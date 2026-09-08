# Surveyvor — working notes

Context for anyone (human or Claude) picking this up. Only things that are **not
obvious from reading the code** — no file inventories, no architecture diagrams
that `src/` already tells you.

**Deeper context lives in `context/`** — read the relevant file before
re-deriving any of it:

| File | Read it before |
|---|---|
| `context/audit-findings.md` | **start here** — the tracked pre-launch fix list and its status |
| `context/deployment.md` | deploying, touching env vars, or debugging the live site |
| `context/naming.md` | proposing a name change — two are already dead, and why matters |
| `context/brand-voice.md` | writing any user-facing copy; holds unused lines worth using |
| `context/competitive-landscape.md` | positioning or feature decisions vs Brieflow / Content Snare |

---

## Language

**The brief is still the product.** Surveyvor does not replace the brief; it
makes the brief *trustworthy*. Resist the pull to reposition this as a
"project discovery tool" — that demotes the thing users actually keep.

The split that governs all copy:

- **Survey** is the verb — the process, the analysis, what the AI does.
- **Brief** is the noun — the artifact, the destination, what you leave with.

So: "Survey your project" (action) produces "Your briefs" (things you own).
Never rename the artifact away from "brief".

The rest of the vocabulary is load-bearing rather than decorative — it is what
makes the name earned. Use it consistently:

| Term | Means |
|---|---|
| **Survey** | the AI's analysis pass (step 6) |
| **Findings** | what the survey turned up |
| **Marker** | something firmly established (`kind: 'clear'`) |
| **Tension** | two parts of the project disagree (`kind: 'contradiction'`) |
| **Unknown** | not established yet (`kind: 'missing'`) |
| **Assumption** | inferred, never confirmed |
| **Terrain** | the project as a whole |

Never revert to generic SaaS words — "AI insights", "recommendations",
"optimisation". The positioning is explicitly anti-that: *Claude can write your
brief; Surveyvor interrogates it.*

Live at **https://surveyvor.app** (Vercel project `surveyvor`, auto-deploys from
`main`). Restore point for the pre-rename app: `git checkout finished-unfold`.
Restore point for the password-gated beta: `git checkout gated-beta`.

---

## What the product actually is

The brief is a **by-product**. The value is surfacing what is *unknown,
contradictory, or assumed* before anyone starts designing.

This matters because it's easy to drift back into "AI tidies up your text,"
which is a commodity. The diagnostic engine (`/api/review-brief`) is the
product; the wizard is the delivery mechanism.

Two rules that fall out of this:

- **Never invent precision.** No fabricated effort estimates, cost deltas, risk
  scores or percentages ("+1.5 days", "72% brief health"). Findings are
  qualitative and evidence-backed. Fake numbers destroy trust the moment a user
  checks one.
- **Never ship a nagging machine.** `/api/review-brief` prompt rule `1a` makes at
  least one "clear" finding mandatory. A tool that only ever reports problems
  gets closed. Don't remove that rule. The same principle is why findings can be
  dismissed (`status: 'dismissed'`) and why `setFindings` treats a dismissal as
  as deliberate as a confirmation — a re-review that resurrected set-aside
  findings would be exactly the machine we promised not to build.
- **Brief templates carry a knowledge model.** `PROJECT_TYPES` in `types.ts`
  (surfaced as "What kind of brief is this?") holds two things per template:
  `lens`, what this discipline routinely omits, and `coherence`, which parts of
  this kind of brief must agree with each other. The second is the valuable one:
  it lets the survey report "your objective is awareness but your success metric
  measures conversion" instead of "the success metric is vague". A mismatch
  between two stated things beats an observation about one vague thing.
  Never turn these into pre-filled placeholder text — people delete that, and it
  teaches the model nothing. The code identifier stays `projectType` because it
  is a persisted field; the UI language is "template".
- **A template also defines the brief's shape.** `PROJECT_TYPES[t].sections` is
  an ordered list of ids from `SECTION_DEFS`, and the whole wizard derives from
  it: `stepLabelsFor`, `totalStepsFor`, `surveyStepFor`, `briefStore.sectionKeys`.
  Basics, one step per section, Survey, Export. Adding a section to a template is
  a data change — there is one generic `StepSection.svelte`, not one component
  per step.
- **Section storage is deliberately lossless.** `emptySections()` seeds *every*
  key in `SECTION_DEFS`, not just the current template's, so switching template
  hides sections rather than deleting them. Verified: text typed into a
  packaging-only section is still there after switching to campaign and back.
  Never "clean up" unused sections — that silently destroys work.

