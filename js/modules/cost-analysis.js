"use strict";

import {
  getAssets,
  getClientProfile,
  getExpenses,
  getGoals,
  getLiabilities,
} from "../state/client-plan.js";

import { getCpfAllocationRates } from "../services/cpf-service.js";

import { calculateIncomeSummary } from "../services/income-calculator.js";

import { calculateLiquidAssetTotal } from "./assets-income/assets-income-calculator.js";

import {
  getCpfLifePayoutStartAge,
  getDesiredFybcAge,
  getGrossRetirementGoalSummary,
  getInflationRate,
  getPlannedMortalityAge,
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

const goalFilterOptions = document.getElementById("analysisGoalFilterOptions");

const selectAllGoalsButton = document.getElementById(
  "analysisSelectAllGoalsButton",
);

const desiredFybcAgeElement = document.getElementById("analysisDesiredFybcAge");

const plannedMortalityAgeElement = document.getElementById(
  "analysisPlannedMortalityAge",
);

const monthlyIncomeTodayElement = document.getElementById(
  "analysisMonthlyIncomeToday",
);

const monthlyIncomeNeededElement = document.getElementById(
  "analysisMonthlyIncomeNeeded",
);

const monthlyIncomeAt65Element = document.getElementById(
  "analysisMonthlyIncomeAt65",
);

const totalCapitalNeededElement = document.getElementById(
  "analysisTotalCapitalNeeded",
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

const retirementAnalysisElements = {
  positionTitle: document.getElementById("analysisProjectedPositionTitle"),

  readinessBadge: document.getElementById("analysisReadinessBadge"),

  withdrawableAssets: document.getElementById(
    "analysisProjectedWithdrawableAssets",
  ),

  includeOaInput: document.getElementById("analysisIncludeProjectedOaInput"),

  includeOaHelper: document.getElementById("analysisIncludeProjectedOaHelper"),

  oaBalance: document.getElementById("analysisProjectedOaBalance"),

  retirementBalanceLabel: document.getElementById(
    "analysisProjectedRetirementBalanceLabel",
  ),

  retirementBalance: document.getElementById(
    "analysisProjectedRetirementBalance",
  ),

  cpfLifeSectionTitle: document.getElementById("analysisCpfLifeSectionTitle"),

  cpfLifeRaBeforePremium: document.getElementById(
    "analysisCpfLifeRaBeforePremium",
  ),

  cpfLifeTargetPremium: document.getElementById("analysisCpfLifeTargetPremium"),

  cpfLifePremium: document.getElementById("analysisProjectedCpfLifePremium"),

  cpfLifePremiumBasis: document.getElementById(
    "analysisProjectedCpfLifePremiumBasis",
  ),

  cpfLifeIncome: document.getElementById("analysisProjectedCpfLifeIncome"),

  cpfLifeIncomeBasis: document.getElementById(
    "analysisProjectedCpfLifeIncomeBasis",
  ),

  desiredIncomeAtFybc: document.getElementById("analysisDesiredIncomeAtFybc"),

  recordedIncomeAtFybc: document.getElementById("analysisRecordedIncomeAtFybc"),

  incomeGapAtFybc: document.getElementById("analysisIncomeGapAtFybc"),

  desiredIncomeAt65: document.getElementById("analysisDesiredIncomeAt65"),

  recordedIncomeAt65: document.getElementById("analysisRecordedIncomeAt65"),

  incomeGapAt65: document.getElementById("analysisIncomeGapAt65"),

  desiredRetirementCapital: document.getElementById(
    "analysisDesiredRetirementCapital",
  ),

  projectedRetirementCapital: document.getElementById(
    "analysisProjectedRetirementCapital",
  ),

  retirementCapitalGap: document.getElementById("analysisRetirementCapitalGap"),

  fundingResult: document.getElementById("analysisFundingResult"),

  fundingResultLabel: document.getElementById("analysisFundingResultLabel"),

  fundingResultAmount: document.getElementById("analysisFundingResultAmount"),

  fundingResultMessage: document.getElementById("analysisFundingResultMessage"),

  keyFindingsList: document.getElementById("analysisKeyFindingsList"),
};

/* ========================================
   INITIALIZATION
======================================== */

let moduleInitialized = false;

let expenseInflationWasOverridden = false;

let includeProjectedOa = false;

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

  retirementAnalysisElements.includeOaInput?.addEventListener(
    "change",
    function (event) {
      includeProjectedOa = Boolean(event.currentTarget.checked);

      renderCostAnalysis();
    },
  );

  goalFilterOptions?.addEventListener("change", handleGoalFilterChange);

  selectAllGoalsButton?.addEventListener("click", handleSelectAllGoals);

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

  if (retirementAnalysisElements.includeOaInput) {
    retirementAnalysisElements.includeOaInput.checked = false;
    retirementAnalysisElements.includeOaInput.disabled = true;
  }

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
   MAIN RENDER
======================================== */

export function renderCostAnalysis() {
  renderRetirementGoalSummary();

  const cpfLifeStartAge = getCpfLifePayoutStartAge();

  if (cpfLifeStartAgeInput) {
    cpfLifeStartAgeInput.value = String(cpfLifeStartAge);
  }

  if (!expenseInflationWasOverridden) {
    syncExpenseInflationDefault();
  }

  const currentCashflow = calculateCurrentMonthlyCashflow();

  renderCurrentMonthlyCashflow(currentCashflow);

  renderGoalFilter(getGoals());

  const selectedPeriod = getSelectedProjectionPeriod();

  const usesAnnualRows = selectedPeriod !== DEFAULT_PROJECTION_PERIOD;

  const startingDate = getProjectionStartDate();

  const projectionMonths = getProjectionMonthCount(
    selectedPeriod,
    startingDate,
  );

  const cohortFrs = getProjectedCohortFrs();

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

    cohortFrsAmount: cohortFrs.isValid ? cohortFrs.amount : 0,

    cpfLifeStartAge,
  };

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

  renderRetirementPositionAnalysis({
    rows: analysisProjection,

    cpfLifeStartAge,
  });
}

/* ========================================
   RETIREMENT SUMMARY
======================================== */

function renderRetirementGoalSummary() {
  const summary = getGrossRetirementGoalSummary();

  setText(
    desiredFybcAgeElement,
    summary.desiredFybcAge > 0 ? String(summary.desiredFybcAge) : "—",
  );

  setText(
    plannedMortalityAgeElement,
    summary.plannedMortalityAge > 0 ? String(summary.plannedMortalityAge) : "—",
  );

  if (!summary.isValid) {
    setCurrency(monthlyIncomeTodayElement, 0);

    setCurrency(monthlyIncomeNeededElement, 0);

    setCurrency(monthlyIncomeAt65Element, 0);

    setCurrency(totalCapitalNeededElement, 0);

    return;
  }

  setCurrency(monthlyIncomeTodayElement, summary.monthlyIncomeToday);

  setCurrency(monthlyIncomeNeededElement, summary.monthlyIncomeAtFybc);

  setCurrency(monthlyIncomeAt65Element, summary.monthlyIncomeAt65);

  setCurrency(totalCapitalNeededElement, summary.grossCapitalRequired);
}

/* ========================================
   RETIREMENT POSITION ANALYSIS
======================================== */

function renderRetirementPositionAnalysis({ rows, cpfLifeStartAge }) {
  const summary = getGrossRetirementGoalSummary();

  const desiredFybcAge = getDesiredFybcAge();

  const fybcRow = rows.find(function (row) {
    return row.fybcReachedThisMonth;
  });

  const age65Row = rows.find(function (row) {
    return getFiniteNumber(row.age) >= 65;
  });

  const cpfLifeStartRow = rows.find(function (row) {
    return getFiniteNumber(row.age) >= cpfLifeStartAge;
  });

  if (!summary.isValid || !fybcRow) {
    renderIncompleteRetirementPositionAnalysis(desiredFybcAge, cpfLifeStartAge);

    return;
  }

  const projectedWithdrawableAssets = getFiniteNumber(
    fybcRow.endWithdrawableBalance,
  );

  const projectedOaBalance = getNonNegativeNumber(fybcRow.oaBalance);

  const canIncludeProjectedOa = Boolean(fybcRow.hasMetCohortFrs);

  /*
   * OA cannot remain selected when the projected cohort FRS
   * has not been fully set aside.
   */
  if (!canIncludeProjectedOa) {
    includeProjectedOa = false;
  }

  if (retirementAnalysisElements.includeOaInput) {
    retirementAnalysisElements.includeOaInput.disabled = !canIncludeProjectedOa;

    retirementAnalysisElements.includeOaInput.checked =
      canIncludeProjectedOa && includeProjectedOa;
  }

  if (canIncludeProjectedOa) {
    setText(
      retirementAnalysisElements.includeOaHelper,
      includeProjectedOa
        ? `${formatCurrency(projectedOaBalance)} of projected OA is included in the retirement funding comparison.`
        : `${formatCurrency(projectedOaBalance)} of projected OA is eligible but currently excluded.`,
    );
  } else {
    setText(
      retirementAnalysisElements.includeOaHelper,
      "Projected OA cannot be included because the cohort FRS has not been fully set aside.",
    );
  }

  const includedProjectedOa =
    canIncludeProjectedOa && includeProjectedOa ? projectedOaBalance : 0;

  const projectedRetirementCapital =
    Math.max(projectedWithdrawableAssets, 0) + includedProjectedOa;

  const retirementAccount = fybcRow.retirementAccount === "ra" ? "RA" : "SA";

  const raBalanceBeforeCpfLife = getNonNegativeNumber(
    cpfLifeStartRow?.raBalanceBeforeCpfLife,
  );

  const targetCpfLifePremium = getNonNegativeNumber(
    cpfLifeStartRow?.targetCpfLifePremium,
  );

  const projectedCpfLifePremium = getNonNegativeNumber(
    cpfLifeStartRow?.affordableCpfLifePremium,
  );

  const projectedCpfLifeIncome = getNonNegativeNumber(
    cpfLifeStartRow?.cpfLifeMonthlyPayout,
  );

  const recordedIncomeAtFybc =
    getRetirementPolicyIncomeForRow(fybcRow) +
    getNonNegativeNumber(fybcRow.cpfLifeCashInflow);

  const recordedIncomeAt65 = age65Row
    ? getRetirementPolicyIncomeForRow(age65Row) +
      getNonNegativeNumber(age65Row.cpfLifeCashInflow)
    : 0;

  const incomeGapAtFybc = Math.max(
    summary.monthlyIncomeAtFybc - recordedIncomeAtFybc,
    0,
  );

  const incomeGapAt65 = Math.max(
    summary.monthlyIncomeAt65 - recordedIncomeAt65,
    0,
  );

  const capitalDifference =
    projectedRetirementCapital - summary.grossCapitalRequired;

  const capitalGap = Math.max(-capitalDifference, 0);

  const isOnTrack = capitalDifference >= 0;

  setText(
    retirementAnalysisElements.positionTitle,
    `Projected Position at FYBC Age ${desiredFybcAge}`,
  );

  setText(
    retirementAnalysisElements.withdrawableAssets,
    formatCurrency(projectedWithdrawableAssets),
  );

  setText(
    retirementAnalysisElements.oaBalance,
    formatCurrency(projectedOaBalance),
  );

  setText(
    retirementAnalysisElements.retirementBalanceLabel,
    `Projected ${retirementAccount} Balance`,
  );

  setText(
    retirementAnalysisElements.retirementBalance,
    formatCurrency(fybcRow.retirementBalance),
  );

  setText(
    retirementAnalysisElements.cpfLifeSectionTitle,
    `Projected CPF LIFE at Age ${cpfLifeStartAge}`,
  );

  setText(
    retirementAnalysisElements.cpfLifeRaBeforePremium,
    formatCurrency(raBalanceBeforeCpfLife),
  );

  setText(
    retirementAnalysisElements.cpfLifeTargetPremium,
    formatCurrency(targetCpfLifePremium),
  );

  setText(
    retirementAnalysisElements.cpfLifePremium,
    formatCurrency(projectedCpfLifePremium),
  );

  setText(
    retirementAnalysisElements.cpfLifePremiumBasis,
    projectedCpfLifePremium > 0
      ? `Deducted from RA at age ${cpfLifeStartAge}`
      : `Insufficient RA to start CPF LIFE at age ${cpfLifeStartAge}`,
  );

  setText(
    retirementAnalysisElements.cpfLifeIncome,
    `${formatCurrency(projectedCpfLifeIncome)}/mth`,
  );

  setText(
    retirementAnalysisElements.cpfLifeIncomeBasis,
    projectedCpfLifePremium > 0
      ? `Projected to start from age ${cpfLifeStartAge}`
      : "No monthly payout projected",
  );

  setAnalysisComparisonValue(
    retirementAnalysisElements.desiredIncomeAtFybc,
    summary.monthlyIncomeAtFybc,
  );

  setAnalysisComparisonValue(
    retirementAnalysisElements.recordedIncomeAtFybc,
    recordedIncomeAtFybc,
  );

  setAnalysisGapValue(
    retirementAnalysisElements.incomeGapAtFybc,
    incomeGapAtFybc,
  );

  setAnalysisComparisonValue(
    retirementAnalysisElements.desiredIncomeAt65,
    summary.monthlyIncomeAt65,
  );

  setAnalysisComparisonValue(
    retirementAnalysisElements.recordedIncomeAt65,
    recordedIncomeAt65,
  );

  setAnalysisGapValue(retirementAnalysisElements.incomeGapAt65, incomeGapAt65);

  setAnalysisComparisonValue(
    retirementAnalysisElements.desiredRetirementCapital,
    summary.grossCapitalRequired,
  );

  setAnalysisComparisonValue(
    retirementAnalysisElements.projectedRetirementCapital,
    projectedRetirementCapital,
  );

  setAnalysisGapValue(
    retirementAnalysisElements.retirementCapitalGap,
    capitalGap,
  );

  renderFundingResult({
    isOnTrack,
    capitalDifference,
    desiredFybcAge,
  });

  renderRetirementAnalysisFindings({
    rows,
    desiredFybcAge,
    projectedWithdrawableAssets,
    includedProjectedOa,
    projectedCpfLifeIncome,
    incomeGapAtFybc,
    capitalGap,
    cpfLifeStartAge,
  });
}

function renderIncompleteRetirementPositionAnalysis(
  desiredFybcAge,
  cpfLifeStartAge,
) {
  const emptyValue = "—";

  setText(
    retirementAnalysisElements.positionTitle,

    desiredFybcAge > 0
      ? `Projected Position at FYBC Age ${desiredFybcAge}`
      : "Projected Position at FYBC",
  );

  setText(
    retirementAnalysisElements.retirementBalanceLabel,
    "Projected SA / RA Balance",
  );

  setText(
    retirementAnalysisElements.cpfLifePremiumBasis,
    "Based on the projected RA balance",
  );

  setText(
    retirementAnalysisElements.cpfLifeIncomeBasis,
    "Monthly payout from the selected start age",
  );

  setText(
    retirementAnalysisElements.cpfLifeSectionTitle,
    `Projected CPF LIFE at Age ${cpfLifeStartAge}`,
  );

  [
    retirementAnalysisElements.withdrawableAssets,

    retirementAnalysisElements.oaBalance,

    retirementAnalysisElements.retirementBalance,

    retirementAnalysisElements.cpfLifeRaBeforePremium,

    retirementAnalysisElements.cpfLifeTargetPremium,

    retirementAnalysisElements.cpfLifePremium,

    retirementAnalysisElements.cpfLifeIncome,

    retirementAnalysisElements.desiredIncomeAtFybc,

    retirementAnalysisElements.recordedIncomeAtFybc,

    retirementAnalysisElements.incomeGapAtFybc,

    retirementAnalysisElements.desiredIncomeAt65,

    retirementAnalysisElements.recordedIncomeAt65,

    retirementAnalysisElements.incomeGapAt65,

    retirementAnalysisElements.desiredRetirementCapital,

    retirementAnalysisElements.projectedRetirementCapital,

    retirementAnalysisElements.retirementCapitalGap,
  ].forEach(function (element) {
    setText(element, emptyValue);

    element?.classList.remove("is-positive", "is-negative");
  });

  setText(
    retirementAnalysisElements.readinessBadge,

    "Complete the retirement goal",
  );

  retirementAnalysisElements.readinessBadge?.classList.remove(
    "is-on-track",
    "is-shortfall",
  );

  retirementAnalysisElements.fundingResult?.classList.remove(
    "is-on-track",
    "is-shortfall",
  );

  setText(
    retirementAnalysisElements.fundingResultLabel,

    "Retirement Funding Position",
  );

  setText(
    retirementAnalysisElements.fundingResultAmount,

    emptyValue,
  );

  setText(
    retirementAnalysisElements.fundingResultMessage,

    "Complete the retirement goal and projection assumptions.",
  );

  includeProjectedOa = false;

  if (retirementAnalysisElements.includeOaInput) {
    retirementAnalysisElements.includeOaInput.checked = false;
    retirementAnalysisElements.includeOaInput.disabled = true;
  }

  setText(
    retirementAnalysisElements.includeOaHelper,
    "Available only after the projected cohort FRS has been fully set aside.",
  );

  retirementAnalysisElements.keyFindingsList?.replaceChildren();
}

function getRetirementPolicyIncomeForRow(
  row,
) {
  return (
    row?.policyCashInflowItems || []
  ).reduce(function (total, item) {
    if (
      item.policyType !== "retirement"
    ) {
      return total;
    }

    return (
      total +
      getNonNegativeNumber(
        item.amount,
      )
    );
  }, 0);
}

function setAnalysisComparisonValue(
  element,
  value,
) {
  setText(
    element,
    formatCurrency(value),
  );

  element?.classList.remove(
    "is-positive",
    "is-negative",
  );
}

function setAnalysisGapValue(
  element,
  value,
) {
  const safeValue =
    getNonNegativeNumber(value);

  setText(
    element,
    formatCurrency(safeValue),
  );

  element?.classList.toggle(
    "is-negative",
    safeValue > 0,
  );

  element?.classList.toggle(
    "is-positive",
    safeValue <= 0,
  );
}

function renderFundingResult({
  isOnTrack,
  capitalDifference,
  desiredFybcAge,
}) {
  const resultElement =
    retirementAnalysisElements
      .fundingResult;

  resultElement?.classList.toggle(
    "is-on-track",
    isOnTrack,
  );

  resultElement?.classList.toggle(
    "is-shortfall",
    !isOnTrack,
  );

  retirementAnalysisElements
    .readinessBadge
    ?.classList.toggle(
      "is-on-track",
      isOnTrack,
    );

  retirementAnalysisElements
    .readinessBadge
    ?.classList.toggle(
      "is-shortfall",
      !isOnTrack,
    );

  setText(
    retirementAnalysisElements
      .readinessBadge,

    isOnTrack
      ? "Capital target met"
      : "Capital shortfall projected",
  );

  setText(
    retirementAnalysisElements
      .fundingResultLabel,

    isOnTrack
      ? "Projected Retirement Surplus"
      : "Retirement Funding Shortfall",
  );

  setText(
    retirementAnalysisElements
      .fundingResultAmount,

    formatCurrency(
      Math.abs(capitalDifference),
    ),
  );

  setText(
    retirementAnalysisElements.fundingResultMessage,

    isOnTrack
      ? `The projected accessible retirement capital at FYBC age ${desiredFybcAge} meets the gross Cost of Wants capital target.`
      : `The projected accessible retirement capital at FYBC age ${desiredFybcAge} does not fully meet the gross Cost of Wants capital target.`,
  );
}

function renderRetirementAnalysisFindings({
  rows,
  desiredFybcAge,
  projectedWithdrawableAssets,
  includedProjectedOa,
  projectedCpfLifeIncome,
  incomeGapAtFybc,
  capitalGap,
  cpfLifeStartAge,
}) {
  const findings = [];

  findings.push(
    `Employment and net trade income stop when the client reaches FYBC age ${desiredFybcAge}.`,
  );

  findings.push(
    projectedWithdrawableAssets >= 0
      ? `Projected withdrawable retirement assets at FYBC are ${formatCurrency(projectedWithdrawableAssets)}.`
      : `The cash projection is already in deficit by ${formatCurrency(
          Math.abs(projectedWithdrawableAssets),
        )} at FYBC.`,
  );

  findings.push(
    projectedCpfLifeIncome > 0
      ? `Projected CPF LIFE income is ${formatCurrency(projectedCpfLifeIncome)} per month from age ${cpfLifeStartAge}.`
      : `The projected RA balance does not currently start CPF LIFE at age ${cpfLifeStartAge}.`,
  );

  if (incomeGapAtFybc > 0) {
    findings.push(
      `${formatCurrency(incomeGapAtFybc)} per month at FYBC must still be funded from retirement assets or other income sources.`,
    );
  }

  if (capitalGap > 0) {
    findings.push(
      `Projected accessible retirement capital is ${formatCurrency(capitalGap)} below the gross retirement capital target.`,
    );
  }

  if (includedProjectedOa > 0) {
    findings.push(
      `${formatCurrency(includedProjectedOa)} of eligible projected OA has been included in the retirement funding comparison.`,
    );
  }

  const depletionRow = rows.find(function (row) {
    return getFiniteNumber(row.endWithdrawableBalance) < 0;
  });

  if (depletionRow) {
    findings.push(
      `The projected cash reserve first becomes negative in ${formatMonthYear(
        depletionRow.date,
      )}, at approximately age ${depletionRow.age}.`,
    );
  } else {
    findings.push(
      "The projected cash reserve remains non-negative through the planned mortality age.",
    );
  }

  const fragment = document.createDocumentFragment();

  findings.forEach(function (finding) {
    const item = document.createElement("li");

    item.textContent = finding;

    fragment.append(item);
  });

  retirementAnalysisElements.keyFindingsList?.replaceChildren(fragment);
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
      ? "Net trade income is shown after the estimated mandatory MediSave contribution."
      : "Employment and bonus income are shown after the employee's CPF contribution.",
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
    const emptyMessage =
      document.createElement("p");

    emptyMessage.className =
      "analysis-goal-filter-empty";

    emptyMessage.textContent =
      "No current goals have been added.";

    goalFilterOptions.append(emptyMessage);

    if (selectAllGoalsButton) {
      selectAllGoalsButton.hidden = true;
    }

    return;
  }

  if (selectAllGoalsButton) {
    selectAllGoalsButton.hidden = false;
  }

  const fragment =
    document.createDocumentFragment();

  goals.forEach(function (goal, index) {
    const goalId = getProjectionGoalId(
      goal,
      index,
    );

    const label = document.createElement("label");

    label.className =
      "analysis-goal-filter-option";

    const checkbox =
      document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.value = goalId;
    checkbox.checked =
      !excludedProjectionGoalIds.has(goalId);

    const marker = document.createElement("span");

    marker.className =
      "analysis-goal-filter-checkbox";

    const details = document.createElement("span");

    details.className =
      "analysis-goal-filter-details";

    const name = document.createElement("strong");

    name.textContent = goal?.name || "Goal";

    const amount = document.createElement("small");

    amount.textContent = formatCurrency(
      getNonNegativeNumber(
        goal?.targetAmount,
      ),
    );

    details.append(name, amount);

    label.append(checkbox, marker, details);

    fragment.append(label);
  });

  goalFilterOptions.append(fragment);
}

