"use strict";

/* ========================================
   BASIC HEALTHCARE SUM CONFIGURATION
======================================== */

export const BHS_PROJECTION_GROWTH_RATE = 4.72;

export const BHS_PROJECTION_ROUNDING = 500;

export const LATEST_CONFIRMED_BHS_YEAR = 2026;

export const LATEST_CONFIRMED_BHS = 79000;

/*
 * The BHS applicable in the year the
 * member turns 65 remains fixed for life.
 */
const CONFIRMED_BASIC_HEALTHCARE_SUMS = Object.freeze({
  2016: 49800,
  2017: 52000,
  2018: 54500,
  2019: 57200,
  2020: 60000,
  2021: 63000,
  2022: 66000,
  2023: 68500,
  2024: 71500,
  2025: 75500,
  2026: 79000,
});

/* ========================================
   APPLICABLE BHS
======================================== */

export function getApplicableBasicHealthcareSum({
  dateOfBirth,
  projectionDate,
}) {
  const projectionYear = projectionDate?.getFullYear();

  const yearTurning65 = calculateYearTurningAge(dateOfBirth, 65);

  if (!Number.isFinite(projectionYear) || !yearTurning65) {
    return createInvalidBhsResult();
  }

  const isLocked = projectionYear >= yearTurning65;

  const applicableBhsYear = isLocked ? yearTurning65 : projectionYear;

  const bhsResult = getBasicHealthcareSumForYear(applicableBhsYear);

  return {
    isValid: bhsResult.amount > 0,

    amount: bhsResult.amount,

    applicableBhsYear,

    yearTurning65,

    isLocked,

    basis: bhsResult.basis,

    annualGrowthRate:
      bhsResult.basis === "projected" ? BHS_PROJECTION_GROWTH_RATE : 0,
  };
}

export function getProjectedCohortBasicHealthcareSum({ dateOfBirth }) {
  const yearTurning65 = calculateYearTurningAge(dateOfBirth, 65);

  if (!yearTurning65) {
    return {
      isValid: false,
      amount: 0,
      yearTurning65: null,
      basis: "unavailable",
      isProjected: false,
      annualGrowthRate: 0,
    };
  }

  const bhsResult = getBasicHealthcareSumForYear(yearTurning65);

  return {
    isValid: bhsResult.amount > 0,

    amount: bhsResult.amount,

    yearTurning65,

    basis: bhsResult.basis,

    isProjected: bhsResult.basis === "projected",

    annualGrowthRate:
      bhsResult.basis === "projected" ? BHS_PROJECTION_GROWTH_RATE : 0,
  };
}

/* ========================================
   BHS BY YEAR
======================================== */

export function getBasicHealthcareSumForYear(year) {
  const safeYear = Number(year);

  if (!Number.isInteger(safeYear)) {
    return {
      amount: 0,
      basis: "unavailable",
    };
  }

  /*
   * Members who turned 65 in 2016 or earlier
   * use the confirmed $49,800 cohort limit.
   */
  if (safeYear <= 2016) {
    return {
      amount: CONFIRMED_BASIC_HEALTHCARE_SUMS[2016],

      basis: "confirmed",
    };
  }

  const confirmedAmount = CONFIRMED_BASIC_HEALTHCARE_SUMS[safeYear];

  if (confirmedAmount) {
    return {
      amount: confirmedAmount,
      basis: "confirmed",
    };
  }

  if (safeYear > LATEST_CONFIRMED_BHS_YEAR) {
    return {
      amount: calculateProjectedBasicHealthcareSum(safeYear),

      basis: "projected",
    };
  }

  return {
    amount: 0,
    basis: "unavailable",
  };
}

/* ========================================
   FUTURE BHS PROJECTION
======================================== */

export function calculateProjectedBasicHealthcareSum(targetYear) {
  const safeTargetYear = Number(targetYear);

  if (
    !Number.isInteger(safeTargetYear) ||
    safeTargetYear <= LATEST_CONFIRMED_BHS_YEAR
  ) {
    return getBasicHealthcareSumForYear(safeTargetYear).amount || 0;
  }

  let projectedAmount = LATEST_CONFIRMED_BHS;

  for (
    let year = LATEST_CONFIRMED_BHS_YEAR + 1;
    year <= safeTargetYear;
    year += 1
  ) {
    projectedAmount = roundToNearestIncrement(
      projectedAmount * (1 + BHS_PROJECTION_GROWTH_RATE / 100),

      BHS_PROJECTION_ROUNDING,
    );
  }

  return projectedAmount;
}

/* ========================================
   HELPERS
======================================== */

function calculateYearTurningAge(dateOfBirth, targetAge) {
  if (
    typeof dateOfBirth !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
  ) {
    return null;
  }

  const birthYear = Number(dateOfBirth.slice(0, 4));

  if (!Number.isInteger(birthYear)) {
    return null;
  }

  return birthYear + targetAge;
}

function roundToNearestIncrement(value, increment) {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(increment) ||
    increment <= 0
  ) {
    return 0;
  }

  return Math.round(value / increment) * increment;
}

function createInvalidBhsResult() {
  return {
    isValid: false,
    amount: 0,
    applicableBhsYear: null,
    yearTurning65: null,
    isLocked: false,
    basis: "unavailable",
    annualGrowthRate: 0,
  };
}