**The app serves both ends of one handoff**, not one audience. The person
commissioning the work and the studio delivering it both use it, on the same
document. `ProjectMeta.role` (`commissioning` | `delivering`, null until asked)
drives labels, placeholders and the framing handed to every prompt — most
visibly the organisation field, which means "someone else's company" to a
designer and "my own" to a client. Never write copy that assumes an agency
reader; that assumption was baked in once and had to be unpicked.

Local-only by design: no accounts, no server-side persistence. Any feature that
needs multiplayer (shared review, comments, presence) contradicts the
architecture — say so rather than half-building it.

---

## Design system

**Never write a raw colour or a `dark:` variant.** All colours are CSS variables
in `src/routes/layout.css`, defined once on `:root` and swapped wholesale under
`[data-theme='dark']`. `@theme` maps them to Tailwind tokens, so components stay
theme-agnostic.

### Two brand colours, and why the warm one is pink

The palette is **violet (primary) + warm rose (secondary) + sand (warm ground)**.

The warm colour sits at hue 345 rather than a conventional amber or terracotta
for a measurable reason: the semantic colours already own the warm arc
(`attention` ~40 degrees, `contradiction` ~5). Every ochre, clay, copper and
coral tested landed within 13 degrees of one of them and would have read as an
alert. Rose is 54 degrees off attention. Verified 16/16 WCAG checks across both
themes before it shipped.

Use `--c-warm` for brand moments, never for status. `--c-sand` is ground for
large areas (the dark-mode illustration plate), not a signal.

### The `--c-on-*` pattern — read this before adding any filled button

A saturated fill that looks fine in light mode often **fails contrast in dark
mode**, because the dark palette lightens the fill while the label stays white.
This has bitten the app twice:

| Fill | White label | Fix |
|---|---|---|
| `--c-accent` (dark) `#8f83ff` | 3.06:1 ✗ | `--c-on-accent: #14121f` → passes |
| `--c-contradiction` (dark) `#ff6b5a` | 2.80:1 ✗ | `--c-on-contradiction: #1c0f0d` → 6.60:1 |
| `--c-warm` (dark) `#f0879f` | under 4.5:1 ✗ | `--c-on-warm: #2b0f18` → 7.32:1 |

So: **every solid fill gets a paired `--c-on-*` token.** Use `text-on-accent`,
never `text-white`. Measure both themes before committing — don't eyeball it.

`text-ink` on a dark fill is also a trap: `--c-ink` *inverts* per theme, so
`bg-ink text-white` is invisible in dark mode. Use `text-background`.

### Non-negotiable floors

- WCAG **AA (4.5:1)** for text, in **both** themes.
- Visible `:focus-visible` ring — the global rule in `layout.css` exists because
  several components carry `outline-none`. Don't suppress it.
- **44px** minimum touch target (Apple HIG / WCAG 2.5.5). `layout.css` floors
  every button under 768px; opt out with `data-compact` only for genuinely
  inline controls.
- Modals use `use:modal` (`src/lib/actions/modal.ts`) — focus trap, Escape,
  scroll lock, focus restore. Never `window.confirm()`; it can be suppressed by
  the browser and silently returns false.

### Taste

Light mode is the primary expression — the owner is not a dark-mode person, and
dark exists for completeness, not as the showcase. Minimal but high-tech;
generous whitespace; motion should feel physical, never linear easing.

---

## Testing

`npm test` — Vitest, jsdom, ~63 tests. Run it before pushing; it has already
caught a real auth bug and two silent template-blindness bugs.

**Three process skills live in `.claude/skills/`** (from addyosmani/agent-skills):
`browser-testing` (verify in a real browser: console, network, accessibility,
vitals, screenshots), `test-driven-development` (failing test first; a bug
gets a reproduction test before a fix), and `debugging` (reproduce, localise,
reduce, fix the root cause, guard). Follow them. The browser one assumes a
DevTools MCP server; here the same checklist runs as
`node scripts/browser-audit.mjs <url> [--mobile] [--clear]` — every page, zero
console errors or warnings, no failed requests, one visible h1, no heading
skips, every control named, LCP and CLS printed.

**Look at the real page, not the type-checker.** The in-app browser pane never
repaints after a scroll, so use `scripts/shot.mjs` (headless Chrome over the
DevTools protocol) for anything below the fold, every phone-width check, and
for what "Save as PDF" actually prints — a blank single-page PDF shipped for
weeks because nobody printed one. It seeds two test briefs from
`scripts/seed-briefs.js`, so no AI call is needed to see the survey or export.

