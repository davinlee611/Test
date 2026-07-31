"use strict";

import {
  getAssets,
  getClientProfile,
  getCommitments,
  getCostOfWants,
  getExpenses,
  getLiabilities,
  getPolicies,
  updateCostOfWants,
} from "../../state/client-plan.js";

import { getClientAge } from "../client-profile.js";

import { calculateIncomeSummary } from "../../services/income-calculator.js";

import { getAllGoals } from "../../services/goal-service.js";

import { calculateGoalSavings } from "../../services/goal-savings-calculator.js";

import { getLiabilityMonthlyCashRepayment } from "../liabilities/liability-calculator.js";

import {
  DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE,
  calculateClientCpfRetirementProjection as calculateCpfRetirementProjection,
  calculateFybcProjection as calculateFybcProjectionValues,
} from "./cost-of-wants-calculator.js";

import { getEffectiveMonthlyInsurancePremium } from "../../services/commitment-service.js";

/* ========================================
   CONSTANTS
======================================== */

const LIFESTYLE_AMOUNTS = Object.freeze({
  basic: 3000,
  average: 5000,
  comfort: 8000,
});

/* ========================================
   COST OF WANTS STATE
======================================== */

export function getCostOfWantsState() {
  return getCostOfWants();
}

export function saveFybcAssumptions({
  desiredFybcAge,
  plannedMortalityAge,
  inflationRate,
}) {
  updateCostOfWants({
    desiredFybcAge: getWholeNumber(desiredFybcAge),

    plannedMortalityAge: getWholeNumber(plannedMortalityAge),

    inflationRate: getNonNegativeNumber(inflationRate),
  });
}

export function setLifestyleOption(option) {
  const validOptions = ["basic", "average", "comfort", "custom"];

  if (!validOptions.includes(option)) {
    return false;
  }

  updateCostOfWants({
    lifestyleOption: option,
  });

  return true;
}

export function setCustomMonthlyIncome(value) {
  updateCostOfWants({
    customMonthlyIncome: getWholeNumber(value),
  });
}

/* ========================================
   LIFESTYLE SELECTORS
======================================== */

export function getSelectedMonthlyIncome() {
  const { lifestyleOption, customMonthlyIncome } = getCostOfWants();

  if (lifestyleOption === "custom") {
    return getValidAmount(customMonthlyIncome);
  }

  return LIFESTYLE_AMOUNTS[lifestyleOption] || 0;
}

export function getSelectedMonthlyPassiveIncome() {
  return getSelectedMonthlyIncome();
}

/* ========================================
   FYBC INPUT SELECTORS
======================================== */

export function getDesiredFybcAge() {
  const { desiredFybcAge } = getCostOfWants();

  const age = Number(desiredFybcAge);

  return Number.isFinite(age) ? age : null;
}

export function getPlannedMortalityAge() {
  const { plannedMortalityAge } = getCostOfWants();

  const age = Number(plannedMortalityAge);

  return Number.isFinite(age) ? age : null;
}

export function getInflationRate() {
  const { inflationRate } = getCostOfWants();

  const rate = Number(inflationRate);

  return Number.isFinite(rate) ? rate : 0;
}

export function getSelectedCpfRetirementOption() {
  const { selectedCpfRetirementOption } = getCostOfWants();

  const validOptions = ["brs", "frs", "ers", "self_employed"];

  return validOptions.includes(selectedCpfRetirementOption)
    ? selectedCpfRetirementOption
    : "frs";
}

export function getSavedCpfRetirementSumGrowthRate() {
  const { cpfRetirementSumGrowthRate } = getCostOfWants();

  return getCpfRetirementSumGrowthRate(cpfRetirementSumGrowthRate);
}

export function setSelectedCpfRetirementOption(option) {
  const validOptions = ["brs", "frs", "ers", "self_employed"];

  if (!validOptions.includes(option)) {
    return false;
  }

  updateCostOfWants({
    selectedCpfRetirementOption: option,
  });

  return true;
}

export function setCpfRetirementSumGrowthRate(value) {
  updateCostOfWants({
    cpfRetirementSumGrowthRate: getCpfRetirementSumGrowthRate(value),
  });
}

/* ========================================
   CPF PROJECTION
======================================== */

export function getCpfRetirementSumGrowthRate(inputValue) {
  const enteredValue = String(inputValue ?? "").trim();

  if (!enteredValue) {
    return DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE;
  }

  const enteredRate = Number(enteredValue);

  if (!Number.isFinite(enteredRate)) {
    return DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE;
  }

  return Math.min(Math.max(enteredRate, 0), 10);
}

export function calculateClientCpfRetirementProjection({ cpfGrowthRate } = {}) {
  const profile = getClientProfile();

  return calculateCpfRetirementProjection({
    currentAge: getClientAge(),

    gender: profile?.gender,

    dateOfBirth: profile?.dateOfBirth,

    annualGrowthRate: getCpfRetirementSumGrowthRate(cpfGrowthRate),
  });
}

/* ========================================
   FYBC PROJECTION
======================================== */

export function calculateFybcProjection({
  selectedCpfRetirementOption,
  cpfGrowthRate,
}) {
  return calculateFybcProjectionValues({
    currentAge: getClientAge(),

    desiredFybcAge: getDesiredFybcAge(),

    mortalityAge: getPlannedMortalityAge(),

    inflationRatePercent: getInflationRate(),

    monthlyPassiveIncome: getSelectedMonthlyPassiveIncome(),

    cpfLifePayout: getSelectedCpfLifeMonthlyPayout({
      selectedCpfRetirementOption,
      cpfGrowthRate,
    }),
  });
}

