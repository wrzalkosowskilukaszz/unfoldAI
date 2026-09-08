# Pre-launch audit — tracked findings

## Second audit — 7 September 2026, before opening the beta

Scope: every source file (about 8,000 lines), the live UI at 1440, 390 and
320px in both themes, the print path, and the two frameworks Luke asked for:
the 15-principle usability audit (mistyhx/frontend-design-audit) and the
"ponytail" simplification ladder. Baseline before changes: 56 tests, 0 type
errors, Upstash provisioned in production (item 1 below is therefore done).

**Verdict: safe to open without a password once the Vercel variable is
removed.** Everything below is fixed in code and verified in the browser
unless marked otherwise. Branch `audit-2026-09`; tag `gated-beta` marks the
last password-only state.

### Bugs found and fixed

| Sev | Finding | Where | Verified how |
|---|---|---|---|
| 4 | **Save as PDF printed one blank page.** `#printable-brief` was absolutely positioned with `inset: 0` inside its own `overflow-hidden`, clipping everything after page 1; the `.rise` entry animation printed at its first frame (opacity 0). | `layout.css` print block | Headless print of the test brief: 1 page / 2 KB before, 3 pages / 190 KB after; page 1 rendered and read. |
| 3 | **"Go back and settle these" / "Review it first" opened the wrong step** on every specialist template (survey is step 7, code said 6) and the URL stayed stale, so refresh landed elsewhere. | `Step7Export`, `ImportDocument`, `+page.svelte` | Clicked on a campaign brief: lands on Survey, URL reads `s=7`; Back, Forward, Next and reload all correct. |
| 3 | **Declining the AI notice stranded two screens**: the interview showed "Thinking…" forever; import showed "Reading…" forever. | `QuestionFlow`, `ImportDocument` | Code path; both now return to where they started. |
| 3 | **Gallery overflowed horizontally at 320px** — the card could not shrink below its longest title. | `BriefsList` | `scrollWidth` 344 → 320. |
| 2 | Copy marked the brief "exported" before the clipboard write succeeded. | `Step7Export` | Reordered. |
| 2 | A hand-edited step past the end (`?s=99`, or an imported file) showed a 130% progress bar and, after the URL fix, would have crashed the page. | `brief.svelte.ts` clamp; router-ready gate | Loaded `?s=99`: URL corrected to `s=8`, no console error. Test added. |
| 2 | API 500 instead of 400 when a section value was not a string; interview answers, help history and decisions were not counted against the input cap. | all five routes | Tests for the helpers; routes read. |
| 2 | Vercel Analytics threw two CSP errors on every page load in dev. | `+layout.svelte` | Not injected in dev at all. Production loads the same-origin script (verified 200 on the live site). |
| 1 | "Saved here only — not exported yet" wrapped around the dash in the desktop rail. | `SaveIndicator` | Screenshot. |
| 1 | Import never fired `brief_created`. | `ImportDocument` | Added. |

### Design audit (15 principles) — applied

| Principle | Finding | Change |
|---|---|---|
| Aesthetic & minimalist / Structure | The full marketing hero pushed **Your briefs** below the fold on every visit, desktop and phone. The gallery is a tool for a returning user, not a landing page. | With briefs present (or on the import view) the hero becomes a masthead: smaller line, no subtitle, no illustration. First run keeps the full hero. Cards now start at ~470px on desktop, ~380px on a phone. |
| Match system & real world | "Project Metadata & Basics", "Status: Refining with AI...", "Original Raw Input", "AI Structured Proposal" read as system language. | "Project basics", "Refining...", "Your notes", "Suggested structure". |
| Affordances / touch | Export's "Include in the exported brief" checkbox was a 13px target on a phone. | The label is the target (44px). Everything else already met 44px at 320px — checked programmatically. |
| Structure | "Survey again" wrapped under the heading instead of sitting beside it. | Heading block capped. |
| Flexibility | Section textarea was six rows on a 900px-tall desktop. | Taller on large screens, still resizable. |
| Visibility of status | (kept) Loading narration, save indicator, per-finding states are all good. | — |

Not changed, worth knowing: the brief card is a `div role="button"` containing
real buttons (nested interactive content). It works with keyboard and screen
readers today; restructuring it is a bigger change than this pass. Contrast,
focus rings, dialogs, empty states and error pages all passed and were not
touched.

### Simplification (ponytail) — applied, no behaviour lost

- One `postJson()` replaces five copies of the fetch-and-read-the-error block.
- `textOf()` and `parseModelJson()` replace five copies of the text-block
  filter and three copies of the fence stripper.
- Deleted: `STEP_LABELS`, `TOTAL_STEPS`, `SECTION_ORDER`,
  `SECTION_PLACEHOLDERS`, `next()/back()`, `analytics.stepReached`, the
  `showWordmark` and `compact` props nobody passed, the empty `lib/index.ts`,
  and a duplicate keydown listener in the modal action.
- Net: 31 files, roughly +370 / −290 lines, 63 tests (was 56).

### Follow-up — 8 September 2026, after launch

Running real surveys (the first ever, three of them) found that two in three
replies were unreadable: the model wrapped its JSON in a sentence. Fixed the
same day, then hardened properly: every JSON route now uses schema-enforced
output. In the same pass the four behaviour gaps from the review were closed —
locked decisions reach every prompt; findings name their section and the card
links to it; every quote is verified against the brief before a finding is
shown, and unsupported ones are dropped; and answering one finding re-examines
the rest (the cascade), setting aside what it settled with a note saying why.
`npm run smoke` runs paid surveys against a deployment and checks the shape.

### Going public — what changes and what to do

