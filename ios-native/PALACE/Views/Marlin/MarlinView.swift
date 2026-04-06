import SwiftUI
import AVFoundation

struct MarlinView: View {
    @State private var messages: [ChatMessage] = []
    @State private var inputText = ""
    @State private var isRecording = false
    @State private var isProcessing = false
    @State private var audioRecorder: AVAudioRecorder?
    @State private var audioPlayer: AVAudioPlayer?
    @State private var sessionId = "palace-\(Int(Date().timeIntervalSince1970))"
    @FocusState private var inputFocused: Bool

    private let examples = [
        "Who is Carter?",
        "What's the Kyndred status?",
        "Tell me about my family",
        "What happened last Tuesday?",
        "Who do I talk to the most?",
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 20) {
                            if messages.isEmpty {
                                emptyState
                                    .transition(.opacity)
                            }

                            ForEach(messages) { msg in
                                MessageBubble(message: msg)
                                    .id(msg.id)
                            }

                            if isProcessing {
                                thinkingIndicator
                                    .id("thinking")
                            }
                        }
                        .padding(.vertical, 12)
                        .animation(.easeOut(duration: 0.25), value: messages.count)
                    }
                    .scrollDismissesKeyboard(.interactively)
                    .onChange(of: messages.count) {
                        withAnimation(.easeOut(duration: 0.3)) {
                            if let lastId = messages.last?.id {
                                proxy.scrollTo(lastId, anchor: .bottom)
                            }
                        }
                    }
                    .onChange(of: isProcessing) { _, processing in
                        if processing {
                            withAnimation { proxy.scrollTo("thinking", anchor: .bottom) }
                        }
                    }
                }

                Divider()
                inputBar
            }
            .navigationTitle("Marlin")
            .navigationBarTitleDisplayMode(.large)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 24) {
            Spacer().frame(height: 20)

            VStack(spacing: 6) {
                Text("Ask anything about your life.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text("Type or tap the mic.")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                ForEach(examples, id: \.self) { q in
                    Button {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        askText(q)
                    } label: {
                        Text(q)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.leading)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(12)
                            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Thinking

    private var thinkingIndicator: some View {
        HStack(spacing: 10) {
            Circle()
                .fill(LinearGradient(colors: [.orange, .pink], startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: 28, height: 28)
                .overlay(Text("M").font(.system(size: 11, weight: .bold)).foregroundStyle(.white))

            HStack(spacing: 4) {
                ForEach(0..<3, id: \.self) { i in
                    Circle()
                        .fill(.secondary)
                        .frame(width: 6, height: 6)
                        .opacity(0.4)
                        .animation(
                            .easeInOut(duration: 0.5)
                                .repeatForever()
                                .delay(Double(i) * 0.15),
                            value: isProcessing
                        )
                        .scaleEffect(isProcessing ? 1.3 : 0.8)
                }
            }

            Spacer()
        }
        .padding(.horizontal)
    }

    // MARK: - Input Bar

    private var inputBar: some View {
        HStack(spacing: 10) {
            TextField("What would you like to know?", text: $inputText, axis: .vertical)
                .lineLimit(1...4)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 22))
                .focused($inputFocused)
                .submitLabel(.send)
                .onSubmit { askText(inputText) }
                .disabled(isProcessing)

            // Mic
            Button {
                if isRecording { stopRecording() } else { startRecording() }
            } label: {
                Image(systemName: isRecording ? "stop.circle.fill" : "mic.circle.fill")
                    .font(.system(size: 36))
                    .symbolRenderingMode(.hierarchical)
                    .foregroundStyle(isRecording ? .red : .orange)
                    .contentTransition(.symbolEffect(.replace))
            }
            .sensoryFeedback(.impact(flexibility: .rigid, intensity: 0.7), trigger: isRecording)
            .disabled(isProcessing)

            // Send
            if !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    askText(inputText)
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 32))
                        .foregroundStyle(.orange)
                }
                .transition(.scale.combined(with: .opacity))
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(.bar)
        .animation(.easeOut(duration: 0.15), value: inputText.isEmpty)
    }

    // MARK: - Text Ask

    private func askText(_ question: String) {
        let q = question.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !q.isEmpty else { return }
        inputText = ""
        inputFocused = false

        withAnimation { messages.append(ChatMessage(role: .user, text: q, audioBase64: nil, model: nil, timings: nil)) }
        isProcessing = true

        Task {
            do {
                let response = try await APIClient.shared.ask(question: q)
                await MainActor.run {
                    withAnimation {
                        messages.append(ChatMessage(role: .marlin, text: response.answer, audioBase64: nil, model: nil, timings: nil))
                        isProcessing = false
                    }
                    UINotificationFeedbackGenerator().notificationOccurred(.success)
                }
            } catch {
                await MainActor.run {
                    withAnimation {
                        messages.append(ChatMessage(role: .marlin, text: "Couldn't connect. Is the API running?", audioBase64: nil, model: nil, timings: nil))
                        isProcessing = false
                    }
                    UINotificationFeedbackGenerator().notificationOccurred(.error)
                }
            }
        }
    }

    // MARK: - Voice

    private func startRecording() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
            try session.setActive(true)
        } catch { return }

        AVAudioApplication.requestRecordPermission { granted in
            guard granted else { return }

            let url = FileManager.default.temporaryDirectory.appendingPathComponent("marlin_recording.wav")
            let settings: [String: Any] = [
                AVFormatIDKey: Int(kAudioFormatLinearPCM),
                AVSampleRateKey: 16000,
                AVNumberOfChannelsKey: 1,
                AVLinearPCMBitDepthKey: 16,
                AVLinearPCMIsFloatKey: false,
            ]

            do {
                audioRecorder = try AVAudioRecorder(url: url, settings: settings)
                audioRecorder?.record()
                DispatchQueue.main.async { isRecording = true }
            } catch {}
        }
    }

    private func stopRecording() {
        audioRecorder?.stop()
        isRecording = false

        guard let url = audioRecorder?.url,
              let audioData = try? Data(contentsOf: url) else { return }

        withAnimation {
            messages.append(ChatMessage(role: .user, text: "...", audioBase64: nil, model: nil, timings: nil))
        }
        isProcessing = true

        Task {
            do {
                let response = try await MarlinClient.shared.sendVoice(audioData: audioData, sessionId: sessionId)
                await MainActor.run {
                    // Replace "..." with transcript
                    if let idx = messages.lastIndex(where: { $0.role == .user && $0.text == "..." }) {
                        messages[idx] = ChatMessage(role: .user, text: response.transcript, audioBase64: nil, model: nil, timings: nil)
                    }
                    withAnimation {
                        messages.append(ChatMessage(
                            role: .marlin, text: response.response,
                            audioBase64: response.audio, model: response.model, timings: response.timings
                        ))
                        isProcessing = false
                    }
                    UINotificationFeedbackGenerator().notificationOccurred(.success)
                    playAudio(base64: response.audio)
                }
            } catch {
                await MainActor.run {
                    withAnimation {
                        messages.append(ChatMessage(role: .marlin, text: "Voice failed: \(error.localizedDescription)", audioBase64: nil, model: nil, timings: nil))
                        isProcessing = false
                    }
                    UINotificationFeedbackGenerator().notificationOccurred(.error)
                }
            }
        }
    }

    private func playAudio(base64: String) {
        guard let data = Data(base64Encoded: base64) else { return }
        do {
            audioPlayer = try AVAudioPlayer(data: data)
            audioPlayer?.play()
        } catch {}
    }
}