The dev server **dies when a route file is deleted** (SvelteKit's type
writer races the watcher). Restart it; it is not your change.

Two environment traps are handled in `tests/setup.ts` and `vitest.config.ts`,
and will bite again if you touch them:

- **Node 26 ships its own experimental `localStorage`** that shadows jsdom's and
  is inert without `--localstorage-file`; this jsdom does not install one either.
  The suite owns a `MemoryStorage`, which is also what makes quota failure
  injectable.
- **`$env/dynamic/private` cannot be resolved by Vite**, so it is aliased to a
  stub whose state lives on `globalThis` — `vi.resetModules()` would otherwise
  discard whatever a test had set.

Test the store, the guards and anything that can fail silently. Do not chase a
coverage number. Pure helpers that the API routes share live in
`src/lib/server/model.ts`, apart from the SDK client in `anthropic.ts`, so
they can be tested without constructing the client.

---

## Things that need provisioning, not code

- **`UPSTASH_REDIS_REST_URL` / `_TOKEN`** — without them the rate limiter counts
  in each serverless instance's own memory, so the limit is per-instance rather
  than per-person. The code falls back and logs a loud warning; it is not a
  substitute. See `context/deployment.md`.
- **`SENTRY_DSN`** — optional. Errors already get a reference id and structured
  logs without it.
- **`DAILY_AI_CALL_LIMIT`** — optional, default 1000. The whole-service ceiling
  on AI calls per day, checked in `hooks.server.ts` after the per-address
  limit. It is what makes an open (no password) deployment survivable: the
  per-address limit stops one person, this stops many. Keep it under the hard
  cap in the Anthropic Console.

---

## Two flows that are easy to break

**The AI disclosure.** Every call site that sends brief text to the model awaits
`aiConsent.ensure()` (`src/lib/stores/aiConsent.svelte.ts`). It shows once, at
the moment text first leaves the device — deliberately not an arrival popup.
Zero requests may fire before acknowledgement; declining cancels the action and
does **not** record consent. If you add an AI call site, add the guard **and
add it to the list in `/privacy`** — the cascade (`/api/reconsider`) is the one
call that fires without its own button, and the policy names it. Nothing may
ever send while someone is typing. Server logs carry counts and shapes only:
`describeUnreadable` reports length and shape, never a character of a reply.

**The gate is optional.** `APP_PASSWORD` set means every route except
`PUBLIC_PATHS` in `hooks.server.ts` (`/unlock`, `/privacy`, `/terms`,
`/sitemap.xml`) needs the cookie. Unset means the app is public and the only
things standing between a stranger and the Anthropic bill are the per-address
limit and `DAILY_AI_CALL_LIMIT`. Both paths are live code; do not remove either.

**Page metadata.** Use `Seo.svelte` — it supplies title, description, canonical,
Open Graph and Twitter tags together. The root route renders its head on the
server and **nothing else** — the body is built from localStorage, which the
server cannot see — so link previews on LinkedIn, Slack and iMessage get a real
title and card without a hydration mismatch. `ready` in `+page.svelte` is that
gate; it flips via `afterNavigate`, one microtask after the router starts, and
it also guards every `pushState`/`replaceState`. Calling those from an effect
during mount throws in dev and the throw tears the page down.

**The URL follows the store, not the call site.** An effect in `+page.svelte`
rewrites `?s=` whenever `briefStore.step` changes while a brief is open. So a
component can call `briefStore.goToStep(briefStore.surveyStep)` and the URL,
refresh and Back all stay right. Never hard-code a step number — the survey is
step 6 on the default template and step 7 on every specialist one, and that
exact bug shipped.

---

## Svelte 5 gotchas

- Runes only: `$state`, `$derived`, `$props`, `$effect`.
- **Never import jsdom, or anything that wraps it, into a server-rendered
  route.** `isomorphic-dompurify` did (it loads jsdom on the server), and the
  moment the root page rendered on the server, production answered 500:
  Vercel's Node cannot `require()` one of jsdom's ESM dependencies. Plain
  `dompurify` is safe to import anywhere; it is only ever *called* in the
  browser. If `/` starts 500ing after a dependency change, grep
  `.svelte-kit/output/server` for `jsdom` first.
- **`structuredClone()` throws on a `$state` proxy.** Use `$state.snapshot()`.
  This silently broke Duplicate once.
- `isStepComplete()` is **content-based, not positional**. An empty brief must
  never show completion checkmarks.