Code is ready: the root page now serves real title and Open Graph tags from
the server (link previews work with no JavaScript), the sitemap drops
`/unlock` on its own, the lock control hides itself, and a whole-service
ceiling of 1,000 AI calls a day (`DAILY_AI_CALL_LIMIT`) sits under the
Anthropic hard cap. The steps are in `context/deployment.md` → *Going public*.
They are: merge the branch, remove `APP_PASSWORD` in Vercel, redeploy, run
the three checks.

---

## First audit — 27 August 2026

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
| 1 | ~~Rate limiting does not work on serverless.~~ **DONE — Upstash provisioned in production, confirmed 7 Sep.** Originally: Counter now lives in Upstash Redis with a weighted sliding window, falling back to in-process for local dev and during a Redis outage (fails open, never locks users out, and reports `durable: false`). **Action required: create a free Upstash database and set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel.** Until then production logs a warning and the old per-instance behaviour applies. | ☑ done |
| 2 | ~~Client briefs go to Anthropic with no disclosure.~~ **DONE 27 Aug.** `/privacy` and `/terms` published as Take a Luke Studio (Poland), both exempt from the beta gate. Privacy names Anthropic, Vercel and Upstash as sub-processors, states the training position with a citation, covers SCC transfers, retention, GDPR rights and UODO. Terms carry an as-is warranty disclaimer and a limitation-of-liability clause. Homepage carries a plain-language data-safety line. **Still advisable: a lawyer's read before taking real client data or charging.** | ☑ done |
| 3 | **A cleared browser destroys everything.** ◐ **Mitigated 27 Aug — not solved.** Briefs now track `lastExportedAt`; the save indicator reads "Saved here only — not exported yet" and gallery cards carry a marker until a brief is downloaded, copied or printed. Edits after an export re-flag it. This makes the risk visible; it does **not** remove it. The real fix is still a server-side store with identity, which is the same work as accounts. | ◐ mitigated |
| 4 | ~~No automated tests.~~ **DONE 27 Aug.** Vitest suite, 28 tests, covering the migration chain, template switching, finding lifecycle, import/duplicate fidelity, prompt-injection guards, the access gate and the save-failure path. `npm test`. Caught a real auth bug on first run. | ☑ done |

## Before public launch

| # | Finding | Status |
|---|---|---|
| 5 | **Shared password only.** ◐ **Hardened 27 Aug — accounts declined, so this is as far as it goes.** Added a lock action so a shared or borrowed machine can be re-locked (previously impossible for the full 30-day cookie life), a far tighter allowance for password attempts than for AI calls, and structured logging of failed attempts so a burst is visible. Still no per-user identity, revocation or audit trail — inherent to a shared secret. Cookie is httpOnly, SameSite=Lax, Secure on HTTPS. | ◐ hardened |
| 6 | ~~Nothing watches production.~~ **DONE 27 Aug.** `handleError` on both server and client. Every unhandled error gets a short reference shown on the error page and written as structured JSON, so a bug report is greppable. Forwards to Sentry when `SENTRY_DSN` is set — optional, and useful without it. Messages are truncated and error properties are never serialised, so brief content cannot leak into logs. Still no uptime pinger. | ☑ done |
| 7 | ~~No product analytics.~~ **DONE 27 Aug.** Vercel Web Analytics — chosen because Vercel is already a sub-processor, so it adds no new company to the privacy policy, and it is cookieless so the no-cookie-banner claim stays true. Events: brief created, template chosen, role chosen, survey run (counts), finding resolved vs dismissed, brief exported. **Rule: events describe shape, never content** — enforced by a test that rejects any non-primitive or long-string property. Privacy policy updated to match rather than quietly broken. | ☑ done |
| 8 | ~~No meta description, Open Graph, canonical or sitemap.~~ **DONE 27 Aug.** `Seo.svelte` gives every route title, description, canonical, Open Graph and Twitter card. Favicon (SVG + PNG set), apple-touch-icon, maskable icon, web manifest and a generated 1200x630 social card. `/sitemap.xml` route, robots.txt updated. The gated app carries `noindex`; the public pages do not. | ☑ done |

## Before iOS

| # | Finding | Status |
|---|---|---|
| 9 | ~~No URL state.~~ **DONE 27 Aug.** Position lives in the URL as `?b=<id>&s=<step>`. Back leaves the brief, Forward returns, refresh lands on the same step, and stale or malformed links fall back to the gallery instead of stranding you. Query params rather than `/brief/[id]/[step]` **on purpose**: brief ids are local UUIDs, so a "shareable" path would be a link nobody else can open — params buy the same back/refresh behaviour without restructuring every route. Revisit if briefs ever live server-side. | ☑ done |
| 10 | No staging environment — production is the first place any change meets a user. | ☐ open |

## Future / tech debt

| # | Finding | Status |
|---|---|---|
| 11 | ~~Stepper cells are 36×44px at 320px.~~ **DONE 27 Aug.** The row scrolls instead of compressing: every cell holds 44px, the page itself never overflows, the active step auto-scrolls into view, and the clipped edge fades — tracking scroll position, so it fades left, right or both depending on what is actually hidden. | ☑ done |
| 12 | ~~Cube Shifter inlined on every wizard load.~~ **DONE 27 Aug.** Lazy-loaded behind the loading state, in its own 2K-gzip chunk; the wizard route chunk now carries no SMIL. Honest measure: gzip fell 59K→55K only, because that markup is repetitive and compresses hard — the real gain is **48K less raw JS to parse**, which is what costs on a low-end phone. A reserved 132px box prevents layout jump. | ☑ done |
| 13 | Safari and Firefox untested. SMIL and `:has()` are the risk areas. | ☐ open |
| 15 | Brief card is a `div role="button"` with buttons inside. Works, but restructure when the card is next touched. | ☐ open |
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
