import ExpoModulesCore
import Foundation
import WatchConnectivity

public class WatchBridgeModule: Module {
  private static weak var shared: WatchBridgeModule?

  public func definition() -> ModuleDefinition {
    Name("WatchBridge")

    Events("onWatchDoseAction")

    OnCreate {
      WatchBridgeModule.shared = self
      WatchSessionHandler.shared.activate()
      WatchSessionHandler.shared.onAction = { payload in
        WatchBridgeModule.shared?.sendEvent("onWatchDoseAction", payload)
      }
    }

    Function("isSupported") { () -> Bool in
      WCSession.isSupported()
    }

    Function("getStatus") { () -> [String: Any] in
      WatchSessionHandler.shared.activate()
      guard WCSession.isSupported() else {
        return [
          "supported": false,
          "paired": false,
          "watchAppInstalled": false,
          "reachable": false,
          "activated": false,
        ]
      }
      let session = WCSession.default
      return [
        "supported": true,
        "paired": session.isPaired,
        "watchAppInstalled": session.isWatchAppInstalled,
        "reachable": session.isReachable,
        "activated": session.activationState == .activated,
      ]
    }

    AsyncFunction("pushContext") { (payload: [String: Any]) in
      try WatchSessionHandler.shared.pushContext(payload)
    }
  }
}

final class WatchSessionHandler: NSObject, WCSessionDelegate {
  static let shared = WatchSessionHandler()

  var onAction: (([String: Any]) -> Void)?
  private var lastContext: [String: Any] = [:]

  private override init() {
    super.init()
  }

  func activate() {
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    if session.delegate == nil || session.delegate !== self {
      session.delegate = self
    }
    if session.activationState != .activated {
      session.activate()
    }
  }

  func pushContext(_ payload: [String: Any]) throws {
    activate()
    guard WCSession.isSupported() else {
      throw NSError(
        domain: "WatchBridge",
        code: 1,
        userInfo: [NSLocalizedDescriptionKey: "WatchConnectivity is not supported on this device"]
      )
    }
    lastContext = payload
    let session = WCSession.default
    guard session.activationState == .activated else {
      session.activate()
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { [weak self] in
        guard let self else { return }
        try? session.updateApplicationContext(self.lastContext)
        if session.isReachable {
          session.sendMessage(self.lastContext, replyHandler: { _ in }, errorHandler: { _ in })
        }
      }
      return
    }

    try session.updateApplicationContext(payload)
    if session.isReachable {
      session.sendMessage(payload, replyHandler: { _ in }, errorHandler: { _ in })
    }
  }

  private func handleIncoming(_ info: [String: Any], replyHandler: (([String: Any]) -> Void)? = nil) {
    let type = info["type"] as? String

    if type == "request_sync" {
      replyHandler?(lastContext.isEmpty ? ["ok": false, "type": "dose_sync"] : lastContext)
      return
    }

    if type == "dose_action",
       let id = info["id"] as? String,
       let action = info["action"] as? String
    {
      onAction?([
        "id": id,
        "action": action,
        "createdAt": info["createdAt"] as? String ?? ISO8601DateFormatter().string(from: Date()),
      ])
      replyHandler?(["ok": true])
      return
    }

    replyHandler?(["ok": true])
  }

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {}

  func sessionDidBecomeInactive(_ session: WCSession) {}

  func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }

  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    DispatchQueue.main.async {
      self.handleIncoming(message)
    }
  }

  func session(
    _ session: WCSession,
    didReceiveMessage message: [String: Any],
    replyHandler: @escaping ([String: Any]) -> Void
  ) {
    DispatchQueue.main.async {
      self.handleIncoming(message, replyHandler: replyHandler)
    }
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
    DispatchQueue.main.async {
      self.handleIncoming(userInfo)
    }
  }

  func sessionWatchStateDidChange(_ session: WCSession) {}

  func sessionReachabilityDidChange(_ session: WCSession) {
    guard session.isReachable, !lastContext.isEmpty else { return }
    session.sendMessage(lastContext, replyHandler: { _ in }, errorHandler: { _ in })
  }
}