function handleGoalFilterChange(event) {
  const checkbox = event.target.closest(
    'input[type="checkbox"]',
  );

  if (!checkbox) {
    return;
  }

  if (checkbox.checked) {
    excludedProjectionGoalIds.delete(
      checkbox.value,
    );
  } else {
    excludedProjectionGoalIds.add(
      checkbox.value,
    );
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
      return getProjectionGoalId(
        goal,
        index,
      );
    }),
  );

  excludedProjectionGoalIds.forEach(
    function (goalId) {
      if (!currentGoalIds.has(goalId)) {
        excludedProjectionGoalIds.delete(
          goalId,
        );
      }
    },
  );
}

function getProjectionGoalId(goal, index) {
  return String(
    goal?.id || `projection-goal-${index}`,
  );
}

function isGoalIncludedInProjection(
  goal,
  index,
) {
  return !excludedProjectionGoalIds.has(
    getProjectionGoalId(goal, index),
  );
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
  cpfLifeStartAge,
}) {
  const assets = getAssets();

  const profile = getClientProfile();

  const desiredFybcAge = getDesiredFybcAge();

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
    ? Math.min(raBalance, cohortFrsAmount)
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

      otherMonthlyIncome: currentCashflow.otherMonthlyIncome,

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
    if (hasReachedAge55 && !raHasBeenFormed) {
      const remainingFrsBeforeTransfer = Math.max(
        cohortFrsAmount - raBalance,
        0,
      );

      const saTransferredToRa = Math.min(saBalance, remainingFrsBeforeTransfer);

      raBalance += saTransferredToRa;
      saBalance -= saTransferredToRa;

      const remainingFrsAfterSa = Math.max(cohortFrsAmount - raBalance, 0);

      const oaTransferredToRa = Math.min(oaBalance, remainingFrsAfterSa);

      raBalance += oaTransferredToRa;
      oaBalance -= oaTransferredToRa;

      /*
       * Any SA remaining after RA reaches FRS
       * is redirected into OA.
       */
      oaBalance += saBalance;
      saBalance = 0;

      /*
       * Interest accrued for SA before age 55
       * follows the retirement balance after
       * SA closes.
       */
      pendingCpfInterest.ra += pendingCpfInterest.sa;

      pendingCpfInterest.sa = 0;

      raHasBeenFormed = true;

      retirementSumSetAside = Math.max(
        retirementSumSetAside,
        Math.min(raBalance, cohortFrsAmount),
      );

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
        cohortFrsAmount,
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
          const remainingSaCapacity = Math.max(cohortFrsAmount - saBalance, 0);

          const overflowToSa = Math.min(
            maInterestOverflow,
            remainingSaCapacity,
          );

          saBalance += overflowToSa;

          oaBalance += maInterestOverflow - overflowToSa;
        } else {
          const remainingRaCapacity = Math.max(
            cohortFrsAmount - retirementSumSetAside,
            0,
          );

          const overflowToRa = Math.min(
            maInterestOverflow,
            remainingRaCapacity,
          );

          raBalance += overflowToRa;
          retirementSumSetAside += overflowToRa;
          oaBalance += maInterestOverflow - overflowToRa;
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

    const netMovement = operatingCashflow - bigTicketOutflow;

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
    };

    const cashflowEvents = createCashflowEvents({
      policyItems: policyCashInflow.items,

      goalItems: goalOutflowItems,

      cpfLifeStartedThisMonth,

      cpfLifeCashInflow,
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
  const selectedInput = projectionPeriodInputs.find(
    function (input) {
      return input.checked;
    },
  );

  return selectedInput?.value ||
    DEFAULT_PROJECTION_PERIOD;
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

  const currentAge = calculateAgeOnDate(profile.dateOfBirth, new Date());

  const plannedMortalityAge = getPlannedMortalityAge();

  if (
    currentAge === null ||
    !Number.isFinite(plannedMortalityAge) ||
    plannedMortalityAge <= currentAge
  ) {
    return DEFAULT_PROJECTION_YEARS * MONTHS_PER_YEAR;
  }

  const yearsUntilMortality = plannedMortalityAge - currentAge;

  const projectionEndDate = new Date(
    startingDate.getFullYear() + yearsUntilMortality,
    11,
    1,
  );

  return getInclusiveMonthDifference(startingDate, projectionEndDate);
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
    return total +
      getFiniteNumber(row[propertyName]);
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

function renderProjectionPeriodLabels({
  selectedPeriod,
  usesAnnualRows,
}) {
  const periodDescription =
    selectedPeriod === "mortality"
      ? `To Planned Mortality Age ${getPlannedMortalityAge()}`
      : `${selectedPeriod}-Year Outlook`;

  const rowDescription = usesAnnualRows
    ? "Annual Rows"
    : "Monthly Rows";

  setText(
    projectionPeriodLabel,
    `${periodDescription} · ${rowDescription}`,
  );

  setText(
    cashflowPeriodHeading,
    usesAnnualRows ? "Projection Year" : "Month",
  );

  setText(
    cpfPeriodHeading,
    usesAnnualRows ? "Projection Year" : "Month",
  );
}

function renderCashflowProjectionTable({
  rows,
  usesAnnualRows,
}) {
  if (!cashflowProjectionTableBody) {
    return;
  }

  cashflowProjectionTableBody.replaceChildren();

  const fragment =
    document.createDocumentFragment();

  rows.forEach(function (row, index) {
    const tableRow = document.createElement("tr");

    if (
      !usesAnnualRows &&
      index % MONTHS_PER_YEAR === 0
    ) {
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

function renderCpfProjectionTable({
  rows,
  usesAnnualRows,
}) {
  if (!cpfProjectionTableBody) {
    return;
  }

  cpfProjectionTableBody.replaceChildren();

  const fragment =
    document.createDocumentFragment();

  rows.forEach(function (row, index) {
    const tableRow = document.createElement("tr");

    if (
      !usesAnnualRows &&
      index % MONTHS_PER_YEAR === 0
    ) {
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

function formatCurrency(value) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(getFiniteNumber(value));
}

function getFiniteNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function getNonNegativeNumber(value) {
  return Math.max(0, getFiniteNumber(value));
}
