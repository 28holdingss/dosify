# Dosify Apple Watch companion

Native watchOS app (SwiftUI) via `@bacons/apple-targets`.

**Full step-by-step:** [docs/WATCH_COMPANION_GUIDE.md](../../docs/WATCH_COMPANION_GUIDE.md)

## Quick start

1. Apple Developer: App Group `group.com.dhafee.dosify` on `com.dhafee.dosify` + `com.dhafee.dosify.watchkitapp`
2. `npx expo prebuild -p ios`
3. `xed ios` → run **DosifyWatch** on a paired Watch
4. On iPhone: open Dosify → **Today’s doses** so the Watch gets data

## What it does

- Due / taken doses on the wrist  
- Taken · Skip · Snooze → queued for the iPhone API  
- HealthKit Recovery sync stays on the iPhone (`lib/watch-sync/`)
