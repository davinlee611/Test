"use strict";

import { getClientProfile } from "../../state/client-plan.js";

import { formatCurrency } from "../../utils/client-utils.js";

import { getApplicableErsForYear } from "../cost-of-wants/cost-of-wants-service.js";

import {
  getSelectedRetirementStrategy,
  setIncludeProjectedOa,
  setSelectedRetirementStrategy,
} from "./cost-analysis-state.js";

import { getNonNegativeNumber, setText } from "./cost-analysis-format-utils.js";

import { setAnalysisSectionExpanded } from "./cost-analysis-collapse.js";

import { openSection } from "../sidebar.js";

/* ========================================
   RETIREMENT STRATEGY CONSTANTS
======================================== */

export const RETIREMENT_STRATEGIES = Object.freeze({
  CURRENT_PATH: "current_path",

  BRS: "brs",

  FRS: "frs",

  ERS: "ers",

  NO_TOP_UP: "no_top_up",
});

export const RETIREMENT_STRATEGY_MULTIPLIERS = Object.freeze({
  brs: 0.5,

  frs: 1,
});

/* ========================================
   RETIREMENT STRATEGY

   Single entry point for both the detailed CPF Flow radio cards and
   the compact selector on the Projected Position card, so the two
   controls can never fall out of sync. Callers are responsible for
   re-rendering the page after calling this — it only updates state.
======================================== */

export function applySelectedRetirementStrategy(strategy) {
  setSelectedRetirementStrategy(
    normaliseRetirementStrategy(strategy, getClientProfile().employmentStatus),
  );

  setIncludeProjectedOa(false);
}

