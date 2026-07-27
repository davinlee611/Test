"use strict";

import {
  calculateTotalMonthlyCashRepayments,
  calculateTotalMonthlyCpfRepayments,
} from "../liabilities/liability-calculator.js";

/* ========================================
   LIABILITY REPAYMENTS
======================================== */

export function calculateMonthlyLiabilityRepayments(liabilities) {
  return calculateTotalMonthlyCashRepayments(liabilities);
}

export function calculateMonthlyCpfLiabilityRepayments(liabilities) {
  return calculateTotalMonthlyCpfRepayments(liabilities);
}

/* ========================================
   TOTAL MONTHLY COMMITMENTS
======================================== */

export function calculateTotalMonthlyCommitments({ commitments, liabilities }) {
  return (
    getValidCommitmentAmount(commitments?.insurancePremiums) +
    calculateMonthlyLiabilityRepayments(liabilities)
  );
}

export function calculateTotalMonthlyCpfCommitments({ liabilities }) {
  return calculateMonthlyCpfLiabilityRepayments(liabilities);
}

/* ========================================
   TOTAL ANNUAL COMMITMENTS
======================================== */

export function calculateTotalAnnualCommitments({ commitments, liabilities }) {
  return (
    calculateTotalMonthlyCommitments({
      commitments,
      liabilities,
    }) * 12
  );
}

export function calculateTotalAnnualCpfCommitments({ liabilities }) {
  return (
    calculateTotalMonthlyCpfCommitments({
      liabilities,
    }) * 12
  );
}

/* ========================================
   AMOUNT NORMALISATION
======================================== */

function getValidCommitmentAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return amount;
}