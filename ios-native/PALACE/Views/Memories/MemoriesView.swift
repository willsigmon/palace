import SwiftUI

struct MemoriesView: View {
    @State private var memories: [Memory] = []
    @State private var searchText = ""
    @State private var loading = true

    var body: some View {
        NavigationStack {
            List(memories) { memory in
                VStack(alignment: .leading, spacing: 6) {
                    Text(memory.content)
                        .font(.subheadline)
                        .lineLimit(4)
                        .textSelection(.enabled)

                    HStack {
                        if let cat = memory.category {
                            Text(cat)
                                .font(.caption2)
                                .foregroundStyle(.orange)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(.orange.opacity(0.1), in: Capsule())
                        }
                        Spacer()
                        Text(String(memory.createdAt.prefix(10)))
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                            .monospacedDigit()
                    }
                }
                .padding(.vertical, 2)
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Memories")
            .searchable(text: $searchText, prompt: "Search memories")
            .refreshable { await loadData() }
            .task { await loadData() }
            .onChange(of: searchText) { _, query in
                Task { await loadData(query: query) }
            }
            .overlay {
                if loading && memories.isEmpty { ProgressView() }
            }
        }
    }

    private func loadData(query: String? = nil) async {
        do {
            memories = try await APIClient.shared.getMemories(
                limit: 50,
                query: query?.isEmpty == true ? nil : query
            )
        } catch {}
        loading = false
    }
}
