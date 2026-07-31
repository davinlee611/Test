"use strict";

import {
  getAssets,
  getClientProfile,
  getCommitments,
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

import { getRetirementGoalSummary } from "./cost-of-wants/cost-of-wants-service.js";

import { calculateTotalMonthlyExpenses } from "./expenses/expense-calculator.js";

import {
  getLiabilityMonthlyCashRepayment,
  getLiabilityMonthlyCpfPayment,
} from "./liabilities/liability-calculator.js";

import { getEffectiveMonthlyInsurancePremium } from "../services/commitment-service.js";

/* ========================================
   CONFIGURATION
======================================== */

const PROJECTION_MONTHS = 120;
const DEFAULT_EMPLOYMENT_INCREMENT = 2;

/* ========================================
   ELEMENTS
======================================== */

const employmentIncrementInput = document.getElementById(
  "analysisEmploymentIncrementInput",
);

const projectionTableBody = document.getElementById(
  "analysisProjectionTableBody",
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

export function initializeCostAnalysis() {
  if (moduleInitialized) {
    renderCostAnalysis();
    return;
  }

  if (employmentIncrementInput) {
    employmentIncrementInput.addEventListener("input", renderCostAnalysis);
  }

  moduleInitialized = true;

  renderCostAnalysis();
}

export function resetCostAnalysis() {
  if (employmentIncrementInput) {
    employmentIncrementInput.value = DEFAULT_EMPLOYMENT_INCREMENT;
  }

  renderCostAnalysis();
}

/* ========================================
   MAIN RENDER
======================================== */

export function renderCostAnalysis() {
  renderRetirementGoalSummary();

  const currentCashflow = calculateCurrentMonthlyCashflow();

  renderCurrentMonthlyCashflow(currentCashflow);

  const projection = calculateTenYearProjection({
    currentCashflow,
    annualEmploymentIncrement:
      getNonNegativeNumber(employmentIncrementInput?.value) / 100,
  });

  renderProjectionTable(projection);
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
   TEN-YEAR PROJECTION
======================================== */

function calculateTenYearProjection({
  currentCashflow,
  annualEmploymentIncrement,
}) {
  const assets = getAssets();

  const profile = getClientProfile();

  const goals = getGoals();

  const liabilities = getLiabilities();

  const startingDate = getProjectionStartDate();

  let withdrawableBalance = calculateLiquidAssetTotal(assets.liquidAssets);

  let oaBalance = getNonNegativeNumber(assets.cpf?.oa);

  let saBalance = getNonNegativeNumber(assets.cpf?.sa);

  let raBalance = getNonNegativeNumber(assets.cpf?.ra);

  let maBalance = getNonNegativeNumber(assets.cpf?.ma);

  const rows = [];

  for (let monthIndex = 0; monthIndex < PROJECTION_MONTHS; monthIndex += 1) {
    const projectionDate = addMonths(startingDate, monthIndex);

    const completedYears = Math.floor(monthIndex / 12);

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

    const monthlyExpenses = currentCashflow.monthlyExpenses;

    const activeCashCommitments = calculateActiveMonthlyCashCommitments(
      liabilities,
      projectionDate,
    );

    const insurancePremiums = getNonNegativeNumber(
      getCommitments().insurancePremiums,
    );

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

    const oaInflow = totalCpfInflow * allocationRates.oaRate;

    const retirementInflow = totalCpfInflow * allocationRates.retirementRate;

    const maInflow = totalCpfInflow * allocationRates.maRate;

    const oaOutflow = calculateActiveMonthlyCpfCommitments(
      liabilities,
      projectionDate,
    );

    oaBalance = Math.max(0, oaBalance + oaInflow - oaOutflow);

    if (allocationRates.retirementAccount === "ra") {
      raBalance += retirementInflow;
    } else {
      saBalance += retirementInflow;
    }

    maBalance += maInflow;

    rows.push({
      date: projectionDate,

      startWithdrawableBalance,
      netCashflow,
      bigTicketOutflow,
      endWithdrawableBalance: withdrawableBalance,

      cpfInflow: totalCpfInflow,
      oaOutflow,
      netCpf: totalCpfInflow - oaOutflow,

      oaBalance,
      retirementBalance: saBalance + raBalance,
      maBalance,

      goalNames: goalsDue.map(function (goal) {
        return goal.name || "Goal";
      }),
    });
  }

  return rows;
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
   PROJECTION TABLE
======================================== */

function renderProjectionTable(rows) {
  if (!projectionTableBody) {
    return;
  }

  projectionTableBody.replaceChildren();

  const fragment = document.createDocumentFragment();

  rows.forEach(function (row, index) {
    const tableRow = document.createElement("tr");

    if (index % 12 === 0) {
      tableRow.classList.add("is-year-start");
    }

    tableRow.append(
      createTextCell(formatMonthYear(row.date)),
      createCurrencyCell(row.startWithdrawableBalance),
      createCurrencyCell(row.netCashflow, true),
      createGoalOutflowCell(row),
      createCurrencyCell(row.endWithdrawableBalance, true),
      createCurrencyCell(row.cpfInflow),
      createCurrencyCell(-row.oaOutflow, true),
      createCurrencyCell(row.netCpf, true),
      createCurrencyCell(row.oaBalance),
      createCurrencyCell(row.retirementBalance),
      createCurrencyCell(row.maBalance),
    );

    fragment.append(tableRow);
  });

  projectionTableBody.append(fragment);
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

function createGoalOutflowCell(row) {
  const cell = document.createElement("td");

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

  return goals.filter(function (goal) {
    return goal?.targetDate === projectionMonth;
  });
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

function getNonNegativeNumber(value) {
  return Math.max(0, getFiniteNumber(value));
}

function getFiniteNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}
