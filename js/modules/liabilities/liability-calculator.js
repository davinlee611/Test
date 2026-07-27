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

export function normalizeRepaymentEndDate(
  value,
) {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  if (
    /^\d{4}-\d{2}$/.test(value)
  ) {
    return isValidMonthString(value)
      ? value
      : "";
  }

  /*
   * Compatibility with older liabilities
   * that stored a full YYYY-MM-DD date.
   */
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    const monthValue =
      value.slice(0, 7);

    return isValidMonthString(
      monthValue,
    )
      ? monthValue
      : "";
  }

  return "";
}

export function getRemainingRepaymentMonths(
  repaymentEndDate,
  referenceDate = new Date(),
) {
  const normalizedDate =
    normalizeRepaymentEndDate(
      repaymentEndDate,
    );

  if (!normalizedDate) {
    return 0;
  }

  const [targetYear, targetMonth] =
    normalizedDate
      .split("-")
      .map(Number);

  const currentYear =
    referenceDate.getFullYear();

  const currentMonth =
    referenceDate.getMonth() + 1;

  const monthDifference =
    (targetYear - currentYear) *
      12 +
    (targetMonth - currentMonth);

  /*
   * Include the selected repayment month.
   *
   * July 2026 to July 2036 is treated as
   * 121 monthly repayment periods.
   */
  return Math.max(
    monthDifference + 1,
    0,
  );
}

export function isRepaymentEndDateInFuture(
  repaymentEndDate,
  referenceDate = new Date(),
) {
  const normalizedDate =
    normalizeRepaymentEndDate(
      repaymentEndDate,
    );

  if (!normalizedDate) {
    return false;
  }

  const currentMonth =
    [
      referenceDate.getFullYear(),

      String(
        referenceDate.getMonth() + 1,
      ).padStart(2, "0"),
    ].join("-");

  return normalizedDate >
    currentMonth;
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
   PRIVATE DATE VALIDATION
======================================== */

function isValidMonthString(value) {
  const [year, month] =
    value.split("-").map(Number);

  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12
  );
}