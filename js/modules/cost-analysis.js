"use strict";

import {
  getAssets,
  getClientProfile,
  getExpenses,
  getGoals,
  getLiabilities,
  getPolicies,
} from "../state/client-plan.js";

import { formatCurrency } from "../utils/client-utils.js";

import { getCpfAllocationRates } from "../services/cpf-service.js";

import { calculateIncomeSummary } from "../services/income-calculator.js";

import {
  calculateCpfBalanceTotal,
  calculateLiquidAssetTotal,
} from "./assets-income/assets-income-calculator.js";

import {
  getApplicableErsForYear,
  getCpfLifePayoutStartAge,
  getDesiredFybcAge,
  getGrossRetirementGoalSummary,
  getInflationRate,
  getPlannedMortalityAge,
  getPostFybcReturnRate,
  getProjectedCohortFrs,
  setCpfLifePayoutStartAge,
} from "./cost-of-wants/cost-of-wants-service.js";

import {
  CPF_RA_INTEREST_RATE,
  calculateProjectedCpfLifePayout,
} from "./cost-of-wants/cost-of-wants-calculator.js";

import { calculateTotalMonthlyExpenses } from "./expenses/expense-calculator.js";

import {
  getLiabilityMonthlyCashRepayment,
  getLiabilityMonthlyCpfPayment,
} from "./liabilities/liability-calculator.js";

import {
  getEffectiveMonthlyInsurancePremium,
  getMonthlyInsuranceMedisaveOutflow,
} from "../services/commitment-service.js";

import {
  BHS_PROJECTION_GROWTH_RATE,
  getApplicableBasicHealthcareSum,
  getProjectedCohortBasicHealthcareSum,
} from "../services/cpf-healthcare-service.js";

import { calculateMonthlyCpfInterest } from "../services/cpf-interest-calculator.js";

import { getPolicyCashInflow } from "../services/policy-cashflow-service.js";

import {
  openModal,
  closeModal,
  closeModalOnOverlayClick,
  closeModalOnEscape,
} from "../utils/modal.js";

/* ========================================
   CONFIGURATION
======================================== */

const MONTHS_PER_YEAR = 12;
const DEFAULT_PROJECTION_PERIOD = "10";
const DEFAULT_PROJECTION_YEARS = 10;
const DEFAULT_EMPLOYMENT_INCREMENT = 2;
const MINIMUM_AUTOMATIC_CPF_LIFE_PREMIUM = 60000;
const DEFAULT_PRE_FYBC_GROWTH_RATE = 5;
const DEFAULT_INVESTMENT_POLICY_GROWTH_RATE = 4;

const RETIREMENT_STRATEGIES = Object.freeze({
  CURRENT_PATH: "current_path",

  BRS: "brs",

  FRS: "frs",

  ERS: "ers",

  NO_TOP_UP: "no_top_up",
});

const RETIREMENT_STRATEGY_MULTIPLIERS = Object.freeze({
  brs: 0.5,

  frs: 1,
});

/* ========================================
   ELEMENTS
======================================== */

const employmentIncrementInput = document.getElementById(
  "analysisEmploymentIncrementInput",
);

const expenseInflationInput = document.getElementById(
  "analysisExpenseInflationInput",
);

const cashflowDescriptionElement = document.getElementById(
  "analysisCashflowDescription",
);

const incomeIncrementLabel = document.getElementById(
  "analysisIncomeIncrementLabel",
);

const primaryIncomeLabel = document.getElementById(
  "analysisPrimaryIncomeLabel",
);

const contributionIncomeLabel = document.getElementById(
  "analysisContributionIncomeLabel",
);

const projectionPeriodInputs = Array.from(
  document.querySelectorAll('input[name="analysisProjectionPeriod"]'),
);

const projectionPeriodLabel = document.getElementById(
  "analysisProjectionPeriodLabel",
);

const cashflowPeriodHeading = document.getElementById(
  "analysisCashflowPeriodHeading",
);

const cpfPeriodHeading = document.getElementById("analysisCpfPeriodHeading");

const cashflowProjectionTableBody = document.getElementById(
  "analysisCashflowProjectionTableBody",
);

const cpfProjectionTableBody = document.getElementById(
  "analysisCpfProjectionTableBody",
);

const analysisSectionCollapseButtons = Array.from(
  document.querySelectorAll("[data-analysis-collapse-target]"),
);

const projectedFrsElement = document.getElementById("analysisProjectedFrs");

const projectedFrsBasisElement = document.getElementById(
  "analysisProjectedFrsBasis",
);

const projectedCohortBhsElement = document.getElementById(
  "analysisProjectedCohortBhs",
);

const projectedCohortBhsBasisElement = document.getElementById(
  "analysisProjectedCohortBhsBasis",
);

const cpfLifeStartAgeInput = document.getElementById(
  "analysisCpfLifeStartAgeInput",
);

const cpfLifePremiumElement = document.getElementById("analysisCpfLifePremium");

const cpfLifePayoutElement = document.getElementById("analysisCpfLifePayout");

const cpfLifeProjectionStatusElement = document.getElementById(
  "analysisCpfLifeProjectionStatus",
);

const retirementStrategyOptionsElement = document.getElementById(
  "analysisRetirementStrategyOptions",
);

const retirementStrategyStatusElement = document.getElementById(
  "analysisRetirementStrategyStatus",
);

const retirementStrategyTargetElement = document.getElementById(
  "analysisRetirementStrategyTarget",
);

const retirementStrategyCashTopUpElement = document.getElementById(
  "analysisRetirementStrategyCashTopUp",
);

const retirementStrategyFundingResultElement = document.getElementById(
  "analysisRetirementStrategyFundingResult",
);

const retirementStrategyNoteElement = document.getElementById(
  "analysisRetirementStrategyNote",
);

const goalFilterOptions = document.getElementById("analysisGoalFilterOptions");

const selectAllGoalsButton = document.getElementById(
  "analysisSelectAllGoalsButton",
);

const employmentIncomeElement = document.getElementById(
  "analysisEmploymentIncomeAfterCpf",
);

const bonusIncomeElement = document.getElementById(
  "analysisBonusIncomeAfterCpf",
);

const otherIncomeElement = document.getElementById(
  "analysisOtherMonthlyIncome",
);

const retirementPolicyIncomeElement = document.getElementById(
  "analysisRetirementPolicyIncome",
);

const totalMonthlyIncomeElement = document.getElementById(
  "analysisTotalMonthlyIncome",
);

const monthlyExpensesElement = document.getElementById(
  "analysisMonthlyExpenses",
);

const monthlyCommitmentsElement = document.getElementById(
  "analysisMonthlyCommitments",
);

const remainingSurplusElement = document.getElementById(
  "analysisRemainingSurplus",
);

/* ========================================
   YOUR PATH ELEMENTS
======================================== */

const pathPreviewElements = {
  fybcAge: document.getElementById("analysisPathFybcAge"),

  yearsRemaining: document.getElementById("analysisPathYearsRemaining"),

  monthlyLifestyle: document.getElementById("analysisPathMonthlyLifestyle"),

  monthlyLifestyleAtFybc: document.getElementById(
    "analysisPathMonthlyLifestyleAtFybc",
  ),

  lifestyleAtFybcLabel: document.getElementById(
    "analysisPathLifestyleAtFybcLabel",
  ),

  inflationAssumption: document.getElementById(
    "analysisPathInflationAssumption",
  ),

  methodologyLifestyleToday: document.getElementById(
    "analysisPathMethodologyLifestyleToday",
  ),

  methodologyInflation: document.getElementById(
    "analysisPathMethodologyInflation",
  ),

  methodologyFybcLabel: document.getElementById(
    "analysisPathMethodologyFybcLabel",
  ),

  methodologyLifestyleAtFybc: document.getElementById(
    "analysisPathMethodologyLifestyleAtFybc",
  ),

  methodologyPeriod: document.getElementById("analysisPathMethodologyPeriod"),

  lifetimeSpending: document.getElementById("analysisPathLifetimeSpending"),

  currentAssets: document.getElementById("analysisPathCurrentAssets"),

  currentCpfSavings: document.getElementById("analysisPathCurrentCpfSavings"),

  currentCpfBreakdown: document.getElementById(
    "analysisPathCurrentCpfBreakdown",
  ),

  affordableAmount: document.getElementById("analysisPathAffordableAmount"),

  currentStatus: document.getElementById("analysisPathCurrentStatus"),

  projectedPositionTitle: document.getElementById(
    "analysisPathProjectedPositionTitle",
  ),

  projectionIncomplete: document.getElementById(
    "analysisPathProjectionIncomplete",
  ),

  projectionResults: document.getElementById("analysisPathProjectionResults"),

  strategySelect: document.getElementById("analysisPathStrategySelect"),

  strategyNote: document.getElementById("analysisPathStrategyNote"),

  strategyDetailLink: document.getElementById(
    "analysisPathStrategyDetailLink",
  ),

  capitalNeededLabel: document.getElementById("analysisPathCapitalNeededLabel"),

  capitalNeededAtFybc: document.getElementById(
    "analysisPathCapitalNeededAtFybc",
  ),

  capitalNeedBasis: document.getElementById("analysisPathCapitalNeedBasis"),

  capitalNeedReductionNote: document.getElementById(
    "analysisPathCapitalReductionNote",
  ),

  recordedIncomeAtFybc: document.getElementById(
    "analysisPathRecordedIncomeAtFybc",
  ),

  recordedIncomeAtFybcBasis: document.getElementById(
    "analysisPathRecordedIncomeAtFybcBasis",
  ),

  projectedCpfLifeIncome: document.getElementById(
    "analysisPathProjectedCpfLifeIncome",
  ),

  projectedCpfLifeBasis: document.getElementById(
    "analysisPathProjectedCpfLifeBasis",
  ),

  grossCapitalAtFybc: document.getElementById("analysisPathGrossCapitalAtFybc"),

  incomeCapitalOffset: document.getElementById(
    "analysisPathIncomeCapitalOffset",
  ),

  netCapitalAtFybc: document.getElementById("analysisPathNetCapitalAtFybc"),

  postFybcReturn: document.getElementById("analysisPathPostFybcReturn"),

  incomeIncrementAssumption: document.getElementById(
    "analysisPathIncomeIncrementAssumption",
  ),

  expenseInflationAssumption: document.getElementById(
    "analysisPathExpenseInflationAssumption",
  ),
};

const capitalMethodologyButtons = Array.from(
  document.querySelectorAll("[data-capital-breakdown]"),
);

const projectionBreakdownModal = document.getElementById(
  "projectionBreakdownModal",
);

const projectionBreakdownTitle = document.getElementById(
  "projectionBreakdownTitle",
);

const projectionBreakdownSubtitle = document.getElementById(
  "projectionBreakdownSubtitle",
);

const projectionBreakdownContent = document.getElementById(
  "projectionBreakdownContent",
);

const closeProjectionBreakdownButton = document.getElementById(
  "closeProjectionBreakdownButton",
);

/* ========================================
   YOUR NEXT STEPS
======================================== */

const nextStepsElements = {
  suggestedMonthly: document.getElementById("analysisNextSuggestedMonthly"),

  availableMonthly: document.getElementById("analysisNextAvailableMonthly"),

  chosenMonthly: document.getElementById("analysisNextChosenMonthly"),

  monthlyAmountInput: document.getElementById("analysisNextMonthlyAmountInput"),

  growthRateInput: document.getElementById("analysisNextGrowthRateInput"),

  flexibilityRemaining: document.getElementById(
    "analysisNextFlexibilityRemaining",
  ),

  commitmentMessage: document.getElementById("analysisNextCommitmentMessage"),

  availableAssets: document.getElementById("analysisNextAvailableAssets"),

  assetsReservedNote: document.getElementById("analysisNextAssetsReservedNote"),

  assetsAmountInput: document.getElementById("analysisNextAssetsAmountInput"),

  assetsAmountHelp: document.getElementById("analysisNextAssetsAmountHelp"),

  assetsProjectedRow: document.getElementById("analysisNextAssetsProjectedRow"),

  assetsProjectedAtFybc: document.getElementById(
    "analysisNextAssetsProjectedAtFybc",
  ),

  investmentPolicies: document.getElementById("analysisNextInvestmentPolicies"),

  investmentGrowthRateInput: document.getElementById(
    "analysisNextInvestmentGrowthRateInput",
  ),

  endowmentValue: document.getElementById("analysisNextEndowmentValue"),

  eligibleOa: document.getElementById("analysisNextEligibleOa"),

  includeAssetsInput: document.getElementById("analysisNextIncludeAssetsInput"),

  includeInvestmentPoliciesInput: document.getElementById(
    "analysisNextIncludeInvestmentPoliciesInput",
  ),

  includeEndowmentInput: document.getElementById(
    "analysisNextIncludeEndowmentInput",
  ),

  includeOaInput: document.getElementById("analysisNextIncludeOaInput"),

  capitalNeeded: document.getElementById("analysisNextCapitalNeeded"),

  selectedResources: document.getElementById("analysisNextSelectedResources"),

  monthlyCommitmentValue: document.getElementById(
    "analysisNextMonthlyCommitmentValue",
  ),

  projectedFunding: document.getElementById("analysisNextProjectedFunding"),

  remainingGap: document.getElementById("analysisNextRemainingGap"),

  fundingProgressLabel: document.getElementById(
    "analysisNextFundingProgressLabel",
  ),

  fundingProgressBar: document.getElementById("analysisNextFundingProgressBar"),

  fundingStatus: document.getElementById("analysisNextFundingStatus"),
};

const monthlyCommitmentInputs = Array.from(
  document.querySelectorAll('input[name="analysisMonthlyCommitment"]'),
);

/* ========================================
   INITIALIZATION
======================================== */

let moduleInitialized = false;

let expenseInflationWasOverridden = false;

let includeProjectedOa = false;

let latestYourPathProjectedPosition = null;

let selectedRetirementStrategy = RETIREMENT_STRATEGIES.CURRENT_PATH;

const excludedProjectionGoalIds = new Set();

export function initializeCostAnalysis() {
  if (moduleInitialized) {
    renderCostAnalysis();
    return;
  }

  if (employmentIncrementInput) {
    employmentIncrementInput.addEventListener("input", renderCostAnalysis);
  }

  syncExpenseInflationDefault();

  if (expenseInflationInput) {
    expenseInflationInput.addEventListener("input", function () {
      expenseInflationWasOverridden = true;

      renderCostAnalysis();
    });
  }

  projectionPeriodInputs.forEach(function (input) {
    input.addEventListener("change", renderCostAnalysis);
  });

  cpfLifeStartAgeInput?.addEventListener("change", function (event) {
    const wasSaved = setCpfLifePayoutStartAge(event.currentTarget.value);

    if (!wasSaved) {
      event.currentTarget.value = String(getCpfLifePayoutStartAge());
    }

    renderCostAnalysis();
  });

  retirementStrategyOptionsElement?.addEventListener(
    "change",
    function (event) {
      const input = event.target.closest(
        'input[name="analysisRetirementStrategy"]',
      );

      if (!input) {
        return;
      }

      applySelectedRetirementStrategy(input.value);
    },
  );

  pathPreviewElements.strategySelect?.addEventListener(
    "change",
    function (event) {
      applySelectedRetirementStrategy(event.currentTarget.value);
    },
  );

  pathPreviewElements.strategyDetailLink?.addEventListener(
    "click",
    handleStrategyDetailLinkClick,
  );

  analysisSectionCollapseButtons.forEach(function (button) {
    button.addEventListener("click", handleAnalysisSectionCollapse);
  });

  goalFilterOptions?.addEventListener("change", handleGoalFilterChange);

  selectAllGoalsButton?.addEventListener("click", handleSelectAllGoals);

  monthlyCommitmentInputs.forEach(function (input) {
    input.addEventListener("change", function () {
      renderCostAnalysis();
    });
  });

  nextStepsElements.assetsAmountInput?.addEventListener(
    "input",
    renderCostAnalysis,
  );

  nextStepsElements.monthlyAmountInput?.addEventListener("input", function () {
    const selectedInput = monthlyCommitmentInputs.find(function (input) {
      return input.checked;
    });

    if (selectedInput?.value === "custom") {
      renderCostAnalysis();
    }
  });

  nextStepsElements.growthRateInput?.addEventListener(
    "input",
    renderCostAnalysis,
  );

  nextStepsElements.investmentGrowthRateInput?.addEventListener(
    "input",
    renderCostAnalysis,
  );

  nextStepsElements.includeAssetsInput?.addEventListener("change", function () {
    /*
     * We deliberately do not automatically put the
     * full available balance into the plan.
     */
    renderCostAnalysis();

    if (nextStepsElements.includeAssetsInput.checked) {
      nextStepsElements.assetsAmountInput?.focus();
    }
  });

  [
    nextStepsElements.includeInvestmentPoliciesInput,

    nextStepsElements.includeEndowmentInput,

    nextStepsElements.includeOaInput,
  ].forEach(function (input) {
    input?.addEventListener("change", renderCostAnalysis);
  });

  capitalMethodologyButtons.forEach(function (button) {
    button.addEventListener("click", handleCapitalMethodologyClick);
  });

  closeProjectionBreakdownButton?.addEventListener("click", function () {
    closeModal(projectionBreakdownModal);
  });

  closeModalOnOverlayClick(projectionBreakdownModal);

  closeModalOnEscape(projectionBreakdownModal);

  moduleInitialized = true;

  renderCostAnalysis();
}

