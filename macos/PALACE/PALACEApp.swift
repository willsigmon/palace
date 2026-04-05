import SwiftUI

@main
struct PALACEApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .frame(minWidth: 400, minHeight: 600)
        }
        .windowStyle(.titleBar)
        .defaultSize(width: 1200, height: 800)
        .commands {
            CommandGroup(replacing: .newItem) {}
            CommandGroup(after: .toolbar) {
                Button("Marlin Voice") {
                    NotificationCenter.default.post(name: .navigateToVoice, object: nil)
                }
                .keyboardShortcut("m", modifiers: [.command, .shift])
            }
        }
    }
}

extension Notification.Name {
    static let navigateToVoice = Notification.Name("navigateToVoice")
}
