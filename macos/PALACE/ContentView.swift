import SwiftUI
import WebKit

struct ContentView: View {
    @State private var urlString = "https://palace-tan.vercel.app"
    @State private var isLoading = true

    var body: some View {
        ZStack {
            Color(red: 0.10, green: 0.10, blue: 0.18)
                .ignoresSafeArea()

            PALACEWebView(
                urlString: $urlString,
                isLoading: $isLoading
            )

            if isLoading {
                VStack(spacing: 12) {
                    Text("PALACE")
                        .font(.system(size: 28, weight: .light, design: .serif))
                        .italic()
                        .foregroundStyle(
                            LinearGradient(
                                colors: [
                                    Color(red: 0.95, green: 0.65, blue: 0.35),
                                    Color(red: 0.90, green: 0.40, blue: 0.55),
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                    ProgressView()
                        .tint(.white.opacity(0.5))
                }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .navigateToVoice)) { _ in
            urlString = "https://palace-tan.vercel.app/voice"
        }
    }
}

struct PALACEWebView: NSViewRepresentable {
    @Binding var urlString: String
    @Binding var isLoading: Bool

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.mediaTypesRequiringUserActionForPlayback = []
        config.preferences.isElementFullscreenEnabled = true

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.isInspectable = true
        webView.allowsBackForwardNavigationGestures = true
        webView.setValue(false, forKey: "drawsBackground")

        if let url = URL(string: urlString) {
            webView.load(URLRequest(url: url))
        }

        context.coordinator.webView = webView
        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        let current = webView.url?.absoluteString ?? ""
        if current != urlString, let url = URL(string: urlString) {
            webView.load(URLRequest(url: url))
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(isLoading: $isLoading)
    }

    class Coordinator: NSObject, WKNavigationDelegate {
        @Binding var isLoading: Bool
        weak var webView: WKWebView?

        init(isLoading: Binding<Bool>) {
            _isLoading = isLoading
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            isLoading = false
            // Inject dark scrollbar styling
            let css = "html { background: #1a1a2e !important; }"
            webView.evaluateJavaScript(
                "var s=document.createElement('style');s.textContent='\(css)';document.head.appendChild(s)"
            )
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            isLoading = false
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            // Open external links in default browser
            if let url = navigationAction.request.url,
               !url.absoluteString.contains("palace-tan.vercel.app"),
               !url.absoluteString.contains("marlin.sigflix.stream"),
               navigationAction.navigationType == .linkActivated {
                NSWorkspace.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        // Allow microphone access for Marlin voice
        func webView(
            _ webView: WKWebView,
            requestMediaCapturePermissionFor origin: WKSecurityOrigin,
            initiatedByFrame frame: WKFrameInfo,
            type: WKMediaCaptureType,
            decisionHandler: @escaping (WKPermissionDecision) -> Void
        ) {
            decisionHandler(.grant)
        }
    }
}
