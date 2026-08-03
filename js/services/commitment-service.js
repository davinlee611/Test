"use strict";

import {
  getClientProfile,
  getCommitments,
  getPolicies,
} from "../state/client-plan.js";

/* ========================================
   MONTHLY INSURANCE PREMIUM
======================================== */

export function getEffectiveMonthlyInsurancePremium(
  projectionDate = new Date(),
) {
  const policies = getPolicies();

  if (Array.isArray(policies) && policies.length > 0) {
    return calculatePortfolioMonthlyPremium(
      policies,
      projectionDate,
      getClientProfile().dateOfBirth,
    );
  }

  return getNonNegativeNumber(getCommitments()?.insurancePremiums);
}

/* ========================================
   INSURANCE PORTFOLIO
======================================== */

export function calculatePortfolioMonthlyPremium(
  policies = [],
  projectionDate = new Date(),
  dateOfBirth = getClientProfile().dateOfBirth,
) {
  if (!Array.isArray(policies)) {
    return 0;
  }

  return policies.reduce(function (runningTotal, policy) {
    return (
      runningTotal +
      getPolicyMonthlyCashPremium(policy, projectionDate, dateOfBirth)
    );
  }, 0);
}

/* ========================================
   MONTHLY MEDISAVE INSURANCE OUTFLOW
======================================== */

export function getMonthlyInsuranceMedisaveOutflow() {
  const policies = getPolicies();

  if (!Array.isArray(policies)) {
    return 0;
  }

  return calculatePortfolioMonthlyMedisaveOutflow(
    policies,
  );
}

export function calculatePortfolioMonthlyMedisaveOutflow(
  policies = [],
) {
  if (!Array.isArray(policies)) {
    return 0;
  }

  const annualMedisaveOutflow =
    policies.reduce(
      function (runningTotal, policy) {
        return (
          runningTotal +
          getPolicyAnnualMedisavePremium(
            policy,
          )
        );
      },
      0,
    );

  return annualMedisaveOutflow / 12;
}

function getPolicyAnnualMedisavePremium(
  policy,
) {
  if (
    policy?.policyType ===
    "hospitalisation"
  ) {
    return getNonNegativeNumber(
      policy.hospitalisation
        ?.premiumPayment
        ?.medisaveAmount,
    );
  }

  if (
    policy?.policyType ===
    "long_term_care"
  ) {
    return getNonNegativeNumber(
      policy.longTermCare
        ?.premiumPayment
        ?.medisaveAmount,
    );
  }

  return 0;
}

/* ========================================
   PREMIUM CONVERSION
======================================== */

function getPolicyMonthlyCashPremium(policy, projectionDate, dateOfBirth) {
  if (!isPolicyPremiumPayable(policy, projectionDate, dateOfBirth)) {
    return 0;
  }

  if (policy?.policyType === "hospitalisation") {
    const annualCashAmount = getNonNegativeNumber(
      policy.hospitalisation?.premiumPayment?.cashAmount,
    );

    return annualCashAmount / 12;
  }

  if (policy?.policyType === "long_term_care") {
    const annualCashAmount = getNonNegativeNumber(
      policy.longTermCare?.premiumPayment?.cashAmount,
    );

    return annualCashAmount / 12;
  }

  return convertPremiumToMonthly(policy?.premium);
}

function isPolicyPremiumPayable(policy, projectionDate, dateOfBirth) {
  if (policy?.status === "paid_up") {
    return false;
  }

  if (!(projectionDate instanceof Date)) {
    return false;
  }

  const effectiveEndDate = getEffectivePremiumEndDate(policy, dateOfBirth);

  /*
   * No end date means an Active policy
   * continues throughout the projection.
   *
   * A Limited-Pay policy without its
   * required end date is not counted.
   */
  if (!effectiveEndDate) {
    return policy?.status === "active";
  }

  const projectionMonth =
    projectionDate.getFullYear() * 12 + projectionDate.getMonth();

  const finalPremiumMonth = effectiveEndDate.year * 12 + effectiveEndDate.month;

  return projectionMonth <= finalPremiumMonth;
}

function getEffectivePremiumEndDate(policy, dateOfBirth) {
  const recordedPremiumEndDate = parseYearMonth(policy?.premiumPaymentEndDate);

  const coverageEndDate = getPolicyCoverageEndDate(policy, dateOfBirth);

  /*
   * Limited-pay uses the earlier of the
   * premium end and coverage end.
   */
  if (policy?.status === "limited_pay") {
    return getEarlierYearMonth(recordedPremiumEndDate, coverageEndDate);
  }

  /*
   * Whole Life regular-pay can optionally
   * have a recorded premium end date.
   */
  if (recordedPremiumEndDate) {
    return getEarlierYearMonth(recordedPremiumEndDate, coverageEndDate);
  }

  /*
   * Term and Disability Income regular-pay
   * default to their coverage end.
   */
  return coverageEndDate;
}

function getPolicyCoverageEndDate(policy, dateOfBirth) {
  if (policy?.policyType === "term") {
    return parseYearMonth(policy.coverageEndDate);
  }

  if (policy?.policyType === "disability_income") {
    return getCoverageEndDateFromAge({
      dateOfBirth,

      coverageEndAge: policy.coverageEndAge,
    });
  }

  return null;
}

function getEarlierYearMonth(firstDate, secondDate) {
  if (!firstDate) {
    return secondDate;
  }

  if (!secondDate) {
    return firstDate;
  }

  const firstMonth = firstDate.year * 12 + firstDate.month;

  const secondMonth = secondDate.year * 12 + secondDate.month;

  return firstMonth <= secondMonth ? firstDate : secondDate;
}

function getCoverageEndDateFromAge({ dateOfBirth, coverageEndAge }) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth || "");

  const age = Number(coverageEndAge);

  if (!match || !Number.isInteger(age) || age <= 0) {
    return null;
  }

  return {
    year: Number(match[1]) + age,

    month: Number(match[2]) - 1,
  };
}

function parseYearMonth(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(value || "");

  if (!match) {
    return null;
  }

  const year = Number(match[1]);

  const month = Number(match[2]) - 1;

  if (month < 0 || month > 11) {
    return null;
  }

  return {
    year,
    month,
  };
}

export function convertPremiumToMonthly(premium) {
  const amount = getNonNegativeNumber(premium?.amount);

  if (amount <= 0) {
    return 0;
  }

  switch (premium?.frequency) {
    case "monthly":
      return amount;

    case "quarterly":
      return amount / 3;

    case "half_yearly":
      return amount / 6;

    case "annual":
      return amount / 12;

    default:
      return 0;
  }
}

/* ========================================
   HELPERS
======================================== */

function getNonNegativeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return number;
}