# Deployment and operations

## Where it lives

| | |
|---|---|
| Repo | `wrzalkosowskilukaszz/unfoldAI` (name predates the rename) |
| Vercel project | `luke-s-projectss/unfoldai` |
| Live URL | https://unfoldai-seven.vercel.app |
| Deploys | Automatically, on every push to `main` |

A duplicate Vercel project (`unfold-ai-five`) existed and has been deleted.

## Environment variables

Both are set on Production. **Never add the key without the password** — that
puts a public spend button on the internet.

- `ANTHROPIC_API_KEY` — required, server-side only
- `APP_PASSWORD` — the shared access gate. Unset means the app is wide open.

Env vars are injected at deploy time, so **adding one does nothing until you
redeploy**. Vercel moved the UI: they are under Settings → Environments → click
the **Production** row, not a top-level "Environment Variables" page. The
dashboard's prefix check sometimes fails with "Failed to verify the project's
public environment variable prefix"; `vercel env add NAME production` bypasses it.

The CLI token expires. If `vercel --prod` says "Not authorized", run
`vercel login` — or just push to `main`, which deploys anyway.

## Verifying a deploy

```bash
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" https://unfoldai-seven.vercel.app/
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://unfoldai-seven.vercel.app/api/review-brief -H 'content-type: application/json' -d '{}'
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
