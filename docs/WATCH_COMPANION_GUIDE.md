# Dosify Apple Watch Companion — Detailed Guide

This guide walks you from zero to a working Watch app on a physical Apple Watch, then toward TestFlight / App Store.

---

## What you are building

| Piece | What it is |
|-------|------------|
| **iPhone app** | Expo / React Native Dosify (`com.dhafee.dosify`) |
| **Watch app** | Native SwiftUI companion (`com.dhafee.dosify.watchkitapp`) |
| **HealthKit sync** | Separate feature on iPhone (sleep, HR, steps → Recovery) |
| **Watch companion** | Today’s doses on the wrist + Taken / Skip / Snooze |

The Watch app does **not** pair the Watch (Apple does that). It does **not** replace HealthKit sync. It shows doses and sends actions back to the iPhone.

```
Apple Watch (DosifyWatch)
    │  App Group: group.com.dhafee.dosify
    │  watch.doses ← read
    │  watch.pendingActions → write
    ▼
iPhone (Dosify)
    │  lib/watch-companion.ts
    ▼
API  POST /api/doses/:id  (taken / skipped / snoozed)
```

---

## Prerequisites

### Hardware / software
- Mac with **macOS 15+** and **Xcode 16+**
- Physical **iPhone** + paired **Apple Watch** (simulator Watch works for UI only; App Groups + real sync need devices)
- Paid **Apple Developer** account
- Dosify repo with server running (or production API) so doses exist

