"use strict";

import { getCommitments, getPolicies } from "../state/client-plan.js";

/* ========================================
   MONTHLY INSURANCE PREMIUM
======================================== */

export function getEffectiveMonthlyInsurancePremium(
  projectionDate = new Date(),
) {
  const policies = getPolicies();

  if (Array.isArray(policies) && policies.length > 0) {
    return calculatePortfolioMonthlyPremium(policies, projectionDate);
  }

  return getNonNegativeNumber(getCommitments()?.insurancePremiums);
}

/* ========================================
   INSURANCE PORTFOLIO
======================================== */

export function calculatePortfolioMonthlyPremium(
  policies = [],
  projectionDate = new Date(),
) {
  if (!Array.isArray(policies)) {
    return 0;
  }

  return policies.reduce(function (runningTotal, policy) {
    return runningTotal + getPolicyMonthlyCashPremium(policy, projectionDate);
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

function getPolicyMonthlyCashPremium(policy, projectionDate) {
  if (!isPolicyPremiumPayable(policy, projectionDate)) {
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

function isPolicyPremiumPayable(policy, projectionDate) {
  if (policy?.status === "paid_up") {
    return false;
  }

  if (policy?.status !== "limited_pay") {
    return true;
  }

  const endDate = parseYearMonth(policy.premiumPaymentEndDate);

  if (!endDate || !(projectionDate instanceof Date)) {
    return false;
  }

  const projectionMonth =
    projectionDate.getFullYear() * 12 + projectionDate.getMonth();

  const finalPremiumMonth = endDate.year * 12 + endDate.month;

  return projectionMonth <= finalPremiumMonth;
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