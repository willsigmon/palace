import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            MarlinView()
                .tabItem {
                    Label("Marlin", systemImage: "bubble.left.and.text.bubble.right.fill")
                }
                .tag(0)

            TimelineView()
                .tabItem {
                    Label("Timeline", systemImage: "calendar.day.timeline.left")
                }
                .tag(1)

            PeopleView()
                .tabItem {
                    Label("People", systemImage: "person.2.fill")
                }
                .tag(2)

            MemoriesView()
                .tabItem {
                    Label("Memories", systemImage: "brain.head.profile.fill")
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
