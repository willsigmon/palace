import SwiftUI
import AVFoundation

struct MarlinView: View {
    @State private var messages: [ChatMessage] = []
    @State private var inputText = ""
    @State private var isProcessing = false
    @State private var isRecording = false
    @State private var audioPlayer: AVAudioPlayer?
    @State private var audioRecorder: AVAudioRecorder?
    @State private var sessionId = "palace-\(Int(Date().timeIntervalSince1970))"
    @FocusState private var inputFocused: Bool

    private let starters = [
        "What's up?", "Tell me something interesting",
        "Who did I talk to today?", "What's the Kyndred status?",
        "Anything I should remember?",
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 4) {
                            if messages.isEmpty { emptyState }
                            ForEach(messages) { msg in
                                ChatBubble(message: msg, onReplay: playAudio)
                                    .id(msg.id)
                            }
                            if isProcessing { typingIndicator.id("typing") }
                        }
                        .padding(.vertical, 8)
                    }
                    .scrollDismissesKeyboard(.interactively)
                    .onChange(of: messages.count) {
                        withAnimation(.easeOut(duration: 0.25)) {
                            if let last = messages.last { proxy.scrollTo(last.id, anchor: .bottom) }
                        }
                    }
                    .onChange(of: isProcessing) { _, on in
                        if on { withAnimation { proxy.scrollTo("typing", anchor: .bottom) } }
                    }
                }

                Divider()
                inputBar
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 6) {
                        MarlinAvatarView(size: 24)
                        Text("Marlin").font(.headline)
                    }
                }
            }
        }
    }

    // MARK: - Empty

    private var emptyState: some View {
        VStack(spacing: 28) {
            Spacer().frame(height: 60)
            MarlinAvatarView(size: 64)
                .shadow(color: .orange.opacity(0.3), radius: 20)
            VStack(spacing: 4) {
                Text("Hey Will").font(.title3).fontWeight(.semibold)
                Text("What's on your mind?").font(.subheadline).foregroundStyle(.secondary)
            }
            VStack(spacing: 6) {
                ForEach(starters, id: \.self) { q in
                    Button {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        sendMessage(q)
                    } label: {
                        Text(q)
                            .font(.subheadline)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 16).padding(.vertical, 11)
                            .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 24)
        }
    }

    // MARK: - Thinking Indicator

    private var typingIndicator: some View {
        HStack(alignment: .bottom, spacing: 8) {
            MarlinAvatarView(size: 24)
                .scaleEffect(1.0)
                .animation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true), value: isProcessing)

            VStack(alignment: .leading, spacing: 6) {
                ThinkingDots()

                Text("Marlin is thinking...")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
            .padding(.horizontal, 14).padding(.vertical, 10)
            .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 18))

            Spacer()
        }
        .padding(.horizontal, 12)
        .transition(.asymmetric(
            insertion: .opacity.combined(with: .scale(scale: 0.9, anchor: .leading)),
            removal: .opacity
        ))
    }

    // MARK: - Input

    private var inputBar: some View {
        HStack(spacing: 8) {
            if isRecording {
                // Recording state — show waveform instead of text field
                HStack(spacing: 6) {
                    RecordingWaveform()
                    Text("Listening...")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Spacer()
                }
                .padding(.horizontal, 14).padding(.vertical, 10)
                .background(Color.red.opacity(0.08), in: RoundedRectangle(cornerRadius: 22))
            } else {
                TextField("Message", text: $inputText, axis: .vertical)
                    .lineLimit(1...5)
                    .padding(.horizontal, 14).padding(.vertical, 10)
                    .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 22))
                    .focused($inputFocused)
                    .submitLabel(.send)
                    .onSubmit { if !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { sendMessage(inputText) } }
                    .disabled(isProcessing)
            }

            Button {
                if isRecording { stopRecording() } else { startRecording() }
            } label: {
                Image(systemName: isRecording ? "stop.circle.fill" : "mic.circle.fill")
                    .font(.system(size: 34))
                    .symbolRenderingMode(.hierarchical)
                    .foregroundStyle(isRecording ? .red : .orange)
                    .contentTransition(.symbolEffect(.replace))
            }
            .sensoryFeedback(.impact(flexibility: .rigid, intensity: 0.7), trigger: isRecording)
            .disabled(isProcessing)

            if !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    sendMessage(inputText)
                } label: {
                    Image(systemName: "arrow.up.circle.fill").font(.system(size: 30)).foregroundStyle(.orange)
                }
                .transition(.scale.combined(with: .opacity))
            }
        }
        .padding(.horizontal, 10).padding(.vertical, 8)
        .background(.bar)
        .animation(.easeOut(duration: 0.15), value: inputText.isEmpty)
    }

    // MARK: - Send (fast /api/chat)

    private func sendMessage(_ text: String) {
        let q = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !q.isEmpty else { return }
        inputText = ""; inputFocused = false
        withAnimation(.easeOut(duration: 0.2)) { messages.append(ChatMessage(role: .user, text: q, audioBase64: nil, model: nil, timings: nil)) }
        isProcessing = true
        Task {
            do {
                let r = try await MarlinClient.shared.chat(message: q, sessionId: sessionId)
                await MainActor.run {
                    withAnimation(.easeOut(duration: 0.2)) { messages.append(ChatMessage(role: .marlin, text: r.response, audioBase64: nil, model: r.model, timings: nil)); isProcessing = false }
                    UINotificationFeedbackGenerator().notificationOccurred(.success)
                }
            } catch {
                await MainActor.run {
                    withAnimation { messages.append(ChatMessage(role: .marlin, text: "Can't reach Marlin right now.", audioBase64: nil, model: nil, timings: nil)); isProcessing = false }
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
            let url = FileManager.default.temporaryDirectory.appendingPathComponent("marlin_voice.wav")
            let settings: [String: Any] = [
                AVFormatIDKey: Int(kAudioFormatLinearPCM), AVSampleRateKey: 16000,
                AVNumberOfChannelsKey: 1, AVLinearPCMBitDepthKey: 16, AVLinearPCMIsFloatKey: false,
            ]
            audioRecorder = try? AVAudioRecorder(url: url, settings: settings)
            audioRecorder?.record()
            DispatchQueue.main.async { isRecording = true }
        }
    }

    private func stopRecording() {
        audioRecorder?.stop(); isRecording = false
        guard let url = audioRecorder?.url, let audioData = try? Data(contentsOf: url) else { return }
        withAnimation(.easeOut(duration: 0.2)) { messages.append(ChatMessage(role: .user, text: "...", audioBase64: nil, model: nil, timings: nil)) }
        isProcessing = true
        Task {
            do {
                let r = try await MarlinClient.shared.sendVoice(audioData: audioData, sessionId: sessionId)
                await MainActor.run {
                    if let idx = messages.lastIndex(where: { $0.text == "..." }) { messages[idx] = ChatMessage(role: .user, text: r.transcript, audioBase64: nil, model: nil, timings: nil) }
                    withAnimation { messages.append(ChatMessage(role: .marlin, text: r.response, audioBase64: r.audio, model: r.model, timings: r.timings)); isProcessing = false }
                    UINotificationFeedbackGenerator().notificationOccurred(.success)
                    playAudio(base64: r.audio)
                }
            } catch {
                await MainActor.run {
                    withAnimation { messages.append(ChatMessage(role: .marlin, text: "Voice failed.", audioBase64: nil, model: nil, timings: nil)); isProcessing = false }
                    UINotificationFeedbackGenerator().notificationOccurred(.error)
                }
            }
        }
    }

    private func playAudio(base64: String) {
        guard let data = Data(base64Encoded: base64) else { return }
        audioPlayer = try? AVAudioPlayer(data: data); audioPlayer?.play()
    }
}

// MARK: - Chat Bubble (iMessage style)

struct ChatBubble: View {
    let message: ChatMessage
    var onReplay: ((String) -> Void)?

    var body: some View {
        HStack(alignment: .bottom, spacing: 6) {
            if message.role == .marlin {
                MarlinAvatarView(size: 24)
            } else { Spacer(minLength: 60) }

            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 3) {
                Text(message.text)
                    .font(.body)
                    .foregroundStyle(message.role == .user ? .white : .primary)
                    .textSelection(.enabled)
                    .padding(.horizontal, 14).padding(.vertical, 9)
                    .background(
                        message.role == .user
                            ? AnyShapeStyle(LinearGradient(colors: [.orange, Color(red: 0.9, green: 0.4, blue: 0.3)], startPoint: .topLeading, endPoint: .bottomTrailing))
                            : AnyShapeStyle(Color(.secondarySystemBackground)),
                        in: RoundedRectangle(cornerRadius: 18)
                    )

                if message.role == .marlin {
                    HStack(spacing: 8) {
                        if let audio = message.audioBase64 {
                            Button { onReplay?(audio) } label: {
                                Image(systemName: "play.fill").font(.system(size: 10)).foregroundStyle(.secondary)
                            }
                        }
                        if let model = message.model {
                            Text(model.replacingOccurrences(of: "gemma4:", with: ""))
                                .font(.system(size: 9, weight: .medium, design: .monospaced))
                                .foregroundStyle(.quaternary)
                        }
                    }
                    .padding(.leading, 6)
                }
            }

            if message.role == .user {
                // No avatar for user, just alignment
            } else { Spacer(minLength: 60) }
        }
        .frame(maxWidth: .infinity, alignment: message.role == .user ? .trailing : .leading)
        .padding(.horizontal, 10).padding(.vertical, 1)
    }
}
