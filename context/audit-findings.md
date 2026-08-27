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
| 2 | **Client briefs go to Anthropic with no disclosure.** No privacy policy, no terms, no consent anywhere. Users are agencies handling third-party confidential material; GDPR processor with no stated lawful basis. Apple also requires a reachable privacy URL. Needs legal review, not just engineering. | ☐ open |
| 3 | **A cleared browser destroys everything.** One localStorage key, no server copy, no backup, no cross-device. Also the single blocker for a mobile app. Short term: prominent export + periodic backup prompt. Real fix: server-side store + identity. | ☐ open |
| 4 | ~~No automated tests.~~ **DONE 27 Aug.** Vitest suite, 28 tests, covering the migration chain, template switching, finding lifecycle, import/duplicate fidelity, prompt-injection guards, the access gate and the save-failure path. `npm test`. Caught a real auth bug on first run. | ☑ done |

## Before public launch

| # | Finding | Status |
|---|---|---|
| 5 | Shared password only — no per-user identity, revocation or audit. Acceptable for a beta with people you know. | ☐ open |
| 6 | Nothing watches production. No error monitoring, no uptime check, no alerting. Add Sentry free tier. | ☐ open |
| 7 | No product analytics — roadmap decisions currently have no evidence behind them. | ☐ open |
| 8 | No meta description, Open Graph, canonical or sitemap. | ☐ open |

## Before iOS

| # | Finding | Status |
|---|---|---|
| 9 | **No URL state.** Path stays `/` at gallery, inside a brief and at step 3. No deep links, no meaningful back button, nothing for universal links to point at. Fix: `/brief/[id]/[step]`. | ☐ open |
| 10 | No staging environment — production is the first place any change meets a user. | ☐ open |

## Future / tech debt

| # | Finding | Status |
|---|---|---|
| 11 | Stepper cells are 36×44px at 320px — passes WCAG 2.5.8 AA (24px), fails the 44px AAA/Apple HIG target. Let it scroll below ~360px. | ☐ open |
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