export function handleStrategyDetailLinkClick() {
  /*
   * The CPF Flow retirement-strategy detail this link expands and
   * scrolls to lives on the separate "Detailed Cashflow & CPF Flow"
   * sub-page, not on this simplified Analysis page — navigate there
   * first or the expand/scroll below silently targets elements on a
   * currently-hidden section.
   */
  openSection("cost-analysis-detail");

  const collapseButton = document.querySelector(
    '[data-analysis-collapse-target="analysisCpfProjectionContent"]',
  );

  const content = document.getElementById("analysisCpfProjectionContent");

  if (collapseButton && content) {
    setAnalysisSectionExpanded({
      button: collapseButton,

      content,

      expanded: true,
    });
  }

  document
    .getElementById("analysisRetirementStrategySection")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function getDefaultRetirementStrategy(employmentStatus) {
  return employmentStatus === "self_employed"
    ? RETIREMENT_STRATEGIES.NO_TOP_UP
    : RETIREMENT_STRATEGIES.CURRENT_PATH;
}

export function normaliseRetirementStrategy(strategy, employmentStatus) {
  const isSelfEmployed = employmentStatus === "self_employed";

  const validStrategies = [
    RETIREMENT_STRATEGIES.CURRENT_PATH,
    RETIREMENT_STRATEGIES.BRS,
    RETIREMENT_STRATEGIES.FRS,
    RETIREMENT_STRATEGIES.ERS,
    RETIREMENT_STRATEGIES.NO_TOP_UP,
  ];

  if (!validStrategies.includes(strategy)) {
    return getDefaultRetirementStrategy(employmentStatus);
  }

  if (strategy === RETIREMENT_STRATEGIES.NO_TOP_UP && !isSelfEmployed) {
    return RETIREMENT_STRATEGIES.CURRENT_PATH;
  }

  if (strategy === RETIREMENT_STRATEGIES.CURRENT_PATH && isSelfEmployed) {
    return RETIREMENT_STRATEGIES.NO_TOP_UP;
  }

  return strategy;
}

export function getRetirementStrategyApplicationYear({
  dateOfBirth,
  startingDate,
}) {
  const startYear = startingDate.getFullYear();

  if (
    typeof dateOfBirth !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
  ) {
    return startYear;
  }

  const birthYear = Number(dateOfBirth.slice(0, 4));

  if (!Number.isInteger(birthYear)) {
    return startYear;
  }

  const yearTurning55 = birthYear + 55;

  /*
   * Clients already aged 55 use the prevailing
   * ERS in the projection's starting year.
   *
   * Younger clients use the prevailing ERS in
   * the year they will reach age 55.
   */
  return Math.max(startYear, yearTurning55);
}

export function getRetirementStrategyTarget({
  strategy,
  cohortFrsAmount,
  strategyApplicationYear,
}) {
  const safeFrs = getNonNegativeNumber(cohortFrsAmount);

  /*
   * ERS is the prevailing annual ceiling
   * applicable when the strategy is applied.
   *
   * For a client already aged 55, this is the
   * projection's current year ERS.
   *
   * For a younger client, this is the ERS in
   * the year they reach age 55.
   */
  if (strategy === RETIREMENT_STRATEGIES.ERS) {
    const applicableErs = getApplicableErsForYear(strategyApplicationYear);

    return applicableErs.isValid ? applicableErs.amount : 0;
  }

  const multiplier = RETIREMENT_STRATEGY_MULTIPLIERS[strategy];

  if (Number.isFinite(multiplier)) {
    return safeFrs * multiplier;
  }

  /*
   * Current Path and No Cash Top-up use the
   * client's cohort FRS as the normal RA
   * funding ceiling.
   */
  return safeFrs;
}

export function strategyUsesCashTopUp(strategy) {
  return [
    RETIREMENT_STRATEGIES.BRS,
    RETIREMENT_STRATEGIES.FRS,
    RETIREMENT_STRATEGIES.ERS,
  ].includes(strategy);
}

export function getRetirementStrategyLabel(strategy) {
  switch (strategy) {
    case RETIREMENT_STRATEGIES.BRS:
      return "BRS";

    case RETIREMENT_STRATEGIES.FRS:
      return "FRS";

    case RETIREMENT_STRATEGIES.ERS:
      return "ERS";

    case RETIREMENT_STRATEGIES.NO_TOP_UP:
      return "No Cash Top-up";

    default:
      return "Current Path";
  }
}

export function renderRetirementStrategySelection({
  elements,
  cohortFrsAmount,
  strategyApplicationYear,
}) {
  const profile = getClientProfile();

  const isSelfEmployed = profile.employmentStatus === "self_employed";

  setSelectedRetirementStrategy(
    normaliseRetirementStrategy(
      getSelectedRetirementStrategy(),
      profile.employmentStatus,
    ),
  );

  const selectedRetirementStrategy = getSelectedRetirementStrategy();

  const currentPathCard =
    elements.retirementStrategyOptionsElement?.querySelector(
      '[data-retirement-strategy-card="current_path"]',
    );

  const noTopUpCard = elements.retirementStrategyOptionsElement?.querySelector(
    '[data-retirement-strategy-card="no_top_up"]',
  );

  if (currentPathCard) {
    currentPathCard.hidden = isSelfEmployed;
  }

  if (noTopUpCard) {
    noTopUpCard.hidden = !isSelfEmployed;
  }

  const compactCurrentPathOption =
    elements.pathPreviewElements.strategySelect?.querySelector(
      'option[value="current_path"]',
    );

  const compactNoTopUpOption =
    elements.pathPreviewElements.strategySelect?.querySelector(
      'option[value="no_top_up"]',
    );

  if (compactCurrentPathOption) {
    compactCurrentPathOption.hidden = isSelfEmployed;
  }

  if (compactNoTopUpOption) {
    compactNoTopUpOption.hidden = !isSelfEmployed;
  }

  if (elements.pathPreviewElements.strategySelect) {
    elements.pathPreviewElements.strategySelect.value =
      selectedRetirementStrategy;
  }

  const inputs = Array.from(
    elements.retirementStrategyOptionsElement?.querySelectorAll(
      'input[name="analysisRetirementStrategy"]',
    ) || [],
  );

  inputs.forEach(function (input) {
    input.checked = input.value === selectedRetirementStrategy;

    input
      .closest(".analysis-retirement-strategy-option")
      ?.classList.toggle("is-selected", input.checked);
  });

  const targetAmount = getRetirementStrategyTarget({
    strategy: selectedRetirementStrategy,

    cohortFrsAmount,

    strategyApplicationYear,
  });

  setText(
    elements.retirementStrategyStatusElement,
    getRetirementStrategyLabel(selectedRetirementStrategy),
  );

  setText(
    elements.retirementStrategyTargetElement,
    targetAmount > 0 ? formatCurrency(targetAmount) : "—",
  );

  setText(
    elements.retirementStrategyCashTopUpElement,
    strategyUsesCashTopUp(selectedRetirementStrategy)
      ? "Calculated at age 55"
      : "$0",
  );

  setText(
    elements.retirementStrategyFundingResultElement,
    strategyUsesCashTopUp(selectedRetirementStrategy)
      ? "Uses SA, OA, then available cash"
      : "Uses projected CPF balances",
  );

  let note = "Current Path does not force an additional cash top-up.";

  if (selectedRetirementStrategy === RETIREMENT_STRATEGIES.NO_TOP_UP) {
    note =
      "No Cash Top-up uses existing CPF balances and future mandatory CPF flows. It does not deduct cash to meet BRS, FRS or ERS.";
  }

  if (selectedRetirementStrategy === RETIREMENT_STRATEGIES.BRS) {
    note =
      "The BRS scenario targets 50% of projected FRS. Property pledge eligibility and withdrawal conditions are not validated by this projection.";
  }

  if (selectedRetirementStrategy === RETIREMENT_STRATEGIES.FRS) {
    note =
      "The FRS scenario uses SA first, followed by OA, then available cash to meet the projected cohort FRS at age 55.";
  }

  if (selectedRetirementStrategy === RETIREMENT_STRATEGIES.ERS) {
    note = `The ERS scenario uses the prevailing ${strategyApplicationYear} ERS. Any amount not covered by SA and OA is funded from available withdrawable cash.`;
  }

  setText(elements.retirementStrategyNoteElement, note);

  setText(elements.pathPreviewElements.strategyNote, note);
}

export function renderRetirementStrategyResult(elements, rows) {
  const selectedRetirementStrategy = getSelectedRetirementStrategy();

  const topUpRow = rows.find(function (row) {
    return (
      getNonNegativeNumber(row.retirementStrategyCashTopUp) > 0 ||
      row.retirementStrategyAppliedThisMonth
    );
  });

  const cashTopUp = getNonNegativeNumber(topUpRow?.retirementStrategyCashTopUp);

  setText(
    elements.retirementStrategyCashTopUpElement,
    strategyUsesCashTopUp(selectedRetirementStrategy)
      ? formatCurrency(cashTopUp)
      : "$0",
  );

  if (!strategyUsesCashTopUp(selectedRetirementStrategy)) {
    setText(
      elements.retirementStrategyFundingResultElement,
      "No forced cash top-up",
    );

    return;
  }

  if (!topUpRow) {
    setText(
      elements.retirementStrategyFundingResultElement,
      "Applied when age 55 is reached",
    );

    return;
  }

  const target = getNonNegativeNumber(topUpRow.retirementStrategyTarget);

  const funded = getNonNegativeNumber(topUpRow.retirementSumSetAside);

  const shortfall = Math.max(target - funded, 0);

  setText(
    elements.retirementStrategyFundingResultElement,
    shortfall > 0
      ? `${formatCurrency(shortfall)} unfunded`
      : "Target fully funded",
  );
}
