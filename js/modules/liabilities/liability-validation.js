"use strict";

import {
  MAXIMUM_INTEREST_RATE,
  MINIMUM_INTEREST_RATE,
  MINIMUM_MONTHLY_REPAYMENT,
  MINIMUM_OUTSTANDING_BALANCE,
} from "./liability-config.js";

/* ========================================
   LIABILITY VALIDATION
======================================== */

export function validateLiabilityDraft(formData) {
  if (!formData.liabilityType) {
    return createInvalidResult(
      "liabilityType",
      "Please select a liability type.",
    );
  }

  if (!formData.liabilityName) {
    return createInvalidResult(
      "liabilityName",
      "Please enter a liability name.",
    );
  }

  if (formData.outstandingBalance < MINIMUM_OUTSTANDING_BALANCE) {
    return createInvalidResult(
      "outstandingBalance",
      "Please enter the outstanding balance.",
    );
  }

  if (formData.monthlyRepayment < MINIMUM_MONTHLY_REPAYMENT) {
    return createInvalidResult(
      "monthlyRepayment",
      "Monthly repayment cannot be negative.",
    );
  }

  if (
    formData.interestRate < MINIMUM_INTEREST_RATE ||
    formData.interestRate > MAXIMUM_INTEREST_RATE
  ) {
    return createInvalidResult(
      "interestRate",
      "Interest rate must be between 0% and 100%.",
    );
  }

  return {
    isValid: true,
    field: "",
    message: "",
  };
}

/* ========================================
   INVALID RESULT
======================================== */

function createInvalidResult(field, message) {
  return {
    isValid: false,
    field,
    message,
  };
}