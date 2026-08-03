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
    const amount = getPolicyInflowAmount({
      policy,

      projectionDate,

      dateOfBirth,
    });

    if (amount <= 0) {
      return;
    }

    items.push({
      policyId: policy.id || "",

      policyName: policy.policyName || "Policy",

      policyType: policy.policyType,

      amount,
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

function getPolicyInflowAmount({ policy, projectionDate, dateOfBirth }) {
  if (policy?.policyType === "endowment") {
    return getEndowmentMaturityInflow(policy, projectionDate);
  }

  if (policy?.policyType === "retirement") {
    return getRetirementMonthlyInflow(policy, projectionDate, dateOfBirth);
  }

  return 0;
}

/* ========================================
   ENDOWMENT
======================================== */

function getEndowmentMaturityInflow(policy, projectionDate) {
  const maturityDate = parseYearMonth(policy.endowment?.maturityDate);

  if (!maturityDate) {
    return 0;
  }

  const isMaturityMonth =
    projectionDate.getFullYear() === maturityDate.year &&
    projectionDate.getMonth() === maturityDate.month;

  if (!isMaturityMonth) {
    return 0;
  }

  return (
    getNonNegativeNumber(policy.endowment?.guaranteedMaturityAmount) +
    getNonNegativeNumber(policy.endowment?.projectedNonGuaranteedAmount)
  );
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
    return 0;
  }

  const startMonthIndex = (birthDate.year + startAge) * 12 + birthDate.month;

  const projectionMonthIndex =
    projectionDate.getFullYear() * 12 + projectionDate.getMonth();

  const elapsedMonths = projectionMonthIndex - startMonthIndex;

  if (elapsedMonths < 0) {
    return 0;
  }

  if (retirement.payoutTerm === "lifetime") {
    return monthlyIncome;
  }

  const durationMonths = getNonNegativeNumber(retirement.payoutDurationMonths);

  if (retirement.payoutTerm === "limited" && elapsedMonths < durationMonths) {
    return monthlyIncome;
  }

  return 0;
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
