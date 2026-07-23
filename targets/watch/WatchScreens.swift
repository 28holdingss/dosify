import SwiftUI

// MARK: - Next dose (hero)

struct NextDosePage: View {
    @EnvironmentObject private var store: WatchDoseStore
    let dose: WatchDose

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                BrandHeader()

                Text("Next dose")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.secondary)

                HStack(alignment: .top, spacing: 8) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(dose.name)
                            .font(.system(size: 20, weight: .bold))
                            .foregroundStyle(.white)
                            .lineLimit(2)
                            .minimumScaleFactor(0.8)

                        Text(dose.timeLabel)
                            .font(.system(size: 22, weight: .semibold))
                            .foregroundStyle(DosifyWatchTheme.cyan)
                    }

                    Spacer(minLength: 4)
                    CapsuleArt()
                }

                if dose.status == "TAKEN" {
                    Label("Taken", systemImage: "checkmark.circle.fill")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(DosifyWatchTheme.teal)
                        .padding(.top, 4)
                } else if dose.status != "SKIPPED" {
                    GradientTakenButton(title: "Taken") {
                        store.markTaken(dose)
                    }
                    .padding(.top, 4)
                }
            }
            .padding(.horizontal, 4)
        }
    }
}

// MARK: - Reminder (due now)

struct ReminderPage: View {
    @EnvironmentObject private var store: WatchDoseStore
    let dose: WatchDose

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                Text("Time for \(dose.name)")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(.white)
                    .lineLimit(3)
                    .minimumScaleFactor(0.85)

                if let doseLabel = dose.doseLabel, !doseLabel.isEmpty {
                    Text(doseLabel)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(DosifyWatchTheme.teal)
                }

                HStack(spacing: 6) {
                    Image(systemName: "drop.fill")
                        .font(.system(size: 12))
                        .foregroundStyle(DosifyWatchTheme.cyan)
                    Text(dose.hint?.isEmpty == false ? dose.hint! : "Take with water")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }

                GradientTakenButton(title: "Taken") {
                    store.markTaken(dose)
                }
                .padding(.top, 2)

                Button {
                    store.markSnoozed(dose)
                } label: {
                    Text("Snooze 10 min")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 9)
                        .background(Color.white.opacity(0.12), in: Capsule())
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 4)
        }
    }
}

// MARK: - Daily progress

struct ProgressPage: View {
    @EnvironmentObject private var store: WatchDoseStore

    private var progress: Double {
        min(1, max(0, Double(store.summary.percent) / 100.0))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                HStack {
                    Text("Today")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                    Spacer()
                }

                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.12), lineWidth: 10)

                    Circle()
                        .trim(from: 0, to: progress)
                        .stroke(
                            DosifyWatchTheme.ringGradient,
                            style: StrokeStyle(lineWidth: 10, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))

                    VStack(spacing: 2) {
                        Text("\(store.summary.percent)%")
                            .font(.system(size: 26, weight: .bold))
                            .foregroundStyle(.white)
                        Text("\(store.summary.taken) of \(store.summary.total) taken")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(width: 110, height: 110)
                .padding(.vertical, 4)

                HStack(spacing: 5) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 11))
                        .foregroundStyle(DosifyWatchTheme.teal)
                    Text("\(store.summary.streakDays) day streak")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(.white)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .overlay(
                    Capsule()
                        .stroke(DosifyWatchTheme.teal.opacity(0.7), lineWidth: 1)
                )
            }
            .padding(.horizontal, 4)
        }
    }
}

// MARK: - Interaction risk

struct RiskAlertPage: View {
    let alert: WatchAlert

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 28))
                    .foregroundStyle(DosifyWatchTheme.danger)
                    .padding(.top, 2)

                Text(alert.isHigh ? "HIGH RISK" : alert.riskLevel.uppercased())
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .overlay(
                        Capsule()
                            .stroke(DosifyWatchTheme.danger, lineWidth: 1.5)
                    )

                Text(alert.pairLabel)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                    .lineLimit(3)
                    .minimumScaleFactor(0.85)

                Text(alert.advice?.isEmpty == false ? alert.advice! : "Avoid combining")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                // Watch apps can't deep-link reliably without companion handling;
                // this prompts the user to open Dosify on iPhone.
                Text("View on iPhone")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color(red: 0.12, green: 0.18, blue: 0.38), in: Capsule())
                    .padding(.top, 4)
            }
            .padding(.horizontal, 4)
        }
    }
}

struct RiskClearPage: View {
    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: "checkmark.shield.fill")
                .font(.system(size: 28))
                .foregroundStyle(DosifyWatchTheme.teal)
            Text("No high-risk alerts")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
            Text("Active interactions will show up here.")
                .font(.system(size: 11))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}

struct EmptySyncPage: View {
    @EnvironmentObject private var store: WatchDoseStore

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                BrandHeader()
                Image(systemName: "iphone.and.arrow.forward")
                    .font(.system(size: 26))
                    .foregroundStyle(DosifyWatchTheme.cyan)
                Text("Waiting for iPhone")
                    .font(.system(size: 16, weight: .bold))
                Text(store.statusMessage)
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                Text("Open Dosify → Today’s doses on your iPhone, keep the Watch nearby, then reopen this app.")
                    .font(.system(size: 10))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                Button("Refresh") {
                    store.reloadFromAppGroup()
                }
                .font(.system(size: 12, weight: .semibold))
                if let last = store.lastSyncAt {
                    Text("Updated \(last)")
                        .font(.system(size: 10))
                        .foregroundStyle(.secondary)
                }
            }
            .padding()
        }
    }
}