export function resetCostAnalysis() {
  if (employmentIncrementInput) {
    employmentIncrementInput.value = DEFAULT_EMPLOYMENT_INCREMENT;
  }

  expenseInflationWasOverridden = false;

  syncExpenseInflationDefault();

  projectionPeriodInputs.forEach(function (input) {
    input.checked = input.value === DEFAULT_PROJECTION_PERIOD;
  });

  excludedProjectionGoalIds.clear();

  includeProjectedOa = false;

  selectedRetirementStrategy = getDefaultRetirementStrategy(
    getClientProfile().employmentStatus,
  );

  analysisSectionCollapseButtons.forEach(function (button) {
    const targetId = button.dataset.analysisCollapseTarget;

    const content = document.getElementById(targetId);

    if (!content) {
      return;
    }

    setAnalysisSectionExpanded({
      button,

      content,

      expanded: false,
    });
  });

  renderCostAnalysis();
}

function syncExpenseInflationDefault() {
  if (!expenseInflationInput) {
    return;
  }

  expenseInflationInput.value = String(
    getNonNegativeNumber(getInflationRate()),
  );
}

/* ========================================
   RETIREMENT STRATEGY
======================================== */

/*
 * Single entry point for both the detailed CPF Flow radio cards and
 * the compact selector on the Projected Position card, so the two
 * controls can never fall out of sync.
 */
function applySelectedRetirementStrategy(strategy) {
  selectedRetirementStrategy = normaliseRetirementStrategy(
    strategy,
    getClientProfile().employmentStatus,
  );

  includeProjectedOa = false;

  renderCostAnalysis();
}

