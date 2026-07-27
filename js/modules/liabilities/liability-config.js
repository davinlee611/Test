"use strict";

/* ========================================
   LIABILITY TYPES
======================================== */

export const LIABILITY_TYPES = Object.freeze([
  Object.freeze({
    value: "property_loan",
    label: "Property Loan",
    iconClass: "fa-solid fa-house",
  }),
  Object.freeze({
    value: "car_loan",
    label: "Car Loan",
    iconClass: "fa-solid fa-car",
  }),
  Object.freeze({
    value: "personal_loan",
    label: "Personal Loan",
    iconClass: "fa-solid fa-money-bill-wave",
  }),
  Object.freeze({
    value: "business_loan",
    label: "Business Loan",
    iconClass: "fa-solid fa-briefcase",
  }),
  Object.freeze({
    value: "other",
    label: "Other Liability",
    iconClass: "fa-solid fa-file-invoice-dollar",
  }),
]);

export const PROPERTY_LOAN_TYPE = "property_loan";

export const LIABILITY_REPAYMENT_SOURCES = Object.freeze({
  MANUAL: "manual",
  CALCULATED: "calculated",
});

/* ========================================
   NUMERIC LIMITS
======================================== */

export const MINIMUM_OUTSTANDING_BALANCE = 1;
export const MINIMUM_MONTHLY_REPAYMENT = 1;
export const MINIMUM_INTEREST_RATE = 0;
export const MAXIMUM_INTEREST_RATE = 100;
export const MINIMUM_MONTHLY_CPF_PAYMENT = 1;

/* ========================================
   CONFIGURATION QUERIES
======================================== */

export function normalizeLiabilityType(type) {
  if (!type) {
    return "";
  }

  // Supports any older liability data created as "mortgage".
  if (type === "mortgage") {
    return PROPERTY_LOAN_TYPE;
  }

  return LIABILITY_TYPES.some((liabilityType) => liabilityType.value === type)
    ? type
    : "other";
}

export function getLiabilityType(type) {
  const normalizedType = normalizeLiabilityType(type);

  return (
    LIABILITY_TYPES.find(
      (liabilityType) => liabilityType.value === normalizedType,
    ) || LIABILITY_TYPES[LIABILITY_TYPES.length - 1]
  );
}

export function getLiabilityTypeLabel(type) {
  return getLiabilityType(type).label;
}

export function getLiabilityIconClass(type) {
  return getLiabilityType(type).iconClass;
}