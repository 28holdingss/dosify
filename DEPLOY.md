# Deploying Dosify

The app has two independently-deployed pieces:

| Piece | What it is | Where to host |
| --- | --- | --- |
| **Web frontend** | Expo Router web build (`output: "static"`) | **Vercel** |
| **API server** | Hono + Prisma + Postgres (`server/`) | Railway / Render / Fly (a long-running Node host) |

> **Use one custom domain for both.** Serve the web app and API as subdomains of the
> same registrable domain (e.g. `dosify.example.com` + `api.example.com`). The auth
> session cookie is `SameSite=None; Secure`, and keeping both on one parent domain
> makes the cookie same-site so logins work reliably across browsers (Safari in
> particular drops cross-site cookies).

---

## 1. Deploy the API (do this first)

You need the API's public HTTPS URL before building the web app.

The server runs TypeScript directly with `tsx` — there is no compile step.

- **Install:** `npm install`
- **Start:** `npm start --workspace=@bioos/server` (runs `tsx src/index.ts`)
- **Migrate DB:** `npx prisma migrate deploy --schema server/prisma/schema.prisma`
- **Seed (optional):** `npm run db:seed --workspace=@bioos/server`

### API environment variables

```bash
DATABASE_URL="postgres://.../dbname"          # from your DB provider
PORT=3001                                       # or provider-injected port
BETTER_AUTH_SECRET="<openssl rand -base64 32>"  # required
BETTER_AUTH_URL="https://api.example.com"        # the API's public URL
WEB_APP_URL="https://dosify.example.com"          # web origin(s) for trustedOrigins; comma-separated for multiple, e.g. "https://dosify.example.com,https://dosify.vercel.app"
GROQ_API_KEY=""                                   # optional (AI features)
OPENAI_API_KEY=""                                 # optional fallback
```

Point `api.example.com` at this host, then confirm:

```bash
curl https://api.example.com/health
# {"status":"ok","database":"connected"}
```

---

## 2. Deploy the web frontend to Vercel

Config lives in `vercel.json`:

- **Framework:** `null` (Other) — overrides auto-detect so Vercel does not treat the monorepo as Hono
- **Build:** `npx expo export -p web`
- **Output:** `dist`
- **Install:** `npm install`

`dist/` is gitignored on purpose — Vercel builds it.

### Vercel project settings checklist

| Setting | Value |
| --- | --- |
| Root Directory | leave empty (repo root — **not** `server`) |
| Framework Preset | Other |
| Build Command | `npx expo export -p web` (from `vercel.json`) |
| Output Directory | `dist` |
| Install Command | `npm install` |

> If the import wizard still shows **Hono**, ignore it — once `vercel.json` with
> `"framework": null` is on `main`, the build uses Expo static export instead.

### Vercel environment variable

Set this for the **Production** environment (Settings -> Environment Variables):

```bash
EXPO_PUBLIC_API_URL=https://api.example.com
```

`EXPO_PUBLIC_API_URL` is baked into the bundle at build time, so **redeploy after
changing it**. Never put secrets in `EXPO_PUBLIC_*` — those values are public.

---

## 3. Add the custom domain in Vercel

1. Vercel -> Project -> Settings -> **Domains** -> add `dosify.example.com`
   (or the root `example.com`).
2. Add the DNS record Vercel gives you (CNAME for a subdomain; A/ALIAS for a root).
3. Wait for the SSL certificate to issue automatically.

---

## 4. Verify

1. Open `https://mydosify.com` and sign up / log in.
2. In DevTools -> Network, confirm the auth response sets a cookie and subsequent
   `/api/...` requests send it, with no CORS errors.

---

## 5. App Store legal URLs

After deploying the web app, use these in App Store Connect → App Information:

| Field | URL |
| --- | --- |
| **Privacy Policy URL** | `https://mydosify.com/privacy` |
| **Support URL** | `https://mydosify.com/support` |
| Terms (optional / EULA) | `https://mydosify.com/terms` |

Support email referenced in those pages: `support@mydosify.com` (create the mailbox or forward it).

---

## Notes / gotchas

- **HTTPS on both sides is mandatory** — the session cookie is `Secure`.
- **CORS** allows only configured `WEB_APP_URL` origins (comma-separated), localhost web
  servers, and native `dosify://` / `exp://` schemes. Do not set a literal `*`.
- **Phase 0/1 migration** — after pulling Health Cabinet / schedules work, run
  `npx prisma migrate deploy --schema server/prisma/schema.prisma` (or
  `npm run db:migrate --workspace=@bioos/server` locally) so Cabinet, schedules,
  and dose tables exist before using those screens.
- **Phase 2 migration** — `20260719210000_phase2_interaction_checks` adds
  InteractionCheck / Finding tables for Check Before Taking. Apply the same
  `prisma migrate deploy` command after pull.
- **Phase 3** — product barcodes and medicine knowledge endpoints ship behind
  `/api/products` and `/api/knowledge` once that migration is applied.
- **Phase 4** — `20260719230000_phase4_care_reports` adds emergency contacts,
  symptom logs, households/care grants, and health report exports
  (`/api/emergency-contacts`, `/api/symptoms`, `/api/households`, `/api/reports`).
  Apply with the same `prisma migrate deploy` command after pull.
- **Phase 5 (partial)** — `/api/insights/observational` correlates adherence with
  wearables/symptoms and is gated by `User.isPremium` on the server. Pharmacy and
  Health Connect are not shipped yet.
- **Web is client-only.** HealthKit / Apple Watch sync are native-only and do not
  run in the web build. Local medication reminders use `expo-notifications` on
  native; web shows in-app due doses only.
- **Do not deploy `server/` to Vercel** — it uses `@hono/node-server`'s long-running
  `serve()`, not a serverless handler.
