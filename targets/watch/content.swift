import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var store: WatchDoseStore

    var body: some View {
        TabView {
            // 1 — Next dose hero
            Group {
                if let next = store.nextDose {
                    NextDosePage(dose: next)
                } else {
                    EmptySyncPage()
                }
            }
            .tag(0)

            // 2 — Active reminder (due / snoozed)
            Group {
                if let due = store.primaryDue {
                    ReminderPage(dose: due)
                } else if let next = store.nextDose {
                    // Upcoming but not due yet — still allow Taken / Snooze
                    ReminderPage(dose: next)
                } else {
                    caughtUpCard
                }
            }
            .tag(1)

            // 3 — Daily progress + streak
            ProgressPage()
                .tag(2)

            // 4 — Interaction risk
            Group {
                if let alert = store.alert {
                    RiskAlertPage(alert: alert)
                } else {
                    RiskClearPage()
                }
            }
            .tag(3)
        }
        .tabViewStyle(.verticalPage)
        .onAppear {
            store.reloadFromAppGroup()
        }
    }

    private var caughtUpCard: some View {
        VStack(spacing: 10) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 28))
                .foregroundStyle(DosifyWatchTheme.teal)
            Text("You're caught up")
                .font(.system(size: 16, weight: .bold))
            Text("No doses due right now.")
                .font(.system(size: 11))
                .foregroundStyle(.secondary)
        }
        .padding()
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(WatchDoseStore.shared)
    }
}
