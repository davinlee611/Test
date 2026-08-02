"use strict";

import { getCommitments, getPolicies } from "../state/client-plan.js";

/* ========================================
   MONTHLY INSURANCE PREMIUM
======================================== */

export function getEffectiveMonthlyInsurancePremium() {
  const policies = getPolicies();

  /*
   * Once the Insurance Portfolio contains policies,
   * it takes precedence even when the cash premium
   * happens to be zero.
   */
  if (Array.isArray(policies) && policies.length > 0) {
    return calculatePortfolioMonthlyPremium(policies);
  }

  return getNonNegativeNumber(getCommitments()?.insurancePremiums);
}

/* ========================================
   INSURANCE PORTFOLIO
======================================== */

export function calculatePortfolioMonthlyPremium(policies = []) {
  if (!Array.isArray(policies)) {
    return 0;
  }

  return policies.reduce(function (runningTotal, policy) {
    return runningTotal + getPolicyMonthlyCashPremium(policy);
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

function getPolicyMonthlyCashPremium(policy) {
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