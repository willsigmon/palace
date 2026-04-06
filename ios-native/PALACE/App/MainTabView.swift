import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            MarlinView()
                .tabItem {
                    Label("Marlin", image: "marlin.fish")
                }
                .tag(0)

            TimelineView()
                .tabItem {
                    Label("Timeline", systemImage: "text.line.first.and.arrowtriangle.forward")
                }
                .tag(1)

            PeopleView()
                .tabItem {
                    Label("People", systemImage: "person.2")
                }
                .tag(2)

            MemoriesView()
                .tabItem {
                    Label("Memories", systemImage: "square.grid.2x2")
                }
                .tag(3)

            SearchView()
                .tabItem {
                    Label("Search", systemImage: "magnifyingglass")
                }
                .tag(4)
        }
        .tint(.orange)
    }
}
