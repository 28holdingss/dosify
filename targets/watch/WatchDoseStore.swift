import Foundation
import WatchConnectivity

/// Local cache keys on the Watch (filled via WatchConnectivity from iPhone).
enum WatchSharedKeys {
    static let appGroup = "group.com.dhafee.dosify"
    static let doses = "watch.doses"
    static let pendingActions = "watch.pendingActions"
    static let lastSyncAt = "watch.lastSyncAt"
    static let summary = "watch.summary"
    static let alert = "watch.alert"
}

struct WatchDose: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let scheduledFor: String
    let status: String
    let timeLabel: String
    let doseLabel: String?
    let hint: String?

    var isActionable: Bool {
        status == "DUE" || status == "SNOOZED"
    }

    init(
        id: String,
        name: String,
        scheduledFor: String,
        status: String,
        timeLabel: String,
        doseLabel: String? = nil,
        hint: String? = nil
    ) {
        self.id = id
        self.name = name
        self.scheduledFor = scheduledFor
        self.status = status
        self.timeLabel = timeLabel
        self.doseLabel = doseLabel
        self.hint = hint
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        name = try c.decode(String.self, forKey: .name)
        scheduledFor = try c.decode(String.self, forKey: .scheduledFor)
        status = try c.decode(String.self, forKey: .status)
        timeLabel = try c.decode(String.self, forKey: .timeLabel)
        doseLabel = try c.decodeIfPresent(String.self, forKey: .doseLabel)
        hint = try c.decodeIfPresent(String.self, forKey: .hint)
    }
}

struct WatchSummary: Codable, Equatable {
    var taken: Int
    var total: Int
    var percent: Int
    var streakDays: Int

    static let empty = WatchSummary(taken: 0, total: 0, percent: 0, streakDays: 0)
}

struct WatchAlert: Codable, Equatable, Identifiable {
    var id: String { pairLabel + riskLevel }
    let riskLevel: String
    let title: String
    let advice: String?
    let pairLabel: String

    var isHigh: Bool { riskLevel.uppercased() == "HIGH" }
}

struct WatchPendingAction: Codable, Equatable {
    let id: String
    let action: String
    let createdAt: String
}

@MainActor
final class WatchDoseStore: NSObject, ObservableObject {
    static let shared = WatchDoseStore()

    @Published var doses: [WatchDose] = []
    @Published var summary: WatchSummary = .empty
    @Published var alert: WatchAlert?
    @Published var lastSyncAt: String?
    @Published var statusMessage: String = "Open Dosify on iPhone to sync doses."
    @Published var isBusy = false

    /// Prefer standard defaults on Watch — App Groups do not sync across devices.
    private var defaults: UserDefaults { .standard }

    override init() {
        super.init()
        activateSession()
        reloadFromCache()
        applyReceivedContextIfAny()
    }

    var dueDoses: [WatchDose] {
        doses.filter(\.isActionable)
    }

    var takenToday: [WatchDose] {
        doses.filter { $0.status == "TAKEN" }
    }

    var nextDose: WatchDose? {
        let open = doses.filter { $0.status != "TAKEN" && $0.status != "SKIPPED" }
        return open.sorted { $0.scheduledFor < $1.scheduledFor }.first
    }

    var primaryDue: WatchDose? {
        dueDoses.sorted { $0.scheduledFor < $1.scheduledFor }.first
    }

    func reloadFromAppGroup() {
        reloadFromCache()
        applyReceivedContextIfAny()
        requestSyncFromPhone()
    }

    func reloadFromCache() {
        lastSyncAt = defaults.string(forKey: WatchSharedKeys.lastSyncAt)

        if let raw = defaults.string(forKey: WatchSharedKeys.summary),
           let data = raw.data(using: .utf8),
           let decoded = try? JSONDecoder().decode(WatchSummary.self, from: data)
        {
            summary = decoded
        }

        if let raw = defaults.string(forKey: WatchSharedKeys.alert),
           !raw.isEmpty,
           let data = raw.data(using: .utf8),
           let decoded = try? JSONDecoder().decode(WatchAlert.self, from: data)
        {
            alert = decoded
        } else {
            alert = nil
        }

        guard let raw = defaults.string(forKey: WatchSharedKeys.doses),
              let data = raw.data(using: .utf8)
        else {
            if doses.isEmpty {
                statusMessage = "No doses yet — open Today’s doses on iPhone."
            }
            return
        }

        do {
            doses = try JSONDecoder().decode([WatchDose].self, from: data)
            if doses.isEmpty {
                statusMessage = "No doses scheduled today."
            } else {
                statusMessage = "Synced from iPhone"
            }
            recomputeSummaryFallback()
        } catch {
            statusMessage = "Could not read dose data"
        }
    }

    private func recomputeSummaryFallback() {
        guard defaults.string(forKey: WatchSharedKeys.summary) == nil else { return }
        let taken = doses.filter { $0.status == "TAKEN" }.count
        let total = max(doses.filter { $0.status != "SKIPPED" }.count, doses.count)
        summary = WatchSummary(
            taken: taken,
            total: total,
            percent: total > 0 ? Int(round(Double(taken) / Double(total) * 100)) : 0,
            streakDays: summary.streakDays
        )
    }

