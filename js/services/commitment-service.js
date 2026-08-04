"use strict";

import {
  getClientProfile,
  getCommitments,
  getPolicies,
} from "../state/client-plan.js";

import { getHospitalisationAwl } from "../modules/insurance/hospitalisation-premium.js";

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

export function getMonthlyInsuranceMedisaveOutflow(
  projectionDate = new Date(),
) {
  const policies = getPolicies();

  if (!Array.isArray(policies)) {
    return 0;
  }

  return calculatePortfolioMonthlyMedisaveOutflow(
    policies,
    projectionDate,
    getClientProfile().dateOfBirth,
  );
}

export function calculatePortfolioMonthlyMedisaveOutflow(
  policies = [],
  projectionDate = new Date(),
  dateOfBirth = getClientProfile().dateOfBirth,
) {
  if (!Array.isArray(policies)) {
    return 0;
  }

  const annualMedisaveOutflow = policies.reduce(function (
    runningTotal,
    policy,
  ) {
    return (
      runningTotal +
      getPolicyAnnualMedisavePremium({
        policy,
        projectionDate,
        dateOfBirth,
      })
    );
  }, 0);

  return annualMedisaveOutflow / 12;
}

function getPolicyAnnualMedisavePremium({
  policy,
  projectionDate,
  dateOfBirth,
}) {
  if (policy?.policyType === "hospitalisation") {
    return getProjectedHospitalisationPayment({
      policy,
      projectionDate,
      dateOfBirth,
    }).medisaveAmount;
  }

  if (policy?.policyType === "long_term_care") {
    return getNonNegativeNumber(
      policy.longTermCare?.premiumPayment?.medisaveAmount,
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
    const projectedPayment = getProjectedHospitalisationPayment({
      policy,
      projectionDate,
      dateOfBirth,
    });

    return projectedPayment.cashAmount / 12;
  }

  if (policy?.policyType === "long_term_care") {
    const annualCashAmount = getNonNegativeNumber(
      policy.longTermCare?.premiumPayment?.cashAmount,
    );

    return annualCashAmount / 12;
  }

  return convertPremiumToMonthly(policy?.premium);
}

function getProjectedHospitalisationPayment({
  policy,
  projectionDate,
  dateOfBirth,
}) {
  const annualBasePremium = getNonNegativeNumber(policy?.premium?.amount);

  const annualRiderPremium =
    policy?.hospitalisation?.rider?.included === true
      ? getNonNegativeNumber(policy.hospitalisation?.rider?.annualPremium)
      : 0;

  const recordedMedisaveAmount = getNonNegativeNumber(
    policy?.hospitalisation?.premiumPayment?.medisaveAmount,
  );

  const currentAge = calculateAgeOnDate(dateOfBirth, new Date());

  const projectedAge = calculateAgeOnDate(dateOfBirth, projectionDate);

  if (currentAge === null || projectedAge === null) {
    const medisaveAmount = Math.min(recordedMedisaveAmount, annualBasePremium);

    return {
      medisaveAmount,

      cashAmount: Math.max(
        annualBasePremium + annualRiderPremium - medisaveAmount,
        0,
      ),
    };
  }

  const currentAwl = getHospitalisationAwl(currentAge);

  const projectedAwl = getHospitalisationAwl(projectedAge);

  /*
   * Preserve the insurer's recorded MediSave
   * amount while the client remains in the
   * current AWL age band.
   *
   * When the client enters another age band,
   * use that projected AWL, capped by the
   * recorded base-plan premium.
   */
  const projectedMedisaveAmount =
    projectedAwl === currentAwl
      ? Math.min(recordedMedisaveAmount, annualBasePremium)
      : Math.min(projectedAwl, annualBasePremium);

  return {
    medisaveAmount: projectedMedisaveAmount,

    cashAmount: Math.max(
      annualBasePremium + annualRiderPremium - projectedMedisaveAmount,
      0,
    ),
  };
}

function calculateAgeOnDate(dateOfBirth, referenceDate) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth || "") ||
    !(referenceDate instanceof Date) ||
    Number.isNaN(referenceDate.getTime())
  ) {
    return null;
  }

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);

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