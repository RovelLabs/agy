import AppIntents
import UIKit

@available(iOS 16.0, *)
struct CleanClipboardIntent: AppIntent {
    static var title: LocalizedStringResource = "Clean Clipboard with Operon"
    static var description = IntentDescription("Strips UTM tracking parameters and tracking tokens from copied link.")

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        guard let rawText = UIPasteboard.general.string else {
            return .result(value: "")
        }

        // Deterministic URL query cleaning
        let cleaned = stripTrackingParameters(from: rawText)
        UIPasteboard.general.string = cleaned

        return .result(value: cleaned)
    }

    private func stripTrackingParameters(from text: String) -> String {
        guard let url = URL(string: text), var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            return text
        }

        let trackingKeys: Set<String> = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "igshid", "si"]
        components.queryItems = components.queryItems?.filter { !trackingKeys.contains($0.name.lowercased()) }
        return components.url?.absoluteString ?? text
    }
}

@available(iOS 16.0, *)
struct OperonShortcutsProvider: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: CleanClipboardIntent(),
            phrases: [
                "Clean copied link in \(.applicationName)",
                "Strip tracking with \(.applicationName)"
            ],
            shortTitle: "Clean Link",
            systemImageName: "link.badge.plus"
        )
    }
}
