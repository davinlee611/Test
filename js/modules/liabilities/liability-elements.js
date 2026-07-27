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

    liabilityMonthlyRepaymentInput: document.getElementById(
      "liabilityMonthlyRepayment",
    ),

    liabilityInterestRateInput: document.getElementById(
      "liabilityInterestRate",
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