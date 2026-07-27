"use strict";

import { getWholeNumber } from "../../utils/client-utils.js";

/* ========================================
   READ FORM
======================================== */

export function readLiabilityFormData(elements) {
  return {
    liabilityType: elements.liabilityTypeInput?.value || "",

    liabilityName: elements.liabilityNameInput?.value.trim() || "",

    outstandingBalance: getWholeNumber(
      elements.liabilityOutstandingBalanceInput?.value,
    ),

    monthlyRepayment: getWholeNumber(
      elements.liabilityMonthlyRepaymentInput?.value,
    ),

    interestRate: Number(elements.liabilityInterestRateInput?.value) || 0,
  };
}

/* ========================================
   WRITE FORM
======================================== */

export function writeLiabilityFormData(elements, liability) {
  if (elements.editingLiabilityIdInput) {
    elements.editingLiabilityIdInput.value = liability?.id || "";
  }

  if (elements.liabilityTypeInput) {
    elements.liabilityTypeInput.value = liability?.type || "";
  }

  if (elements.liabilityNameInput) {
    elements.liabilityNameInput.value = liability?.name || "";
  }

  if (elements.liabilityOutstandingBalanceInput) {
    elements.liabilityOutstandingBalanceInput.value =
      liability?.outstandingBalance ?? "";
  }

  if (elements.liabilityMonthlyRepaymentInput) {
    elements.liabilityMonthlyRepaymentInput.value =
      liability?.monthlyRepayment ?? "";
  }

  if (elements.liabilityInterestRateInput) {
    elements.liabilityInterestRateInput.value = liability?.interestRate ?? "";
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
}