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
- **Config-driven field lists**: `COMMITMENT_FIELDS` (in
  `modules/commitments/commitment-config.js`) and `EXPENSE_FIELDS` (in
  `modules/expenses/expense-config.js`) each hold `{ key, elementId, label }`
  per field. Adding a new commitment/expense field is: add one entry to the
  array, add the matching HTML input, done — the render/save/reset wiring in
  `commitments.js`/`expenses.js` is already generic over the array. Reuse
  `EXPENSE_FIELDS` (with its `label`) for display labels elsewhere instead of
  hand-rolling another `{ key: "household", label: "Household" }`-style map;
  client-report.js and protection-analysis.js both do this correctly now —
  don't regress that.
- **New top-level state buckets** (e.g. `protection`, alongside `costOfWants`)
  need four things in `client-plan.js`, mirroring the `costOfWants` pattern
  exactly: a `createEmptyX()` factory, `X: createEmptyX()` in
  `createEmptyClientPlan()`, a `getX()` selector, an `updateX(updates)`
  updater, and a normalization branch in `normalizeClientPlan()` so plans
  saved before the field existed still load with sane defaults.

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
7. Fixed Client Report layout issues the user found live: split the report
   into per-section bordered cards with page breaks between them (was one
   continuous flow), made Insurance Portfolio conditional on having policies,
   fixed the Benefits row overflowing instead of wrapping, and fixed print
   only using the sidebar-content grid's middle column (`.workspace-layout`
   needed `display: block` in print, not just hiding the sidebar element).
   Renamed "Retirement Plan" → "Cost of Wants Analysis" in the report.
8. Added a "Wealth Priorities" group to the Client Report — the 4 wealth
   types (Accumulation/Distribution/Protection/Preservation) in the order the
   client ranked them (`priorities.selectedWealthTypes`, array order = rank).
9. Added a new **Contribution to Future Self** field — a monthly
   savings/investment amount, alongside the insurance-premium quick-entry in
   Priorities & Situation → Commitments. This concept didn't exist anywhere
   in the app before this session; treated as a brand-new field rather than
   a rename of something existing. Deliberately **not** summed into Total
   Monthly Commitments or any cashflow/surplus figure — new input, not a
   change to existing calculations.
