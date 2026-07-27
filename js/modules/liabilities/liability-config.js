"use strict";

/* ========================================
   LIABILITY TYPES
======================================== */

export const LIABILITY_TYPE_LABELS = Object.freeze({
  mortgage: "Mortgage",

  car_loan: "Car Loan",

  personal_loan: "Personal Loan",

  education_loan: "Education Loan",

  credit_card: "Credit Card",

  business_loan: "Business Loan",

  other: "Other Liability",
});

export const LIABILITY_TYPE_ICONS = Object.freeze({
  mortgage: "fa-solid fa-house",

  car_loan: "fa-solid fa-car",

  personal_loan: "fa-solid fa-money-bill-wave",

  education_loan: "fa-solid fa-graduation-cap",

  credit_card: "fa-solid fa-credit-card",

  business_loan: "fa-solid fa-briefcase",

  other: "fa-solid fa-file-invoice-dollar",
});

/* ========================================
   NUMERIC LIMITS
======================================== */

export const MINIMUM_OUTSTANDING_BALANCE = 1;

export const MINIMUM_MONTHLY_REPAYMENT = 0;

export const MINIMUM_INTEREST_RATE = 0;

export const MAXIMUM_INTEREST_RATE = 100;

/* ========================================
   CONFIGURATION QUERIES
======================================== */

export function getLiabilityTypeLabel(type) {
  return LIABILITY_TYPE_LABELS[type] || LIABILITY_TYPE_LABELS.other;
}

export function getLiabilityIconClass(type) {
  return LIABILITY_TYPE_ICONS[type] || LIABILITY_TYPE_ICONS.other;
}