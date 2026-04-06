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

    // Filter to meaningful events (conversations, not raw location pings)
    private var conversationEvents: [TimelineEvent] {
        events.filter { $0.type == "conversation" }
    }

    private var locationCount: Int {
        events.filter { $0.type == "location" }.count
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
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
            .navigationDestination(for: Int.self) { id in
                ConversationDetailView(conversationId: id)
            }
            .task { await loadAll() }
        }
    }

    // MARK: - Diary

    private var diaryView: some View {
        VStack(spacing: 0) {
            // Date row
            HStack {
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    selectedDate = Calendar.current.date(byAdding: .day, value: -1, to: selectedDate) ?? selectedDate
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.body.weight(.medium))
                }

                Spacer()

                DatePicker("", selection: $selectedDate, in: ...Date(), displayedComponents: .date)
                    .labelsHidden()

                Spacer()

                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    selectedDate = Calendar.current.date(byAdding: .day, value: 1, to: selectedDate) ?? selectedDate
                } label: {
                    Image(systemName: "chevron.right")
                        .font(.body.weight(.medium))
                }
                .disabled(Calendar.current.isDateInToday(selectedDate))
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)

            // Day summary
            HStack {
                Text(selectedDate, format: .dateTime.weekday(.wide).month(.wide).day())
                    .font(.headline)
                Spacer()
                if !conversationEvents.isEmpty || locationCount > 0 {
                    Text("\(conversationEvents.count) conversations")
                        .font(.caption)
                        .foregroundStyle(.orange)
                    if locationCount > 0 {
                        Text("  \(locationCount) locations")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 8)

            Divider()

            // Events
            if loading {
                Spacer()
                ProgressView()
                Spacer()
            } else if conversationEvents.isEmpty {
                ContentUnavailableView(
                    "Nothing recorded",
                    systemImage: "calendar.badge.minus",
                    description: Text("No conversations on this day.")
                )
            } else {
                List(conversationEvents) { event in
                    if let id = event.data.id {
                        NavigationLink(value: id) {
                            DayEventRow(event: event)
                        }
                    } else {
                        DayEventRow(event: event)
                    }
                }
                .listStyle(.plain)
            }
        }
        .onChange(of: selectedDate) { _, _ in
            Task { await loadDay() }
        }
        .task { await loadDay() }
    }

    // MARK: - List

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

            Section("Recent") {
                ForEach(recentConversations) { convo in
                    NavigationLink(value: convo.id) {
                        ConversationRow(conversation: convo)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .refreshable { await loadAll() }
    }

    // MARK: - Data

    private func loadDay() async {
        loading = true
        do {
            let response = try await APIClient.shared.getTimeline(date: dateString)
            events = response.events
        } catch { events = [] }
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
        let parts = event.time.split(separator: " ")
        guard parts.count >= 2 else { return "" }
        return String(parts[1].prefix(5))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .top) {
                Text(timeLabel)
                    .font(.caption)
                    .fontWeight(.medium)
                    .monospacedDigit()
                    .foregroundStyle(.secondary)
                    .frame(width: 44, alignment: .leading)

                VStack(alignment: .leading, spacing: 3) {
                    if let title = event.data.title, !title.isEmpty {
                        Text(title)
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .lineLimit(2)
                    } else {
                        Text("Untitled conversation")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    if let overview = event.data.overview, !overview.isEmpty {
                        Text(overview)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                    }
                }
            }

            if let cat = event.data.category {
                Text(cat)
                    .font(.caption2)
                    .foregroundStyle(.orange)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(.orange.opacity(0.1), in: Capsule())
            }
        }
        .padding(.vertical, 4)
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
                if let title = conversation.title, !title.isEmpty {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .lineLimit(1)
                } else if let overview = conversation.overview, !overview.isEmpty {
                    // No title — use overview as title
                    Text(overview)
                        .font(.subheadline)
                        .lineLimit(1)
                } else {
                    Text("Conversation")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }

            if conversation.title != nil, let overview = conversation.overview, !overview.isEmpty {
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
                Text(String((conversation.startedAt ?? "").prefix(10)))
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                    .monospacedDigit()
            }
        }
        .padding(.vertical, 2)
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

// ConversationDetailView is in its own file
