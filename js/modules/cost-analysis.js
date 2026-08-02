"use strict";

import {
  getAssets,
  getClientProfile,
  getExpenses,
  getGoals,
  getLiabilities,
} from "../state/client-plan.js";

import {
  CPF_ANNUAL_WAGE_CEILING,
  CPF_ORDINARY_WAGE_CEILING,
  getCpfAllocationRates,
  getCpfContributionRates,
} from "../services/cpf-service.js";

import { calculateLiquidAssetTotal } from "./assets-income/assets-income-calculator.js";

import {
  getInflationRate,
  getPlannedMortalityAge,
  getProjectedCohortFrs,
  getRetirementGoalSummary,
} from "./cost-of-wants/cost-of-wants-service.js";

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

/* ========================================
   CONFIGURATION
======================================== */

const MONTHS_PER_YEAR = 12;
const DEFAULT_PROJECTION_PERIOD = "10";
const DEFAULT_PROJECTION_YEARS = 10;
const DEFAULT_EMPLOYMENT_INCREMENT = 2;

/* ========================================
   ELEMENTS
======================================== */

const employmentIncrementInput = document.getElementById(
  "analysisEmploymentIncrementInput",
);

const expenseInflationInput = document.getElementById(
  "analysisExpenseInflationInput",
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

const goalFilterOptions = document.getElementById("analysisGoalFilterOptions");

const selectAllGoalsButton = document.getElementById(
  "analysisSelectAllGoalsButton",
);

const desiredFybcAgeElement = document.getElementById("analysisDesiredFybcAge");

const monthlyIncomeNeededElement = document.getElementById(
  "analysisMonthlyIncomeNeeded",
);

const monthlyIncomeAt65Element = document.getElementById(
  "analysisMonthlyIncomeAt65",
);

const cpfLifeIncomeElement = document.getElementById("analysisCpfLifeIncome");

const incomeGapElement = document.getElementById("analysisIncomeGap");

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
   INITIALIZATION
======================================== */

let moduleInitialized = false;

let expenseInflationWasOverridden = false;

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

  goalFilterOptions?.addEventListener("change", handleGoalFilterChange);

  selectAllGoalsButton?.addEventListener("click", handleSelectAllGoals);

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

  const monthlyProjection = calculateProjection({
    currentCashflow,

    annualEmploymentIncrement:
      getNonNegativeNumber(employmentIncrementInput?.value) / 100,

    annualExpenseInflation:
      getNonNegativeNumber(expenseInflationInput?.value) / 100,

    projectionMonths,

    startingDate,

    cohortFrsAmount: cohortFrs.isValid ? cohortFrs.amount : 0,
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
}

/* ========================================
   RETIREMENT SUMMARY
======================================== */

function renderRetirementGoalSummary() {
  const summary = getRetirementGoalSummary();

  setText(
    desiredFybcAgeElement,
    summary.desiredFybcAge > 0 ? String(summary.desiredFybcAge) : "—",
  );

  if (!summary.isValid) {
    setCurrency(monthlyIncomeNeededElement, 0);

    setCurrency(monthlyIncomeAt65Element, 0);

    setCurrency(cpfLifeIncomeElement, 0);

    setText(incomeGapElement, `${formatCurrency(0)}/mth`);

    setCurrency(totalCapitalNeededElement, 0);

    return;
  }

  setCurrency(monthlyIncomeNeededElement, summary.monthlyPassiveIncomeNeeded);

  setCurrency(monthlyIncomeAt65Element, summary.monthlyIncomeAt65);

  setCurrency(cpfLifeIncomeElement, summary.cpfLifeIncome);

  setText(incomeGapElement, `${formatCurrency(summary.incomeGap)}/mth`);

  setCurrency(totalCapitalNeededElement, summary.totalCapitalNeeded);
}

/* ========================================
   CURRENT MONTHLY CASHFLOW
======================================== */

function calculateCurrentMonthlyCashflow() {
  const assets = getAssets();

  const profile = getClientProfile();

  const liabilities = getLiabilities();

  const income = assets.income || {};

  const age = calculateAgeOnDate(profile.dateOfBirth, new Date());

  const employmentIncome = getNonNegativeNumber(income.monthlyEmployment);

  const annualBonus = getNonNegativeNumber(income.annualBonus);

  const otherMonthlyIncome = getNonNegativeNumber(income.otherMonthly);

  const cpfApplies =
    profile.employmentStatus === "full_time_employed" && age !== null;

  const contributionRates = cpfApplies
    ? getCpfContributionRates(age)
    : {
        employeeRate: 0,
        employerRate: 0,
      };

  const ordinaryWageSubjectToCpf = Math.min(
    employmentIncome,
    CPF_ORDINARY_WAGE_CEILING,
  );

  const monthlyEmployeeCpf = cpfApplies
    ? Math.round(ordinaryWageSubjectToCpf * contributionRates.employeeRate)
    : 0;

  const annualOrdinaryWage = ordinaryWageSubjectToCpf * 12;

  const additionalWageCeiling = Math.max(
    CPF_ANNUAL_WAGE_CEILING - annualOrdinaryWage,
    0,
  );

  const bonusSubjectToCpf = cpfApplies
    ? Math.min(annualBonus, additionalWageCeiling)
    : 0;

  const annualBonusEmployeeCpf = cpfApplies
    ? Math.round(bonusSubjectToCpf * contributionRates.employeeRate)
    : 0;

  const employmentIncomeAfterCpf = employmentIncome - monthlyEmployeeCpf;

  const annualBonusAfterCpf = annualBonus - annualBonusEmployeeCpf;

  const monthlyBonusAfterCpf = annualBonusAfterCpf / 12;

  const totalMonthlyIncome =
    employmentIncomeAfterCpf + monthlyBonusAfterCpf + otherMonthlyIncome;

  const monthlyExpenses = calculateTotalMonthlyExpenses(getExpenses());

  const monthlyCashCommitments = calculateMonthlyCashCommitments(liabilities);

  const monthlyInsurancePremiums = getEffectiveMonthlyInsurancePremium();

  const monthlyCommitments = monthlyCashCommitments + monthlyInsurancePremiums;

  const remainingSurplus =
    totalMonthlyIncome - monthlyExpenses - monthlyCommitments;

  return {
    employmentIncome,
    annualBonus,
    otherMonthlyIncome,

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
  setCurrency(employmentIncomeElement, cashflow.employmentIncomeAfterCpf);

  setText(
    bonusIncomeElement,
    `${formatCurrency(cashflow.annualBonusAfterCpf)}/year · ` +
      `${formatCurrency(cashflow.monthlyBonusAfterCpf)}/month`,
  );

  setCurrency(otherIncomeElement, cashflow.otherMonthlyIncome);

  setCurrency(totalMonthlyIncomeElement, cashflow.totalMonthlyIncome);

  setText(
    monthlyExpensesElement,
    `-${formatCurrency(cashflow.monthlyExpenses)}`,
  );

  setText(
    monthlyCommitmentsElement,
    `-${formatCurrency(cashflow.monthlyCommitments)}`,
  );

  setSignedCurrency(remainingSurplusElement, cashflow.remainingSurplus);
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
}) {
  const assets = getAssets();

  const profile = getClientProfile();

  const goals = getGoals();

  const liabilities = getLiabilities();

  let withdrawableBalance = calculateLiquidAssetTotal(assets.liquidAssets);

  let oaBalance = getNonNegativeNumber(assets.cpf?.oa);

  let saBalance = getNonNegativeNumber(assets.cpf?.sa);

  let raBalance = getNonNegativeNumber(assets.cpf?.ra);

  const monthlyInsuranceMedisaveOutflow = getMonthlyInsuranceMedisaveOutflow();

  let maBalance = getNonNegativeNumber(assets.cpf?.ma);

  const startingAge = calculateAgeOnDate(profile.dateOfBirth, startingDate);

  /*
   * If the client is already 55, preserve the
   * entered balances because they should already
   * represent their actual post-55 CPF position.
   */
  let raHasBeenFormed = startingAge !== null && startingAge >= 55;

  const pendingCpfInterest = {
    oa: 0,
    sa: 0,
    ra: 0,
    ma: 0,
  };

  const rows = [];

  for (let monthIndex = 0; monthIndex < projectionMonths; monthIndex += 1) {
    const projectionDate = addMonths(startingDate, monthIndex);

    const completedYears = Math.max(
      projectionDate.getFullYear() - startingDate.getFullYear(),
      0,
    );

    const salaryGrowthFactor = Math.pow(
      1 + annualEmploymentIncrement,
      completedYears,
    );

    const projectedEmploymentIncome =
      currentCashflow.employmentIncome * salaryGrowthFactor;

    const projectedAnnualBonus =
      currentCashflow.annualBonus * salaryGrowthFactor;

    const age = calculateAgeOnDate(profile.dateOfBirth, projectionDate);

    const projectedIncome = calculateProjectedIncome({
      monthlyEmploymentIncome: projectedEmploymentIncome,
      annualBonus: projectedAnnualBonus,
      otherMonthlyIncome: currentCashflow.otherMonthlyIncome,
      employmentStatus: profile.employmentStatus,
      age,
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

    const insurancePremiums = getEffectiveMonthlyInsurancePremium();

    const monthlyCommitments = activeCashCommitments + insurancePremiums;

    const netCashflow =
      projectedIncome.monthlyTakeHomeIncome +
      projectedIncome.monthlyBonusAfterCpf -
      monthlyExpenses -
      monthlyCommitments;

    const goalsDue = getGoalsDueInMonth(goals, projectionDate);

    const bigTicketOutflow = goalsDue.reduce(function (total, goal) {
      return total + getNonNegativeNumber(goal.targetAmount);
    }, 0);

    const startWithdrawableBalance = withdrawableBalance;

    withdrawableBalance =
      startWithdrawableBalance + netCashflow - bigTicketOutflow;

    const totalCpfInflow =
      projectedIncome.monthlyTotalCpfContribution +
      projectedIncome.monthlyBonusTotalCpf;

    const allocationRates = getCpfAllocationRates(age);

    let oaInflow = totalCpfInflow * allocationRates.oaRate;

    const retirementInflow = totalCpfInflow * allocationRates.retirementRate;

    const originalMaInflow = totalCpfInflow * allocationRates.maRate;

    const hasReachedAge55 = age !== null && age >= 55;

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

      const remainingRaCapacity = Math.max(cohortFrsAmount - raBalance, 0);

      const amountDirectedToRa = Math.min(
        amountAvailableForRa,
        remainingRaCapacity,
      );

      const amountRedirectedToOa = amountAvailableForRa - amountDirectedToRa;

      raBalance += amountDirectedToRa;
      oaInflow += amountRedirectedToOa;
    }

    const oaOutflow = calculateActiveMonthlyCpfCommitments(
      liabilities,
      projectionDate,
    );

    oaBalance = Math.max(0, oaBalance + oaInflow - oaOutflow);

    const availableMaBalance = maBalance + maInflow;

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
          const remainingRaCapacity = Math.max(cohortFrsAmount - raBalance, 0);

          const overflowToRa = Math.min(
            maInterestOverflow,
            remainingRaCapacity,
          );

          raBalance += overflowToRa;

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

    const displayedRetirementBalance =
      retirementAccount === "ra" ? raBalance : saBalance;

    rows.push({
      date: projectionDate,

      startWithdrawableBalance,
      netCashflow,
      bigTicketOutflow,
      endWithdrawableBalance: withdrawableBalance,

      cpfInflow: totalCpfInflow,

      cpfInterestCredited,

      oaOutflow,

      maInsuranceOutflow,

      netCpf:
        totalCpfInflow + cpfInterestCredited - oaOutflow - maInsuranceOutflow,

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

      calendarYear,

      projectionYear: calendarYear - currentYear,

      isCurrentPartialYear: calendarYear === currentYear,

      startWithdrawableBalance: firstRow.startWithdrawableBalance,

      netCashflow: sumProjectionValues(periodRows, "netCashflow"),

      bigTicketOutflow: sumProjectionValues(periodRows, "bigTicketOutflow"),

      endWithdrawableBalance: lastRow.endWithdrawableBalance,

      cpfInflow: sumProjectionValues(periodRows, "cpfInflow"),

      cpfInterestCredited: sumProjectionValues(
        periodRows,
        "cpfInterestCredited",
      ),

      oaOutflow: sumProjectionValues(periodRows, "oaOutflow"),

      maInsuranceOutflow: sumProjectionValues(periodRows, "maInsuranceOutflow"),

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

function calculateProjectedIncome({
  monthlyEmploymentIncome,
  annualBonus,
  otherMonthlyIncome,
  employmentStatus,
  age,
}) {
  const cpfApplies = employmentStatus === "full_time_employed" && age !== null;

  const contributionRates = cpfApplies
    ? getCpfContributionRates(age)
    : {
        employeeRate: 0,
        employerRate: 0,
      };

  const cpfOrdinaryWage = cpfApplies
    ? Math.min(monthlyEmploymentIncome, CPF_ORDINARY_WAGE_CEILING)
    : 0;

  const ordinaryWageEmployeeCpf = cpfApplies
    ? Math.round(cpfOrdinaryWage * contributionRates.employeeRate)
    : 0;

  const ordinaryWageEmployerCpf = cpfApplies
    ? Math.round(cpfOrdinaryWage * contributionRates.employerRate)
    : 0;

  const annualOrdinaryWage = cpfOrdinaryWage * 12;

  const additionalWageCeiling = Math.max(
    CPF_ANNUAL_WAGE_CEILING - annualOrdinaryWage,
    0,
  );

  const annualBonusSubjectToCpf = cpfApplies
    ? Math.min(annualBonus, additionalWageCeiling)
    : 0;

  const annualBonusEmployeeCpf = cpfApplies
    ? Math.round(annualBonusSubjectToCpf * contributionRates.employeeRate)
    : 0;

  const annualBonusEmployerCpf = cpfApplies
    ? Math.round(annualBonusSubjectToCpf * contributionRates.employerRate)
    : 0;

  /*
   * Draft assumption:
   * The annual bonus is spread evenly over 12 months.
   */
  const monthlyBonusAfterCpf = (annualBonus - annualBonusEmployeeCpf) / 12;

  const monthlyBonusTotalCpf =
    (annualBonusEmployeeCpf + annualBonusEmployerCpf) / 12;

  return {
    monthlyTakeHomeIncome:
      monthlyEmploymentIncome - ordinaryWageEmployeeCpf + otherMonthlyIncome,

    monthlyBonusAfterCpf,

    monthlyTotalCpfContribution:
      ordinaryWageEmployeeCpf + ordinaryWageEmployerCpf,

    monthlyBonusTotalCpf,
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
      createTextCell(
        getProjectionRowLabel(
          row,
          usesAnnualRows,
        ),
      ),

      createCurrencyCell(
        row.startWithdrawableBalance,
      ),

      createCurrencyCell(
        row.netCashflow,
        true,
      ),

      createGoalOutflowCell(row),

      createCurrencyCell(
        row.endWithdrawableBalance,
        true,
      ),
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

      createCurrencyCell(-row.oaOutflow, true),

      createCurrencyCell(-row.maInsuranceOutflow, true),

      createCurrencyCell(row.cpfInterestCredited, true),

      createCurrencyCell(row.netCpf, true),

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
  if (!usesAnnualRows) {
    return formatMonthYear(row.date);
  }

  if (row.isCurrentPartialYear) {
    return "Current Year · " + formatMonthYear(row.date);
  }

  return `Year ${row.projectionYear} · ` + formatMonthYear(row.date);
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

function createRetirementBalanceCell(row) {
  const cell = document.createElement("td");

  cell.className = "analysis-cpf-retirement-cell";

  const wrapper = document.createElement("div");

  wrapper.className = "analysis-cpf-retirement-value";

  const accountLabel = document.createElement("small");

  accountLabel.className = "analysis-cpf-account-badge";

  accountLabel.textContent = row.retirementAccount === "ra" ? "RA" : "SA";

  const amount = document.createElement("strong");

  amount.textContent = formatCurrency(row.retirementBalance);

  wrapper.append(accountLabel, amount);

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

function createGoalOutflowCell(row) {
  const cell = document.createElement("td");

  cell.className = "analysis-projection-goal-cell";

  if (row.bigTicketOutflow <= 0) {
    cell.textContent = "—";
    return cell;
  }

  const amount = document.createElement("strong");

  amount.textContent = `-${formatCurrency(row.bigTicketOutflow)}`;

  const note = document.createElement("small");

  note.className = "analysis-projection-goal-note";
  note.textContent = row.goalNames.join(", ");
  note.title = row.goalNames.join(", ");

  cell.append(amount, note);

  return cell;
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
