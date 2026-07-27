"use strict";

import {
  MAXIMUM_INTEREST_RATE,
  MINIMUM_INTEREST_RATE,
  MINIMUM_MONTHLY_CPF_PAYMENT,
  MINIMUM_MONTHLY_REPAYMENT,
  MINIMUM_OUTSTANDING_BALANCE,
  PROPERTY_LOAN_TYPE,
} from "./liability-config.js";

import { isRepaymentEndDateInFuture } from "./liability-calculator.js";

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

  if (
    formData.interestRate < MINIMUM_INTEREST_RATE ||
    formData.interestRate > MAXIMUM_INTEREST_RATE
  ) {
    return createInvalidResult(
      "interestRate",
      "Interest rate must be between 0% and 100%.",
    );
  }

  if (
    formData.repaymentEndDate &&
    !isRepaymentEndDateInFuture(formData.repaymentEndDate)
  ) {
    return createInvalidResult(
      "repaymentEndDate",
      "Repay By must be a future date.",
    );
  }

  if (formData.monthlyRepayment < MINIMUM_MONTHLY_REPAYMENT) {
    return createInvalidResult(
      "monthlyRepayment",
      "Please enter the monthly repayment or provide a Repay By date so it can be estimated.",
    );
  }

  const cpfPaymentSelected = formData.monthlyCpfPayment !== null;

  if (cpfPaymentSelected && formData.liabilityType !== PROPERTY_LOAN_TYPE) {
    return createInvalidResult(
      "monthlyCpfPayment",
      "CPF payment is only available for property loans.",
    );
  }

  if (
    cpfPaymentSelected &&
    formData.monthlyCpfPayment < MINIMUM_MONTHLY_CPF_PAYMENT
  ) {
    return createInvalidResult(
      "monthlyCpfPayment",
      "Please enter the monthly CPF payment.",
    );
  }

  if (
    cpfPaymentSelected &&
    formData.monthlyCpfPayment > formData.monthlyRepayment
  ) {
    return createInvalidResult(
      "monthlyCpfPayment",
      "Monthly CPF payment cannot exceed the monthly repayment.",
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