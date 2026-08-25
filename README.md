# Surveyvor

Turns a messy client conversation into a brief everyone agrees on — surfacing what's
vague, contradictory or still unknown before anyone starts designing.

## Running locally

```bash
nvm use v26.7.0        # Vite 8 needs Node >= 20.19
npm install
cp .env.example .env   # then add your ANTHROPIC_API_KEY
npm run dev
```

Leave `APP_PASSWORD` unset locally so the app stays open.

## Deploying

The app is a normal SvelteKit project using `adapter-auto`, which detects the host at
build time. It runs on Vercel, Netlify or Cloudflare with no code change.

**Before the URL is public, set both environment variables on the host:**

| Variable | Required | Notes |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Yes | Server-side only. Never commit it. |
| `APP_PASSWORD` | Strongly recommended | Enables the access gate. Without it, anyone with the URL can spend your Anthropic credits. |

Also set a **hard spend cap in the Anthropic Console**. App-level limits reduce risk;
the console cap is the only thing that cannot be bypassed.

### Steps

1. Push this repo to GitHub.
2. Import it in your host's dashboard (Vercel / Netlify / Cloudflare Pages).
3. Add the two environment variables above.
4. Deploy.

## Cost & abuse controls

| Control | Where | Notes |
| --- | --- | --- |
| Access gate | `src/lib/server/auth.ts` | Shared password; blocks pages *and* API before any AI call. |
| Rate limit | `src/lib/server/rateLimit.ts` | 25 requests / 10 min per IP. |
| Input cap | same file | 20k characters per request. |
| Spend cap | Anthropic Console | The real backstop. |

**One caveat on the rate limiter:** it holds state in-process. That is correct on a
long-running Node server or container. On serverless (Vercel/Netlify functions) each
instance keeps its own counter, so the effective limit is per-instance. If you deploy
serverless and expect real traffic, move it to Upstash Redis or the platform's own
rate limiting.

## Where data lives

Briefs are stored in the browser's `localStorage` — nothing is persisted server-side.
Brief content *is* sent to the Anthropic API when the AI features are used. There are
no accounts; export/import a `.json` to move a brief between machines.

## Architecture notes

- **Svelte 5 runes** throughout (`$state`, `$derived`, `$props`).
- `ssr = false` on the main route — the app is entirely client-state driven.
- API routes in `src/routes/api/` are the only place the Anthropic key is touched.
- A mobile app (Capacitor) would call this same deployment; the key can never ship
  inside an app bundle.
