"use strict";

import { getWholeNumber } from "../../utils/client-utils.js";

import {
  LIABILITY_REPAYMENT_SOURCES,
  normalizeLiabilityType,
  PROPERTY_LOAN_TYPE,
} from "./liability-config.js";

/* ========================================
   READ FORM
======================================== */

export function readLiabilityFormData(elements) {
  const liabilityType = normalizeLiabilityType(
    elements.liabilityTypeInput?.value || "",
  );

  const monthlyRepayment = getWholeNumber(
    elements.liabilityMonthlyRepaymentInput?.value,
  );

  const cpfPaymentEnabled =
    liabilityType === PROPERTY_LOAN_TYPE &&
    Boolean(elements.liabilityUsesCpfInput?.checked);

  return {
    liabilityType,

    liabilityName: elements.liabilityNameInput?.value.trim() || "",

    outstandingBalance: getWholeNumber(
      elements.liabilityOutstandingBalanceInput?.value,
    ),

    interestRate: Number(elements.liabilityInterestRateInput?.value) || 0,

    repaymentEndDate: elements.liabilityRepaymentEndDateInput?.value || "",

    monthlyRepayment,

    monthlyRepaymentSource:
      elements.liabilityMonthlyRepaymentSourceInput?.value ||
      (monthlyRepayment > 0 ? LIABILITY_REPAYMENT_SOURCES.MANUAL : ""),

    /*
     * null means CPF payment was not selected.
     * 0 means it was selected but no valid amount
     * was entered, allowing validation to catch it.
     */
    monthlyCpfPayment: cpfPaymentEnabled
      ? getWholeNumber(elements.liabilityMonthlyCpfPaymentInput?.value)
      : null,
  };
}

/* ========================================
   WRITE FORM
======================================== */

export function writeLiabilityFormData(elements, liability) {
  const liabilityType = normalizeLiabilityType(liability?.type || "");

  const monthlyRepayment = getWholeNumber(liability?.monthlyRepayment);

  const monthlyCpfPayment = getWholeNumber(liability?.monthlyCpfPayment);

  const repaymentSource =
    liability?.monthlyRepaymentSource ||
    (monthlyRepayment > 0 ? LIABILITY_REPAYMENT_SOURCES.MANUAL : "");

  const hasCpfPayment =
    liabilityType === PROPERTY_LOAN_TYPE && monthlyCpfPayment > 0;

  if (elements.editingLiabilityIdInput) {
    elements.editingLiabilityIdInput.value = liability?.id || "";
  }

  if (elements.liabilityTypeInput) {
    elements.liabilityTypeInput.value = liabilityType;
  }

  if (elements.liabilityNameInput) {
    elements.liabilityNameInput.value = liability?.name || "";
  }

  if (elements.liabilityOutstandingBalanceInput) {
    elements.liabilityOutstandingBalanceInput.value =
      liability?.outstandingBalance ?? "";
  }

  if (elements.liabilityInterestRateInput) {
    elements.liabilityInterestRateInput.value = liability?.interestRate ?? "";
  }

  if (elements.liabilityRepaymentEndDateInput) {
    elements.liabilityRepaymentEndDateInput.value =
      liability?.repaymentEndDate || "";
  }

  if (elements.liabilityMonthlyRepaymentInput) {
    elements.liabilityMonthlyRepaymentInput.value = monthlyRepayment || "";
  }

  if (elements.liabilityMonthlyRepaymentSourceInput) {
    elements.liabilityMonthlyRepaymentSourceInput.value = repaymentSource;
  }

  if (elements.liabilityUsesCpfInput) {
    elements.liabilityUsesCpfInput.checked = hasCpfPayment;
  }

  if (elements.liabilityMonthlyCpfPaymentInput) {
    elements.liabilityMonthlyCpfPaymentInput.value = hasCpfPayment
      ? monthlyCpfPayment
      : "";
  }
}

/* ========================================
   CLEAR FORM
======================================== */

export function clearLiabilityForm(elements) {
  elements.liabilityForm?.reset();

  if (elements.editingLiabilityIdInput) {
    elements.editingLiabilityIdInput.value = "";
  }

  if (elements.liabilityMonthlyRepaymentSourceInput) {
    elements.liabilityMonthlyRepaymentSourceInput.value = "";
  }

  if (elements.liabilityMonthlyCpfPaymentInput) {
    elements.liabilityMonthlyCpfPaymentInput.value = "";
  }
}