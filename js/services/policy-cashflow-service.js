"use strict";

import { getPolicies } from "../state/client-plan.js";

/* ========================================
   POLICY CASH INFLOW
======================================== */

export function getPolicyCashInflow({
  projectionDate,

  dateOfBirth,

  policies = getPolicies(),
}) {
  if (!(projectionDate instanceof Date) || !Array.isArray(policies)) {
    return createEmptyResult();
  }

  const items = [];

  policies.forEach(function (policy) {
    const inflow = getPolicyInflow({
      policy,

      projectionDate,

      dateOfBirth,
    });

    if (inflow.amount <= 0) {
      return;
    }

    items.push({
      policyId: policy.id || "",

      policyName: policy.policyName || "Policy",

      policyType: policy.policyType,

      amount: inflow.amount,

      maturedThisMonth: inflow.maturedThisMonth,

      startedThisMonth: inflow.startedThisMonth,

      endedThisMonth: inflow.endedThisMonth,
    });
  });

  return {
    total: items.reduce(function (total, item) {
      return total + item.amount;
    }, 0),

    items,
  };
}

/* ========================================
   POLICY TYPE ROUTING
======================================== */

function getPolicyInflow({
  policy,

  projectionDate,

  dateOfBirth,
}) {
  if (policy?.policyType === "endowment") {
    return getEndowmentMaturityInflow(policy, projectionDate);
  }

  if (policy?.policyType === "retirement") {
    return getRetirementMonthlyInflow(policy, projectionDate, dateOfBirth);
  }

  return createEmptyPolicyInflow();
}

/* ========================================
   ENDOWMENT
======================================== */

function getEndowmentMaturityInflow(policy, projectionDate) {
  const maturityDate = parseYearMonth(policy.endowment?.maturityDate);

  if (!maturityDate) {
    return createEmptyPolicyInflow();
  }

  const isMaturityMonth =
    projectionDate.getFullYear() === maturityDate.year &&
    projectionDate.getMonth() === maturityDate.month;

  if (!isMaturityMonth) {
    return createEmptyPolicyInflow();
  }

  return {
    amount:
      getNonNegativeNumber(policy.endowment?.guaranteedMaturityAmount) +
      getNonNegativeNumber(policy.endowment?.projectedNonGuaranteedAmount),

    maturedThisMonth: true,

    startedThisMonth: false,

    endedThisMonth: false,
  };
}

/* ========================================
   RETIREMENT POLICY
======================================== */

function getRetirementMonthlyInflow(policy, projectionDate, dateOfBirth) {
  const retirement = policy.retirement || {};

  const startAge = getNonNegativeNumber(retirement.payoutStartAge);

  const monthlyIncome = getNonNegativeNumber(retirement.monthlyIncome);

  const birthDate = parseDateOfBirth(dateOfBirth);

  if (!birthDate || startAge <= 0 || monthlyIncome <= 0) {
    return createEmptyPolicyInflow();
  }

  /*
   * Projection rows represent the first day
   * of each month.
   *
   * If the birthday is later than the first
   * day, the client only reaches the payout
   * age during that month, so the first full
   * projected payout month is the following
   * month.
   */
  const birthdayMonthIndex = (birthDate.year + startAge) * 12 + birthDate.month;

  const startMonthIndex =
    birthDate.day === 1 ? birthdayMonthIndex : birthdayMonthIndex + 1;

  const projectionMonthIndex =
    projectionDate.getFullYear() * 12 + projectionDate.getMonth();

  const elapsedMonths = projectionMonthIndex - startMonthIndex;

  if (elapsedMonths < 0) {
    return createEmptyPolicyInflow();
  }

  const durationMonths = getNonNegativeNumber(retirement.payoutDurationMonths);

  const isLifetime = retirement.payoutTerm === "lifetime";

  const isLimitedAndPayable =
    retirement.payoutTerm === "limited" && elapsedMonths < durationMonths;

  if (!isLifetime && !isLimitedAndPayable) {
    return createEmptyPolicyInflow();
  }

  return {
    amount: monthlyIncome,

    maturedThisMonth: false,

    startedThisMonth: elapsedMonths === 0,

    endedThisMonth:
      retirement.payoutTerm === "limited" &&
      durationMonths > 0 &&
      elapsedMonths === durationMonths - 1,
  };
}

/* ========================================
   DATE HELPERS
======================================== */

function parseDateOfBirth(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),

    month: Number(match[2]) - 1,

    day: Number(match[3]),
  };
}

function parseYearMonth(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(value || "");

  if (!match) {
    return null;
  }

  const month = Number(match[2]) - 1;

  if (month < 0 || month > 11) {
    return null;
  }

  return {
    year: Number(match[1]),

    month,
  };
}

/* ========================================
   HELPERS
======================================== */

function getNonNegativeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return 0;
  }

  return number;
}

function createEmptyResult() {
  return {
    total: 0,

    items: [],
  };
}

function createEmptyPolicyInflow() {
  return {
    amount: 0,

    maturedThisMonth: false,

    startedThisMonth: false,

    endedThisMonth: false,
  };
}
