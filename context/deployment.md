# Deployment and operations

## Where it lives

| | |
|---|---|
| Repo | `wrzalkosowskilukaszz/unfoldAI` (name predates the rename) |
| Vercel project | `luke-s-projectss/surveyvor` |
| Live URL | https://surveyvor.app |
| Deploys | Automatically, on every push to `main` |

A duplicate Vercel project (`unfold-ai-five`) existed and has been deleted.

## Environment variables

Both are set on Production. **Never add the key without the password** — that
puts a public spend button on the internet.

- `ANTHROPIC_API_KEY` — required, server-side only
- `APP_PASSWORD` — the shared access gate. **Unset means the app is public**,
  which is the intended state from September 2026 on. Set it again to close the
  beta; nothing else changes.
- `DAILY_AI_CALL_LIMIT` — optional, default 1000. Whole-service ceiling on AI
  calls per day; users past it get a friendly 429 until the window rolls over.
  Cheap insurance under the Anthropic hard cap once there is no password.
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — required in
  production. Without them the rate limiter counts in each function instance's
  own memory, so the limit is per-instance rather than per-person and the spend
  ceiling effectively disappears. Free tier is far more than enough; create it
  at console.upstash.com or through the Vercel Marketplace. The app logs a loud
  warning on first request if they are missing in production.

Env vars are injected at deploy time, so **adding one does nothing until you
redeploy**. Vercel moved the UI: they are under Settings → Environments → click
the **Production** row, not a top-level "Environment Variables" page. The
dashboard's prefix check sometimes fails with "Failed to verify the project's
public environment variable prefix"; `vercel env add NAME production` bypasses it.

The CLI token expires. If `vercel --prod` says "Not authorized", run
`vercel login` — or just push to `main`, which deploys anyway.

## Going public (removing the password)

Everything in code is already in place: the root page serves real title and
social-card tags without JavaScript, the sitemap drops `/unlock` on its own,
the lock control hides itself, and the daily ceiling takes over from the gate.
The only action is in Vercel, and it needs a redeploy to take effect:

```bash
vercel env rm APP_PASSWORD production
git commit --allow-empty -m "Redeploy: open the beta" && git push
```

Check afterwards, and only walk away when all three are right:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://surveyvor.app/          # 200 (was 303 -> /unlock)
curl -s https://surveyvor.app/ | grep -c 'og:title'                        # 1 — link previews work
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://surveyvor.app/api/review-brief -H 'content-type: application/json' -d '{}'   # 400 (was 401)
```

A 400 from the API is correct once the gate is off: it means the request
reached validation. What must **never** appear is a 200 or 502 for an empty
body. Also confirm the Upstash variables are still set — without them the
per-address limit is per function instance and the ceiling is the only thing
left.

## Verifying a deploy (while the password is set)

```bash
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" https://surveyvor.app/
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://surveyvor.app/api/review-brief -H 'content-type: application/json' -d '{}'
```

Healthy: `303 -> /unlock` and `401`. A **400 or 502 from the API means the gate
is not protecting it** — investigate before walking away.

## Cost

- A hard spend cap is set in the Anthropic Console.
- Every AI call logs one line of JSON to the Vercel runtime logs. Filter for
  `"type":"usage"` to get real per-brief cost instead of an estimate.
- Cost is **output**-dominated (output ≈ 5× input). To reduce spend, look at
  `output_config.effort` and `max_tokens`, not at prompt size.
- Prompt caching does not apply — all system prompts are under Sonnet's
  1024-token minimum, so `cache_control` would be silently ignored.

## Restore points

```bash
git checkout finished-unfold   # the complete pre-rename app
```

## Local development

```bash
source "$HOME/.nvm/nvm.sh" && nvm use v26.7.0
npm run dev
```

Node v26.7.0 via nvm (Vite 8 needs ≥20.19). Run `npm run check` and `npm run build`
before pushing. Scan for secrets first:

```bash
git grep -I -E "sk-ant-|APP_PASSWORD=[^[:space:]]"
```

## Mobile

Capacitor is **deliberately deferred**. A web app in a WKWebView with no native
capability is a textbook App Store Guideline 4.2 rejection, and it would turn
same-origin `/api/*` calls into cross-origin ones (CORS + session cookie work)
without improving the product. A PWA is the cheap path to a home-screen icon.