    func applySyncPayload(_ info: [String: Any]) {
        guard (info["type"] as? String) == "dose_sync" || info["dosesJson"] != nil else { return }

        if let dosesJson = info["dosesJson"] as? String {
            defaults.set(dosesJson, forKey: WatchSharedKeys.doses)
        }
        if let summaryJson = info["summaryJson"] as? String, !summaryJson.isEmpty {
            defaults.set(summaryJson, forKey: WatchSharedKeys.summary)
        }
        if let alertJson = info["alertJson"] as? String {
            if alertJson.isEmpty {
                defaults.removeObject(forKey: WatchSharedKeys.alert)
            } else {
                defaults.set(alertJson, forKey: WatchSharedKeys.alert)
            }
        }
        if let last = info["lastSyncAt"] as? String {
            defaults.set(last, forKey: WatchSharedKeys.lastSyncAt)
        }

        reloadFromCache()
    }

    private func applyReceivedContextIfAny() {
        guard WCSession.isSupported() else { return }
        let context = WCSession.default.receivedApplicationContext
        if !context.isEmpty {
            applySyncPayload(context)
        }
    }

    private func requestSyncFromPhone() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        guard session.activationState == .activated, session.isReachable else { return }
        session.sendMessage(
            ["type": "request_sync"],
            replyHandler: { [weak self] reply in
                Task { @MainActor in
                    self?.applySyncPayload(reply)
                }
            },
            errorHandler: { _ in }
        )
    }

    func markTaken(_ dose: WatchDose) {
        enqueue(action: "taken", doseId: dose.id)
        optimisticallyUpdate(doseId: dose.id, status: "TAKEN")
    }

    func markSkipped(_ dose: WatchDose) {
        enqueue(action: "skipped", doseId: dose.id)
        optimisticallyUpdate(doseId: dose.id, status: "SKIPPED")
    }

    func markSnoozed(_ dose: WatchDose) {
        enqueue(action: "snoozed", doseId: dose.id)
        optimisticallyUpdate(doseId: dose.id, status: "SNOOZED")
    }

    private func optimisticallyUpdate(doseId: String, status: String) {
        doses = doses.map { dose in
            guard dose.id == doseId else { return dose }
            return WatchDose(
                id: dose.id,
                name: dose.name,
                scheduledFor: dose.scheduledFor,
                status: status,
                timeLabel: dose.timeLabel,
                doseLabel: dose.doseLabel,
                hint: dose.hint
            )
        }
        let taken = doses.filter { $0.status == "TAKEN" }.count
        let total = max(doses.filter { $0.status != "SKIPPED" }.count, 1)
        summary = WatchSummary(
            taken: taken,
            total: total,
            percent: Int(round(Double(taken) / Double(total) * 100)),
            streakDays: summary.streakDays
        )
        if let data = try? JSONEncoder().encode(doses),
           let raw = String(data: data, encoding: .utf8)
        {
            defaults.set(raw, forKey: WatchSharedKeys.doses)
        }
    }

    private func enqueue(action: String, doseId: String) {
        let createdAt = ISO8601DateFormatter().string(from: Date())
        let payload: [String: Any] = [
            "type": "dose_action",
            "id": doseId,
            "action": action,
            "createdAt": createdAt,
        ]

        guard WCSession.isSupported() else {
            statusMessage = "WatchConnectivity unavailable"
            return
        }
        let session = WCSession.default

        if session.isReachable {
            session.sendMessage(
                payload,
                replyHandler: { _ in },
                errorHandler: { [weak self] _ in
                    session.transferUserInfo(payload)
                    Task { @MainActor in
                        self?.statusMessage = "Action queued for iPhone"
                    }
                }
            )
        } else {
            session.transferUserInfo(payload)
            statusMessage = "Action queued — open Dosify on iPhone"
        }
    }

    private func activateSession() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        session.delegate = self
        session.activate()
    }
}

extension WatchDoseStore: WCSessionDelegate {
    nonisolated func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        Task { @MainActor in
            applyReceivedContextIfAny()
            if activationState == .activated {
                requestSyncFromPhone()
            }
        }
    }

    nonisolated func session(
        _ session: WCSession,
        didReceiveApplicationContext applicationContext: [String: Any]
    ) {
        Task { @MainActor in
            applySyncPayload(applicationContext)
        }
    }

    nonisolated func session(
        _ session: WCSession,
        didReceiveUserInfo userInfo: [String: Any] = [:]
    ) {
        Task { @MainActor in
            applySyncPayload(userInfo)
        }
    }

    nonisolated func session(
        _ session: WCSession,
        didReceiveMessage message: [String: Any]
    ) {
        Task { @MainActor in
            applySyncPayload(message)
        }
    }

    nonisolated func session(
        _ session: WCSession,
        didReceiveMessage message: [String: Any],
        replyHandler: @escaping ([String: Any]) -> Void
    ) {
        Task { @MainActor in
            applySyncPayload(message)
            replyHandler(["ok": true])
        }
    }

    #if os(iOS)
    nonisolated func sessionDidBecomeInactive(_ session: WCSession) {}
    nonisolated func sessionDidDeactivate(_ session: WCSession) {
        session.activate()
    }
    #endif
}
