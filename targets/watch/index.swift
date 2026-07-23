import SwiftUI

@main
struct DosifyWatchApp: App {
    @StateObject private var store = WatchDoseStore.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
        }
    }
}