### Already in the repo
- [`targets/watch/`](../targets/watch/) — SwiftUI Watch target
- [`lib/watch-companion.ts`](../lib/watch-companion.ts) — App Group sync
- [`@bacons/apple-targets`](https://github.com/evanbacon/expo-apple-targets) in `app.json` plugins
- App Group entitlement on iPhone: `group.com.dhafee.dosify` in `app.json`

---

## Part 1 — Apple Developer portal

### 1.1 App Group
1. Open [developer.apple.com/account](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles**
2. **Identifiers** → **+** → **App Groups** → Continue  
   - Description: `Dosify Shared`  
   - Identifier: `group.com.dhafee.dosify`  
   - Register

### 1.2 iPhone App ID
1. **Identifiers** → find **`com.dhafee.dosify`**
2. Enable:
   - **App Groups** → Configure → check `group.com.dhafee.dosify`
   - **HealthKit** (for Watch Sync / Health data on iPhone)
   - **Push Notifications** (optional; local dose alerts already work without APNs certs)
3. Save

### 1.3 Watch App ID
1. **Identifiers** → **+** → **App IDs** → **App**
2. Description: `Dosify Watch`
3. Bundle ID: **Explicit** → `com.dhafee.dosify.watchkitapp`
4. Enable **App Groups** → same `group.com.dhafee.dosify`
5. Register / Save

### 1.4 Provisioning
EAS / Xcode automatic signing usually regenerates profiles. If you manage profiles manually:
- Create/refresh **Development** and **Distribution** profiles for both App IDs including the App Group.

---

## Part 2 — Generate the native iOS + Watch project

From the repo root:

```bash
cd /Users/ekaygabriel/Downloads/bioos

# Install deps if needed
npm install

# Generate / refresh ios/ and link targets/watch
npx expo prebuild -p ios
```

Use `--clean` only when you intentionally want to wipe `ios/` and regenerate:

```bash
npx expo prebuild -p ios --clean
```

After prebuild you should see the Watch target linked (in Xcode under something like `expo:targets/watch` or **DosifyWatch**).

Open the project:

```bash
xed ios
```

---

## Part 3 — Xcode setup

### Why Watch showed “No doses yet”
App Groups **do not sync** UserDefaults from iPhone → Watch (separate devices). Dosify uses **WatchConnectivity** (`modules/watch-bridge`) to push doses and receive Taken/Snooze.

If the Watch is empty:
1. Use a real **EAS / TestFlight** build (not Expo Go) that includes Watch + WatchBridge  
2. On iPhone: open **Dosify → Today’s doses** (triggers sync)  
3. Keep Watch nearby → open Dosify on Watch → tap **Refresh** if needed  

### 3.1 Signing
1. Select the **main app** target (Dosify / bioos)  
   - Team: your Apple Developer team  
   - Bundle ID: `com.dhafee.dosify`  
   - Signing: Automatic (recommended)
2. Select the **DosifyWatch** / watch target  
   - Team: same
   - Bundle ID: `com.dhafee.dosify.watchkitapp`  
   - Confirm App Groups capability shows `group.com.dhafee.dosify`

If App Groups is missing on either target, add it under **Signing & Capabilities** → **+ Capability** → **App Groups**.

### 3.2 Schemes
- To run the phone app: scheme **Dosify** (or your main app name) → your iPhone  
- To run the Watch app: scheme **DosifyWatch** → your Apple Watch (paired to that iPhone)

First Watch install can take several minutes.

### 3.3 Build order tip
1. Build & run **iPhone app** first (install Dosify, sign in)  
2. Then build & run **DosifyWatch** onto the Watch  

---

## Part 4 — End-to-end test on devices

### 4.1 Prepare data on iPhone
1. Launch Dosify on the iPhone (dev build, not Expo Go for Watch + HealthKit)  
2. Sign in  
3. Add a medication + schedule with a dose **due soon** (or due today)  
4. Open **Today’s doses**  

That screen (and app foreground) calls `refreshWatchCompanion()`, which writes:

- `watch.doses` — JSON list of today’s doses  
- `watch.lastSyncAt` — time label  

into the App Group.

### 4.2 On the Watch
1. Open **Dosify** on the Watch  
2. You should see **Due** doses (name, time, status)  
3. Tap **Taken** / **Skip** / **Snooze**  

Watch writes to `watch.pendingActions` and optionally pings the phone via WatchConnectivity if reachable.

### 4.3 Confirm on iPhone
1. Bring Dosify to the foreground (or pull to refresh / reopen Today’s doses)  
2. `processWatchPendingActions()` should call the API and refresh  
3. Dose status should match on phone and, after the next sync, on Watch  

### 4.4 HealthKit (separate)
For Recovery / sleep / HR:
1. Dosify → **Apple Watch Sync**  
2. **Connect & sync** → allow Health access  
3. Wear Watch overnight for sleep / resting HR  

That path is HealthKit → `/api/wearables/sync`, not the Watch companion UI.

---

## Part 5 — File map (for developers)

### Watch (Swift)
| File | Role |
|------|------|
| `targets/watch/index.swift` | `@main` Watch app entry |
| `targets/watch/content.swift` | Dose list UI |
| `targets/watch/WatchDoseStore.swift` | App Group + WCSession |
| `targets/watch/expo-target.config.js` | Target type, icon, entitlements |
| `targets/watch/Info.plist` | Companion bundle id |

### iPhone (TypeScript)
| File | Role |
|------|------|
| `lib/watch-companion.ts` | Sync doses out / drain Watch actions |
| `app/_layout.tsx` | Starts companion bridge on launch |
| `app/todays-doses.tsx` | Syncs after load / dose actions |
| `app.json` | Plugin + App Group entitlement |

### Shared keys
| Key | Direction | Content |
|-----|-----------|---------|
| `watch.doses` | iPhone → Watch | JSON array of `{ id, name, scheduledFor, status, timeLabel }` |
| `watch.pendingActions` | Watch → iPhone | JSON array of `{ id, action, createdAt }` |
| `watch.lastSyncAt` | iPhone → Watch | Display string |

Actions: `taken` | `skipped` | `snoozed`

---

## Part 6 — EAS / TestFlight / App Store

### 6.1 Build
Ensure Apple Team ID is set if needed (`ios.appleTeamId` in `app.json`).

```bash
eas build --platform ios --profile development   # device testing
eas build --platform ios --profile preview       # internal
eas build --platform ios --profile production    # store
```

The Watch target is included when prebuild + `@bacons/apple-targets` linked it correctly. After a cloud build, confirm the archive **Includes Apple Watch**.

### 6.2 TestFlight
1. Submit the build to App Store Connect  
2. Install Dosify on the test iPhone from TestFlight  
3. Watch app should appear under the Watch automatically (or in Watch app → My Watch → available apps)  
4. Repeat Part 4 checks on TestFlight builds  

### 6.3 App Store (when companion is ready)
Only submit the “Watch-ready” release when:

- [ ] Watch app installs with Dosify  
- [ ] Due doses appear after opening Today’s doses on iPhone  
- [ ] Taken / Skip / Snooze updates server + iPhone  
- [ ] Empty state is clear when no data / iPhone not synced  
- [ ] HealthKit permission strings still accurate  
- [ ] Privacy Nutrition Labels include Health data you read  
- [ ] Review notes mention: Watch for dose actions; HealthKit on iPhone for recovery metrics  

---

## Part 7 — Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Watch shows “No doses yet” | App Group empty / not opened Today’s doses | Open Dosify → Today’s doses on iPhone; confirm App Group on both IDs |
| Actions don’t stick | Pending queue not drained | Foreground Dosify; check API / auth; look for failed `markDose*` |
| Watch app missing after install | Signing / embed Watch target | Xcode: Watch target signed; product embeds Watch app; rebuild |
| Prebuild wiped Watch | Edited only inside `ios/` | Keep Watch code under `targets/watch/`; re-run prebuild |
| Expo Go | No native Watch / HealthKit | Use `expo run:ios` / EAS / Xcode device build |
| App Group mismatch | Different group strings | Must be exactly `group.com.dhafee.dosify` everywhere |
| First Watch install hangs | Normal on device | Wait; keep Watch unlocked and near iPhone |

### Useful Xcode checks
- **Window → Devices and Simulators** → Watch → Open Console  
- Confirm both targets share the same Team and App Group  
- Scheme **DosifyWatch** destination = your physical Watch  

---

## Part 8 — Suggested order of work (checklist)

1. [ ] Create App Group + Watch App ID in Developer portal  
2. [ ] Attach App Group to iPhone + Watch App IDs  
3. [ ] `npx expo prebuild -p ios`  
4. [ ] `xed ios` → fix signing on both targets  
5. [ ] Run iPhone app → sign in → schedule a dose → open Today’s doses  
6. [ ] Run DosifyWatch on the Watch → verify list + actions  
7. [ ] EAS development/preview build → TestFlight  
8. [ ] Production build → App Store when checklist in §6.3 is green  

---

## Out of scope (later)

- Watch face complications (`npx create-target watch-widget`)  
- Full WCSession live sync without opening iPhone (needs richer native iOS bridge)  
- Standalone Watch networking (auth without phone)  
- Editing schedules / cabinet from Watch  

---

## Quick commands

```bash
# Link Watch target into ios/
npx expo prebuild -p ios

# Open Xcode
xed ios

# Device / EAS builds
npx expo run:ios --device
eas build --platform ios --profile development
eas build --platform ios --profile production
```

For HealthKit-only sync (no Watch UI), see the in-app **Apple Watch Sync** screen and `lib/watch-sync/`.
