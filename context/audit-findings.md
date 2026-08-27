# Pre-launch audit — tracked findings

Full report: https://claude.ai/code/artifact/e4e59c4e-1879-4da6-ad6b-e98883e33a6a
Audited 27 Aug 2026 at commit `5bd03e3` against all 60 sections of `CHECKLIST.md`.

**Verdict: not production-ready; close for a private beta.** Production-quality
frontend on prototype foundations. The gap is durability, observability and law
— not craft.

Work these in order. Update the status column here as each lands; this file is
the single source of truth for what is left.

## Blocking a public link

| # | Finding | Status |
|---|---|---|
| 1 | ~~Rate limiting does not work on serverless.~~ **CODE DONE 27 Aug — needs provisioning.** Counter now lives in Upstash Redis with a weighted sliding window, falling back to in-process for local dev and during a Redis outage (fails open, never locks users out, and reports `durable: false`). **Action required: create a free Upstash database and set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel.** Until then production logs a warning and the old per-instance behaviour applies. | ◐ awaiting provisioning |
| 2 | ~~Client briefs go to Anthropic with no disclosure.~~ **DONE 27 Aug.** `/privacy` and `/terms` published as Take a Luke Studio (Poland), both exempt from the beta gate. Privacy names Anthropic, Vercel and Upstash as sub-processors, states the training position with a citation, covers SCC transfers, retention, GDPR rights and UODO. Terms carry an as-is warranty disclaimer and a limitation-of-liability clause. Homepage carries a plain-language data-safety line. **Still advisable: a lawyer's read before taking real client data or charging.** | ☑ done |
| 3 | **A cleared browser destroys everything.** ◐ **Mitigated 27 Aug — not solved.** Briefs now track `lastExportedAt`; the save indicator reads "Saved here only — not exported yet" and gallery cards carry a marker until a brief is downloaded, copied or printed. Edits after an export re-flag it. This makes the risk visible; it does **not** remove it. The real fix is still a server-side store with identity, which is the same work as accounts. | ◐ mitigated |
| 4 | ~~No automated tests.~~ **DONE 27 Aug.** Vitest suite, 28 tests, covering the migration chain, template switching, finding lifecycle, import/duplicate fidelity, prompt-injection guards, the access gate and the save-failure path. `npm test`. Caught a real auth bug on first run. | ☑ done |

## Before public launch

| # | Finding | Status |
|---|---|---|
| 5 | Shared password only — no per-user identity, revocation or audit. Acceptable for a beta with people you know. | ☐ open |
| 6 | ~~Nothing watches production.~~ **DONE 27 Aug.** `handleError` on both server and client. Every unhandled error gets a short reference shown on the error page and written as structured JSON, so a bug report is greppable. Forwards to Sentry when `SENTRY_DSN` is set — optional, and useful without it. Messages are truncated and error properties are never serialised, so brief content cannot leak into logs. Still no uptime pinger. | ☑ done |
| 7 | No product analytics — roadmap decisions currently have no evidence behind them. | ☐ open |
| 8 | ~~No meta description, Open Graph, canonical or sitemap.~~ **DONE 27 Aug.** `Seo.svelte` gives every route title, description, canonical, Open Graph and Twitter card. Favicon (SVG + PNG set), apple-touch-icon, maskable icon, web manifest and a generated 1200x630 social card. `/sitemap.xml` route, robots.txt updated. The gated app carries `noindex`; the public pages do not. | ☑ done |

## Before iOS

| # | Finding | Status |
|---|---|---|
| 9 | **No URL state.** Path stays `/` at gallery, inside a brief and at step 3. No deep links, no meaningful back button, nothing for universal links to point at. Fix: `/brief/[id]/[step]`. | ☐ open |
| 10 | No staging environment — production is the first place any change meets a user. | ☐ open |

## Future / tech debt

| # | Finding | Status |
|---|---|---|
| 11 | ~~Stepper cells are 36×44px at 320px.~~ **DONE 27 Aug.** The row scrolls instead of compressing: every cell holds 44px, the page itself never overflows, the active step auto-scrolls into view, and the clipped edge fades — tracking scroll position, so it fades left, right or both depending on what is actually hidden. | ☑ done |
| 12 | Cube Shifter SVG is inlined for theme-aware fills: 55K gzip on every wizard load. Lazy-load behind the loading state. | ☐ open |
| 13 | Safari and Firefox untested. SMIL and `:has()` are the risk areas. | ☐ open |
| 14 | All copy hard-coded English; no i18n scaffolding. | ☐ open |

## Do NOT do

- **Do not wrap the web app for iOS.** Guideline 4.2 rejection risk, and it turns
  same-origin `/api/*` calls into cross-origin ones for no product gain. Ship a
  PWA first. The blocking decision is storage, not the shell.

## What already passes — don't "fix" these

74/74 contrast checks in both themes; zero raw hex outside the two brand assets;
no fake buttons, dead ends or unreachable screens; no horizontal overflow
320–1920px; zero npm vulnerabilities; clean git history with a `finished-unfold`
restore tag; documentation good enough for a handover.
