import UIKit
import WebKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Set the window background to match the web content
        // This eliminates the dark band behind the status bar
        window?.backgroundColor = UIColor(red: 250/255, green: 250/255, blue: 250/255, alpha: 1)

        // Make the WebView extend under the status bar (edge-to-edge)
        if let vc = window?.rootViewController as? CAPBridgeViewController {
            vc.additionalSafeAreaInsets = .zero
            vc.view.backgroundColor = UIColor(red: 250/255, green: 250/255, blue: 250/255, alpha: 1)

            // Find the WKWebView and configure it
            for subview in vc.view.subviews {
                if let webView = subview as? WKWebView {
                    webView.isOpaque = false
                    webView.backgroundColor = .clear
                    webView.scrollView.backgroundColor = .clear
                    webView.scrollView.contentInsetAdjustmentBehavior = .always
                }
            }
        }

        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationDidBecomeActive(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
