"use strict";

import {
  getClientProfile,
  getCostOfWants,
  updateCostOfWants,
} from "../../state/client-plan.js";

import { getClientAge } from "../client-profile.js";

import {
  DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE,
  calculateClientCpfRetirementProjection as calculateCpfRetirementProjection,
  calculateCpfRetirementSums,
  calculateFybcProjection as calculateFybcProjectionValues,
  roundCpfProjectionAmount,
} from "./cost-of-wants-calculator.js";

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
  postFybcReturnRate,
}) {
  updateCostOfWants({
    desiredFybcAge: getWholeNumber(desiredFybcAge),

    plannedMortalityAge: getWholeNumber(plannedMortalityAge),

    inflationRate: getNonNegativeNumber(inflationRate),

    postFybcReturnRate: getNonNegativeNumber(postFybcReturnRate),
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

export function getPostFybcReturnRate() {
  const { postFybcReturnRate } = getCostOfWants();

  return getNonNegativeNumber(postFybcReturnRate);
}

export function getSavedCpfRetirementSumGrowthRate() {
  const { cpfRetirementSumGrowthRate } = getCostOfWants();

  return getCpfRetirementSumGrowthRate(cpfRetirementSumGrowthRate);
}

export function getCpfLifePayoutStartAge() {
  const selectedAge = Number(getCostOfWants().cpfLifePayoutStartAge);

  return Number.isInteger(selectedAge) && selectedAge >= 65 && selectedAge <= 70
    ? selectedAge
    : 65;
}

export function setCpfLifePayoutStartAge(value) {
  const selectedAge = Number(value);

  if (!Number.isInteger(selectedAge) || selectedAge < 65 || selectedAge > 70) {
    return false;
  }

  updateCostOfWants({
    cpfLifePayoutStartAge: selectedAge,
  });

  return true;
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

export function getProjectedCohortFrs() {
  const cpfProjection = calculateClientCpfRetirementProjection({
    cpfGrowthRate: getSavedCpfRetirementSumGrowthRate(),
  });

  if (!cpfProjection?.isValid) {
    return {
      isValid: false,
      amount: 0,
      yearTurning55: null,
      basis: "unavailable",
      annualGrowthRate: getSavedCpfRetirementSumGrowthRate(),
    };
  }

  const projectedFrs = Number(cpfProjection.retirementSums?.frs);

  return {
    isValid: Number.isFinite(projectedFrs) && projectedFrs > 0,

    amount: Number.isFinite(projectedFrs) ? projectedFrs : 0,

    yearTurning55: cpfProjection.yearTurning55,

    basis: cpfProjection.retirementSumBasis,

    annualGrowthRate: cpfProjection.annualGrowthRate,
  };
}

export function getApplicableErsForYear(targetYear) {
  const safeYear = Number(targetYear);

  if (!Number.isInteger(safeYear) || safeYear < 2015) {
    return {
      isValid: false,

      amount: 0,

      year: null,

      basis: "unavailable",
    };
  }

  const retirementSums = calculateCpfRetirementSums({
    /*
     * This deliberately treats targetYear as
     * the year whose prevailing retirement
     * sums are required.
     */
    yearTurning55: safeYear,

    annualGrowthRate: getSavedCpfRetirementSumGrowthRate(),
  });

  const ers = Number(retirementSums?.ers);

  return {
    isValid: Number.isFinite(ers) && ers > 0,

    amount: Number.isFinite(ers) ? roundCpfProjectionAmount(ers) : 0,

    year: safeYear,

    basis: retirementSums?.basis || "unavailable",
  };
}

/* ========================================
   GROSS RETIREMENT TARGET
======================================== */

/*
 * Returns the complete cost of funding the selected
 * retirement lifestyle without deducting CPF LIFE,
 * projected assets, OA or policy income.
 *
 * Those resources are applied later by the Analysis page.
 */
export function getGrossRetirementGoalSummary() {
  const projection = calculateFybcProjectionValues({
    currentAge: getClientAge(),

    desiredFybcAge: getDesiredFybcAge(),

    mortalityAge: getPlannedMortalityAge(),

    inflationRatePercent: getInflationRate(),

    monthlyPassiveIncome: getSelectedMonthlyPassiveIncome(),

    /*
     * Cost of Wants measures the gross lifestyle target.
     * No CPF LIFE assumption is applied here.
     */
    cpfLifePayout: 0,
  });

  if (!projection.isValid) {
    return {
      isValid: false,

      currentAge: getClientAge(),

      desiredFybcAge: getDesiredFybcAge(),

      plannedMortalityAge: getPlannedMortalityAge(),

      inflationRate: getInflationRate(),

      yearsRemaining: 0,

      monthlyIncomeToday: getSelectedMonthlyPassiveIncome(),

      monthlyIncomeAtFybc: 0,

      monthlyIncomeAt65: 0,

      grossCapitalRequired: 0,
    };
  }

  return {
    isValid: true,

    currentAge: projection.currentAge,

    desiredFybcAge: projection.desiredFybcAge,

    plannedMortalityAge: projection.mortalityAge,

    inflationRate: getInflationRate(),

    yearsRemaining: projection.yearsRemaining,

    monthlyIncomeToday: projection.monthlyPassiveIncome,

    monthlyIncomeAtFybc: projection.monthlyIncomeAtFybc,

    monthlyIncomeAt65: projection.monthlyIncomeAt65,

    grossCapitalRequired: projection.totalCapitalRequired,
  };
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
