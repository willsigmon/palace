import SwiftUI

struct SearchView: View {
    @State private var query = ""
    @State private var results: SearchResponse?
    @State private var searching = false

    var body: some View {
        NavigationStack {
            List {
                if let results {
                    if !results.conversations.isEmpty {
                        Section("Conversations") {
                            ForEach(results.conversations) { convo in
                                NavigationLink(value: convo.id) {
                                    ConversationRow(conversation: convo)
                                }
                            }
                        }
                    }

                    if !results.memories.isEmpty {
                        Section("Memories") {
                            ForEach(results.memories) { memory in
                                Text(memory.content)
                                    .font(.subheadline)
                                    .lineLimit(3)
                                    .textSelection(.enabled)
                            }
                        }
                    }

                    if results.conversations.isEmpty && results.memories.isEmpty {
                        ContentUnavailableView.search(text: query)
                    }
                } else if !searching {
                    ContentUnavailableView(
                        "Search your life",
                        systemImage: "magnifyingglass",
                        description: Text("Search across conversations, memories, and people.")
                    )
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Search")
            .navigationDestination(for: Int.self) { id in
                ConversationDetailView(conversationId: id)
            }
            .searchable(text: $query, prompt: "Conversations, memories, people...")
            .onSubmit(of: .search) { performSearch() }
            .overlay {
                if searching { ProgressView() }
            }
        }
    }

    private func performSearch() {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !q.isEmpty else { return }
        searching = true
        Task {
            do { results = try await APIClient.shared.search(query: q) } catch {}
            searching = false
        }
    }
}