function handleStrategyDetailLinkClick() {
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

function getDefaultRetirementStrategy(employmentStatus) {
  return employmentStatus === "self_employed"
    ? RETIREMENT_STRATEGIES.NO_TOP_UP
    : RETIREMENT_STRATEGIES.CURRENT_PATH;
}

function normaliseRetirementStrategy(strategy, employmentStatus) {
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

function getRetirementStrategyApplicationYear({ dateOfBirth, startingDate }) {
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

function getRetirementStrategyTarget({
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

function strategyUsesCashTopUp(strategy) {
  return [
    RETIREMENT_STRATEGIES.BRS,
    RETIREMENT_STRATEGIES.FRS,
    RETIREMENT_STRATEGIES.ERS,
  ].includes(strategy);
}

function getRetirementStrategyLabel(strategy) {
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

function renderRetirementStrategySelection({
  cohortFrsAmount,
  strategyApplicationYear,
}) {
  const profile = getClientProfile();

  const isSelfEmployed = profile.employmentStatus === "self_employed";

  selectedRetirementStrategy = normaliseRetirementStrategy(
    selectedRetirementStrategy,
    profile.employmentStatus,
  );

  const currentPathCard = retirementStrategyOptionsElement?.querySelector(
    '[data-retirement-strategy-card="current_path"]',
  );

  const noTopUpCard = retirementStrategyOptionsElement?.querySelector(
    '[data-retirement-strategy-card="no_top_up"]',
  );

  if (currentPathCard) {
    currentPathCard.hidden = isSelfEmployed;
  }

  if (noTopUpCard) {
    noTopUpCard.hidden = !isSelfEmployed;
  }

  const compactCurrentPathOption =
    pathPreviewElements.strategySelect?.querySelector(
      'option[value="current_path"]',
    );

  const compactNoTopUpOption =
    pathPreviewElements.strategySelect?.querySelector(
      'option[value="no_top_up"]',
    );

  if (compactCurrentPathOption) {
    compactCurrentPathOption.hidden = isSelfEmployed;
  }

  if (compactNoTopUpOption) {
    compactNoTopUpOption.hidden = !isSelfEmployed;
  }

  if (pathPreviewElements.strategySelect) {
    pathPreviewElements.strategySelect.value = selectedRetirementStrategy;
  }

  const inputs = Array.from(
    retirementStrategyOptionsElement?.querySelectorAll(
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
    retirementStrategyStatusElement,
    getRetirementStrategyLabel(selectedRetirementStrategy),
  );

  setText(
    retirementStrategyTargetElement,
    targetAmount > 0 ? formatCurrency(targetAmount) : "—",
  );

  setText(
    retirementStrategyCashTopUpElement,
    strategyUsesCashTopUp(selectedRetirementStrategy)
      ? "Calculated at age 55"
      : "$0",
  );

  setText(
    retirementStrategyFundingResultElement,
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

  setText(retirementStrategyNoteElement, note);

  setText(pathPreviewElements.strategyNote, note);
}

function renderRetirementStrategyResult(rows) {
  const topUpRow = rows.find(function (row) {
    return (
      getNonNegativeNumber(row.retirementStrategyCashTopUp) > 0 ||
      row.retirementStrategyAppliedThisMonth
    );
  });

  const cashTopUp = getNonNegativeNumber(topUpRow?.retirementStrategyCashTopUp);

  setText(
    retirementStrategyCashTopUpElement,
    strategyUsesCashTopUp(selectedRetirementStrategy)
      ? formatCurrency(cashTopUp)
      : "$0",
  );

  if (!strategyUsesCashTopUp(selectedRetirementStrategy)) {
    setText(retirementStrategyFundingResultElement, "No forced cash top-up");

    return;
  }

  if (!topUpRow) {
    setText(
      retirementStrategyFundingResultElement,
      "Applied when age 55 is reached",
    );

    return;
  }

  const target = getNonNegativeNumber(topUpRow.retirementStrategyTarget);

  const funded = getNonNegativeNumber(topUpRow.retirementSumSetAside);

  const shortfall = Math.max(target - funded, 0);

  setText(
    retirementStrategyFundingResultElement,
    shortfall > 0
      ? `${formatCurrency(shortfall)} unfunded`
      : "Target fully funded",
  );
}

/* ========================================
   COLLAPSIBLE ANALYSIS SECTIONS
======================================== */

function handleAnalysisSectionCollapse(event) {
  const button = event.currentTarget;

  const targetId = button.dataset.analysisCollapseTarget;

  const content = document.getElementById(targetId);

  if (!content) {
    return;
  }

  const isCurrentlyExpanded = button.getAttribute("aria-expanded") === "true";

  setAnalysisSectionExpanded({
    button,

    content,

    expanded: !isCurrentlyExpanded,
  });
}

function setAnalysisSectionExpanded({ button, content, expanded }) {
  button.setAttribute("aria-expanded", String(expanded));

  content.hidden = !expanded;

  const label = button.querySelector("span");

  const icon = button.querySelector("i");

  if (label) {
    label.textContent = expanded ? "Hide Section" : "Show Section";
  }

  if (icon) {
    icon.classList.toggle("fa-chevron-up", expanded);

    icon.classList.toggle("fa-chevron-down", !expanded);
  }
}

/* ========================================
   MAIN RENDER
======================================== */

export function renderCostAnalysis() {
  const cpfLifeStartAge = getCpfLifePayoutStartAge();

  if (cpfLifeStartAgeInput) {
    cpfLifeStartAgeInput.value = String(cpfLifeStartAge);
  }

  if (!expenseInflationWasOverridden) {
    syncExpenseInflationDefault();
  }

  const currentCashflow = calculateCurrentMonthlyCashflow();

  renderCurrentMonthlyCashflow(currentCashflow);

  renderYourPathPreview(currentCashflow);

  renderGoalFilter(getGoals());

  const selectedPeriod = getSelectedProjectionPeriod();

  const usesAnnualRows = selectedPeriod !== DEFAULT_PROJECTION_PERIOD;

  const startingDate = getProjectionStartDate();

  const projectionMonths = getProjectionMonthCount(
    selectedPeriod,
    startingDate,
  );

  const cohortFrs = getProjectedCohortFrs();

  const cohortFrsAmount = cohortFrs.isValid ? cohortFrs.amount : 0;

  const retirementStrategyApplicationYear =
    getRetirementStrategyApplicationYear({
      dateOfBirth: getClientProfile().dateOfBirth,

      startingDate,
    });

  renderRetirementStrategySelection({
    cohortFrsAmount,

    strategyApplicationYear: retirementStrategyApplicationYear,
  });

  const projectedCohortBhs = getProjectedCohortBasicHealthcareSum({
    dateOfBirth: getClientProfile().dateOfBirth,
  });

  renderCpfPlanningAssumptions({
    cohortFrs,
    projectedCohortBhs,
  });

  const projectionSettings = {
    currentCashflow,

    annualEmploymentIncrement:
      getNonNegativeNumber(employmentIncrementInput?.value) / 100,

    annualExpenseInflation:
      getNonNegativeNumber(expenseInflationInput?.value) / 100,

    startingDate,

    cohortFrsAmount,

    retirementStrategy: selectedRetirementStrategy,

    retirementStrategyApplicationYear,

    cpfLifeStartAge,
  };

  /*
   * The increment/inflation inputs live on the Detailed Cashflow &
   * CPF Flow page, but their current values still affect the
   * projection behind Part 3 (CPF growth, ending withdrawable
   * balance). Surface them read-only here so the numbers stay
   * explainable without needing to leave Analysis.
   */
  setText(
    pathPreviewElements.incomeIncrementAssumption,
    formatRate(getNonNegativeNumber(employmentIncrementInput?.value)),
  );

  setText(
    pathPreviewElements.expenseInflationAssumption,
    formatRate(getNonNegativeNumber(expenseInflationInput?.value)),
  );

  const monthlyProjection = calculateProjection({
    ...projectionSettings,

    projectionMonths,
  });

  renderCpfLifeProjectionStatus({
    rows: monthlyProjection,
    cpfLifeStartAge,
  });

  const displayRows = usesAnnualRows
    ? aggregateProjectionIntoAnnualRows(monthlyProjection)
    : monthlyProjection;

  renderProjectionPeriodLabels({
    selectedPeriod,
    usesAnnualRows,
  });

  renderCashflowProjectionTable({
    rows: displayRows,
    usesAnnualRows,
  });

  renderCpfProjectionTable({
    rows: displayRows,
    usesAnnualRows,
  });

  const analysisProjectionMonths = getProjectionMonthCount(
    "mortality",
    startingDate,
  );

  const analysisProjection =
    projectionMonths === analysisProjectionMonths
      ? monthlyProjection
      : calculateProjection({
          ...projectionSettings,

          projectionMonths: analysisProjectionMonths,
        });

  /*
   * Use the full mortality-age projection for the strategy
   * result. Otherwise a client who reaches age 55 outside
   * the selected 10-year table would show no top-up result.
   */
  renderRetirementStrategyResult(analysisProjection);

  renderYourPathProjectedPosition({
    rows: analysisProjection,

    cpfLifeStartAge,
  });

  renderYourNextSteps(currentCashflow);
}

/* ========================================
   YOUR PATH OVERVIEW
======================================== */

function renderYourPathPreview(currentCashflow) {
  const summary = getGrossRetirementGoalSummary();

  const assets = getAssets();

  const currentWithdrawableAssets = calculateLiquidAssetTotal(
    assets?.liquidAssets,
  );

  const profile = getClientProfile();

  const currentAge = calculateAgeOnDate(profile.dateOfBirth, new Date());

  const currentCpfSavings = calculateCpfBalanceTotal(assets?.cpf, currentAge);

  /*
   * The starting-position card shows the actual signed
   * monthly surplus. The suggested-plan calculation must
   * not treat a negative surplus as investable.
   */
  const currentMonthlySurplus = getFiniteNumber(
    currentCashflow?.remainingSurplus,
  );

  setText(
    pathPreviewElements.fybcAge,
    summary.desiredFybcAge > 0 ? String(summary.desiredFybcAge) : "—",
  );

  setText(
    pathPreviewElements.yearsRemaining,
    summary.isValid
      ? `${summary.yearsRemaining} ${
          summary.yearsRemaining === 1 ? "year" : "years"
        }`
      : "—",
  );

  setCurrency(pathPreviewElements.monthlyLifestyle, summary.monthlyIncomeToday);

  setCurrency(
    pathPreviewElements.monthlyLifestyleAtFybc,
    summary.monthlyIncomeAtFybc,
  );

  setText(
    pathPreviewElements.lifestyleAtFybcLabel,
    summary.desiredFybcAge > 0
      ? `Estimated Monthly Lifestyle at Age ${summary.desiredFybcAge}`
      : "Estimated Monthly Lifestyle at FYBC",
  );

  setText(
    pathPreviewElements.inflationAssumption,
    summary.isValid
      ? `Assuming ${getNonNegativeNumber(
          summary.inflationRate,
        )}% annual inflation`
      : "Adjusted for annual inflation",
  );

  renderYourPathLifestyleMethodology(summary);

  setCurrency(pathPreviewElements.currentAssets, currentWithdrawableAssets);

  setCurrency(pathPreviewElements.currentCpfSavings, currentCpfSavings);

  setText(
    pathPreviewElements.currentCpfBreakdown,
    formatCurrentCpfBreakdown(assets?.cpf),
  );

  /*
   * Show the signed amount in the starting-position card.
   * This may display a positive or negative value.
   */
  setSignedCurrency(
    pathPreviewElements.affordableAmount,
    currentMonthlySurplus,
  );

  renderYourPathCurrentStatus({
    summary,

    remainingSurplus: currentMonthlySurplus,
  });
}

function renderYourPathLifestyleMethodology(summary) {
  setText(
    pathPreviewElements.methodologyLifestyleToday,
    summary.isValid
      ? `${formatCurrency(summary.monthlyIncomeToday)}/mth`
      : "$0/mth",
  );

  setText(
    pathPreviewElements.methodologyInflation,
    summary.isValid
      ? `${getNonNegativeNumber(summary.inflationRate)}% p.a.`
      : "—",
  );

  setText(
    pathPreviewElements.methodologyFybcLabel,
    summary.desiredFybcAge > 0
      ? `Estimated Lifestyle at Age ${summary.desiredFybcAge}`
      : "Estimated Lifestyle at FYBC",
  );

  setText(
    pathPreviewElements.methodologyLifestyleAtFybc,
    summary.isValid
      ? `${formatCurrency(summary.monthlyIncomeAtFybc)}/mth`
      : "$0/mth",
  );

  setText(
    pathPreviewElements.methodologyPeriod,
    summary.isValid
      ? `From age ${summary.desiredFybcAge} through age ${
          summary.plannedMortalityAge - 1
        }`
      : "From FYBC until the planned mortality age",
  );

  setCurrency(
    pathPreviewElements.lifetimeSpending,
    summary.grossCapitalRequired,
  );
}

function formatCurrentCpfBreakdown(cpf) {
  const oa = getNonNegativeNumber(cpf?.oa);

  const sa = getNonNegativeNumber(cpf?.sa);

  const ra = getNonNegativeNumber(cpf?.ra);

  const ma = getNonNegativeNumber(cpf?.ma);

  const accountParts = [`OA ${formatCurrency(oa)}`];

  /*
   * Ordinarily the client will have either SA or RA.
   * If both contain a balance, show both so the displayed
   * account breakdown still matches the total.
   */
  if (sa > 0 || ra <= 0) {
    accountParts.push(`SA ${formatCurrency(sa)}`);
  }

  if (ra > 0) {
    accountParts.push(`RA ${formatCurrency(ra)}`);
  }

  accountParts.push(`MA ${formatCurrency(ma)}`);

  return accountParts.join(" · ");
}

function renderYourPathCurrentStatus({ summary, remainingSurplus }) {
  const statusElement = pathPreviewElements.currentStatus;

  if (!statusElement) {
    return;
  }

  statusElement.classList.remove(
    "is-positive",
    "is-warning",
    "is-neutral",
    "is-incomplete",
  );

  if (!summary.isValid) {
    statusElement.classList.add("is-incomplete");

    setText(
      statusElement,
      "Complete the Cost of Wants inputs to create your retirement goal.",
    );

    return;
  }

  if (remainingSurplus > 0) {
    statusElement.classList.add("is-positive");

    setText(
      statusElement,
      [
        `${formatCurrency(remainingSurplus)} currently remains each month.`,
        `This surplus may be used for goals, emergency savings`,
        `and long-term investing.`,
      ].join(" "),
    );

    return;
  }

  if (remainingSurplus < 0) {
    statusElement.classList.add("is-warning");

    setText(
      statusElement,
      [
        `Current monthly outflows exceed inflow by`,
        `${formatCurrency(Math.abs(remainingSurplus))}.`,
        `Review the current expenses and commitments before`,
        `setting a long-term investment amount.`,
      ].join(" "),
    );

    return;
  }

  statusElement.classList.add("is-neutral");

  setText(
    statusElement,
    [
      `Current monthly inflow and outflows are equal.`,
      `There is no monthly surplus available yet for`,
      `additional goals or long-term investing.`,
    ].join(" "),
  );
}

/* ========================================
   YOUR PATH — PROJECTED POSITION
======================================== */

function renderYourPathProjectedPosition({ rows, cpfLifeStartAge }) {
  const result = calculateYourPathProjectedPosition({
    rows,

    cpfLifeStartAge,
  });

  latestYourPathProjectedPosition = result.isValid ? result : null;

  if (!result.isValid) {
    renderIncompleteYourPathProjectedPosition();

    return;
  }

  setHidden(pathPreviewElements.projectionIncomplete, true);

  setHidden(pathPreviewElements.projectionResults, false);

  setText(
    pathPreviewElements.projectedPositionTitle,
    `What You’ll Need at FYBC Age ${result.desiredFybcAge}`,
  );

  setText(
    pathPreviewElements.capitalNeededLabel,
    `Capital Needed at FYBC Age ${result.desiredFybcAge}`,
  );

  setCurrency(
    pathPreviewElements.capitalNeededAtFybc,
    result.capitalNeededAtFybc,
  );

  setText(
    pathPreviewElements.capitalNeedBasis,
    [
      `Using ${formatRate(result.postFybcReturnRate)}`,
      `post-FYBC return and recorded retirement income`,
    ].join(" "),
  );

  renderCapitalReductionNote(result);

  renderRecordedIncomeAtFybc(result.recordedIncomeAtFybc);

  setText(
    pathPreviewElements.projectedCpfLifeIncome,
    result.projectedCpfLifeIncome > 0
      ? `${formatCurrency(result.projectedCpfLifeIncome)}/mth`
      : "$0/mth",
  );

  setText(
    pathPreviewElements.projectedCpfLifeBasis,
    result.projectedCpfLifeIncome > 0
      ? `Projected from age ${result.cpfLifeStartAge}`
      : `No CPF LIFE payout currently projected at age ${result.cpfLifeStartAge}`,
  );

  setCurrency(
    pathPreviewElements.grossCapitalAtFybc,
    result.grossLifestyleCapitalAtFybc,
  );

  setCurrency(
    pathPreviewElements.incomeCapitalOffset,
    result.recordedIncomeCapitalOffset,
  );

  setCurrency(pathPreviewElements.netCapitalAtFybc, result.capitalNeededAtFybc);

  setText(
    pathPreviewElements.postFybcReturn,
    formatRate(result.postFybcReturnRate),
  );
}

/*
 * States, in plain terms, why Capital Needed at FYBC is smaller than
 * the undiscounted "Estimated lifetime retirement spending" total from
 * Step 1 — split between post-FYBC investment returns and recorded
 * recurring income already offsetting the target. Uses only figures
 * already computed by calculateYourPathProjectedPosition.
 */
function renderCapitalReductionNote(result) {
  const element = pathPreviewElements.capitalNeedReductionNote;

  if (!element) {
    return;
  }

  const lifetimeSpending = getNonNegativeNumber(
    result.undiscountedLifetimeSpending,
  );

  const capitalNeededAtFybc = getNonNegativeNumber(result.capitalNeededAtFybc);

  const totalReduction = Math.max(lifetimeSpending - capitalNeededAtFybc, 0);

  if (lifetimeSpending <= 0 || totalReduction <= 0) {
    setText(
      element,
      "Reflects post-FYBC investment returns and recorded retirement income.",
    );

    return;
  }

  const grossLifestyleCapitalAtFybc = getNonNegativeNumber(
    result.grossLifestyleCapitalAtFybc,
  );

  const recordedIncomeCapitalOffset = getNonNegativeNumber(
    result.recordedIncomeCapitalOffset,
  );

  const returnsReduction = Math.max(
    lifetimeSpending - grossLifestyleCapitalAtFybc,
    0,
  );

  const recordedMonthlyIncome = getNonNegativeNumber(
    result.recordedIncomeAtFybc?.total,
  );

  const attributionParts = [];

  if (returnsReduction > 0) {
    attributionParts.push(
      `${formatCurrency(returnsReduction)} from post-FYBC investment returns`,
    );
  }

  if (recordedIncomeCapitalOffset > 0) {
    attributionParts.push(
      `${formatCurrency(
        recordedIncomeCapitalOffset,
      )} from ${formatCurrency(
        recordedMonthlyIncome,
      )}/month of recorded income already offsetting the target`,
    );
  }

  const attribution =
    attributionParts.length > 0
      ? attributionParts.join(" and ")
      : "planning assumptions";

  setText(
    element,
    `${formatCurrency(
      totalReduction,
    )} lower than the ${formatCurrency(
      lifetimeSpending,
    )} lifetime spending estimate — ${attribution}.`,
  );
}

function renderRecordedIncomeAtFybc(recordedIncome = {}) {
  const otherIncome = getNonNegativeNumber(recordedIncome.otherIncome);

  const retirementPolicyIncome = getNonNegativeNumber(
    recordedIncome.retirementPolicyIncome,
  );

  const cpfLifeIncome = getNonNegativeNumber(recordedIncome.cpfLifeIncome);

  const total = getNonNegativeNumber(recordedIncome.total);

  setText(
    pathPreviewElements.recordedIncomeAtFybc,
    `${formatCurrency(total)}/mth`,
  );

  const sources = [];

  if (otherIncome > 0) {
    sources.push(`Other income ${formatCurrency(otherIncome)}`);
  }

  if (retirementPolicyIncome > 0) {
    sources.push(`Policy income ${formatCurrency(retirementPolicyIncome)}`);
  }

  if (cpfLifeIncome > 0) {
    sources.push(`CPF LIFE ${formatCurrency(cpfLifeIncome)}`);
  }

  setText(
    pathPreviewElements.recordedIncomeAtFybcBasis,
    sources.length > 0
      ? sources.join(" · ")
      : "No recorded monthly income active at FYBC",
  );
}

function calculateYourPathProjectedPosition({ rows, cpfLifeStartAge }) {
  const summary = getGrossRetirementGoalSummary();

  if (!summary.isValid || !Array.isArray(rows)) {
    return createInvalidProjectedPosition();
  }

  const fybcRowIndex = rows.findIndex(function (row) {
    return row.fybcReachedThisMonth;
  });

  if (fybcRowIndex < 0) {
    return createInvalidProjectedPosition();
  }

  const fybcRow = rows[fybcRowIndex];

  const recordedIncomeAtFybc = {
    otherIncome: getNonNegativeNumber(fybcRow.cashflowBreakdown?.otherIncome),

    retirementPolicyIncome: getRetirementPolicyIncomeForRow(fybcRow),

    cpfLifeIncome: getNonNegativeNumber(fybcRow.cpfLifeCashInflow),
  };

  recordedIncomeAtFybc.total =
    recordedIncomeAtFybc.otherIncome +
    recordedIncomeAtFybc.retirementPolicyIncome +
    recordedIncomeAtFybc.cpfLifeIncome;

  const retirementRows = rows.slice(fybcRowIndex).filter(function (row) {
    return getFiniteNumber(row.age) < summary.plannedMortalityAge;
  });

  if (retirementRows.length === 0) {
    return createInvalidProjectedPosition();
  }

  const postFybcReturnRate = getNonNegativeNumber(getPostFybcReturnRate());

  const monthlyReturnRate = convertAnnualRateToMonthly(postFybcReturnRate);

  const monthlyInflationRate = convertAnnualRateToMonthly(
    summary.inflationRate,
  );

  let grossLifestyleCapitalAtFybc = 0;

  let capitalNeededAtFybc = 0;

  let otherIncomeCapitalOffset = 0;

  let retirementPolicyCapitalOffset = 0;

  let cpfLifeCapitalOffset = 0;

  retirementRows.forEach(function (row, monthIndex) {
    const discountFactor = Math.pow(1 + monthlyReturnRate, monthIndex);

    const lifestyleNeeded =
      summary.monthlyIncomeAtFybc *
      Math.pow(1 + monthlyInflationRate, monthIndex);

    const continuingOtherIncome = getNonNegativeNumber(
      row.cashflowBreakdown?.otherIncome,
    );

    const retirementPolicyIncome = getRetirementPolicyIncomeForRow(row);

    const cpfLifeIncome = getNonNegativeNumber(row.cpfLifeCashInflow);

    const recordedRecurringIncome =
      continuingOtherIncome + retirementPolicyIncome + cpfLifeIncome;

    /*
     * If total recorded income exceeds the lifestyle
     * required that month, only the amount actually
     * offsetting the lifestyle should be counted.
     *
     * Allocate that usable amount proportionally across
     * the active income sources.
     */
    const usableIncomeRatio =
      recordedRecurringIncome > 0
        ? Math.min(lifestyleNeeded / recordedRecurringIncome, 1)
        : 0;

    const usableOtherIncome = continuingOtherIncome * usableIncomeRatio;

    const usableRetirementPolicyIncome =
      retirementPolicyIncome * usableIncomeRatio;

    const usableCpfLifeIncome = cpfLifeIncome * usableIncomeRatio;

    const usableRecordedIncome =
      usableOtherIncome + usableRetirementPolicyIncome + usableCpfLifeIncome;

    const amountFundedFromCapital = Math.max(
      lifestyleNeeded - usableRecordedIncome,
      0,
    );

    grossLifestyleCapitalAtFybc += lifestyleNeeded / discountFactor;

    otherIncomeCapitalOffset += usableOtherIncome / discountFactor;

    retirementPolicyCapitalOffset +=
      usableRetirementPolicyIncome / discountFactor;

    cpfLifeCapitalOffset += usableCpfLifeIncome / discountFactor;

    capitalNeededAtFybc += amountFundedFromCapital / discountFactor;
  });

  const recordedIncomeCapitalOffset =
    otherIncomeCapitalOffset +
    retirementPolicyCapitalOffset +
    cpfLifeCapitalOffset;

  const projectedWithdrawableAssets = getFiniteNumber(
    fybcRow.endWithdrawableBalance,
  );

  /*
   * A BRS, FRS or ERS strategy draws its cash top-up from the same
   * withdrawable balance Next Steps lets the client opt into as a
   * resource. There is at most one such event in the whole projection
   * (either immediately, for a client already 55+, or at the month
   * age 55 is reached). Record its amount AND month index rather than
   * just a dollar total, because a top-up years away should be
   * discounted back to today before being netted out of today's
   * withdrawable assets — subtracting a future nominal amount from a
   * today balance would mix time frames.
   */
  const retirementStrategyTopUpRowIndex = rows
    .slice(0, fybcRowIndex + 1)
    .findIndex(function (row) {
      return getNonNegativeNumber(row.retirementStrategyCashTopUp) > 0;
    });

  const retirementStrategyTopUp =
    retirementStrategyTopUpRowIndex >= 0
      ? {
          amount: getNonNegativeNumber(
            rows[retirementStrategyTopUpRowIndex].retirementStrategyCashTopUp,
          ),

          monthIndex: retirementStrategyTopUpRowIndex,
        }
      : null;

  const maturityResult = calculateFutureMaturityPresentValue({
    rows,

    fybcRowIndex,

    monthlyReturnRate,

    plannedMortalityAge: summary.plannedMortalityAge,
  });

  const eligibleOaResult = calculateEligibleOaForRetirement({
    rows,

    fybcRowIndex,

    monthlyReturnRate,
  });

  if (!eligibleOaResult.canInclude) {
    includeProjectedOa = false;
  }

  const includedOaPresentValue =
    eligibleOaResult.canInclude && includeProjectedOa
      ? eligibleOaResult.presentValueAtFybc
      : 0;

  const projectedResourcesAtFybc =
    projectedWithdrawableAssets +
    maturityResult.presentValueAtFybc +
    includedOaPresentValue;

  const remainingFundingGap = Math.max(
    capitalNeededAtFybc - projectedResourcesAtFybc,
    0,
  );

  const projectedFundingSurplus = Math.max(
    projectedResourcesAtFybc - capitalNeededAtFybc,
    0,
  );

  const fundingProgressPercent =
    capitalNeededAtFybc > 0
      ? (Math.max(projectedResourcesAtFybc, 0) / capitalNeededAtFybc) * 100
      : 0;

  const cpfLifeStartRow = rows.find(function (row) {
    return (
      row.cpfLifeProjectionStatus === "started" &&
      getNonNegativeNumber(row.cpfLifeMonthlyPayout) > 0
    );
  });

  return {
    isValid: true,

    desiredFybcAge: summary.desiredFybcAge,

    monthsToFybc: fybcRowIndex,

    plannedMortalityAge: summary.plannedMortalityAge,

    monthlyIncomeAtFybc: summary.monthlyIncomeAtFybc,

    retirementFundingMonths: retirementRows.length,

    postFybcReturnRate,

    recordedIncomeAtFybc,

    /*
     * The undiscounted "Estimated lifetime retirement spending"
     * total from Cost of Wants (Step 1). Already computed above
     * via getGrossRetirementGoalSummary() — reused here, not
     * recalculated, so the capital-reduction note stays consistent
     * with the Step 1 figure.
     */
    undiscountedLifetimeSpending: summary.grossCapitalRequired,

    grossLifestyleCapitalAtFybc,

    recordedIncomeCapitalOffset,

    otherIncomeCapitalOffset,

    retirementPolicyCapitalOffset,

    cpfLifeCapitalOffset,

    capitalNeededAtFybc,

    projectedWithdrawableAssets,

    futureMaturityPresentValue: maturityResult.presentValueAtFybc,

    futureMaturityCount: maturityResult.count,

    eligibleOaAmount: eligibleOaResult.amountAtAvailability,

    eligibleOaPresentValue: eligibleOaResult.presentValueAtFybc,

    eligibleOaAvailabilityAge: eligibleOaResult.availabilityAge,

    eligibleOaHousingReserve: eligibleOaResult.housingReserve,

    canIncludeEligibleOa: eligibleOaResult.canInclude,

    includedOaPresentValue,

    projectedResourcesAtFybc,

    remainingFundingGap,

    projectedFundingSurplus,

    fundingProgressPercent,

    cpfLifeStartAge,

    projectedCpfLifeIncome: getNonNegativeNumber(
      cpfLifeStartRow?.cpfLifeMonthlyPayout,
    ),

    retirementStrategyTopUp,
  };
}

function calculateFutureMaturityPresentValue({
  rows,
  fybcRowIndex,
  monthlyReturnRate,
  plannedMortalityAge,
}) {
  let presentValueAtFybc = 0;

  let count = 0;

  rows.slice(fybcRowIndex + 1).forEach(function (row, index) {
    if (getFiniteNumber(row.age) >= plannedMortalityAge) {
      return;
    }

    const maturityAmount = getEndowmentMaturityForRow(row);

    if (maturityAmount <= 0) {
      return;
    }

    const monthsAfterFybc = index + 1;

    presentValueAtFybc +=
      maturityAmount / Math.pow(1 + monthlyReturnRate, monthsAfterFybc);

    count += 1;
  });

  return {
    presentValueAtFybc,

    count,
  };
}

function calculateEligibleOaForRetirement({
  rows,
  fybcRowIndex,
  monthlyReturnRate,
}) {
  const fybcRow = rows[fybcRowIndex];

  const fybcIsAtLeast55 = getFiniteNumber(fybcRow?.age) >= 55;

  const availabilityRowIndex = fybcIsAtLeast55
    ? fybcRowIndex
    : rows.findIndex(function (row, index) {
        return index >= fybcRowIndex && row.retirementAccount === "ra";
      });

  if (availabilityRowIndex < 0) {
    return createUnavailableOaResult();
  }

  const availabilityRow = rows[availabilityRowIndex];

  if (!availabilityRow.hasMetCohortFrs) {
    return {
      ...createUnavailableOaResult(),

      availabilityAge: getFiniteNumber(availabilityRow.age),
    };
  }

  /*
   * The OA balance on the availability row already
   * reflects housing repayments up to that month.
   *
   * Reserve every recorded OA housing repayment
   * after that month so the same OA is not used for
   * both housing and retirement.
   */
  const housingReserve = rows.slice(availabilityRowIndex + 1).reduce(function (
    total,
    row,
  ) {
    return total + getNonNegativeNumber(row.oaOutflow);
  }, 0);

  const amountAtAvailability = Math.max(
    getNonNegativeNumber(availabilityRow.oaBalance) - housingReserve,
    0,
  );

  const monthsAfterFybc = Math.max(availabilityRowIndex - fybcRowIndex, 0);

  const presentValueAtFybc =
    amountAtAvailability / Math.pow(1 + monthlyReturnRate, monthsAfterFybc);

  return {
    canInclude: amountAtAvailability > 0,

    amountAtAvailability,

    presentValueAtFybc,

    availabilityAge: getFiniteNumber(availabilityRow.age),

    housingReserve,
  };
}

function getEndowmentMaturityForRow(row) {
  return (row?.policyCashInflowItems || []).reduce(function (total, item) {
    if (item.policyType !== "endowment" || !item.maturedThisMonth) {
      return total;
    }

    return total + getNonNegativeNumber(item.amount);
  }, 0);
}

function renderIncompleteYourPathProjectedPosition() {
  latestYourPathProjectedPosition = null;

  setHidden(pathPreviewElements.projectionIncomplete, false);

  setHidden(pathPreviewElements.projectionResults, true);

  includeProjectedOa = false;

  if (pathPreviewElements.includeOaInput) {
    pathPreviewElements.includeOaInput.checked = false;

    pathPreviewElements.includeOaInput.disabled = true;
  }
}

function handleCapitalMethodologyClick(event) {
  const breakdownType = event.currentTarget.dataset.capitalBreakdown;

  if (!latestYourPathProjectedPosition) {
    return;
  }

  renderCapitalMethodologyBreakdown(
    breakdownType,
    latestYourPathProjectedPosition,
  );
}

function renderCapitalMethodologyBreakdown(breakdownType, result) {
  if (!projectionBreakdownModal || !projectionBreakdownContent) {
    return;
  }

  projectionBreakdownContent.replaceChildren();

  if (breakdownType === "lifestyle") {
    renderLifestyleCapitalBreakdown(result);
  } else if (breakdownType === "income") {
    renderIncomeCapitalBreakdown(result);
  } else if (breakdownType === "capital") {
    renderNetCapitalBreakdown(result);
  } else {
    return;
  }

  openModal(projectionBreakdownModal);
}

function renderLifestyleCapitalBreakdown(result) {
  setText(projectionBreakdownTitle, "Lifestyle Capital");

  setText(
    projectionBreakdownSubtitle,
    "The estimated value at FYBC of the client's desired monthly lifestyle.",
  );

  appendCapitalBreakdownSection({
    heading: "Lifestyle assumptions",

    rows: [
      {
        label: "Monthly income needed at FYBC",
        value: `${formatCurrency(result.monthlyIncomeAtFybc)}/mth`,
      },
      {
        label: "Planned funding period",
        value: `${result.retirementFundingMonths} months`,
      },
      {
        label: "Planned mortality age",
        value: `Age ${result.plannedMortalityAge}`,
      },
      {
        label: "Post-FYBC return",
        value: formatRate(result.postFybcReturnRate),
      },
    ],

    totalLabel: "Lifestyle capital before recorded income",

    totalValue: result.grossLifestyleCapitalAtFybc,
  });
}

function renderIncomeCapitalBreakdown(result) {
  const income = result.recordedIncomeAtFybc || {};

  setText(projectionBreakdownTitle, "Recorded Retirement Income");

  setText(
    projectionBreakdownSubtitle,
    "Income may start at different ages. The monthly figures show what is active at FYBC, while the capital values include income received later in retirement.",
  );

  appendMonthlyIncomeAtFybcSection(income);

  appendCapitalIncomeOffsetSection(result);
}

function appendMonthlyIncomeAtFybcSection(income) {
  const section = document.createElement("section");

  section.className = "projection-breakdown-section";

  const heading = document.createElement("h3");

  heading.textContent = "Monthly income active at FYBC";

  section.append(heading);

  appendCapitalDisplayRow({
    section,

    label: "Other monthly income",

    value: `${formatCurrency(income.otherIncome)}/mth`,
  });

  appendCapitalDisplayRow({
    section,

    label: "Retirement-policy income",

    value: `${formatCurrency(income.retirementPolicyIncome)}/mth`,
  });

  appendCapitalDisplayRow({
    section,

    label: "CPF LIFE income",

    value: `${formatCurrency(income.cpfLifeIncome)}/mth`,
  });

  appendCapitalDisplayRow({
    section,

    label: "Total income active at FYBC",

    value: `${formatCurrency(income.total)}/mth`,
  });

  projectionBreakdownContent.append(section);
}

function appendCapitalIncomeOffsetSection(result) {
  const section = document.createElement("section");

  section.className = "projection-breakdown-section";

  const heading = document.createElement("h3");

  heading.textContent = "Capital value across retirement";

  section.append(heading);

  appendCapitalDisplayRow({
    section,

    label: "Other monthly income",

    value: formatCurrency(result.otherIncomeCapitalOffset),
  });

  appendCapitalDisplayRow({
    section,

    label: "Retirement-policy income",

    value: formatCurrency(result.retirementPolicyCapitalOffset),
  });

  appendCapitalDisplayRow({
    section,

    label: "CPF LIFE after it starts",

    value: formatCurrency(result.cpfLifeCapitalOffset),
  });

  projectionBreakdownContent.append(section);

  const total = document.createElement("div");

  total.className = "projection-breakdown-total";

  const totalLabel = document.createElement("strong");

  totalLabel.textContent = "Capital value of all recorded retirement income";

  const totalValue = document.createElement("strong");

  totalValue.textContent = formatCurrency(result.recordedIncomeCapitalOffset);

  total.append(totalLabel, totalValue);

  projectionBreakdownContent.append(total);
}

function appendCapitalDisplayRow({ section, label, value }) {
  const row = document.createElement("div");

  row.className = "projection-breakdown-row";

  const labelElement = document.createElement("span");

  labelElement.textContent = label;

  const valueElement = document.createElement("strong");

  valueElement.textContent = value;

  row.append(labelElement, valueElement);

  section.append(row);
}

function renderNetCapitalBreakdown(result) {
  setText(projectionBreakdownTitle, "Capital Needed at FYBC");

  setText(
    projectionBreakdownSubtitle,
    "Lifestyle capital less the value of recurring income received during retirement.",
  );

  appendCapitalBreakdownSection({
    heading: "Capital calculation",

    rows: [
      {
        label: "Lifestyle capital before recorded income",

        value: formatCurrency(result.grossLifestyleCapitalAtFybc),
      },
      {
        label: "Less: value of recorded retirement income",

        value: `-${formatCurrency(result.recordedIncomeCapitalOffset)}`,
      },
    ],

    totalLabel: "Capital needed at FYBC",

    totalValue: result.capitalNeededAtFybc,
  });
}

function appendCapitalBreakdownSection({
  heading,
  rows,
  totalLabel,
  totalValue,
}) {
  const section = document.createElement("section");

  section.className = "projection-breakdown-section";

  const title = document.createElement("h3");

  title.textContent = heading;

  section.append(title);

  rows.forEach(function (row) {
    const detailRow = document.createElement("div");

    detailRow.className = "projection-breakdown-row";

    const label = document.createElement("span");

    label.textContent = row.label;

    const value = document.createElement("strong");

    value.textContent = row.value;

    detailRow.append(label, value);

    section.append(detailRow);
  });

  projectionBreakdownContent.append(section);

  const total = document.createElement("div");

  total.className = "projection-breakdown-total";

  const totalLabelElement = document.createElement("strong");

  totalLabelElement.textContent = totalLabel;

  const totalValueElement = document.createElement("strong");

  totalValueElement.textContent = formatCurrency(totalValue);

  total.append(totalLabelElement, totalValueElement);

  projectionBreakdownContent.append(total);
}

/* ========================================
   YOUR NEXT STEPS
======================================== */

function renderYourNextSteps(currentCashflow) {
  const position = latestYourPathProjectedPosition;

  if (!position?.isValid) {
    renderIncompleteNextSteps();
    return;
  }

  const availableMonthly = Math.max(
    getFiniteNumber(currentCashflow?.remainingSurplus),
    0,
  );

  const monthsToFybc = Math.max(getNonNegativeNumber(position.monthsToFybc), 0);

  const growthRate = getNextStepsGrowthRate();

  const currentAssets = calculateLiquidAssetTotal(getAssets()?.liquidAssets);

  /*
   * A BRS, FRS or ERS strategy draws its cash top-up from this same
   * withdrawable balance before FYBC, but not necessarily today — for
   * a client below 55 it happens at the future month RA forms. Until
   * then the balance keeps growing under the same Pre-FYBC Growth
   * Assumption used elsewhere on this card, so the top-up must be
   * discounted back to today's dollars (at that same rate) before
   * being netted out of today's balance. Subtracting the future
   * nominal top-up directly would understate what is genuinely still
   * available today.
   */
  const topUpReservedFromAssets = Math.min(
    currentAssets,
    calculateLumpSumPresentValue({
      amount: position.retirementStrategyTopUp?.amount,

      months: position.retirementStrategyTopUp?.monthIndex,

      annualRatePercent: growthRate,
    }),
  );

  const availableCurrentAssets = Math.max(
    currentAssets - topUpReservedFromAssets,
    0,
  );

  const includeCurrentAssets = Boolean(
    nextStepsElements.includeAssetsInput?.checked,
  );

  if (nextStepsElements.assetsAmountInput) {
    nextStepsElements.assetsAmountInput.disabled = !includeCurrentAssets;

    nextStepsElements.assetsAmountInput.max = String(
      Math.round(availableCurrentAssets),
    );
  }

  let selectedCurrentAssets = includeCurrentAssets
    ? getNonNegativeNumber(nextStepsElements.assetsAmountInput?.value)
    : 0;

  /*
   * Never allow the client to allocate more than their withdrawable
   * assets actually still available after the CPF top-up reservation.
   */
  selectedCurrentAssets = Math.min(selectedCurrentAssets, availableCurrentAssets);

  if (includeCurrentAssets && nextStepsElements.assetsAmountInput) {
    nextStepsElements.assetsAmountInput.value = String(
      Math.round(selectedCurrentAssets),
    );
  }

  const projectedCurrentAssets = calculateLumpSumFutureValue({
    amount: selectedCurrentAssets,

    months: monthsToFybc,

    annualRatePercent: growthRate,
  });

  setText(
    nextStepsElements.assetsReservedNote,
    topUpReservedFromAssets > 0
      ? `${formatCurrency(
          topUpReservedFromAssets,
        )} reserved for the selected CPF retirement strategy's cash top-up`
      : "",
  );

  setHidden(nextStepsElements.assetsReservedNote, topUpReservedFromAssets <= 0);

  setHidden(
    nextStepsElements.assetsProjectedRow,
    !(includeCurrentAssets && selectedCurrentAssets > 0),
  );

  setCurrency(nextStepsElements.assetsProjectedAtFybc, projectedCurrentAssets);

  const investmentPolicyGrowthRate = getInvestmentPolicyGrowthRate();

  const investmentPoliciesAtFybc = calculateInvestmentPolicyValueAtFybc({
    desiredFybcAge: position.desiredFybcAge,

    annualGrowthRatePercent: investmentPolicyGrowthRate,
  });

  const endowmentValueAtFybc = calculateEndowmentValueAtFybc({
    desiredFybcAge: position.desiredFybcAge,

    plannedMortalityAge: position.plannedMortalityAge,

    preFybcGrowthRate: growthRate,

    postFybcReturnRate: position.postFybcReturnRate,
  });

  const eligibleOaAtFybc = position.canIncludeEligibleOa
    ? getNonNegativeNumber(position.eligibleOaPresentValue)
    : 0;

  /*
   * These four numbers show what is AVAILABLE.
   * They are not automatically counted.
   */
  setCurrency(nextStepsElements.availableAssets, availableCurrentAssets);

  setCurrency(nextStepsElements.investmentPolicies, investmentPoliciesAtFybc);

  setCurrency(nextStepsElements.endowmentValue, endowmentValueAtFybc);

  setCurrency(nextStepsElements.eligibleOa, eligibleOaAtFybc);

  if (nextStepsElements.includeOaInput) {
    nextStepsElements.includeOaInput.disabled = !position.canIncludeEligibleOa;

    if (!position.canIncludeEligibleOa) {
      nextStepsElements.includeOaInput.checked = false;
    }
  }

  const selectedResources = getSelectedNextStepResources({
    projectedCurrentAssets,

    investmentPoliciesAtFybc,

    endowmentValueAtFybc,

    eligibleOaAtFybc,
  });

  const capitalNeeded = getNonNegativeNumber(position.capitalNeededAtFybc);

  /*
   * This is the amount the monthly savings plan
   * still needs to build after resources explicitly
   * selected by the client.
   */
  const capitalStillToBuild = Math.max(capitalNeeded - selectedResources, 0);

  const suggestedMonthly = calculateRequiredMonthlyContribution({
    targetFutureValue: capitalStillToBuild,

    months: monthsToFybc,

    annualRatePercent: growthRate,
  });

  const chosenMonthly = getChosenMonthlyCommitment(availableMonthly);

  const projectedMonthlyCommitment = calculateMonthlyContributionFutureValue({
    monthlyAmount: chosenMonthly,

    months: monthsToFybc,

    annualRatePercent: growthRate,
  });

  const projectedFunding = selectedResources + projectedMonthlyCommitment;

  const remainingGap = Math.max(capitalNeeded - projectedFunding, 0);

  const fundingSurplus = Math.max(projectedFunding - capitalNeeded, 0);

  const fundingProgress =
    capitalNeeded > 0 ? (projectedFunding / capitalNeeded) * 100 : 0;

  const remainingFlexibility = availableMonthly - chosenMonthly;

  setCurrency(nextStepsElements.suggestedMonthly, suggestedMonthly);

  setCurrency(nextStepsElements.availableMonthly, availableMonthly);

  setCurrency(nextStepsElements.chosenMonthly, chosenMonthly);

  setSignedCurrency(
    nextStepsElements.flexibilityRemaining,
    remainingFlexibility,
  );

  setCurrency(nextStepsElements.capitalNeeded, capitalNeeded);

  setCurrency(nextStepsElements.selectedResources, selectedResources);

  setCurrency(
    nextStepsElements.monthlyCommitmentValue,
    projectedMonthlyCommitment,
  );

  setCurrency(nextStepsElements.projectedFunding, projectedFunding);

  setCurrency(nextStepsElements.remainingGap, remainingGap);

  renderNextStepsMonthlyInput({
    chosenMonthly,

    availableMonthly,
  });

  renderNextStepsFundingProgress({
    remainingGap,

    fundingSurplus,

    fundingProgress,
  });

  renderNextStepsCommitmentMessage({
    chosenMonthly,

    availableMonthly,

    suggestedMonthly,

    remainingGap,
  });
}

function getSelectedNextStepResources({
  projectedCurrentAssets,
  investmentPoliciesAtFybc,
  endowmentValueAtFybc,
  eligibleOaAtFybc,
}) {
  let total = 0;

  if (nextStepsElements.includeAssetsInput?.checked) {
    total += projectedCurrentAssets;
  }

  if (nextStepsElements.includeInvestmentPoliciesInput?.checked) {
    total += investmentPoliciesAtFybc;
  }

  if (nextStepsElements.includeEndowmentInput?.checked) {
    total += endowmentValueAtFybc;
  }

  if (
    nextStepsElements.includeOaInput?.checked &&
    !nextStepsElements.includeOaInput?.disabled
  ) {
    total += eligibleOaAtFybc;
  }

  return total;
}

/* ========================================
   MONTHLY COMMITMENT
======================================== */

function getChosenMonthlyCommitment(availableMonthly) {
  const selectedInput = monthlyCommitmentInputs.find(function (input) {
    return input.checked;
  });

  if (!selectedInput) {
    return 0;
  }

  if (selectedInput.value === "custom") {
    return getNonNegativeNumber(nextStepsElements.monthlyAmountInput?.value);
  }

  const percentage = getNonNegativeNumber(selectedInput.value) / 100;

  return availableMonthly * percentage;
}

function renderNextStepsMonthlyInput({ chosenMonthly, availableMonthly }) {
  const selectedInput = monthlyCommitmentInputs.find(function (input) {
    return input.checked;
  });

  const isCustom = selectedInput?.value === "custom";

  if (!nextStepsElements.monthlyAmountInput) {
    return;
  }

  nextStepsElements.monthlyAmountInput.readOnly = !isCustom;

  if (!isCustom) {
    nextStepsElements.monthlyAmountInput.value = String(
      Math.round(chosenMonthly),
    );
  }

  nextStepsElements.monthlyAmountInput.max = String(
    Math.max(Math.round(availableMonthly), 0),
  );
}

function renderNextStepsCommitmentMessage({
  chosenMonthly,
  availableMonthly,
  suggestedMonthly,
  remainingGap,
}) {
  if (!nextStepsElements.commitmentMessage) {
    return;
  }

  if (availableMonthly <= 0) {
    setText(
      nextStepsElements.commitmentMessage,
      "There is currently no positive monthly surplus to allocate. Review the current cashflow before setting a long-term monthly amount.",
    );

    return;
  }

  if (chosenMonthly > availableMonthly) {
    setText(
      nextStepsElements.commitmentMessage,
      [
        `This plan uses ${formatCurrency(chosenMonthly)} per month,`,
        `which is ${formatCurrency(
          chosenMonthly - availableMonthly,
        )} above the current monthly surplus.`,
      ].join(" "),
    );

    return;
  }

  if (remainingGap <= 0) {
    setText(
      nextStepsElements.commitmentMessage,
      "Based on the selected resources and monthly amount, the current plan reaches the estimated capital target.",
    );

    return;
  }

  if (chosenMonthly < suggestedMonthly) {
    setText(
      nextStepsElements.commitmentMessage,
      [
        `You have chosen ${formatCurrency(chosenMonthly)} per month.`,
        `The current estimate suggests about`,
        `${formatCurrency(suggestedMonthly)} per month`,
        `would be needed to fully close the remaining target by FYBC.`,
      ].join(" "),
    );

    return;
  }

  setText(
    nextStepsElements.commitmentMessage,
    "This monthly amount is within the client's current surplus and is being included in the FYBC projection.",
  );
}

/* ========================================
   ACCUMULATION MATH
======================================== */

function calculateRequiredMonthlyContribution({
  targetFutureValue,
  months,
  annualRatePercent,
}) {
  const target = getNonNegativeNumber(targetFutureValue);

  const safeMonths = Math.floor(getNonNegativeNumber(months));

  if (target <= 0 || safeMonths <= 0) {
    return 0;
  }

  const monthlyRate = convertAnnualRateToMonthly(annualRatePercent);

  if (monthlyRate <= 0) {
    return target / safeMonths;
  }

  const accumulationFactor =
    (Math.pow(1 + monthlyRate, safeMonths) - 1) / monthlyRate;

  if (accumulationFactor <= 0) {
    return 0;
  }

  return target / accumulationFactor;
}

function calculateMonthlyContributionFutureValue({
  monthlyAmount,
  months,
  annualRatePercent,
}) {
  const amount = getNonNegativeNumber(monthlyAmount);

  const safeMonths = Math.floor(getNonNegativeNumber(months));

  if (amount <= 0 || safeMonths <= 0) {
    return 0;
  }

  const monthlyRate = convertAnnualRateToMonthly(annualRatePercent);

  if (monthlyRate <= 0) {
    return amount * safeMonths;
  }

  return (amount * (Math.pow(1 + monthlyRate, safeMonths) - 1)) / monthlyRate;
}

function calculateLumpSumFutureValue({ amount, months, annualRatePercent }) {
  const safeAmount = getNonNegativeNumber(amount);

  const safeMonths = getNonNegativeNumber(months);

  if (safeAmount <= 0) {
    return 0;
  }

  const monthlyRate = convertAnnualRateToMonthly(annualRatePercent);

  return safeAmount * Math.pow(1 + monthlyRate, safeMonths);
}

function calculateLumpSumPresentValue({ amount, months, annualRatePercent }) {
  const safeAmount = getNonNegativeNumber(amount);

  const safeMonths = getNonNegativeNumber(months);

  if (safeAmount <= 0) {
    return 0;
  }

  const monthlyRate = convertAnnualRateToMonthly(annualRatePercent);

  return safeAmount / Math.pow(1 + monthlyRate, safeMonths);
}

function getNextStepsGrowthRate() {
  if (!nextStepsElements.growthRateInput) {
    return DEFAULT_PRE_FYBC_GROWTH_RATE;
  }

  return getNonNegativeNumber(nextStepsElements.growthRateInput.value);
}

/* ========================================
   FUNDING PROGRESS
======================================== */

function renderNextStepsFundingProgress({
  remainingGap,
  fundingSurplus,
  fundingProgress,
}) {
  const displayedProgress = Math.max(0, Math.min(fundingProgress, 100));

  setText(
    nextStepsElements.fundingProgressLabel,
    `${Math.round(displayedProgress)}%`,
  );

  if (nextStepsElements.fundingProgressBar) {
    nextStepsElements.fundingProgressBar.style.width = `${displayedProgress}%`;
  }

  if (remainingGap > 0) {
    setText(
      nextStepsElements.fundingStatus,
      [
        `This plan is estimated to cover`,
        `${Math.round(
          Math.max(0, Math.min(fundingProgress, 100)),
        )}% of your goal.`,
        `${formatCurrency(remainingGap)}`,
        `remains to be planned for.`,
      ].join(" "),
    );

    return;
  }

  setText(
    nextStepsElements.fundingStatus,
    fundingSurplus > 0
      ? [
          `The selected plan currently exceeds`,
          `the estimated target by`,
          `${formatCurrency(fundingSurplus)}.`,
        ].join(" ")
      : "The selected plan currently reaches the estimated FYBC capital target.",
  );
}

function renderIncompleteNextSteps() {
  [
    nextStepsElements.suggestedMonthly,
    nextStepsElements.availableMonthly,
    nextStepsElements.chosenMonthly,
    nextStepsElements.availableAssets,
    nextStepsElements.investmentPolicies,
    nextStepsElements.endowmentValue,
    nextStepsElements.eligibleOa,
    nextStepsElements.capitalNeeded,
    nextStepsElements.selectedResources,
    nextStepsElements.monthlyCommitmentValue,
    nextStepsElements.projectedFunding,
    nextStepsElements.remainingGap,
  ].forEach(function (element) {
    setText(element, "—");
  });

  setText(nextStepsElements.fundingProgressLabel, "0%");

  if (nextStepsElements.fundingProgressBar) {
    nextStepsElements.fundingProgressBar.style.width = "0%";
  }

  setText(
    nextStepsElements.fundingStatus,
    "Complete the retirement target first to build a suggested plan.",
  );

  setHidden(nextStepsElements.assetsReservedNote, true);

  setHidden(nextStepsElements.assetsProjectedRow, true);
}

/* ========================================
   INVESTMENT POLICY VALUE AT FYBC
======================================== */

function calculateInvestmentPolicyValueAtFybc({
  desiredFybcAge,
  annualGrowthRatePercent,
}) {
  const policies = getPolicies();

  const profile = getClientProfile();

  const fybcDate = getAgeMonthDate(profile.dateOfBirth, desiredFybcAge);

  if (!Array.isArray(policies) || !fybcDate) {
    return 0;
  }

  return policies.reduce(function (total, policy) {
        if (policy?.policyType !== "ilp_accumulation") {
          return total;
        }

    const accumulation = policy.accumulation || {};

    const projectedValue = getNonNegativeNumber(
      accumulation.projectedPolicyValue,
    );

    const projectedAtAge = getNonNegativeNumber(accumulation.projectedAtAge);

    /*
     * Priority 1:
     * If the insurer already provides a projection
     * specifically for the client's FYBC age,
     * use that value directly.
     */
    if (
      projectedValue > 0 &&
      projectedAtAge === getNonNegativeNumber(desiredFybcAge)
    ) {
      return total + projectedValue;
    }

    /*
     * Priority 2:
     * Otherwise project the recorded current
     * policy value from its actual valuation date
     * until the client's FYBC date.
     */
    const currentPolicyValue = getNonNegativeNumber(
      accumulation.currentPolicyValue,
    );

    if (currentPolicyValue <= 0) {
      return total;
    }

    const valueAsOfDate = parsePlanningYearMonth(accumulation.valueAsOf);

    if (!valueAsOfDate || valueAsOfDate > fybcDate) {
      return total;
    }

    const monthsFromValuationToFybc = getWholeMonthsBetween(
      valueAsOfDate,
      fybcDate,
    );

    const estimatedValue = calculateLumpSumFutureValue({
      amount: currentPolicyValue,

      months: monthsFromValuationToFybc,

      annualRatePercent: annualGrowthRatePercent,
    });

    return total + estimatedValue;
  }, 0);
}

function getInvestmentPolicyGrowthRate() {
  const enteredRate = Number(
    nextStepsElements.investmentGrowthRateInput?.value,
  );

  if (Number.isFinite(enteredRate) && enteredRate >= 0) {
    return enteredRate;
  }

  return DEFAULT_INVESTMENT_POLICY_GROWTH_RATE;
}

/* ========================================
   ENDOWMENT VALUE AT FYBC
======================================== */

function calculateEndowmentValueAtFybc({
  desiredFybcAge,
  plannedMortalityAge,
  preFybcGrowthRate,
  postFybcReturnRate,
}) {
  const policies = getPolicies();

  const profile = getClientProfile();

  const fybcDate = getAgeMonthDate(profile.dateOfBirth, desiredFybcAge);

  const mortalityDate = getAgeMonthDate(
    profile.dateOfBirth,
    plannedMortalityAge,
  );

  if (!fybcDate || !mortalityDate || !Array.isArray(policies)) {
    return 0;
  }

  const currentDate = getProjectionStartDate();

  return policies.reduce(function (total, policy) {
    if (policy?.policyType !== "endowment") {
      return total;
    }

    const maturityDate = parsePlanningYearMonth(policy.endowment?.maturityDate);

    if (
      !maturityDate ||
      maturityDate < currentDate ||
      maturityDate >= mortalityDate
    ) {
      return total;
    }

    const maturityAmount =
      getNonNegativeNumber(policy.endowment?.guaranteedMaturityAmount) +
      getNonNegativeNumber(policy.endowment?.projectedNonGuaranteedAmount);

    if (maturityAmount <= 0) {
      return total;
    }

    /*
     * Matures before FYBC:
     * assume the selected proceeds remain invested
     * until FYBC.
     */
    if (maturityDate <= fybcDate) {
      const monthsToFybc = getWholeMonthsBetween(maturityDate, fybcDate);

      return (
        total +
        calculateLumpSumFutureValue({
          amount: maturityAmount,

          months: monthsToFybc,

          annualRatePercent: preFybcGrowthRate,
        })
      );
    }

    /*
     * Matures after FYBC:
     * convert the future maturity into its
     * FYBC-equivalent present value.
     */
    const monthsAfterFybc = getWholeMonthsBetween(fybcDate, maturityDate);

    const monthlyReturnRate = convertAnnualRateToMonthly(postFybcReturnRate);

    return (
      total + maturityAmount / Math.pow(1 + monthlyReturnRate, monthsAfterFybc)
    );
  }, 0);
}

function getAgeMonthDate(dateOfBirth, targetAge) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth || "");

  const age = getNonNegativeNumber(targetAge);

  if (!match || age <= 0) {
    return null;
  }

  return new Date(Number(match[1]) + age, Number(match[2]) - 1, 1);
}

function parsePlanningYearMonth(value) {
  const match = /^(\d{4})-(\d{2})/.exec(value || "");

  if (!match) {
    return null;
  }

  const year = Number(match[1]);

  const month = Number(match[2]) - 1;

  if (!Number.isFinite(year) || month < 0 || month > 11) {
    return null;
  }

  return new Date(year, month, 1);
}

function getWholeMonthsBetween(fromDate, toDate) {
  return Math.max(
    0,
    (toDate.getFullYear() - fromDate.getFullYear()) * MONTHS_PER_YEAR +
      toDate.getMonth() -
      fromDate.getMonth(),
  );
}

function createInvalidProjectedPosition() {
  return {
    isValid: false,
  };
}

function createUnavailableOaResult() {
  return {
    canInclude: false,

    amountAtAvailability: 0,

    presentValueAtFybc: 0,

    availabilityAge: 0,

    housingReserve: 0,
  };
}

function convertAnnualRateToMonthly(annualRatePercent) {
  const annualRate = getNonNegativeNumber(annualRatePercent) / 100;

  return Math.pow(1 + annualRate, 1 / MONTHS_PER_YEAR) - 1;
}

function formatRate(value) {
  const safeRate = getNonNegativeNumber(value);

  return `${safeRate.toFixed(1)}% p.a.`;
}

function setHidden(element, hidden) {
  if (element) {
    element.hidden = hidden;
  }
}

function getRetirementPolicyIncomeForRow(row) {
  return (row?.policyCashInflowItems || []).reduce(function (total, item) {
    if (item.policyType !== "retirement") {
      return total;
    }

    return total + getNonNegativeNumber(item.amount);
  }, 0);
}

/* ========================================
   CURRENT MONTHLY CASHFLOW
======================================== */

function calculateCurrentMonthlyCashflow() {
  const assets = getAssets();

  const profile = getClientProfile();

  const liabilities = getLiabilities();

  const income = assets.income || {};

  const now = new Date();

  const age = calculateAgeOnDate(profile.dateOfBirth, now);

  const incomeSummary = calculateIncomeSummary({
    monthlyEmploymentIncome: income.monthlyEmployment,

    annualBonus: income.annualBonus,

    annualNetTradeIncome: income.annualNetTradeIncome,

    netPlatformEarnings: income.netPlatformEarnings,

    sepMedisaveOverrideEnabled: income.sepMedisaveOverrideEnabled,

    sepMedisaveOverrideAmount: income.sepMedisaveOverrideAmount,

    monthlyOtherIncome: income.otherMonthly,

    employmentStatus: profile.employmentStatus,

    age,

    ageAtStartOfWorkYear: calculateAgeOnDate(
      profile.dateOfBirth,

      new Date(now.getFullYear(), 0, 1),
    ),
  });

  const isSelfEmployed = profile.employmentStatus === "self_employed";

  const employmentIncome = incomeSummary.monthlyEmploymentIncome;

  const annualBonus = getNonNegativeNumber(income.annualBonus);

  const annualNetTradeIncome = incomeSummary.annualNetTradeIncome;

  const otherMonthlyIncome = incomeSummary.monthlyOtherIncome;

  const currentPolicyCashInflow = getPolicyCashInflow({
    projectionDate: now,

    dateOfBirth: profile.dateOfBirth,
  });

  const retirementPolicyIncome = currentPolicyCashInflow.items
    .filter(function (item) {
      return item.policyType === "retirement";
    })
    .reduce(function (total, item) {
      return total + item.amount;
    }, 0);

  const employmentIncomeAfterCpf =
    employmentIncome - incomeSummary.monthlyEmployeeCpf;

  const annualBonusAfterCpf =
    annualBonus - incomeSummary.annualAdditionalWageEmployeeCpf;

  const monthlyBonusAfterCpf = annualBonusAfterCpf / 12;

  const totalMonthlyIncome = isSelfEmployed
    ? incomeSummary.monthlyTakeHomeIncome + retirementPolicyIncome
    : employmentIncomeAfterCpf +
      monthlyBonusAfterCpf +
      otherMonthlyIncome +
      retirementPolicyIncome;

  const monthlyExpenses = calculateTotalMonthlyExpenses(getExpenses());

  const monthlyCashCommitments = calculateMonthlyCashCommitments(liabilities);

  const monthlyInsurancePremiums = getEffectiveMonthlyInsurancePremium();

  const monthlyCommitments = monthlyCashCommitments + monthlyInsurancePremiums;

  const remainingSurplus =
    totalMonthlyIncome - monthlyExpenses - monthlyCommitments;

  return {
    employmentIncome,

    annualBonus,

    annualNetTradeIncome,

    otherMonthlyIncome,

    retirementPolicyIncome,

    isSelfEmployed,

    monthlyNetTradeIncome: incomeSummary.monthlyNetTradeIncome,

    annualSepMedisaveContribution: incomeSummary.annualSepMedisaveContribution,

    monthlySepMedisaveContribution:
      incomeSummary.monthlySepMedisaveContribution,

    employmentIncomeAfterCpf,

    annualBonusAfterCpf,

    monthlyBonusAfterCpf,

    totalMonthlyIncome,

    monthlyExpenses,

    monthlyCommitments,

    remainingSurplus,
  };
}

function renderCurrentMonthlyCashflow(cashflow) {
  setText(
    cashflowDescriptionElement,

    cashflow.isSelfEmployed
      ? "A snapshot of the client's current monthly income and outflows in today's value. Mandatory MediSave contributions are deducted from self-employed income. Trade-income increments and expense inflation are applied only in the projections below."
      : "A snapshot of the client's current monthly income and outflows in today's value. Employment and bonus income are shown after employee CPF contributions. Employment increments and expense inflation are applied only in the projections below.",
  );

  setText(
    incomeIncrementLabel,

    cashflow.isSelfEmployed
      ? "Annual Net Trade Income Increment"
      : "Annual Employment & Bonus Increment",
  );

  setText(
    primaryIncomeLabel,

    cashflow.isSelfEmployed
      ? "Monthly Net Trade Income"
      : "Employment Income After CPF",
  );

  setText(
    contributionIncomeLabel,

    cashflow.isSelfEmployed
      ? "Mandatory MediSave Contribution"
      : "Annual Bonus After CPF",
  );

  setCurrency(
    employmentIncomeElement,

    cashflow.isSelfEmployed
      ? cashflow.monthlyNetTradeIncome
      : cashflow.employmentIncomeAfterCpf,
  );

  setText(
    bonusIncomeElement,

    cashflow.isSelfEmployed
      ? `-${formatCurrency(
          cashflow.annualSepMedisaveContribution,
        )}/year · -${formatCurrency(
          cashflow.monthlySepMedisaveContribution,
        )}/month`
      : `${formatCurrency(
          cashflow.annualBonusAfterCpf,
        )}/year · ${formatCurrency(cashflow.monthlyBonusAfterCpf)}/month`,
  );

  setCurrency(otherIncomeElement, cashflow.otherMonthlyIncome);

  setCurrency(retirementPolicyIncomeElement, cashflow.retirementPolicyIncome);

  setCurrency(totalMonthlyIncomeElement, cashflow.totalMonthlyIncome);

  setText(
    monthlyExpensesElement,

    `-${formatCurrency(cashflow.monthlyExpenses)}`,
  );

  setText(
    monthlyCommitmentsElement,

    `-${formatCurrency(cashflow.monthlyCommitments)}`,
  );

  setSignedCurrency(
    remainingSurplusElement,

    cashflow.remainingSurplus,
  );
}

/* ========================================
   GOAL PROJECTION FILTER
======================================== */

function renderGoalFilter(goals) {
  if (!goalFilterOptions) {
    return;
  }

  goalFilterOptions.replaceChildren();

  removeMissingGoalExclusions(goals);

  if (!Array.isArray(goals) || goals.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.className = "analysis-goal-filter-empty";

    emptyMessage.textContent = "No current goals have been added.";

    goalFilterOptions.append(emptyMessage);

    if (selectAllGoalsButton) {
      selectAllGoalsButton.hidden = true;
    }

    return;
  }

  if (selectAllGoalsButton) {
    selectAllGoalsButton.hidden = false;
  }

  const fragment = document.createDocumentFragment();

  goals.forEach(function (goal, index) {
    const goalId = getProjectionGoalId(goal, index);

    const label = document.createElement("label");

    label.className = "analysis-goal-filter-option";

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.value = goalId;
    checkbox.checked = !excludedProjectionGoalIds.has(goalId);

    const marker = document.createElement("span");

    marker.className = "analysis-goal-filter-checkbox";

    const details = document.createElement("span");

    details.className = "analysis-goal-filter-details";

    const name = document.createElement("strong");

    name.textContent = goal?.name || "Goal";

    const amount = document.createElement("small");

    amount.textContent = formatCurrency(
      getNonNegativeNumber(goal?.targetAmount),
    );

    details.append(name, amount);

    label.append(checkbox, marker, details);

    fragment.append(label);
  });

  goalFilterOptions.append(fragment);
}

function handleGoalFilterChange(event) {
  const checkbox = event.target.closest('input[type="checkbox"]');

  if (!checkbox) {
    return;
  }

  if (checkbox.checked) {
    excludedProjectionGoalIds.delete(checkbox.value);
  } else {
    excludedProjectionGoalIds.add(checkbox.value);
  }

  renderCostAnalysis();
}

function handleSelectAllGoals() {
  excludedProjectionGoalIds.clear();

  renderCostAnalysis();
}

function removeMissingGoalExclusions(goals) {
  const currentGoalIds = new Set(
    goals.map(function (goal, index) {
      return getProjectionGoalId(goal, index);
    }),
  );

  excludedProjectionGoalIds.forEach(function (goalId) {
    if (!currentGoalIds.has(goalId)) {
      excludedProjectionGoalIds.delete(goalId);
    }
  });
}

function getProjectionGoalId(goal, index) {
  return String(goal?.id || `projection-goal-${index}`);
}

function isGoalIncludedInProjection(goal, index) {
  return !excludedProjectionGoalIds.has(getProjectionGoalId(goal, index));
}

/* ========================================
   CPF PLANNING ASSUMPTIONS
======================================== */

function renderCpfPlanningAssumptions({ cohortFrs, projectedCohortBhs }) {
  if (cohortFrs?.isValid) {
    setCurrency(projectedFrsElement, cohortFrs.amount);

    const frsBasisLabel =
      cohortFrs.basis === "official"
        ? [
            `Confirmed CPF Retirement Sum`,
            `for age 55 in`,
            cohortFrs.yearTurning55,
          ].join(" ")
        : [
            `Projected for age 55 in`,
            cohortFrs.yearTurning55,
            `using`,
            `${cohortFrs.annualGrowthRate}%`,
            `annual growth`,
          ].join(" ");

    setText(projectedFrsBasisElement, frsBasisLabel);
  } else {
    setText(projectedFrsElement, "—");

    setText(projectedFrsBasisElement, "Complete the Client Profile");
  }

  if (projectedCohortBhs?.isValid) {
    setCurrency(projectedCohortBhsElement, projectedCohortBhs.amount);

    const cohortBhsBasisLabel = projectedCohortBhs.isProjected
      ? [
          `Projected for age 65 in`,
          projectedCohortBhs.yearTurning65,
          `using`,
          `${BHS_PROJECTION_GROWTH_RATE}%`,
          `annual growth, rounded to $500.`,
          `Fixed from`,
          projectedCohortBhs.yearTurning65,
          `onward.`,
        ].join(" ")
      : [
          `Confirmed cohort BHS for age 65 in`,
          projectedCohortBhs.yearTurning65,
          `. Fixed for life.`,
        ].join(" ");

    setText(projectedCohortBhsBasisElement, cohortBhsBasisLabel);
  } else {
    setText(projectedCohortBhsElement, "—");

    setText(projectedCohortBhsBasisElement, "Complete the Client Profile");
  }
}

function renderCpfLifeProjectionStatus({ rows, cpfLifeStartAge }) {
  const eventRow = rows.find(function (row) {
    return (
      (row.cpfLifeProjectionStatus === "started" &&
        row.cpfLifePremiumOutflow > 0) ||
      row.cpfLifeProjectionStatus === "insufficient"
    );
  });

  if (!eventRow) {
    setText(cpfLifePremiumElement, "—");

    setText(cpfLifePayoutElement, "—");

    setText(
      cpfLifeProjectionStatusElement,
      `The selected projection does not reach age ${cpfLifeStartAge}.`,
    );

    return;
  }

  if (eventRow.cpfLifeProjectionStatus === "insufficient") {
    setCurrency(cpfLifePremiumElement, eventRow.affordableCpfLifePremium);

    setCurrency(cpfLifePayoutElement, 0);

    setText(
      cpfLifeProjectionStatusElement,
      `Projected RA at age ${cpfLifeStartAge} is below the ` +
        `${formatCurrency(
          MINIMUM_AUTOMATIC_CPF_LIFE_PREMIUM,
        )} automatic-inclusion threshold. ` +
        `No CPF LIFE premium or cash payout is applied.`,
    );

    return;
  }

  setCurrency(cpfLifePremiumElement, eventRow.cpfLifePremiumOutflow);

  setText(
    cpfLifePayoutElement,
    `${formatCurrency(eventRow.cpfLifeMonthlyPayout)}/mth`,
  );

  setText(
    cpfLifeProjectionStatusElement,
    `The premium is limited to the projected RA balance ` +
      `available at age ${cpfLifeStartAge}. The estimated ` +
      `Standard Plan payout is added to cashflow from that month.`,
  );
}

/* ========================================
   PROJECTION ENGINE
======================================== */

function calculateProjection({
  currentCashflow,
  annualEmploymentIncrement,
  annualExpenseInflation,
  projectionMonths,
  startingDate,
  cohortFrsAmount,
  retirementStrategy,
  retirementStrategyApplicationYear,
  cpfLifeStartAge,
}) {
  const assets = getAssets();

  const profile = getClientProfile();

  const desiredFybcAge = getDesiredFybcAge();

  const normalisedRetirementStrategy = normaliseRetirementStrategy(
    retirementStrategy,
    profile.employmentStatus,
  );

  const retirementStrategyTarget = getRetirementStrategyTarget({
    strategy: normalisedRetirementStrategy,

    cohortFrsAmount,

    strategyApplicationYear: retirementStrategyApplicationYear,
  });

  const shouldUseStrategyCashTopUp = strategyUsesCashTopUp(
    normalisedRetirementStrategy,
  );

  const goals = getGoals();

  const liabilities = getLiabilities();

  let withdrawableBalance = calculateLiquidAssetTotal(assets.liquidAssets);

  let oaBalance = getNonNegativeNumber(assets.cpf?.oa);

  let saBalance = getNonNegativeNumber(assets.cpf?.sa);

  let raBalance = getNonNegativeNumber(assets.cpf?.ra);

  let maBalance = getNonNegativeNumber(assets.cpf?.ma);

  const startingAge = calculateAgeOnDate(profile.dateOfBirth, startingDate);

  /*
   * If the client is already 55, preserve the
   * entered balances because they should already
   * represent their actual post-55 CPF position.
   */
  let raHasBeenFormed = startingAge !== null && startingAge >= 55;

  /*
   * Keep the amount already set aside for retirement
   * separate from the visible RA balance.
   *
   * When the CPF LIFE premium leaves RA, it must not
   * reopen FRS room and redirect later employment
   * contributions back into RA.
   */
  let retirementSumSetAside = raHasBeenFormed
    ? Math.min(raBalance, Math.max(cohortFrsAmount, retirementStrategyTarget))
    : 0;

  const pendingCpfInterest = {
    oa: 0,
    sa: 0,
    ra: 0,
    ma: 0,
  };

  const rows = [];

  let cpfLifeHasStarted = false;

  let activeCpfLifeMonthlyPayout = 0;

  for (let monthIndex = 0; monthIndex < projectionMonths; monthIndex += 1) {
    const projectionDate = addMonths(startingDate, monthIndex);

    const startingCpfBalances = {
      oa: oaBalance,
      sa: saBalance,
      ra: raBalance,
      ma: maBalance,
    };

    const completedYears = Math.max(
      projectionDate.getFullYear() - startingDate.getFullYear(),
      0,
    );

    const salaryGrowthFactor = Math.pow(
      1 + annualEmploymentIncrement,
      completedYears,
    );

    const hasReachedFybc = hasReachedTargetAgeMonth({
      dateOfBirth: profile.dateOfBirth,

      projectionDate,

      targetAge: desiredFybcAge,
    });

    const projectedEmploymentIncome = hasReachedFybc
      ? 0
      : currentCashflow.employmentIncome * salaryGrowthFactor;

    const projectedAnnualBonus = hasReachedFybc
      ? 0
      : currentCashflow.annualBonus * salaryGrowthFactor;

    const projectedAnnualNetTradeIncome = hasReachedFybc
      ? 0
      : currentCashflow.annualNetTradeIncome * salaryGrowthFactor;

    const age = calculateAgeOnDate(profile.dateOfBirth, projectionDate);

    const displayedAge = calculateAgeAtEndOfMonth(
      profile.dateOfBirth,
      projectionDate,
    );

    const isAge55TransitionMonth = isBirthdayAgeMonth({
      dateOfBirth: profile.dateOfBirth,

      projectionDate,

      targetAge: 55,
    });

    const fybcReachedThisMonth = isTargetAgeMonth({
      dateOfBirth: profile.dateOfBirth,

      projectionDate,

      targetAge: desiredFybcAge,
    });

    const projectedIncome = calculateProjectedIncome({
      monthlyEmploymentIncome: projectedEmploymentIncome,

      annualBonus: projectedAnnualBonus,

      annualNetTradeIncome: projectedAnnualNetTradeIncome,

      netPlatformEarnings: hasReachedFybc
        ? 0
        : getNonNegativeNumber(assets.income?.netPlatformEarnings) *
          salaryGrowthFactor,

      sepMedisaveOverrideEnabled: assets.income?.sepMedisaveOverrideEnabled,

      sepMedisaveOverrideAmount: assets.income?.sepMedisaveOverrideAmount,

      otherMonthlyIncome:
        !hasReachedFybc ||
        assets.income?.otherMonthlyContinuesAfterFybc !== false
          ? currentCashflow.otherMonthlyIncome
          : 0,

      employmentStatus: profile.employmentStatus,

      age,

      ageAtStartOfWorkYear: calculateAgeOnDate(
        profile.dateOfBirth,

        new Date(projectionDate.getFullYear(), 0, 1),
      ),
    });

    const expenseGrowthFactor = Math.pow(
      1 + annualExpenseInflation,
      completedYears,
    );

    const monthlyExpenses =
      currentCashflow.monthlyExpenses * expenseGrowthFactor;

    const activeCashCommitments = calculateActiveMonthlyCashCommitments(
      liabilities,
      projectionDate,
    );

    const insurancePremiums =
      getEffectiveMonthlyInsurancePremium(projectionDate);

    const monthlyCommitments = activeCashCommitments + insurancePremiums;

    const policyCashInflow = getPolicyCashInflow({
      projectionDate,

      dateOfBirth: profile.dateOfBirth,
    });

    const operatingCashflowBeforeCpfLife =
      projectedIncome.monthlyTakeHomeIncome +
      projectedIncome.monthlyBonusAfterCpf +
      projectedIncome.monthlyOtherIncome -
      monthlyExpenses -
      monthlyCommitments +
      policyCashInflow.total;

    const goalsDue = getGoalsDueInMonth(goals, projectionDate);

    const bigTicketOutflow = goalsDue.reduce(function (total, goal) {
      return total + getNonNegativeNumber(goal.targetAmount);
    }, 0);

    const startWithdrawableBalance = withdrawableBalance;

    const employeeCpfInflow =
      projectedIncome.monthlyTotalCpfContribution +
      projectedIncome.monthlyBonusTotalCpf;

    const totalCpfInflow =
      employeeCpfInflow + projectedIncome.monthlySepMedisaveContribution;

    const allocationRates = getCpfAllocationRates(age);

    let oaInflow = employeeCpfInflow * allocationRates.oaRate;

    const retirementInflow = employeeCpfInflow * allocationRates.retirementRate;

    const originalMaInflow =
      employeeCpfInflow * allocationRates.maRate +
      projectedIncome.monthlySepMedisaveContribution;

    /*
     * Monthly projections treat the client's birthday month
     * as the age-transition month. This ensures RA is formed
     * in June 2044 for a client born on 15 June 1989, rather
     * than one month late in July.
     */
    const hasReachedAge55 = hasReachedTargetAgeMonth({
      dateOfBirth: profile.dateOfBirth,

      projectionDate,

      targetAge: 55,
    });

    let frsMetAt55 = false;

    /*
     * Form RA once in the month the client
     * reaches age 55.
     *
     * SA is transferred first, followed by OA.
     * Any remaining SA after meeting FRS moves
     * into OA because SA no longer remains the
     * displayed retirement account.
     */
    let retirementStrategyCashTopUp = 0;

    let retirementStrategyAppliedThisMonth = false;

    /*
     * If the client is already 55 or older, their entered RA
     * represents the current post-55 position.
     *
     * Apply an explicitly selected BRS, FRS or ERS cash
     * top-up in the first projection month. Do not transfer
     * OA automatically because RA has already been formed.
     */
    if (raHasBeenFormed && monthIndex === 0 && shouldUseStrategyCashTopUp) {
      retirementStrategyAppliedThisMonth = true;

      const remainingTarget = Math.max(retirementStrategyTarget - raBalance, 0);

      const availableWithdrawableCash = Math.max(withdrawableBalance, 0);

      retirementStrategyCashTopUp = Math.min(
        remainingTarget,
        availableWithdrawableCash,
      );

      raBalance += retirementStrategyCashTopUp;

      retirementSumSetAside = Math.max(
        retirementSumSetAside,
        Math.min(raBalance, cohortFrsAmount),
      );
    }

    if (hasReachedAge55 && !raHasBeenFormed) {
      retirementStrategyAppliedThisMonth = true;

      /*
       * Fund the selected retirement target using:
       *
       * 1. SA
       * 2. OA
       * 3. Available withdrawable cash, but only for the
       *    explicit BRS, FRS and ERS scenarios.
       */
      const remainingTargetBeforeSa = Math.max(
        retirementStrategyTarget - raBalance,
        0,
      );

      const saTransferredToRa = Math.min(saBalance, remainingTargetBeforeSa);

      raBalance += saTransferredToRa;
      saBalance -= saTransferredToRa;

      const remainingTargetBeforeOa = Math.max(
        retirementStrategyTarget - raBalance,
        0,
      );

      const oaTransferredToRa = Math.min(oaBalance, remainingTargetBeforeOa);

      raBalance += oaTransferredToRa;
      oaBalance -= oaTransferredToRa;

      /*
       * SA closes when RA is formed. Any SA remaining after
       * the selected retirement target is met moves to OA.
       */
      oaBalance += saBalance;
      saBalance = 0;

      if (shouldUseStrategyCashTopUp) {
        const remainingTargetBeforeCash = Math.max(
          retirementStrategyTarget - raBalance,
          0,
        );

        const availableWithdrawableCash = Math.max(withdrawableBalance, 0);

        retirementStrategyCashTopUp = Math.min(
          remainingTargetBeforeCash,
          availableWithdrawableCash,
        );

        raBalance += retirementStrategyCashTopUp;
      }

      pendingCpfInterest.ra += pendingCpfInterest.sa;

      pendingCpfInterest.sa = 0;

      raHasBeenFormed = true;

      retirementSumSetAside = Math.max(
        retirementSumSetAside,
        Math.min(raBalance, cohortFrsAmount),
      );

      /*
       * This indicator continues to use the actual cohort
       * FRS—not the selected BRS or ERS strategy.
       */
      frsMetAt55 =
        cohortFrsAmount > 0 && retirementSumSetAside >= cohortFrsAmount - 0.5;
    }

    let cpfLifePremiumOutflow = 0;

    let targetCpfLifePremium = 0;

    let affordableCpfLifePremium = 0;

    /*
     * Preserve the RA balance immediately before
     * the CPF LIFE premium is deducted.
     */
    let raBalanceBeforeCpfLife = 0;

    let cpfLifeProjectionStatus = cpfLifeHasStarted ? "started" : "not_started";

    let cpfLifeStartedThisMonth = false;

    if (
      !cpfLifeHasStarted &&
      isCpfLifeStartMonth({
        dateOfBirth: profile.dateOfBirth,
        projectionDate,
        cpfLifeStartAge,
      })
    ) {
      /*
       * Capture the balance before CPF LIFE removes
       * the affordable premium from RA.
       */
      raBalanceBeforeCpfLife = raBalance;

      targetCpfLifePremium = calculateTargetCpfLifePremium({
        cohortFrsAmount: retirementStrategyTarget,

        cpfLifeStartAge,
      });

      affordableCpfLifePremium = Math.min(raBalance, targetCpfLifePremium);

      if (affordableCpfLifePremium >= MINIMUM_AUTOMATIC_CPF_LIFE_PREMIUM) {
        cpfLifePremiumOutflow = affordableCpfLifePremium;

        raBalance -= cpfLifePremiumOutflow;

        activeCpfLifeMonthlyPayout = calculateProjectedCpfLifePayout({
          cpfLifePremium: cpfLifePremiumOutflow,

          gender: profile.gender,
        });

        cpfLifeHasStarted = true;

        cpfLifeStartedThisMonth = true;

        cpfLifeProjectionStatus = "started";
      } else {
        cpfLifeProjectionStatus = "insufficient";
      }
    }

    /*
     * Apply the BHS applicable for this month.
     * Opening MA is preserved. Only new MA
     * allocation is restricted by the limit.
     */
    const applicableBhs = getApplicableBasicHealthcareSum({
      dateOfBirth: profile.dateOfBirth,
      projectionDate,
    });

    const bhsAmount = applicableBhs.isValid
      ? applicableBhs.amount
      : Number.POSITIVE_INFINITY;

    const availableMaCapacity = Math.max(bhsAmount - maBalance, 0);

    const maInflow = Math.min(originalMaInflow, availableMaCapacity);

    const maOverflow = Math.max(originalMaInflow - maInflow, 0);

    /*
     * Before 55:
     * - normal retirement allocation goes to SA
     * - MA overflow also goes to SA
     *
     * From 55:
     * - retirement allocation and MA overflow
     *   fill RA up to cohort FRS
     * - remaining excess goes to OA
     */
    if (!hasReachedAge55) {
      saBalance += retirementInflow + maOverflow;
    } else {
      const amountAvailableForRa = retirementInflow + maOverflow;

      /*
       * Normal CPF contributions continue filling RA only
       * until the client's cohort FRS has been set aside.
       *
       * The selected retirement strategy (BRS / FRS / ERS)
       * is a planning choice and must not change the normal
       * CPF contribution-routing rule.
       */
      const remainingRaCapacity = Math.max(
        cohortFrsAmount - retirementSumSetAside,
        0,
      );

      const amountDirectedToRa = Math.min(
        amountAvailableForRa,
        remainingRaCapacity,
      );

      const amountRedirectedToOa = amountAvailableForRa - amountDirectedToRa;

      raBalance += amountDirectedToRa;
      retirementSumSetAside += amountDirectedToRa;
      oaInflow += amountRedirectedToOa;
    }

    const oaOutflow = calculateActiveMonthlyCpfCommitments(
      liabilities,
      projectionDate,
    );

    oaBalance = Math.max(0, oaBalance + oaInflow - oaOutflow);

    const availableMaBalance = maBalance + maInflow;

    const monthlyInsuranceMedisaveOutflow =
      getMonthlyInsuranceMedisaveOutflow(projectionDate);

    const maInsuranceOutflow = Math.min(
      monthlyInsuranceMedisaveOutflow,
      availableMaBalance,
    );

    maBalance = Math.max(0, availableMaBalance - maInsuranceOutflow);

    const monthlyCpfInterest = calculateMonthlyCpfInterest({
      age,

      oaBalance,
      saBalance,
      raBalance,
      maBalance,
    });

    pendingCpfInterest.oa += monthlyCpfInterest.creditedInterest.oa;

    pendingCpfInterest.sa += monthlyCpfInterest.creditedInterest.sa;

    pendingCpfInterest.ra += monthlyCpfInterest.creditedInterest.ra;

    pendingCpfInterest.ma += monthlyCpfInterest.creditedInterest.ma;

    let cpfInterestCredited = 0;

    /*
     * CPF interest is accumulated monthly and
     * credited in December.
     */
    if (projectionDate.getMonth() === 11) {
      oaBalance += pendingCpfInterest.oa;

      saBalance += pendingCpfInterest.sa;

      raBalance += pendingCpfInterest.ra;

      retirementSumSetAside = Math.max(
        retirementSumSetAside,
        Math.min(raBalance, cohortFrsAmount),
      );

      /*
       * MA interest is credited only up to the
       * applicable BHS. Excess follows the same
       * BHS overflow routing used by contributions.
       */
      const maInterestCapacity = Math.max(bhsAmount - maBalance, 0);

      const maInterestCredited = Math.min(
        pendingCpfInterest.ma,
        maInterestCapacity,
      );

      const maInterestOverflow = Math.max(
        pendingCpfInterest.ma - maInterestCredited,
        0,
      );

      maBalance += maInterestCredited;

      if (maInterestOverflow > 0) {
        if (!hasReachedAge55) {
          /*
           * Before age 55, MA interest above the
           * applicable BHS flows into SA.
           *
           * Do not cap this using the client's future
           * cohort FRS. FRS only becomes relevant when
           * RA is formed at age 55.
           */
          saBalance += maInterestOverflow;
        } else {
          /*
           * From age 55, excess MA interest flows into
           * RA until the client's cohort FRS has been
           * fully set aside.
           *
           * Any remaining excess flows into OA.
           */
          const remainingRaCapacity = Math.max(
            cohortFrsAmount - retirementSumSetAside,
            0,
          );

          const overflowToRa = Math.min(
            maInterestOverflow,
            remainingRaCapacity,
          );

          const overflowToOa = maInterestOverflow - overflowToRa;

          raBalance += overflowToRa;
          retirementSumSetAside += overflowToRa;
          oaBalance += overflowToOa;
        }
      }

      cpfInterestCredited =
        pendingCpfInterest.oa +
        pendingCpfInterest.sa +
        pendingCpfInterest.ra +
        pendingCpfInterest.ma;

      pendingCpfInterest.oa = 0;
      pendingCpfInterest.sa = 0;
      pendingCpfInterest.ra = 0;
      pendingCpfInterest.ma = 0;
    }

    const retirementAccount = hasReachedAge55 ? "ra" : "sa";

    const cpfLifeCashInflow = cpfLifeHasStarted
      ? activeCpfLifeMonthlyPayout
      : 0;

    const operatingCashflow =
      operatingCashflowBeforeCpfLife + cpfLifeCashInflow;

    const netMovement =
      operatingCashflow - bigTicketOutflow - retirementStrategyCashTopUp;

    const goalOutflowItems = goalsDue.map(function (goal) {
      return {
        goalId: goal.id || "",

        goalName: goal.name || "Goal",

        amount: getNonNegativeNumber(goal.targetAmount),
      };
    });

    const cashflowBreakdown = {
      takeHomeIncome: projectedIncome.monthlyTakeHomeIncome,

      bonusIncome: projectedIncome.monthlyBonusAfterCpf,

      otherIncome: projectedIncome.monthlyOtherIncome,

      cpfLifeIncome: cpfLifeCashInflow,

      expenses: monthlyExpenses,

      liabilities: activeCashCommitments,

      insurancePremiums,

      retirementStrategyCashTopUp,
    };

    const cashflowEvents = createCashflowEvents({
      policyItems: policyCashInflow.items,

      goalItems: goalOutflowItems,

      cpfLifeStartedThisMonth,

      cpfLifeCashInflow,

      retirementStrategyCashTopUp,

      retirementStrategy: normalisedRetirementStrategy,
    });

    withdrawableBalance = startWithdrawableBalance + netMovement;

    const accountNetFlows = {
      oa: oaBalance - startingCpfBalances.oa,

      sa: saBalance - startingCpfBalances.sa,

      ra: raBalance - startingCpfBalances.ra,

      ma: maBalance - startingCpfBalances.ma,
    };

    const netCpf =
      accountNetFlows.oa +
      accountNetFlows.sa +
      accountNetFlows.ra +
      accountNetFlows.ma;

    const displayedRetirementBalance =
      retirementAccount === "ra" ? raBalance : saBalance;

    /*
     * This remains true after the age-55 transition when the
     * client's cohort FRS has been fully set aside.
     *
     * It is deliberately separate from frsMetAt55, which only
     * identifies the month in which FRS was first met.
     */
    const hasMetCohortFrs =
      cohortFrsAmount > 0 && retirementSumSetAside >= cohortFrsAmount - 0.5;

    rows.push({
      date: projectionDate,

      age: displayedAge,

      fybcReachedThisMonth,

      frsMetAt55,

      hasMetCohortFrs,

      retirementStrategy: normalisedRetirementStrategy,

      retirementStrategyTarget,

      retirementStrategyCashTopUp,

      retirementStrategyAppliedThisMonth,

      retirementSumSetAside,

      startWithdrawableBalance,

      operatingCashflow,

      netMovement,

      cashflowBreakdown,

      cashflowEvents,

      policyCashInflow: policyCashInflow.total,

      policyCashInflowItems: policyCashInflow.items,

      bigTicketOutflow,

      goalOutflowItems,

      endWithdrawableBalance: withdrawableBalance,

      cpfInflow: totalCpfInflow,

      cpfInterestCredited,

      oaOutflow,

      /*
       * There are currently no routine withdrawals
       * from SA or RA. These fields are retained so
       * the combined outflow column can support them
       * later without another table redesign.
       */
      saOutflow: 0,

      raOutflow: cpfLifePremiumOutflow,

      maInsuranceOutflow,

      accountNetFlows,

      netCpf,

      cpfLifeCashInflow,

      cpfLifePremiumOutflow,

      raBalanceBeforeCpfLife,

      targetCpfLifePremium,

      affordableCpfLifePremium,

      cpfLifeMonthlyPayout: activeCpfLifeMonthlyPayout,

      cpfLifeProjectionStatus,

      oaBalance,

      retirementAccount,

      retirementBalance: displayedRetirementBalance,

      maBalance,

      applicableBhs: applicableBhs.isValid ? applicableBhs.amount : 0,

      bhsBasis: applicableBhs.basis,

      bhsIsLocked: applicableBhs.isLocked,

      goalNames: goalsDue.map(function (goal) {
        return goal.name || "Goal";
      }),
    });
  }

  return rows;
}

function calculateTargetCpfLifePremium({ cohortFrsAmount, cpfLifeStartAge }) {
  const safeFrs = getNonNegativeNumber(cohortFrsAmount);

  const compoundingYears = Math.max(getFiniteNumber(cpfLifeStartAge) - 55, 0);

  return safeFrs * Math.pow(1 + CPF_RA_INTEREST_RATE / 100, compoundingYears);
}

function isCpfLifeStartMonth({ dateOfBirth, projectionDate, cpfLifeStartAge }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth || "")) {
    return false;
  }

  const birthYear = Number(dateOfBirth.slice(0, 4));

  const birthMonth = Number(dateOfBirth.slice(5, 7)) - 1;

  return (
    projectionDate.getFullYear() === birthYear + cpfLifeStartAge &&
    projectionDate.getMonth() === birthMonth
  );
}

/* ========================================
   PROJECTION PERIOD
======================================== */

function getSelectedProjectionPeriod() {
  const selectedInput = projectionPeriodInputs.find(function (input) {
    return input.checked;
  });

  return selectedInput?.value || DEFAULT_PROJECTION_PERIOD;
}

function getProjectionMonthCount(selectedPeriod, startingDate) {
  if (selectedPeriod === "10") {
    return DEFAULT_PROJECTION_YEARS * MONTHS_PER_YEAR;
  }

  if (selectedPeriod !== "mortality") {
    const selectedYears = Number(selectedPeriod);

    if (Number.isFinite(selectedYears) && selectedYears > 0) {
      const projectionEndDate = new Date(
        startingDate.getFullYear() + selectedYears,
        11,
        1,
      );

      return getInclusiveMonthDifference(startingDate, projectionEndDate);
    }

    return DEFAULT_PROJECTION_YEARS * MONTHS_PER_YEAR;
  }

    const profile = getClientProfile();

    const plannedMortalityAge = getPlannedMortalityAge();

    const mortalityMonth = getAgeMonthDate(
      profile.dateOfBirth,
      plannedMortalityAge,
    );

    if (!mortalityMonth || mortalityMonth < startingDate) {
      return DEFAULT_PROJECTION_YEARS * MONTHS_PER_YEAR;
    }

    return getInclusiveMonthDifference(startingDate, mortalityMonth);
}

function getInclusiveMonthDifference(startDate, endDate) {
  const yearDifference = endDate.getFullYear() - startDate.getFullYear();

  const monthDifference = endDate.getMonth() - startDate.getMonth();

  return Math.max(yearDifference * MONTHS_PER_YEAR + monthDifference + 1, 0);
}

/* ========================================
   ANNUAL PROJECTION ROWS
======================================== */

function aggregateProjectionIntoAnnualRows(monthlyRows) {
  const rowsByCalendarYear = new Map();

  monthlyRows.forEach(function (row) {
    const calendarYear = row.date.getFullYear();

    if (!rowsByCalendarYear.has(calendarYear)) {
      rowsByCalendarYear.set(calendarYear, []);
    }

    rowsByCalendarYear.get(calendarYear).push(row);
  });

  const currentYear = new Date().getFullYear();

  return Array.from(rowsByCalendarYear.entries()).map(function ([
    calendarYear,
    periodRows,
  ]) {
    const firstRow = periodRows[0];

    const lastRow = periodRows[periodRows.length - 1];

    return {
      date: new Date(calendarYear, 11, 1),

      age: lastRow.age,

      frsMetAt55: periodRows.some(function (row) {
        return row.frsMetAt55;
      }),

      hasMetCohortFrs: Boolean(lastRow.hasMetCohortFrs),

      retirementStrategy: lastRow.retirementStrategy,

      retirementStrategyTarget: lastRow.retirementStrategyTarget,

      retirementStrategyCashTopUp: sumProjectionValues(
        periodRows,
        "retirementStrategyCashTopUp",
      ),

      retirementStrategyAppliedThisMonth: periodRows.some(function (row) {
        return row.retirementStrategyAppliedThisMonth;
      }),

      retirementSumSetAside: lastRow.retirementSumSetAside,

      calendarYear,

      projectionYear: calendarYear - currentYear,

      isCurrentPartialYear: calendarYear === currentYear,

      fybcReachedThisMonth: periodRows.some(function (row) {
        return row.fybcReachedThisMonth;
      }),

      startWithdrawableBalance: firstRow.startWithdrawableBalance,

      operatingCashflow: sumProjectionValues(periodRows, "operatingCashflow"),

      netMovement: sumProjectionValues(periodRows, "netMovement"),

      cashflowBreakdown: aggregateCashflowBreakdown(periodRows),

      cashflowEvents: periodRows.flatMap(function (row) {
        return row.cashflowEvents || [];
      }),

      policyCashInflow: sumProjectionValues(periodRows, "policyCashInflow"),

      policyCashInflowItems: aggregatePolicyCashInflowItems(periodRows),

      bigTicketOutflow: sumProjectionValues(periodRows, "bigTicketOutflow"),

      goalOutflowItems: periodRows.flatMap(function (row) {
        return row.goalOutflowItems || [];
      }),

      endWithdrawableBalance: lastRow.endWithdrawableBalance,

      cpfInflow: sumProjectionValues(periodRows, "cpfInflow"),

      cpfInterestCredited: sumProjectionValues(
        periodRows,
        "cpfInterestCredited",
      ),

      oaOutflow: sumProjectionValues(periodRows, "oaOutflow"),

      saOutflow: sumProjectionValues(periodRows, "saOutflow"),

      raOutflow: sumProjectionValues(periodRows, "raOutflow"),

      maInsuranceOutflow: sumProjectionValues(periodRows, "maInsuranceOutflow"),

      accountNetFlows: {
        oa: sumNestedProjectionValues(periodRows, "accountNetFlows", "oa"),

        sa: sumNestedProjectionValues(periodRows, "accountNetFlows", "sa"),

        ra: sumNestedProjectionValues(periodRows, "accountNetFlows", "ra"),

        ma: sumNestedProjectionValues(periodRows, "accountNetFlows", "ma"),
      },

      netCpf: sumProjectionValues(periodRows, "netCpf"),

      oaBalance: lastRow.oaBalance,

      retirementAccount: lastRow.retirementAccount,

      retirementBalance: lastRow.retirementBalance,

      maBalance: lastRow.maBalance,

      applicableBhs: lastRow.applicableBhs,

      bhsBasis: lastRow.bhsBasis,

      bhsIsLocked: lastRow.bhsIsLocked,

      goalNames: periodRows.flatMap(function (row) {
        return row.goalNames;
      }),
    };
  });
}

function sumProjectionValues(rows, propertyName) {
  return rows.reduce(function (total, row) {
    return total + getFiniteNumber(row[propertyName]);
  }, 0);
}

function sumNestedProjectionValues(rows, objectName, propertyName) {
  return rows.reduce(function (total, row) {
    return total + getFiniteNumber(row[objectName]?.[propertyName]);
  }, 0);
}

function aggregatePolicyCashInflowItems(rows) {
  const itemsByPolicy = new Map();

  rows
    .flatMap(function (row) {
      return row.policyCashInflowItems || [];
    })
    .forEach(function (item) {
      const key = item.policyId || `${item.policyType}:${item.policyName}`;

      const existing = itemsByPolicy.get(key);

      if (existing) {
        existing.amount += getFiniteNumber(item.amount);

        existing.maturedThisMonth =
          existing.maturedThisMonth || item.maturedThisMonth;

        existing.startedThisMonth =
          existing.startedThisMonth || item.startedThisMonth;

        existing.endedThisMonth =
          existing.endedThisMonth || item.endedThisMonth;

        return;
      }

      itemsByPolicy.set(key, {
        ...item,

        amount: getFiniteNumber(item.amount),
      });
    });

  return Array.from(itemsByPolicy.values());
}

function aggregateCashflowBreakdown(rows) {
  const properties = [
    "takeHomeIncome",
    "bonusIncome",
    "otherIncome",
    "cpfLifeIncome",
    "expenses",
    "liabilities",
    "insurancePremiums",
    "retirementStrategyCashTopUp",
  ];

  return properties.reduce(function (breakdown, propertyName) {
    breakdown[propertyName] = rows.reduce(function (total, row) {
      return total + getFiniteNumber(row.cashflowBreakdown?.[propertyName]);
    }, 0);

    return breakdown;
  }, {});
}

function createCashflowEvents({
  policyItems,
  goalItems,
  cpfLifeStartedThisMonth,
  cpfLifeCashInflow,
  retirementStrategyCashTopUp = 0,
  retirementStrategy = "",
}) {
  const events = [];

  policyItems.forEach(function (item) {
    if (item.maturedThisMonth) {
      events.push({
        label: `${item.policyName} matured`,

        amount: item.amount,

        direction: "inflow",
      });
    }

    if (item.startedThisMonth) {
      events.push({
        label: `${item.policyName} payout started`,

        amount: item.amount,

        direction: "inflow",
      });
    }

    if (item.endedThisMonth) {
      events.push({
        label: `${item.policyName} payout ended`,

        amount: item.amount,

        direction: "inflow",
      });
    }
  });

  if (cpfLifeStartedThisMonth && cpfLifeCashInflow > 0) {
    events.push({
      label: "CPF LIFE payout started",

      amount: cpfLifeCashInflow,

      direction: "inflow",
    });
  }

  if (retirementStrategyCashTopUp > 0) {
    events.push({
      label: `${getRetirementStrategyLabel(retirementStrategy)} cash top-up to RA`,

      amount: retirementStrategyCashTopUp,

      direction: "outflow",
    });
  }

  goalItems.forEach(function (item) {
    if (item.amount <= 0) {
      return;
    }

    events.push({
      label: `${item.goalName} paid`,

      amount: item.amount,

      direction: "outflow",
    });
  });

  return events;
}

function calculateProjectedIncome({
  monthlyEmploymentIncome,

  annualBonus,

  annualNetTradeIncome,

  netPlatformEarnings,

  sepMedisaveOverrideEnabled,

  sepMedisaveOverrideAmount,

  otherMonthlyIncome,

  employmentStatus,

  age,

  ageAtStartOfWorkYear,
}) {
  const summary = calculateIncomeSummary({
    monthlyEmploymentIncome,

    annualBonus,

    annualNetTradeIncome,

    netPlatformEarnings,

    sepMedisaveOverrideEnabled,

    sepMedisaveOverrideAmount,

    monthlyOtherIncome: otherMonthlyIncome,

    employmentStatus,

    age,

    ageAtStartOfWorkYear,
  });

  const monthlyBonusAfterCpf =
    (getNonNegativeNumber(annualBonus) -
      summary.annualAdditionalWageEmployeeCpf) /
    12;

  const monthlyBonusTotalCpf =
    (summary.annualAdditionalWageEmployeeCpf +
      summary.annualAdditionalWageEmployerCpf) /
    12;

  return {
    monthlyTakeHomeIncome: summary.isSelfEmployed
      ? summary.monthlyNetTradeIncome - summary.monthlySepMedisaveContribution
      : getNonNegativeNumber(monthlyEmploymentIncome) -
        summary.monthlyEmployeeCpf,

    monthlyOtherIncome: getNonNegativeNumber(otherMonthlyIncome),

    monthlyBonusAfterCpf: summary.isSelfEmployed ? 0 : monthlyBonusAfterCpf,

    monthlyTotalCpfContribution:
      summary.monthlyEmployeeCpf + summary.monthlyEmployerCpf,

    monthlyBonusTotalCpf: summary.isSelfEmployed ? 0 : monthlyBonusTotalCpf,

    monthlySepMedisaveContribution: summary.monthlySepMedisaveContribution,
  };
}

/* ========================================
   PROJECTION TABLES
======================================== */

function renderProjectionPeriodLabels({ selectedPeriod, usesAnnualRows }) {
  const periodDescription =
    selectedPeriod === "mortality"
      ? `To Planned Mortality Age ${getPlannedMortalityAge()}`
      : `${selectedPeriod}-Year Outlook`;

  const rowDescription = usesAnnualRows ? "Annual Rows" : "Monthly Rows";

  setText(projectionPeriodLabel, `${periodDescription} · ${rowDescription}`);

  setText(cashflowPeriodHeading, usesAnnualRows ? "Projection Year" : "Month");

  setText(cpfPeriodHeading, usesAnnualRows ? "Projection Year" : "Month");
}

function renderCashflowProjectionTable({ rows, usesAnnualRows }) {
  if (!cashflowProjectionTableBody) {
    return;
  }

  cashflowProjectionTableBody.replaceChildren();

  const fragment = document.createDocumentFragment();

  rows.forEach(function (row, index) {
    const tableRow = document.createElement("tr");

    if (!usesAnnualRows && index % MONTHS_PER_YEAR === 0) {
      tableRow.classList.add("is-year-start");
    }

    tableRow.append(
      createCashflowPeriodCell(row, usesAnnualRows),

      createCurrencyCell(row.startWithdrawableBalance),

      createNetMovementCell(row, usesAnnualRows),

      createCurrencyCell(row.endWithdrawableBalance, true),
    );

    fragment.append(tableRow);
  });

  cashflowProjectionTableBody.append(fragment);
}

function renderCpfProjectionTable({ rows, usesAnnualRows }) {
  if (!cpfProjectionTableBody) {
    return;
  }

  cpfProjectionTableBody.replaceChildren();

  const fragment = document.createDocumentFragment();

  rows.forEach(function (row, index) {
    const tableRow = document.createElement("tr");

    if (!usesAnnualRows && index % MONTHS_PER_YEAR === 0) {
      tableRow.classList.add("is-year-start");
    }

    tableRow.append(
      createTextCell(getProjectionRowLabel(row, usesAnnualRows)),

      createCurrencyCell(row.cpfInflow),

      createCpfOutflowCell(row),

      createCurrencyCell(row.cpfInterestCredited, true),

      createCpfNetFlowCell(row),

      createCurrencyCell(row.oaBalance),

      createRetirementBalanceCell(row),

      createCurrencyCell(row.maBalance),

      createBhsCell(row),
    );

    fragment.append(tableRow);
  });

  cpfProjectionTableBody.append(fragment);
}

function getProjectionRowLabel(row, usesAnnualRows) {
  const ageLabel = Number.isFinite(row.age) ? ` · Age ${row.age}` : "";

  if (!usesAnnualRows) {
    return formatMonthYear(row.date) + ageLabel;
  }

  if (row.isCurrentPartialYear) {
    return "Current Year · " + formatMonthYear(row.date) + ageLabel;
  }

  return `Year ${row.projectionYear} · ` + formatMonthYear(row.date) + ageLabel;
}

function createCashflowPeriodCell(row, usesAnnualRows) {
  const cell = document.createElement("td");

  cell.className = "analysis-cashflow-period-cell";

  const period = document.createElement("span");

  period.textContent = getProjectionRowLabel(row, usesAnnualRows);

  cell.append(period);

  if (row.fybcReachedThisMonth) {
    const marker = document.createElement("small");

    marker.className = "analysis-fybc-marker";

    const icon = document.createElement("i");

    icon.className = "fa-solid fa-flag";

    icon.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");

    label.textContent = "FYBC reached";

    marker.append(icon, label);

    cell.append(marker);
  }

  return cell;
}

function createTextCell(value) {
  const cell = document.createElement("td");

  cell.textContent = value;

  return cell;
}

function createCurrencyCell(value, showStatus = false) {
  const cell = document.createElement("td");

  cell.textContent = formatCurrency(value);

  if (showStatus) {
    cell.classList.toggle("is-positive", value > 0);
    cell.classList.toggle("is-negative", value < 0);
  }

  return cell;
}

function createCpfOutflowCell(row) {
  const cell = document.createElement("td");

  cell.className = "analysis-cpf-outflow-cell";

  const outflows = [
    {
      account: "OA",
      amount: getNonNegativeNumber(row.oaOutflow),
    },

    {
      account: "SA",
      amount: getNonNegativeNumber(row.saOutflow),
    },

    {
      account: "RA",
      amount: getNonNegativeNumber(row.raOutflow),
    },

    {
      account: "MA",
      amount: getNonNegativeNumber(row.maInsuranceOutflow),
    },
  ].filter(function (outflow) {
    return outflow.amount > 0;
  });

  if (outflows.length === 0) {
    cell.textContent = "—";

    return cell;
  }

  const list = document.createElement("div");

  list.className = "analysis-cpf-outflow-list";

  outflows.forEach(function ({ account, amount }) {
    const item = document.createElement("div");

    item.className = "analysis-cpf-outflow-item";

    const accountLabel = document.createElement("span");

    accountLabel.textContent = account;

    const amountElement = document.createElement("strong");

    amountElement.textContent = `-${formatCurrency(amount)}`;

    item.append(accountLabel, amountElement);

    list.append(item);
  });

  cell.append(list);

  return cell;
}

function createCpfNetFlowCell(row) {
  const cell = document.createElement("td");

  cell.className = "analysis-cpf-net-flow-cell";

  const movements = [
    ["OA", getFiniteNumber(row.accountNetFlows?.oa)],

    ["SA", getFiniteNumber(row.accountNetFlows?.sa)],

    ["RA", getFiniteNumber(row.accountNetFlows?.ra)],

    ["MA", getFiniteNumber(row.accountNetFlows?.ma)],
  ].filter(function ([, amount]) {
    return Math.abs(amount) >= 0.5;
  });

  if (movements.length === 0) {
    cell.textContent = "—";

    return cell;
  }

  const list = document.createElement("div");

  list.className = "analysis-cpf-net-flow-list";

  movements.forEach(function ([account, amount]) {
    const item = document.createElement("div");

    item.className = "analysis-cpf-net-flow-item";

    const accountLabel = document.createElement("span");

    accountLabel.textContent = account;

    const amountElement = document.createElement("strong");

    const sign = amount > 0 ? "+" : "-";

    amountElement.textContent = `${sign}${formatCurrency(Math.abs(amount))}`;

    amountElement.classList.toggle("is-positive", amount > 0);

    amountElement.classList.toggle("is-negative", amount < 0);

    item.append(accountLabel, amountElement);

    list.append(item);
  });

  cell.append(list);

  return cell;
}

function createRetirementBalanceCell(row) {
  const cell = document.createElement("td");

  cell.className = "analysis-cpf-retirement-cell";

  const wrapper = document.createElement("div");

  wrapper.className = "analysis-cpf-retirement-value";

  const mainLine = document.createElement("div");

  mainLine.className = "analysis-cpf-retirement-main";

  const accountLabel = document.createElement("small");

  accountLabel.className = "analysis-cpf-account-badge";

  accountLabel.textContent = row.retirementAccount === "ra" ? "RA" : "SA";

  const amount = document.createElement("strong");

  amount.textContent = formatCurrency(row.retirementBalance);

  mainLine.append(accountLabel, amount);

  wrapper.append(mainLine);

  if (row.frsMetAt55) {
    const indicator = document.createElement("small");

    indicator.className = "analysis-cpf-frs-indicator";

    const icon = document.createElement("i");

    icon.className = "fa-solid fa-circle-check";

    icon.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");

    label.textContent = "FRS met at 55";

    indicator.append(icon, label);

    wrapper.append(indicator);
  }

  cell.append(wrapper);

  return cell;
}

function createBhsCell(row) {
  const cell = document.createElement("td");

  cell.className = "analysis-cpf-labelled-cell";

  const amount = document.createElement("strong");

  amount.textContent = formatCurrency(row.applicableBhs);

  const basis = document.createElement("small");

  basis.textContent = row.bhsIsLocked
    ? "Fixed for life"
    : row.bhsBasis === "projected"
      ? "Projected"
      : "Confirmed";

  cell.append(amount, basis);

  return cell;
}

function createNetMovementCell(row, usesAnnualRows) {
  const cell = document.createElement("td");

  cell.className = "analysis-net-movement-cell analysis-breakdown-cell";

  cell.classList.toggle("is-positive", row.netMovement > 0);

  cell.classList.toggle("is-negative", row.netMovement < 0);

  cell.tabIndex = 0;

  cell.setAttribute("role", "button");

  const periodLabel = getProjectionRowLabel(row, usesAnnualRows);

  cell.setAttribute(
    "aria-label",
    `View Net Movement breakdown for ${periodLabel}`,
  );

  const amount = document.createElement("strong");

  amount.className = "analysis-net-movement-amount";

  amount.textContent = formatSignedCurrency(row.netMovement);

  cell.append(amount);

  const events = row.cashflowEvents || [];

  if (events.length > 0) {
    const eventList = document.createElement("div");

    eventList.className = "analysis-cashflow-event-list";

    events.forEach(function (event) {
      const eventLine = document.createElement("small");

      eventLine.className = [
        "analysis-cashflow-event",
        `analysis-cashflow-event--${event.direction}`,
      ].join(" ");

      eventLine.textContent = [
        event.label,
        event.direction === "outflow" ? "-" : "+",
        formatCurrency(event.amount),
      ].join(" ");

      eventList.append(eventLine);
    });

    cell.append(eventList);
  }

  const action = document.createElement("small");

  action.className = "analysis-breakdown-cell__action";

  action.textContent = "View breakdown";

  cell.append(action);

  function openBreakdown() {
    openNetMovementBreakdown({
      row,
      periodLabel,
    });
  }

  cell.addEventListener("click", openBreakdown);

  cell.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();

    openBreakdown();
  });

  return cell;
}

function openNetMovementBreakdown({ row, periodLabel }) {
  if (!projectionBreakdownModal || !projectionBreakdownContent) {
    return;
  }

  setText(projectionBreakdownTitle, "Net Movement Breakdown");

  setText(projectionBreakdownSubtitle, periodLabel);

  projectionBreakdownContent.replaceChildren();

  const inflows = [
    {
      label: "Take-home income",
      amount: row.cashflowBreakdown?.takeHomeIncome,
    },

    {
      label: "Annual bonus",
      amount: row.cashflowBreakdown?.bonusIncome,
    },

    {
      label: "Other income",
      amount: row.cashflowBreakdown?.otherIncome,
    },

    ...(row.policyCashInflowItems || []).map(function (item) {
      return {
        label: item.policyName,
        amount: item.amount,
      };
    }),

    {
      label: "CPF LIFE payout",
      amount: row.cashflowBreakdown?.cpfLifeIncome,
    },
  ];

  const outflows = [
    {
      label: "Expenses",
      amount: row.cashflowBreakdown?.expenses,
    },

    {
      label: "Liability repayments",
      amount: row.cashflowBreakdown?.liabilities,
    },

    {
      label: "Insurance premiums",
      amount: row.cashflowBreakdown?.insurancePremiums,
    },

    {
      label: `${getRetirementStrategyLabel(
        row.retirementStrategy,
      )} cash top-up to RA`,

      amount: row.cashflowBreakdown?.retirementStrategyCashTopUp,
    },

    ...(row.goalOutflowItems || []).map(function (item) {
      return {
        label: item.goalName,
        amount: item.amount,
      };
    }),
  ];

  appendBreakdownSection({
    heading: "Inflows",
    items: inflows,
    direction: "inflow",
  });

  appendBreakdownSection({
    heading: "Outflows",
    items: outflows,
    direction: "outflow",
  });

  const total = document.createElement("div");

  total.className = "projection-breakdown-total";

  const totalLabel = document.createElement("strong");

  totalLabel.textContent = "Net Movement";

  const totalAmount = document.createElement("strong");

  totalAmount.textContent = formatSignedCurrency(row.netMovement);

  totalAmount.classList.toggle("is-positive", row.netMovement > 0);

  totalAmount.classList.toggle("is-negative", row.netMovement < 0);

  total.append(totalLabel, totalAmount);

  projectionBreakdownContent.append(total);

  openModal(projectionBreakdownModal);
}

function appendBreakdownSection({ heading, items, direction }) {
  const section = document.createElement("section");

  section.className = "projection-breakdown-section";

  const title = document.createElement("h3");

  title.textContent = heading;

  section.append(title);

  const visibleItems = items.filter(function (item) {
    return getFiniteNumber(item.amount) > 0;
  });

  if (visibleItems.length === 0) {
    const empty = document.createElement("p");

    empty.className = "projection-breakdown-empty";

    empty.textContent = "None";

    section.append(empty);
  } else {
    visibleItems.forEach(function (item) {
      const detailRow = document.createElement("div");

      detailRow.className = "projection-breakdown-row";

      const label = document.createElement("span");

      label.textContent = item.label;

      const amount = document.createElement("strong");

      amount.className =
        direction === "outflow" ? "is-negative" : "is-positive";

      amount.textContent = [
        direction === "outflow" ? "-" : "+",

        formatCurrency(item.amount),
      ].join("");

      detailRow.append(label, amount);

      section.append(detailRow);
    });
  }

  projectionBreakdownContent.append(section);
}

function formatSignedCurrency(value) {
  const amount = getFiniteNumber(value);

  if (amount > 0) {
    return `+${formatCurrency(amount)}`;
  }

  if (amount < 0) {
    return `-${formatCurrency(Math.abs(amount))}`;
  }

  return formatCurrency(0);
}

/* ========================================
   LIABILITY HELPERS
======================================== */

function calculateMonthlyCashCommitments(liabilities) {
  return liabilities.reduce(function (total, liability) {
    return total + getLiabilityMonthlyCashRepayment(liability);
  }, 0);
}

function calculateActiveMonthlyCashCommitments(liabilities, projectionDate) {
  return liabilities.reduce(function (total, liability) {
    if (!isLiabilityActive(liability, projectionDate)) {
      return total;
    }

    return total + getLiabilityMonthlyCashRepayment(liability);
  }, 0);
}

function calculateActiveMonthlyCpfCommitments(liabilities, projectionDate) {
  return liabilities.reduce(function (total, liability) {
    if (!isLiabilityActive(liability, projectionDate)) {
      return total;
    }

    return total + getLiabilityMonthlyCpfPayment(liability);
  }, 0);
}

function isLiabilityActive(liability, projectionDate) {
  const repaymentEndDate = liability?.repaymentEndDate;

  if (!/^\d{4}-\d{2}$/.test(repaymentEndDate || "")) {
    return true;
  }

  return formatYearMonth(projectionDate) <= repaymentEndDate;
}

/* ========================================
   GOAL HELPERS
======================================== */

function getGoalsDueInMonth(goals, projectionDate) {
  const projectionMonth = formatYearMonth(projectionDate);

  return goals.filter(function (goal, index) {
    return (
      isGoalIncludedInProjection(goal, index) &&
      getGoalProjectionMonth(goal) === projectionMonth
    );
  });
}

function getGoalProjectionMonth(goal) {
  const targetDate = goal?.targetDate;

  if (typeof targetDate !== "string") {
    return "";
  }

  if (/^\d{4}-\d{2}$/.test(targetDate)) {
    return targetDate;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return targetDate.slice(0, 7);
  }

  return "";
}

/* ========================================
   DATE HELPERS
======================================== */

function getProjectionStartDate() {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth() + 1, 1);
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function calculateAgeOnDate(dateOfBirth, referenceDate) {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  let age = referenceDate.getFullYear() - birthDate.getFullYear();

  const birthdayHasPassed =
    referenceDate.getMonth() > birthDate.getMonth() ||
    (referenceDate.getMonth() === birthDate.getMonth() &&
      referenceDate.getDate() >= birthDate.getDate());

  if (!birthdayHasPassed) {
    age -= 1;
  }

  return age;
}

function calculateAgeAtEndOfMonth(dateOfBirth, projectionDate) {
  const endOfMonth = new Date(
    projectionDate.getFullYear(),
    projectionDate.getMonth() + 1,
    0,
  );

  return calculateAgeOnDate(dateOfBirth, endOfMonth);
}

function isBirthdayAgeMonth({ dateOfBirth, projectionDate, targetAge }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth || "")) {
    return false;
  }

  const birthYear = Number(dateOfBirth.slice(0, 4));

  const birthMonth = Number(dateOfBirth.slice(5, 7)) - 1;

  return (
    projectionDate.getFullYear() === birthYear + targetAge &&
    projectionDate.getMonth() === birthMonth
  );
}