10. Started **Protection Analysis** (first pass, fields only, no calculation
    logic — by explicit instruction): branded **SBMI** ("Stop Buying More
    Insurance"), mirroring the FYBC treatment on Cost of Wants. Two step-cards
    side by side reusing Analysis's `.analysis-path-card`/step-grid classes —
    Step 1 (Medical Protection: a 1–5 "importance of not waiting for
    treatment" scale, a Yes/No "active exercise / injury-prone" toggle) and
    Step 2 (live checkboxes over non-zero expense categories, liabilities,
    and the future-self contribution, all pulled from Priorities & Situation
    and re-rendering on `EXPENSES_CHANGED`/`LIABILITIES_CHANGED`/
    `COMMITMENTS_CHANGED`). New `protection` state bucket in `client-plan.js`.
    New module: `js/modules/protection-analysis.js`.
11. Fixed Step 2 checklist math per user correction: the "5 years of
    expenses/liabilities" helper totals now sum only checked/selected items
    (previously summed all non-zero items regardless of selection); each
    checklist re-renders itself on its own toggle. Future Self's calculated
    amount now uses actual compound future value via a newly-exported
    `calculateMonthlyContributionFutureValue()` (from `cost-analysis.js`,
    reused rather than duplicated) at an independent 5% p.a. assumption,
    instead of simple monthly × 60 multiplication; helper text discloses the
    rate.
12. Restructured the Future Self checklist item to a horizontal row
    (checkbox+label left, amount input right) instead of stacked, so the
    card reads shorter. Added a "Total Critical Illness Coverage Needed"
    row below a divider at the bottom of Step 2 — sums the 5-year totals of
    only the checked expenses/liabilities plus the Future Self future value
    (only when its checkbox is checked), recomputed live on every toggle via
    `renderCoverageTotal()` in `protection-analysis.js`.
13. Built the **SBMI Analysis** coverage-gap subsection — a new sidebar
    sub-page under Protection Analysis (`data-section="sbmi-analysis"`),
    mirroring the Cost of Wants / Analyse Commitments split. Mocked up as an
    Artifact first per usual practice, discussed with the user whether to
    combine or separate CI/ECI sum-assured amounts and whether to show Death
    coverage, then built to the agreed design:
    - **Coverage Needed** card reuses `protection-analysis.js`'s own
      selected-only totals and Future Self future value (now exported:
      `PROTECTION_HORIZON_YEARS`/`_MONTHS`, `FUTURE_SELF_GROWTH_RATE_PERCENT`,
      `getSelectableExpenseItems`, `getSelectableLiabilities`,
      `getSelectedExpenseMonthlyTotal`, `getSelectedLiabilityMonthlyTotal`,
      `getFutureSelfDisplayedAmount`) instead of recalculating — same number
      as the Step 2 "Total Critical Illness Coverage Needed" card.
    - **Existing Coverage** card is new: `js/services/protection-coverage-
      calculator.js`'s `calculateExistingCriticalIllnessCoverage()` sums
      Critical Illness + Early Critical Illness benefits across the saved
      Insurance Portfolio (`getAllPolicies()`). Accelerated Early CI is
      folded into its related CI benefit's entry as a note rather than
      summed again (it's a sub-limit of the same pool, not extra money);
      additional/standalone Early CI is counted as its own entry. CI
      accelerated/additional from a Death benefit is left at face value —
      that distinction affects the Death benefit afterward, not what's
      payable on a CI event, so it's out of scope for this comparison.
    - **Coverage Gap** = Needed − Existing, with a shortfall/fully-covered
      tag and a progress bar (reuses `.analysis-next-progress-track`). No
      top-up recommendation logic yet — same "just show the number, no
      guidance branch" scope decision as Cost of Wants' Your Next Steps.
    - Re-renders on `EXPENSES_CHANGED`/`LIABILITIES_CHANGED`/
      `COMMITMENTS_CHANGED`/`POLICIES_CHANGED` and on section entry; wired
      into Clear Plan via `resetSbmiAnalysis()`.
    - Deliberately does **not** show Death sum assured as its own figure —
      there's no "Death Coverage Needed" anywhere in the app to compare it
      against, so it would be an orphaned number, not a gap. Per-policy
      Death context (e.g. "accelerated from $X Death") was discussed but not
      built in this pass.
14. Resolved the "Contribution to Future Self" open question from the
    previous session (see the now-removed reminder): it stays excluded from
    every surplus/commitments calculation — the user confirmed the
    investing-for-the-future money it represents already has a home under
    Other Recurring Expenses, Withdrawable Assets, or an Investment
    Accumulation policy, so counting it a second time here would be the
    double-count risk originally flagged. Instead, added a genuinely new
    **Emergency Fund** field — a distinct concept (a monthly cash buffer,
    not investment) — as a plain `EXPENSE_FIELDS` entry
    (`expenses/expense-config.js`), so it flows into
    `calculateTotalMonthlyExpenses()` and therefore reduces
    `remainingSurplus` in `cost-analysis.js` automatically, with zero
    changes needed there. Confirmed via code read that `remainingSurplus`
    only ever subtracted liability repayments + insurance premiums —
    Contribution to Future Self was never part of that formula, which was a
    real gap the user caught, not a false alarm. Because it's a normal
    `EXPENSE_FIELDS` entry it's automatically selectable in Protection
    Analysis Step 2 and counted in SBMI Analysis's Coverage Needed too, same
    as every other expense category.
15. Built the **Medical Protection Check** block on SBMI Analysis, linking
    Protection Analysis Step 1's two qualitative signals to the Insurance
    Portfolio. Mocked up as an Artifact first, then built as approved:
    - **Treatment Wait-Time Preference** card: shows the 1–5 answer (with a
      mini dot-scale readout) against the highest recorded Hospitalisation
      ward class. Flags "Consider Private Ward" when importance is
      high (≥4, `HIGH_WAIT_TIME_IMPORTANCE_THRESHOLD` in
      `sbmi-analysis.js`) and the plan isn't Private; "Matches Preference"
      when it already is; no flag shown below the threshold or before Step
      1 is answered.
    - **Active Lifestyle / Injury Risk** card: shows the Yes/No answer
      against whether a Personal Accident policy is recorded. Flags
      "Consider Personal Accident Cover" when injury-prone with none
      recorded, "Personal Accident Cover in Place" (with policy count +
      Death/TPD total) otherwise.
    - New `js/services/protection-coverage-calculator.js` exports:
      `getBestRecordedHospitalisationWardClass()` (ranks
      b2_ward/b1_ward/a_ward/private across all Hospitalisation policies,
      returns the highest) and `getPersonalAccidentCoverageSummary()` (sums
      Death + TPD benefits across Personal Accident policies).
    - Deliberately flags/badges, not a progress bar — there's no sum
      assured to compare against for either question, unlike the CI cards
      above it on the same page.
    - Reuses the existing `renderSbmiAnalysis()`/`POLICIES_CHANGED` wiring;
      no new event listeners needed since it renders as part of the same
      function.
16. Superseded item 14's decision: the user decided to **remove
    Contribution to Future Self entirely** rather than keep it excluded
    from surplus — its investing-for-the-future role already has a home
    elsewhere (Other Recurring Expenses, Withdrawable Assets, or an
    Investment Accumulation policy). Removed the Priorities & Situation
    input, its Commitments state field (`COMMITMENT_FIELDS` is now just
    `insurancePremiums`), its dedicated Step 2 checklist group and
    future-value calculation in `protection-analysis.js` (along with the
    now-orphaned `createFutureSelfItem()` /
    `.protection-checklist-item--editable` styles it was the only user
    of), its row in SBMI Analysis Coverage Needed, and its group in the
    Client Report. `calculateMonthlyContributionFutureValue()` in
    `cost-analysis.js` stays — it has its own unrelated caller there
    (`projectedMonthlyCommitment`) and was only ever reused by Future Self,
    not owned by it. Also renamed the **Emergency Fund** expense field to
    **Savings** (key `emergencyFund` → `savings`, helper text broadened to
    "emergency fund, general savings, or other liquid reserves") so it
    now fills Future Self's old role in Protection Analysis Step 2 —
    automatically, since both are plain `EXPENSE_FIELDS` entries and Step
    2 already iterates that config generically.
17. Polished the "Continue After FYBC" toggle (`.planning-switch`, Income
    section) per user feedback that it looked misaligned: right-aligned it
    within its row (`justify-self: end`) so it lines up with where other
    rows' inputs sit instead of floating at the row's left edge, sized it
    up slightly (42×24 → 44×26), and added a subtle border for definition
    against the white row background. Only usage of `.planning-switch` in
    the app, so safe to change freely.
18. User asked (in an exploratory question, not a build request) whether the
    new Savings expense field should support a custom protection-horizon
    duration since it also covers "emergency fund." Recommended against it
    (breaks the uniform 5-year-horizon-for-every-expense pattern, re-opens
    per-item override complexity just removed with Future Self) and the
    user agreed not to build it — logged here so it isn't re-litigated
    without a reason to revisit.
19. Fixed a real visual inconsistency on SBMI Analysis: the two Medical
    Protection Check cards (Treatment Wait-Time Preference, Active
    Lifestyle / Injury Risk) were plain `.analysis-path-card` elements
    without the `.analysis-path-section-shell` wrapper that Coverage
    Needed/Existing Coverage already use, so they read as a different
    visual weight despite sharing a card class. Wrapped both in the same
    shell div. Also added a "Continue to Analysis" CTA at the bottom of
    the Protection Analysis (Step 1/Step 2) page, reusing the
    `.analysis-path-details-notice` pattern and `openSection()` wiring
    already used by Analysis's "View Detailed Cashflow & CPF Flow" button
    (`sidebar.js`), navigating to `sbmi-analysis`.
20. Built the **Client Report redesign** — the session-9 pause point's
    planned task. User confirmed the SBMI Analysis card language was
    exactly the look they wanted for the whole report, including print.
    Two mockup rounds (first the full report, then a refinement pass) before
    touching code, per established practice. Final approved changes:
    Priorities & Situation / Insurance Portfolio / Cost of Wants Analysis /
    Protection Analysis all now render as bordered shell cards with summary
    rows building to a highlighted total, instead of the old flat
    label/value listing. Implementation:
    - New reusable pure calculators so the report and the live SBMI
      Analysis page share one source of truth instead of recalculating:
      `getCoverageNeededBreakdown()` (`protection-analysis.js`),
      `calculateCoverageGap()` (`protection-coverage-calculator.js`), and
      `getWaitTimeCheckResult()`/`getInjuryCheckResult()` (`sbmi-analysis.js`
      — these were previously inline DOM-mutating logic in that file's own
      render functions; extracting them as exported pure functions was
      necessary before the report could reuse the exact same flag/threshold
      logic without duplicating it).
    - `hasProtectionAnalysisContent()` is no longer hardcoded `false` — it
      now checks whether Protection Analysis Step 1/Step 2 actually has
      answers/selections (`waitTimeImportance > 0` OR
      `activeExerciseInjuryProne !== null` OR any Step 2 selection). When
      true, the Protection Analysis report section shows real Coverage
      Needed/Existing/Gap cards and Medical Protection Check flags (each
      flag card independently gated on that specific Step 1 question being
      answered), matching SBMI Analysis exactly.
    - Per explicit instruction, sections/cards with nothing recorded no
      longer render at all — no "$0" placeholder cards. Current Monthly
      Cashflow, CPF Balances and Withdrawable Assets gained gates joining
      the pre-existing goals/liabilities/properties/wealth-priorities
      gates; if a whole section ends up with zero cards, the section itself
      is skipped (checked via `grid.children.length === 0`).
    - Per explicit instruction, Insurance Portfolio benefit lists use
      abbreviated labels scoped to the report only (`BENEFIT_LABELS_SHORT`
      in `client-report.js`: Death → "Death / TI", TPD stays "TPD" instead
      of the full "Total and Permanent Disability", Critical Illness → CI,
      Early Critical Illness → ECI) so a policy with several benefits
      doesn't overflow its card border. The shared `BENEFIT_LABELS` used
      elsewhere (e.g. the Add Benefit dropdown) is untouched — full wording
      still helps there, this was a report-card-width problem specifically.
    - `print.css`: added `print-color-adjust: exact` scoped to `.client-report`
      and its descendants, since browsers silently strip background colors
      by default when printing — without this, every shell card, highlighted
      total, gap panel and warning/success flag would print as plain white.
      Added `break-inside: avoid` per card/panel (not per section, since a
      section can now legitimately span more than one printed page with
      several cards in it) so a card doesn't get sliced across a page
      boundary.

## Open items / natural next steps

- Death/TPD coverage-gap analysis and disability-income suitability on SBMI
  Analysis are not built — Critical Illness is the only coverage type
  covered so far. No top-up recommendation logic exists on SBMI Analysis or
  Cost of Wants' Your Next Steps (deliberate scope stop at "show the
  number," not "tell them what to do about it").
- The shortfall-guidance branch for Your Next Steps (what to suggest when the
  gap can't be closed even at full commitment) was designed but the user
  decided not to build it for now.
- Everything in this log has only been verified statically in this sandbox;
  live-browser testing after any further UI change is still the user's job
  unless a working browser harness becomes available. **The redesigned
  Client Report specifically needs a live print test** — the
  `print-color-adjust` fix in `print.css` was written from documented
  browser print-default behavior, not confirmed against an actual print
  preview in this sandbox. Expect a fix-up round once the user has
  actually printed/exported it, same pattern as every other UI change
  this session.
