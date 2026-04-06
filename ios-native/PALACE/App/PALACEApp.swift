import SwiftUI

@main
struct PALACEApp: App {
    var body: some Scene {
        WindowGroup {
            MainTabView()
                .ignoresSafeArea(.keyboard)
        }
    }
}