function formatYearMonth(date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function formatMonthYear(date) {
  return new Intl.DateTimeFormat("en-SG", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function hasReachedTargetAgeMonth({ dateOfBirth, projectionDate, targetAge }) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth || "") ||
    !Number.isFinite(targetAge)
  ) {
    return false;
  }

  const birthYear = Number(dateOfBirth.slice(0, 4));

  const birthMonth = Number(dateOfBirth.slice(5, 7)) - 1;

  const targetYear = birthYear + targetAge;

  if (projectionDate.getFullYear() > targetYear) {
    return true;
  }

  if (projectionDate.getFullYear() < targetYear) {
    return false;
  }

  return projectionDate.getMonth() >= birthMonth;
}

function isTargetAgeMonth({ dateOfBirth, projectionDate, targetAge }) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth || "") ||
    !Number.isFinite(targetAge)
  ) {
    return false;
  }

  const birthYear = Number(dateOfBirth.slice(0, 4));

  const birthMonth = Number(dateOfBirth.slice(5, 7)) - 1;

  return (
    projectionDate.getFullYear() === birthYear + targetAge &&
    projectionDate.getMonth() === birthMonth
  );
}

/* ========================================
   FORMATTERS
======================================== */

function setCurrency(element, value) {
  setText(element, formatCurrency(value));
}

function setSignedCurrency(element, value) {
  const prefix = value < 0 ? "-" : "";

  setText(element, `${prefix}${formatCurrency(Math.abs(value))}`);

  element?.classList.toggle("is-negative", value < 0);
  element?.classList.toggle("is-positive", value > 0);
}

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function getFiniteNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function getNonNegativeNumber(value) {
  return Math.max(0, getFiniteNumber(value));
}
