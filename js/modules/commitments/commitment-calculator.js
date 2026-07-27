"use strict";

import { getLiabilityMonthlyCashRepayment } from "../liabilities/liability-calculator.js";

/* ========================================
   LIABILITY REPAYMENTS
======================================== */

export function calculateMonthlyLiabilityRepayments(liabilities) {
  if (!Array.isArray(liabilities)) {
    return 0;
  }

  return liabilities.reduce(function (total, liability) {
    return total + getLiabilityMonthlyCashRepayment(liability);
  }, 0);
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