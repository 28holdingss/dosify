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
WEB_APP_URL="https://dosify.example.com"          # adds the web origin to trustedOrigins
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

- **Build:** `npx expo export -p web`
- **Output:** `dist`
- **Install:** `npm install`

`dist/` is gitignored on purpose — Vercel builds it.

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

1. Open `https://dosify.example.com` and sign up / log in.
2. In DevTools -> Network, confirm the auth response sets a cookie and subsequent
   `/api/...` requests send it, with no CORS errors.

---

## Notes / gotchas

- **HTTPS on both sides is mandatory** — the session cookie is `Secure`.
- **CORS** already reflects the request origin and allows credentials
  (`server/src/index.ts`); don't replace it with a literal `*`.
- **Web is client-only.** HealthKit / Apple Watch sync are native-only and do not
  run in the web build.
- **Do not deploy `server/` to Vercel** — it uses `@hono/node-server`'s long-running
  `serve()`, not a serverless handler.
