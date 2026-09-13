import SwiftUI

@main
struct OperonApp: App {
    @State private var targetRecipeId: String?

    var body: some Scene {
        WindowGroup {
            ContentView(activeRecipeId: $targetRecipeId)
                .onOpenURL { url in
                    handleIncomingURL(url)
                }
        }
    }

    private func handleIncomingURL(_ url: URL) {
        guard url.scheme == "operon" else { return }
        if url.host == "run" {
            let recipeId = url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
            self.targetRecipeId = recipeId
        }
    }
}
