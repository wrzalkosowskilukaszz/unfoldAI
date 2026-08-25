# Unfold AI — working notes

Context for anyone (human or Claude) picking this up. Only things that are **not
obvious from reading the code** — no file inventories, no architecture diagrams
that `src/` already tells you.

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
- **Project type is a lens, not a template.** `PROJECT_TYPES` in `types.ts`
  changes what the AI probes for and, crucially, what it flags as *absent* — the
  diagnostic can only mention a missing dieline if it knows the job is packaging.
  Don't turn these into pre-filled placeholder text; people delete that and it
  teaches the model nothing.

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

### The `--c-on-*` pattern — read this before adding any filled button

A saturated fill that looks fine in light mode often **fails contrast in dark
mode**, because the dark palette lightens the fill while the label stays white.
This has bitten the app twice:

| Fill | White label | Fix |
|---|---|---|
| `--c-accent` (dark) `#8f83ff` | 3.06:1 ✗ | `--c-on-accent: #14121f` → passes |
| `--c-contradiction` (dark) `#ff6b5a` | 2.80:1 ✗ | `--c-on-contradiction: #1c0f0d` → 6.60:1 |

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

## Svelte 5 gotchas

- Runes only: `$state`, `$derived`, `$props`, `$effect`.
- **`structuredClone()` throws on a `$state` proxy.** Use `$state.snapshot()`.
  This silently broke Duplicate once.
- `isStepComplete()` is **content-based, not positional**. An empty brief must
  never show completion checkmarks.
- The localStorage migration chain
  (`unfold-ai-briefs-v1` ← `briefflow-ai-briefs-v1` ← `briefflow-ai-state-v1`)
  must be preserved. Existing users lose everything if you drop a link.

---

## Anthropic API

Model is **`claude-sonnet-4-6`** everywhere — a deliberate cost decision, not an
oversight. Don't "upgrade" it to Opus.

- **Thinking tokens count against `max_tokens`.** This truncated `/api/review-brief`
  mid-JSON until it got 8000 tokens plus streaming. If a route starts returning
  malformed JSON, check `stop_reason === 'max_tokens'` first.
- **Prompt caching does not apply here.** All system prompts are 292–768 tokens,
  under Sonnet's 1024-token cache minimum, so `cache_control` is silently
  ignored. Revisit only if a shared prefix grows past ~1k tokens.
- Cost is **output**-dominated (output ≈ 5× input). To reduce spend, look at
  `output_config.effort` and `max_tokens` — not at input size.

---

## Security

- `.env` is gitignored. **Scan before every push:**
  `git grep -I -E "sk-ant-|APP_PASSWORD=[^[:space:]]"`
- `APP_PASSWORD` unset = the app is open to anyone who finds the URL, spending
  the owner's credits. It must be set in the host env **before** the site is
  public, and **together with** `ANTHROPIC_API_KEY` — never the key alone.
- Set a hard spend cap in the Anthropic Console.
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