// MARK: - Message Bubble

struct MessageBubble: View {
    let message: ChatMessage
    @State private var isPlaying = false
    @State private var showDetails = false
    @State private var player: AVAudioPlayer?

    var body: some View {
        VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 6) {
            // Message text
            Text(message.text)
                .font(.body)
                .foregroundStyle(.primary)
                .textSelection(.enabled)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    message.role == .user
                        ? Color.orange.opacity(0.12)
                        : Color(.secondarySystemBackground),
                    in: RoundedRectangle(cornerRadius: 18)
                )

                if message.role == .marlin {
                    HStack(spacing: 8) {
                        if let audio = message.audioBase64 {
                            Button {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                togglePlayback(audio)
                            } label: {
                                Label(isPlaying ? "Stop" : "Play", systemImage: isPlaying ? "stop.fill" : "play.fill")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(.ultraThinMaterial, in: Capsule())
                            }
                        }

                        if let timings = message.timings {
                            Button {
                                UISelectionFeedbackGenerator().selectionChanged()
                                withAnimation(.easeOut(duration: 0.2)) { showDetails.toggle() }
                            } label: {
                                Text("\(timings.total, specifier: "%.1f")s")
                                    .font(.caption2)
                                    .foregroundStyle(.tertiary)
                            }
                        }
                    }

                    if showDetails, let t = message.timings, let m = message.model {
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 12) {
                                Label("STT \(t.stt, specifier: "%.2f")s", systemImage: "waveform")
                                Label("LLM \(t.llm, specifier: "%.1f")s", systemImage: "brain")
                                Label("TTS \(t.tts, specifier: "%.2f")s", systemImage: "speaker.wave.2")
                            }
                            Text("via \(m)")
                        }
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                        .padding(8)
                        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 8))
                        .transition(.opacity.combined(with: .scale(scale: 0.95)))
                    }
                }
        }
        .frame(maxWidth: .infinity, alignment: message.role == .user ? .trailing : .leading)
        .padding(.horizontal)
    }

    private func togglePlayback(_ base64: String) {
        if isPlaying { player?.stop(); isPlaying = false; return }
        guard let data = Data(base64Encoded: base64) else { return }
        do {
            player = try AVAudioPlayer(data: data)
            player?.play()
            isPlaying = true
            DispatchQueue.main.asyncAfter(deadline: .now() + (player?.duration ?? 0) + 0.1) { isPlaying = false }
        } catch {}
    }
}
