import UIKit
import Social
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        processSharedItems()
    }

    private func processSharedItems() {
        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let itemProvider = extensionItem.attachments?.first else {
            completeRequest()
            return
        }

        // Process Plain Text / URL
        if itemProvider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
            itemProvider.loadItem(forTypeIdentifier(UTType.url.identifier), options: nil) { (item, error) in
                if let url = item as? URL {
                    self.cleanAndCopyUrl(url.absoluteString)
                }
                self.completeRequest()
            }
        } else if itemProvider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
            itemProvider.loadItem(forTypeIdentifier(UTType.plainText.identifier), options: nil) { (item, error) in
                if let text = item as? String {
                    self.cleanAndCopyUrl(text)
                }
                self.completeRequest()
            }
        } else {
            completeRequest()
        }
    }

    private func cleanAndCopyUrl(_ text: String) {
        let pattern = "(?<=[?&])(utm_[^&=]+|fbclid|gclid|igshid|si)=[^&#]*(&|$)"
        let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive)
        let range = NSRange(location: 0, length: text.utf16.count)
        let cleaned = regex?.stringByReplacingMatches(in: text, options: [], range: range, withTemplate: "").trimmingCharacters(in: CharacterSet(charactersIn: "?&")) ?? text

        UIPasteboard.general.string = cleaned
    }

    private func completeRequest() {
        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
}
