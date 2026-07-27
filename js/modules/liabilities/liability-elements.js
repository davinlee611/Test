"use strict";

/* ========================================
   LIABILITY ELEMENTS
======================================== */

export function getLiabilityElements() {
  return {
    addLiabilityButton: document.getElementById("addLiabilityButton"),

    emptyLiabilityMessage: document.getElementById("emptyLiabilityMessage"),

    totalLiabilitiesValue: document.getElementById("totalLiabilitiesValue"),

    liabilitiesList: document.getElementById("liabilitiesList"),

    liabilityModal: document.getElementById("liabilityModal"),

    liabilityForm: document.getElementById("liabilityForm"),

    liabilityModalTitle: document.getElementById("liabilityModalTitle"),

    editingLiabilityIdInput: document.getElementById("editingLiabilityId"),

    liabilityTypeInput: document.getElementById("liabilityType"),

    liabilityNameInput: document.getElementById("liabilityName"),

    liabilityOutstandingBalanceInput: document.getElementById(
      "liabilityOutstandingBalance",
    ),

    liabilityInterestRateInput: document.getElementById(
      "liabilityInterestRate",
    ),

    liabilityRepaymentEndDateInput: document.getElementById(
      "liabilityRepaymentEndDate",
    ),

    liabilityMonthlyRepaymentInput: document.getElementById(
      "liabilityMonthlyRepayment",
    ),

    liabilityMonthlyRepaymentSourceInput: document.getElementById(
      "liabilityMonthlyRepaymentSource",
    ),

    liabilityRepaymentHelper: document.getElementById(
      "liabilityRepaymentHelper",
    ),

    useEstimatedRepaymentButton: document.getElementById(
      "useEstimatedRepaymentButton",
    ),

    liabilityCpfPanel: document.getElementById("liabilityCpfPanel"),

    liabilityUsesCpfInput: document.getElementById("liabilityUsesCpf"),

    liabilityCpfAmountGroup: document.getElementById("liabilityCpfAmountGroup"),

    liabilityMonthlyCpfPaymentInput: document.getElementById(
      "liabilityMonthlyCpfPayment",
    ),

    liabilityMonthlyCashRepaymentValue: document.getElementById(
      "liabilityMonthlyCashRepaymentValue",
    ),

    liabilityFormMessage: document.getElementById("liabilityFormMessage"),

    closeLiabilityModalButton: document.getElementById(
      "closeLiabilityModalButton",
    ),

    cancelLiabilityButton: document.getElementById("cancelLiabilityButton"),

    liabilityModalBackdrop: document.querySelector(
      "[data-close-liability-modal]",
    ),
  };
}