export function getSelectedCpfLifeMonthlyPayout({
  selectedCpfRetirementOption,
  cpfGrowthRate,
}) {
  if (selectedCpfRetirementOption === "self_employed") {
    return 0;
  }

  const cpfProjection = calculateClientCpfRetirementProjection({
    cpfGrowthRate,
  });

  if (!cpfProjection.isValid) {
    return 0;
  }

  const selectedPayout =
    cpfProjection.monthlyPayouts?.[selectedCpfRetirementOption];

  return Number.isFinite(selectedPayout) ? selectedPayout : 0;
}

/* ========================================
   RETIREMENT GOAL SUMMARY
======================================== */

export function getRetirementGoalSummary() {
  const selectedCpfRetirementOption = getSelectedCpfRetirementOption();

  const cpfGrowthRate = getSavedCpfRetirementSumGrowthRate();

  const cpfLifePayout = getSelectedCpfLifeMonthlyPayout({
    selectedCpfRetirementOption,
    cpfGrowthRate,
  });

  const projection = calculateFybcProjectionValues({
    currentAge: getClientAge(),

    desiredFybcAge: getDesiredFybcAge(),

    mortalityAge: getPlannedMortalityAge(),

    inflationRatePercent: getInflationRate(),

    monthlyPassiveIncome: getSelectedMonthlyPassiveIncome(),

    cpfLifePayout,
  });

  if (!projection.isValid) {
    return {
      isValid: false,

      desiredFybcAge: getDesiredFybcAge(),

      monthlyPassiveIncomeNeeded: 0,

      monthlyIncomeAt65: 0,

      cpfLifeIncome: 0,

      incomeGap: 0,

      totalCapitalNeeded: 0,
    };
  }

  return {
    isValid: true,

    desiredFybcAge: projection.desiredFybcAge,

    monthlyPassiveIncomeNeeded: projection.monthlyIncomeAtFybc,

    monthlyIncomeAt65: projection.monthlyIncomeAt65,

    cpfLifeIncome: projection.cpfLifePayout,

    incomeGap: projection.monthlyIncomeAfterCpf,

    totalCapitalNeeded: projection.totalCapitalRequired,
  };
}

/* ========================================
   MONTHLY SPENDING BREAKDOWN
======================================== */

export function calculateMonthlySpendingBreakdown() {
  const expenses = getExpenses();

  const monthlyExpenses = {
    household: getValidAmount(expenses.household),

    transport: getValidAmount(expenses.transport),

    subscriptionsLifestyle: getValidAmount(expenses.subscriptionsLifestyle),

    parentsDependantsSupport: getValidAmount(expenses.parentsDependantsSupport),

    otherRecurringExpenses: getValidAmount(expenses.otherRecurringExpenses),
  };

  const monthlyCommitments = {
    liabilityRepayments: calculateTotalMonthlyLiabilityRepayments(),

    insurancePremiums: getEffectiveMonthlyInsurancePremium(),
  };

  const totalMonthlyExpenses =
    monthlyExpenses.household +
    monthlyExpenses.transport +
    monthlyExpenses.subscriptionsLifestyle +
    monthlyExpenses.parentsDependantsSupport +
    monthlyExpenses.otherRecurringExpenses;

  const totalMonthlyCommitments =
    monthlyCommitments.liabilityRepayments +
    monthlyCommitments.insurancePremiums;

  return {
    expenses: monthlyExpenses,

    commitments: monthlyCommitments,

    totalMonthlyExpenses,

    totalMonthlyCommitments,

    totalMonthlyOutflow: totalMonthlyExpenses + totalMonthlyCommitments,
  };
}

/* ========================================
   MONTHLY FINANCIAL POSITION
======================================== */

export function calculateMonthlyFinancialPosition() {
  const incomeSummary = calculateCurrentIncomeSummary();

  const spendingBreakdown = calculateMonthlySpendingBreakdown();

  const monthlyTakeHomeIncome = getValidAmount(
    incomeSummary.monthlyTakeHomeIncome,
  );

  const monthlyExpenses = spendingBreakdown.totalMonthlyExpenses;

  const monthlyCommitments = spendingBreakdown.totalMonthlyCommitments;

  const monthlySurplus =
    monthlyTakeHomeIncome - monthlyExpenses - monthlyCommitments;

  const goalSavingsSummary = calculateGoalSavings(getAllGoals());

  const minimumGoalSavings = getValidAmount(
    goalSavingsSummary.totalMonthlySavings,
  );

  const netSurplus = monthlySurplus - minimumGoalSavings;

  return {
    monthlyTakeHomeIncome,

    monthlyExpenses,

    monthlyCommitments,

    monthlySurplus,

    minimumGoalSavings,

    netSurplus,

    goalSavingsSummary,
  };
}

/* ========================================
   INCOME CALCULATION
======================================== */

function calculateCurrentIncomeSummary() {
  const assets = getAssets();

  const profile = getClientProfile();

  const income = assets?.income || {};

  return calculateIncomeSummary({
    monthlyEmploymentIncome: income.monthlyEmployment,

    annualBonus: income.annualBonus,

    monthlyOtherIncome: income.otherMonthly,

    employmentStatus: profile?.employmentStatus,

    age: getClientAge(),
  });
}

/* ========================================
   LIABILITY REPAYMENTS
======================================== */

function calculateTotalMonthlyLiabilityRepayments() {
  return getLiabilities().reduce(function (runningTotal, liability) {
    return runningTotal + getLiabilityMonthlyCashRepayment(liability);
  }, 0);
}

/* ========================================
   NUMBER HELPERS
======================================== */

function getWholeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return Math.trunc(number);
}

function getNonNegativeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return number;
}

function getValidAmount(value) {
  const amount = Number(value);

  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}