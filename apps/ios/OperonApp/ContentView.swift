import SwiftUI
import WebKit

struct ContentView: View {
    @Binding var activeRecipeId: String?

    var body: some View {
        OperonWebViewContainer(activeRecipeId: $activeRecipeId)
            .edgesIgnoringSafeArea(.all)
            .background(Color(red: 18/255, green: 21/255, blue: 24/255))
    }
}

struct OperonWebViewContainer: UIViewRepresentable {
    @Binding var activeRecipeId: String?

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let contentController = WKUserContentController()

        // Bridge native handlers: clipboard, haptics
        contentController.add(context.coordinator, name: "operonIOSBridge")
        config.userContentController = contentController

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 18/255, green: 21/255, blue: 24/255, alpha: 1.0)
        webView.scrollView.backgroundColor = webView.backgroundColor

        if let htmlPath = Bundle.main.path(forResource: "index", ofType: "html", inDirectory: "hud") {
            let url = URL(fileURLWithPath: htmlPath)
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        } else {
            // Local fallback
            webView.load(URLRequest(url: URL(string: "http://localhost:49210")!))
        }

        context.coordinator.webView = webView
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        if let recipeId = activeRecipeId {
            uiView.evaluateJavaScript("window.operonApp?.executeRecipeById('\(recipeId)');", completionHandler: nil)
            DispatchQueue.main.async {
                self.activeRecipeId = nil
            }
        }
    }

    class Coordinator: NSObject, WKScriptMessageHandler {
        var parent: OperonWebViewContainer
        weak var webView: WKWebView?

        init(_ parent: OperonWebViewContainer) {
            self.parent = parent
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any],
                  let action = body["action"] as? String else { return }

            switch action {
            case "copyToClipboard":
                if let text = body["text"] as? String {
                    UIPasteboard.general.string = text
                    let generator = UINotificationFeedbackGenerator()
                    generator.notificationOccurred(.success)
                }
            case "triggerHaptic":
                let impact = UIImpactFeedbackGenerator(style: .medium)
                impact.impactOccurred()
            default:
                break
            }
        }
    }
}
