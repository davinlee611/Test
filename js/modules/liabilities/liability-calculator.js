"use strict";

import { getWholeNumber } from "../../utils/client-utils.js";

/* ========================================
   LIABILITY BALANCE
======================================== */

export function getLiabilityBalance(liability) {
  return getWholeNumber(liability?.outstandingBalance);
}

/* ========================================
   MONTHLY REPAYMENT
======================================== */

export function getLiabilityMonthlyRepayment(liability) {
  return getWholeNumber(liability?.monthlyRepayment);
}

export function getLiabilityMonthlyCpfPayment(liability) {
  if (!liability?.usesCpf) {
    return 0;
  }

  return getWholeNumber(liability?.monthlyCpfPayment);
}

export function getLiabilityMonthlyCashRepayment(liability) {
  return Math.max(
    getLiabilityMonthlyRepayment(liability) -
      getLiabilityMonthlyCpfPayment(liability),
    0,
  );
}

/* ========================================
   REPAYMENT DATE
======================================== */

export function getRemainingRepaymentMonths(
  repaymentEndDate,
  referenceDate = new Date(),
) {
  const endDate = parseDateOnly(repaymentEndDate);

  if (!endDate) {
    return 0;
  }

  const startDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );

  if (endDate <= startDate) {
    return 0;
  }

  let months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  if (endDate.getDate() > startDate.getDate()) {
    months += 1;
  }

  return Math.max(months, 1);
}

export function isRepaymentEndDateInFuture(
  repaymentEndDate,
  referenceDate = new Date(),
) {
  return getRemainingRepaymentMonths(repaymentEndDate, referenceDate) > 0;
}

/* ========================================
   ESTIMATED MONTHLY REPAYMENT
======================================== */

export function calculateEstimatedMonthlyRepayment({
  outstandingBalance,
  annualInterestRate,
  repaymentEndDate,
  referenceDate = new Date(),
}) {
  const principal = Number(outstandingBalance);
  const annualRate = Number(annualInterestRate);

  const numberOfMonths = getRemainingRepaymentMonths(
    repaymentEndDate,
    referenceDate,
  );

  if (
    !Number.isFinite(principal) ||
    principal <= 0 ||
    !Number.isFinite(annualRate) ||
    annualRate < 0 ||
    numberOfMonths <= 0
  ) {
    return 0;
  }

  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    return Math.round(principal / numberOfMonths);
  }

  const growthFactor = Math.pow(1 + monthlyRate, numberOfMonths);

  return Math.round(
    (principal * monthlyRate * growthFactor) / (growthFactor - 1),
  );
}

/* ========================================
   TOTALS
======================================== */

export function calculateTotalLiabilities(liabilities) {
  if (!Array.isArray(liabilities)) {
    return 0;
  }

  return liabilities.reduce(function (total, liability) {
    return total + getLiabilityBalance(liability);
  }, 0);
}

export function calculateTotalMonthlyRepayments(liabilities) {
  if (!Array.isArray(liabilities)) {
    return 0;
  }

  return liabilities.reduce(function (total, liability) {
    return total + getLiabilityMonthlyRepayment(liability);
  }, 0);
}

export function calculateTotalMonthlyCpfRepayments(liabilities) {
  if (!Array.isArray(liabilities)) {
    return 0;
  }

  return liabilities.reduce(function (total, liability) {
    return total + getLiabilityMonthlyCpfPayment(liability);
  }, 0);
}

export function calculateTotalMonthlyCashRepayments(liabilities) {
  if (!Array.isArray(liabilities)) {
    return 0;
  }

  return liabilities.reduce(function (total, liability) {
    return total + getLiabilityMonthlyCashRepayment(liability);
  }, 0);
}

/* ========================================
   PRIVATE DATE PARSER
======================================== */

function parseDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}