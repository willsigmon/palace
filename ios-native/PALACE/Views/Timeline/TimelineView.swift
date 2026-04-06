import SwiftUI

struct TimelineView: View {
    @State private var selectedDate = Date()
    @State private var events: [TimelineEvent] = []
    @State private var recentConversations: [Conversation] = []
    @State private var stats: Stats?
    @State private var loading = true
    @State private var viewMode: ViewMode = .diary

    enum ViewMode: String, CaseIterable {
        case diary = "Diary"
        case list = "All"
    }

    private var dateString: String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: selectedDate)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // View mode picker
                Picker("View", selection: $viewMode) {
                    ForEach(ViewMode.allCases, id: \.self) { Text($0.rawValue) }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)
                .padding(.top, 8)

                if viewMode == .diary {
                    diaryView
                } else {
                    listView
                }
            }
            .navigationTitle("Timeline")
            .task { await loadAll() }
        }
    }

    // MARK: - Diary View

    private var diaryView: some View {
        VStack(spacing: 0) {
            // Date picker
            DatePicker("Date", selection: $selectedDate, in: ...Date(), displayedComponents: .date)
                .datePickerStyle(.compact)
                .labelsHidden()
                .padding()
                .onChange(of: selectedDate) { _, _ in
                    Task { await loadDay() }
                }

            // Day header
            HStack {
                Text(selectedDate, format: .dateTime.weekday(.wide).month(.wide).day())
                    .font(.headline)
                Spacer()
                Text("\(events.count) events")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal)
            .padding(.bottom, 8)

            Divider()

            // Events
            if loading {
                Spacer()
                ProgressView()
                Spacer()
            } else if events.isEmpty {
                ContentUnavailableView(
                    "Nothing recorded",
                    systemImage: "calendar.badge.minus",
                    description: Text("No conversations or events on this day.")
                )
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(events) { event in
                            DayEventRow(event: event)
                        }
                    }
                }
            }
        }
        .task { await loadDay() }
    }

    // MARK: - List View

    private var listView: some View {
        List {
            if let stats {
                Section {
                    HStack(spacing: 20) {
                        StatBadge(value: stats.conversations, label: "conversations")
                        StatBadge(value: stats.memories, label: "memories")
                        StatBadge(value: stats.people, label: "people")
                    }
                    .listRowBackground(Color.clear)
                }
            }

            Section {
                ForEach(recentConversations) { convo in
                    NavigationLink(value: convo.id) {
                        ConversationRow(conversation: convo)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationDestination(for: Int.self) { id in
            ConversationDetailView(conversationId: id)
        }
        .refreshable { await loadAll() }
    }

    // MARK: - Data

    private func loadDay() async {
        loading = true
        do {
            let response = try await APIClient.shared.getTimeline(date: dateString)
            events = response.events
        } catch {
            events = []
        }
        loading = false
    }

    private func loadAll() async {
        do {
            async let c = APIClient.shared.getConversations()
            async let s = APIClient.shared.getStats()
            recentConversations = try await c
            stats = try await s
        } catch {}
    }
}

// MARK: - Day Event Row

struct DayEventRow: View {
    let event: TimelineEvent

    private var timeLabel: String {
        // Extract HH:mm from "2026-04-04 14:23:00.000"
        let parts = event.time.split(separator: " ")
        if parts.count >= 2 {
            let timePart = parts[1]
            return String(timePart.prefix(5))
        }
        return ""
    }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Time column
            Text(timeLabel)
                .font(.caption)
                .fontWeight(.medium)
                .monospacedDigit()
                .foregroundStyle(.secondary)
                .frame(width: 44, alignment: .trailing)

            // Timeline dot + line
            VStack(spacing: 0) {
                Circle()
                    .fill(colorForType)
                    .frame(width: 8, height: 8)
                    .padding(.top, 6)
                Rectangle()
                    .fill(.quaternary)
                    .frame(width: 1)
            }

            // Content
            VStack(alignment: .leading, spacing: 4) {
                if let title = event.data.title, !title.isEmpty {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.medium)
                } else {
                    Text(event.type.capitalized)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                if let overview = event.data.overview, !overview.isEmpty {
                    Text(overview)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(3)
                }

                if let cat = event.data.category {
                    Text(cat)
                        .font(.caption2)
                        .foregroundStyle(.orange)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(.orange.opacity(0.1), in: Capsule())
                }
            }
            .padding(.vertical, 8)

            Spacer()
        }
        .padding(.horizontal)
    }

    private var colorForType: Color {
        switch event.type {
        case "conversation": .orange
        case "memory": .purple
        case "location": .green
        default: .gray
        }
    }
}

// MARK: - Shared Components

struct ConversationRow: View {
    let conversation: Conversation

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                if let emoji = conversation.emoji {
                    Text(emoji)
                }
                Text(conversation.title ?? "Untitled")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(1)
            }

            if let overview = conversation.overview {
                Text(overview)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            HStack {
                if let cat = conversation.category {
                    Text(cat)
                        .font(.caption2)
                        .foregroundStyle(.orange)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(.orange.opacity(0.1), in: Capsule())
                }
                Spacer()
                Text(formatDate(conversation.startedAt))
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                    .monospacedDigit()
            }
        }
        .padding(.vertical, 2)
    }

    private func formatDate(_ str: String) -> String {
        let parts = str.split(separator: " ")
        if parts.count >= 1 { return String(parts[0]) }
        return str
    }
}

struct StatBadge: View {
    let value: Int
    let label: String

    var body: some View {
        VStack(spacing: 2) {
            Text("\(value)")
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundStyle(.orange)
                .monospacedDigit()
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct ConversationDetailView: View {
    let conversationId: Int
    @State private var detail: ConversationDetail?
    @State private var loading = true

    var body: some View {
        Group {
            if let detail {
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        ForEach(detail.segments) { seg in
                            HStack(alignment: .top, spacing: 8) {
                                Text(seg.speakerName ?? seg.speakerLabel ?? "Speaker \(seg.speaker)")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .foregroundStyle(seg.isUser ? .orange : .secondary)
                                    .frame(width: 60, alignment: .trailing)

                                Text(seg.text)
                                    .font(.subheadline)
                                    .textSelection(.enabled)
                            }
                        }
                    }
                    .padding()
                }
                .navigationTitle(detail.session.title ?? "Conversation")
                .navigationBarTitleDisplayMode(.inline)
            } else if loading {
                ProgressView()
            }
        }
        .task {
            do { detail = try await APIClient.shared.getConversation(id: conversationId) } catch {}
            loading = false
        }
    }
}
