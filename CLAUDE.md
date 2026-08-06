# CLAUDE.md

Working notes for future Claude sessions on this repo. Full product/calculation
detail lives in `README.md`; the developer handover doc (uploaded to chat, not
in-repo) has the same content plus a code-ownership map and regression-scenario
list. Read both before touching calculation logic.

## What this is

A Singapore financial-planning workspace (browser-only, vanilla ES modules, no
build step, Supabase for auth only). Serve via `python -m http.server`, never
`file://`. See `README.md` for the full product workflow, calculation register,
and Published/Calculated/Estimated conventions.

## Architecture conventions (apply these without re-deriving them)

- **State**: `js/state/client-plan.js` owns the private `clientPlan` object.
  Never import it directly — use the exported selectors (`getAssets`,
  `getClientProfile`, `getPolicies`, etc.).
- **Business logic**: lives in `services/*.js` or `*-calculator.js` /
  `*-service.js` files, never duplicated in a renderer. If two features need
  the same figure, one canonical function computes it and both call it.
- **Reusing another module's computed result**: several modules cache their
  last render output in a module-level `let` and expose an exported getter
  (e.g. `cost-analysis.js`'s `getLatestCurrentCashflow()`,
  `getLatestYourPathProjectedPosition()`, `getLatestYourNextStepsResult()`).
  Follow this pattern instead of recalculating — it's how `client-report.js`
  builds the Client Report without redoing Analysis's math.
- **DOM building**: `document.createElement` + `.textContent`, never
  `innerHTML` with dynamic content — client/policy/goal names are free text
  and must not be injected as HTML.
- **Navigation**: sidebar items are `.sidebar-item[data-section="x"]` paired
  with `.workspace-section[data-content="x"]`; `openSection()` /
  `navigateToSection()` in `js/modules/sidebar.js` handle switching. Adding a
  new page/sub-page means adding both halves of that pairing.
- **No test harness in this environment**: `soffice`/headless browser tooling
  doesn't work in the sandbox this session ran in. Verification here means
  `node --check` per JS file, a Python HTMLParser tag-balance check, and CSS
  brace-balance counts — not an actual rendered browser. The user tests live
  and reports back with screenshots; budget for a fix-up round after any UI
  change lands.
- **Git workflow used this session**: commits went straight to `main` on
  `davinlee611/test`, per explicit user instruction (not the usual PR-branch
  flow). Don't assume that's the default for future sessions — check what the
  user actually asks for.

## Session log

**2026-08-06 session** (in order):

1. Reviewed the full codebase + handover doc; confirmed disability-income
   validation used one flat 75%-of-gross-income rule regardless of employment
   status.
2. Implemented NTI-based disability-income validation for self-employed
   clients (65% of monthly Net Trade Income vs. 75% of gross income for
   employed) — `services/income-calculator.js` (new
   `getDisabilityIncomeCoverageLimit`), `modules/insurance/policy-validation.js`,
   `modules/insurance/policy-workflow.js`. Updated README + handover docx to
   match.
3. Added a reduction-attribution line to the Capital Needed at FYBC card
   (Analysis, Part 3): states how much lower it is than the undiscounted
   lifetime-spending estimate, split between post-FYBC returns and recorded
   income offset — computed from fields Analysis already returns, nothing new
   calculated. `modules/cost-analysis.js`.
4. Split "Analyse Commitments & Savings Plan": the simplified Your Path
   (Goal → Starting Position → Capital Needed → Next Steps) stays on the main
   page; the detailed month-by-month/year-by-year Cashflow and CPF Flow
   projection tables (plus the increment/inflation inputs and the full
   retirement-strategy explanation) moved to a new sidebar sub-page,
   "Detailed Cashflow & CPF Flow". Deleted the old Retirement Goal Summary
   card (exact duplicate of Part 1). Design was mocked up as an Artifact
   before building.
5. Animated the "Estimated Goal Coverage" progress bar (was jumping instead
   of sliding); tightened banner copy/spacing on Analysis.
6. Built the **Client Report** feature (renamed from the empty "Summary
   Report" placeholder) — `js/modules/client-report.js`:
   - "Generate Report" button on Analysis; always shows a confirmation modal
     first ("Protection Analysis not completed — continue?") because
     Protection Analysis has zero implementation anywhere in the app. That
     confirmation is expected to always fire until Protection Analysis
     exists — the single gate is `hasProtectionAnalysisContent()`, currently
     hardcoded `false`.
   - Report sections: Priorities & Situation (always), Insurance Portfolio
     (only if policies exist), Cost of Wants Analysis (goal + capital-needed
     breakdown + next-steps commitment + CPF assumptions), Protection
     Analysis (explicit "not yet completed" note), disclosure. Each section
     is its own bordered card and starts on a fresh printed page.
   - Print via `window.print()` + `css/layout/print.css` — no new dependency.
     Fixed a real bug where the print output only used the sidebar-content
     grid's middle column; needed `.workspace-layout { display: block }`
     in print, not just hiding the sidebar element.
   - Data is a one-time snapshot built from whatever Analysis last computed,
     not live-bound.

## Open items / natural next steps

- Protection Analysis is still a bare placeholder — the next big roadmap item
  per the handover doc, and the thing the Client Report is explicitly waiting
  on.
- The shortfall-guidance branch for Your Next Steps (what to suggest when the
  gap can't be closed even at full commitment) was designed but the user
  decided not to build it for now.
- Everything in this log has only been verified statically in this sandbox;
  live-browser testing after any further UI change is still the user's job
  unless a working browser harness becomes available.
