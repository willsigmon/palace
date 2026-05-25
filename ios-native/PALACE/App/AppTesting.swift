import Foundation

struct AppTesting {
    static var isRunningTests: Bool {
        NSClassFromString("XCTestCase") != nil
    }
}
