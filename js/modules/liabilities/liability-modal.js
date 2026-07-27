"use strict";

import {
  clearLiabilityForm,
  writeLiabilityFormData,
} from "./liability-form-data.js";

/* ========================================
   LIABILITY MODAL
======================================== */

export function createLiabilityModal({ elements }) {
  /* ========================================
     OPEN ADD
  ======================================== */

  function openAdd() {
    if (!elements.liabilityModal || !elements.liabilityForm) {
      return;
    }

    clearLiabilityForm(elements);

    clearMessage();

    setTitle("Add Liability");

    show();
  }

  /* ========================================
     OPEN EDIT
  ======================================== */

  function openEdit(liability) {
    if (!liability || !elements.liabilityModal) {
      return;
    }

    writeLiabilityFormData(elements, liability);

    clearMessage();

    setTitle("Edit Liability");

    show();
  }

  /* ========================================
     CLOSE
  ======================================== */

  function close() {
    if (!elements.liabilityModal) {
      return;
    }

    elements.liabilityModal.hidden = true;

    document.body.classList.remove("liability-modal-open");

    clearMessage();
  }

  function isOpen() {
    return Boolean(elements.liabilityModal && !elements.liabilityModal.hidden);
  }

  /* ========================================
     FORM MESSAGE
  ======================================== */

  function showMessage(message) {
    if (elements.liabilityFormMessage) {
      elements.liabilityFormMessage.textContent = message;
    }
  }

  function clearMessage() {
    showMessage("");
  }

  /* ========================================
     FIELD FOCUS
  ======================================== */

  function focusField(field) {
    const fieldMap = {
      liabilityType: elements.liabilityTypeInput,

      liabilityName: elements.liabilityNameInput,

      outstandingBalance: elements.liabilityOutstandingBalanceInput,

      monthlyRepayment: elements.liabilityMonthlyRepaymentInput,

      interestRate: elements.liabilityInterestRateInput,
    };

    fieldMap[field]?.focus();
  }

  /* ========================================
     INTERNAL DISPLAY
  ======================================== */

  function show() {
    elements.liabilityModal.hidden = false;

    document.body.classList.add("liability-modal-open");

    elements.liabilityTypeInput?.focus();
  }

  function setTitle(title) {
    if (elements.liabilityModalTitle) {
      elements.liabilityModalTitle.textContent = title;
    }
  }

  return {
    openAdd,

    openEdit,

    close,

    isOpen,

    showMessage,

    clearMessage,

    focusField,
  };
}