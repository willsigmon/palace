import SwiftUI

struct PeopleView: View {
    @State private var people: [Person] = []
    @State private var searchText = ""
    @State private var loading = true

    var filtered: [Person] {
        if searchText.isEmpty { return people }
        return people.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }

    var body: some View {
        NavigationStack {
            List(filtered) { person in
                HStack(spacing: 12) {
                    Circle()
                        .fill(.quaternary)
                        .frame(width: 40, height: 40)
                        .overlay(
                            Text(String(person.name.prefix(1)))
                                .font(.headline)
                                .foregroundStyle(.secondary)
                        )

                    VStack(alignment: .leading, spacing: 2) {
                        Text(person.displayName ?? person.name)
                            .font(.subheadline)
                            .fontWeight(.medium)
                        if let rel = person.relationship {
                            Text(rel)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }

                    Spacer()

                    if let count = person.conversationCount, count > 0 {
                        Text("\(count)")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                            .monospacedDigit()
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("People")
            .searchable(text: $searchText, prompt: "Search people")
            .refreshable { await loadData() }
            .task { await loadData() }
            .overlay {
                if loading && people.isEmpty { ProgressView() }
            }
        }
    }

    private func loadData() async {
        do { people = try await APIClient.shared.getPeople(limit: 100) } catch {}
        loading = false
    }
}
