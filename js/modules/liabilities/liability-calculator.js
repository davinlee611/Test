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

/* ========================================
   TOTAL OUTSTANDING LIABILITIES
======================================== */

export function calculateTotalLiabilities(liabilities) {
  if (!Array.isArray(liabilities)) {
    return 0;
  }

  return liabilities.reduce(function (total, liability) {
    return total + getLiabilityBalance(liability);
  }, 0);
}

/* ========================================
   TOTAL MONTHLY REPAYMENTS
======================================== */

export function calculateTotalMonthlyRepayments(liabilities) {
  if (!Array.isArray(liabilities)) {
    return 0;
  }

  return liabilities.reduce(function (total, liability) {
    return total + getLiabilityMonthlyRepayment(liability);
  }, 0);
}