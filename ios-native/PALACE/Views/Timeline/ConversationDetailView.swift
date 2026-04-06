import SwiftUI

struct ConversationDetailView: View {
    let conversationId: Int
    @State private var detail: ConversationDetail?
    @State private var loading = true
    @State private var speakerOverrides: [Int: String] = [:]
    @State private var editingSpeaker: Int?
    @State private var editName = ""
    @State private var reidentifying = false
    @State private var people: [Person] = []
    @State private var showSpeakerSheet = false
    @State private var selectedSpeakerForSheet: Int?

    var body: some View {
        Group {
            if let detail {
                conversationContent(detail)
            } else if loading {
                ProgressView()
            } else {
                ContentUnavailableView("Not found", systemImage: "doc.questionmark")
            }
        }
        .task {
            do {
                detail = try await APIClient.shared.getConversation(id: conversationId)
                people = try await APIClient.shared.getPeople(limit: 200)
            } catch {}
            loading = false
        }
    }

    @ViewBuilder
    private func conversationContent(_ detail: ConversationDetail) -> some View {
        let speakers = uniqueSpeakers(from: detail)
        let merged = mergeConsecutive(detail.segments)

        List {
            // Header section
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    if let emoji = detail.session.emoji {
                        Text(emoji).font(.title)
                    }
                    Text(detail.session.title ?? "Untitled")
                        .font(.headline)
                    if let overview = detail.session.overview {
                        Text(overview)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    HStack {
                        if let cat = detail.session.category {
                            Text(cat)
                                .font(.caption2)
                                .foregroundStyle(.orange)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(.orange.opacity(0.1), in: Capsule())
                        }
                        Spacer()
                        Text(String((detail.session.startedAt ?? "").prefix(16)))
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                            .monospacedDigit()
                    }
                }
            }

            // Speaker identification section
            Section("Speakers") {
                ForEach(speakers, id: \.id) { speaker in
                    HStack {
                        Circle()
                            .fill(speakerColor(speaker.id))
                            .frame(width: 28, height: 28)
                            .overlay(
                                Text(String(resolvedName(speaker, detail).prefix(1)).uppercased())
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundStyle(.white)
                            )

                        VStack(alignment: .leading, spacing: 1) {
                            Text(resolvedName(speaker, detail))
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text("\(speaker.segmentCount) segments")
                                .font(.caption2)
                                .foregroundStyle(.tertiary)
                        }

                        Spacer()

                        if !speaker.isUser {
                            Button {
                                selectedSpeakerForSheet = speaker.id
                                showSpeakerSheet = true
                            } label: {
                                Text("Identify")
                                    .font(.caption)
                                    .foregroundStyle(.orange)
                            }
                        }
                    }
                }

                // Re-identify with Marlin
                Button {
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    Task { await reidentifySpeakers(detail) }
                } label: {
                    HStack {
                        if reidentifying {
                            ProgressView().tint(.orange)
                        } else {
                            Image(systemName: "wand.and.stars")
                        }
                        Text(reidentifying ? "Analyzing with Marlin..." : "Auto-identify speakers")
                    }
                    .font(.subheadline)
                    .foregroundStyle(.orange)
                }
                .disabled(reidentifying)
            }

            // Transcript
            Section("Transcript (\(merged.count))") {
                ForEach(Array(merged.enumerated()), id: \.offset) { _, seg in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 6) {
                            Circle()
                                .fill(speakerColor(seg.speaker))
                                .frame(width: 8, height: 8)

                            Text(resolvedSegmentName(seg, detail))
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundStyle(seg.isUser ? .orange : speakerColor(seg.speaker))

                            Spacer()

                            Text(formatTimestamp(seg.startedAt))
                                .font(.caption2)
                                .foregroundStyle(.quaternary)
                                .monospacedDigit()
                        }

                        Text(seg.text)
                            .font(.subheadline)
                            .textSelection(.enabled)
                    }
                    .padding(.vertical, 2)
                }
            }
        }
        .listStyle(.plain)
        .navigationTitle(detail.session.title ?? "Conversation")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showSpeakerSheet) {
            speakerPickerSheet
        }
    }

    // MARK: - Speaker Picker Sheet

    private var speakerPickerSheet: some View {
        NavigationStack {
            List {
                Section("Type a name") {
                    HStack {
                        TextField("Name", text: $editName)
                            .textFieldStyle(.plain)
                            .submitLabel(.done)
                            .onSubmit {
                                if let id = selectedSpeakerForSheet, !editName.isEmpty {
                                    UINotificationFeedbackGenerator().notificationOccurred(.success)
                                    speakerOverrides[id] = editName
                                    editName = ""
                                    showSpeakerSheet = false
                                }
                            }
                        if !editName.isEmpty {
                            Button("Save") {
                                if let id = selectedSpeakerForSheet {
                                    UINotificationFeedbackGenerator().notificationOccurred(.success)
                                    speakerOverrides[id] = editName
                                    editName = ""
                                    showSpeakerSheet = false
                                }
                            }
                            .foregroundStyle(.orange)
                        }
                    }
                }

                Section("Pick from People") {
                    ForEach(people.filter { !$0.isLikelyDeceased && !$0.isPhoneNumberOnly }) { person in
                        Button {
                            if let id = selectedSpeakerForSheet {
                                UINotificationFeedbackGenerator().notificationOccurred(.success)
                                speakerOverrides[id] = person.displayLabel
                                showSpeakerSheet = false
                            }
                        } label: {
                            HStack {
                                Circle()
                                    .fill(colorForRelationship(person.relationship))
                                    .frame(width: 28, height: 28)
                                    .overlay(Text(person.initials).font(.system(size: 10, weight: .bold)).foregroundStyle(.white))
                                Text(person.displayLabel)
                                    .font(.subheadline)
                                    .foregroundStyle(.primary)
                                if let rel = person.relationship {
                                    Spacer()
                                    Text(rel)
                                        .font(.caption2)
                                        .foregroundStyle(.tertiary)
                                }
                            }
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Who is this?")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showSpeakerSheet = false }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    // MARK: - Marlin Re-identification

    private func reidentifySpeakers(_ detail: ConversationDetail) async {
        reidentifying = true
        defer { reidentifying = false }

        // Build a sample of the transcript for Marlin
        let sample = detail.segments.prefix(40).map { seg in
            let name = seg.speakerName ?? seg.speakerLabel ?? "Speaker \(seg.speaker)"
            return "\(name): \(seg.text)"
        }.joined(separator: "\n")

        let prompt = """
        Analyze this conversation transcript and identify who the unnamed speakers are.
        The conversation title is: "\(detail.session.title ?? "Unknown")"
        Speaker 0 is the user (Will Sigmon).
        For each other speaker, tell me who they likely are based on context clues.
        Return ONLY a simple list like: "Speaker 1: [Name]\\nSpeaker 2: [Name]"

        Transcript:
        \(sample.prefix(3000))
        """

        do {
            let response = try await MarlinClient.shared.chat(message: prompt, sessionId: "reidentify-\(conversationId)")
            // Parse the response for speaker assignments
            let lines = response.response.split(separator: "\n")
            for line in lines {
                if line.contains("Speaker") && line.contains(":") {
                    let parts = line.split(separator: ":", maxSplits: 2)
                    if parts.count >= 2 {
                        let speakerPart = parts[0].trimmingCharacters(in: .whitespaces)
                        let namePart = parts[1].trimmingCharacters(in: .whitespaces)
                        if let num = speakerPart.last?.wholeNumberValue, !namePart.isEmpty {
                            await MainActor.run {
                                speakerOverrides[num] = namePart
                            }
                        }
                    }
                }
            }
            await MainActor.run {
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            }
        } catch {
            await MainActor.run {
                UINotificationFeedbackGenerator().notificationOccurred(.error)
            }
        }
    }

    // MARK: - Helpers

    private struct SpeakerInfo: Identifiable {
        let id: Int
        let isUser: Bool
        let name: String?
        let label: String?
        let segmentCount: Int
    }

    private func uniqueSpeakers(from detail: ConversationDetail) -> [SpeakerInfo] {
        var seen: [Int: SpeakerInfo] = [:]
        for seg in detail.segments {
            if seen[seg.speaker] == nil {
                seen[seg.speaker] = SpeakerInfo(
                    id: seg.speaker, isUser: seg.isUser,
                    name: seg.speakerName, label: seg.speakerLabel, segmentCount: 0
                )
            }
            let existing = seen[seg.speaker]!
            seen[seg.speaker] = SpeakerInfo(
                id: existing.id, isUser: existing.isUser,
                name: existing.name ?? seg.speakerName,
                label: existing.label ?? seg.speakerLabel,
                segmentCount: existing.segmentCount + 1
            )
        }
        return seen.values.sorted { $0.id < $1.id }
    }

    private func resolvedName(_ speaker: SpeakerInfo, _ detail: ConversationDetail) -> String {
        if let override = speakerOverrides[speaker.id] { return override }
        if let name = speaker.name { return name }
        if speaker.isUser { return "You" }
        if let label = speaker.label { return label }
        return "Speaker \(speaker.id)"
    }

    private func resolvedSegmentName(_ seg: Segment, _ detail: ConversationDetail) -> String {
        if let override = speakerOverrides[seg.speaker] { return override }
        if let name = seg.speakerName { return name }
        if seg.isUser { return "You" }
        if let label = seg.speakerLabel { return label }
        return "Speaker \(seg.speaker)"
    }

    private func speakerColor(_ id: Int) -> Color {
        let colors: [Color] = [.orange, .blue, .purple, .green, .pink, .cyan, .indigo, .mint]
        return colors[id % colors.count]
    }

    private func colorForRelationship(_ rel: String?) -> Color {
        switch rel {
        case "family": return .orange
        case "contact": return .blue
        case "colleague": return .purple
        case "friend": return .green
        default: return .gray
        }
    }

    private func formatTimestamp(_ seconds: Double) -> String {
        let mins = Int(seconds) / 60
        let secs = Int(seconds) % 60
        return String(format: "%d:%02d", mins, secs)
    }

    private func mergeConsecutive(_ segments: [Segment]) -> [Segment] {
        guard !segments.isEmpty else { return [] }
        var result: [Segment] = []
        var current = segments[0]
        for seg in segments.dropFirst() {
            if seg.speaker == current.speaker {
                current = Segment(
                    text: current.text + " " + seg.text,
                    speaker: current.speaker,
                    speakerLabel: current.speakerLabel,
                    speakerName: current.speakerName ?? seg.speakerName,
                    isUser: current.isUser,
                    startTime: current.startTime,
                    endTime: seg.endTime
                )
            } else {
                result.append(current)
                current = seg
            }
        }
        result.append(current)
        return result
    }
}