- **Print CSS is a separate layout.** `#printable-brief` is in flow with
  `overflow: visible`, and `.rise` has no animation under `@media print`.
  Absolutely positioning it with `inset: 0` clipped every brief to one page;
  the entry animation printed as a blank one. Print a long brief after touching
  either.
- The localStorage migration chain
  (`surveyvor-briefs-v1` ← `unfold-ai-briefs-v1` ← `briefflow-ai-briefs-v1`
  ← `briefflow-ai-state-v1`) must be preserved. Existing users lose everything
  if you drop a link. The app has been renamed twice; assume it will happen again.

---

## Anthropic API

Model is **`claude-sonnet-4-6`** everywhere — a deliberate cost decision, not an
oversight. Don't "upgrade" it to Opus.

- **Thinking tokens count against `max_tokens`.** This truncated `/api/review-brief`
  mid-JSON until it got 8000 tokens plus streaming. If a route starts returning
  malformed JSON, check `stop_reason === 'max_tokens'` first.
- **Every JSON route uses schema-enforced output** (`output_config.format`,
  schemas in `src/lib/server/schemas.ts`). Before this, two of three real
  surveys on 8 Sep 2026 came back unreadable because the model wrapped its JSON
  in a sentence. `parseModelJson` keeps its prose fallback, and an unreadable
  reply logs `{"type":"unreadable"}` with length and a 24-character head, never
  content. New fields must be added to the schema *and* the prompt.
- **Findings carry evidence and a section.** `evidence` is verbatim quotes the
  server verified against the brief (`verifyEvidence`); a finding whose every
  quote fails, or a Tension with none, is dropped and counted in a
  `{"type":"evidence"}` log line. `section` is where the fix belongs and drives
  "Fix it in …" on the card. Never invent a step number for that link — use
  `briefStore.stepForSection`.
- **The cascade.** After an answer is locked, `/api/reconsider` (no thinking,
  ~4 s) says which other open findings that answer settled; they are set aside
  with `retiredBy`/`retiredReason` and count as settled in the summary. It only
  ever retires, never adds, and a failure there must never touch the answer
  just given.
- **Locked decisions reach every prompt** — survey, interview, section rewrite
  and final document. If you add an AI call site, pass `briefStore.decisions`.
- **`npm run smoke <url>` spends about ten cents** running two fixed briefs
  through the survey and checking shape, Marker, questions, evidence and section
  references. Run it against production after any change to a route or prompt;
  the unit tests cannot see model behaviour.
- **A survey takes 40–70 s.** Narrated in the UI; still the biggest UX cost.
  Measure any effort/thinking change against real briefs before shipping it.
- **Prompt caching does not apply here.** All system prompts are 292–768 tokens,
  under Sonnet's 1024-token cache minimum, so `cache_control` is silently
  ignored. Revisit only if a shared prefix grows past ~1k tokens.
- Cost is **output**-dominated (output ≈ 5× input). To reduce spend, look at
  `output_config.effort` and `max_tokens` — not at input size.

---

## Security

- `.env` is gitignored. **Scan before every push:**
  `git grep -I -E "sk-ant-|APP_PASSWORD=[^[:space:]]"`
- `APP_PASSWORD` unset = the app is open to anyone who finds the URL. That is
  now the intended public state, and it is only safe **with** Upstash Redis
  provisioned (so the per-address limit is per person, not per instance) and
  a hard spend cap in the Anthropic Console. `DAILY_AI_CALL_LIMIT` is the
  friendly ceiling under that cap.
- The API validates every field it interpolates into a prompt and caps the
  total length of all of them, not just the sections. Keep it that way.
- Never paste keys or tokens into chat, logs, commit messages or issues.

---

## Environment

Node **v26.7.0** via nvm (Vite 8 needs ≥20.19):

```bash
source "$HOME/.nvm/nvm.sh" && nvm use v26.7.0
```

Deployed on Vercel from `main` (auto-deploy). Run `npm run check` and
`npm run build` before pushing.

---

## Open decisions

- **Capacitor / App Store: deferred.** A web app in a WKWebView with no native
  capability is a textbook App Store Guideline 4.2 rejection. It would also turn
  same-origin `/api/*` calls into cross-origin ones (CORS + session cookie work)
  without improving the product. Revisit when there's a real native need — share
  sheet, file system, push. A PWA is the cheap path to a home-screen icon.
- Not yet built: save indicator, onboarding beyond `FirstRun`, collapsible
  steppers.
