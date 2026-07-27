"use strict";

import { formatCurrency } from "../../utils/client-utils.js";

import {
  calculateEstimatedMonthlyRepayment,
  getLiabilityMonthlyCashRepayment,
} from "./liability-calculator.js";

import {
  LIABILITY_REPAYMENT_SOURCES,
  PROPERTY_LOAN_TYPE,
} from "./liability-config.js";

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

    resetRepaymentState();

    updateCpfVisibility();

    updateCpfAmountVisibility();

    updateCashRepaymentPreview();

    updateRepaymentHelper();

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

    updateCpfVisibility();

    updateCpfAmountVisibility();

    updateCashRepaymentPreview();

    updateRepaymentHelper();

    show();
  }

  /* ========================================
     LIABILITY TYPE
  ======================================== */

  function handleLiabilityTypeChange() {
    updateCpfVisibility();

    updateCpfAmountVisibility();

    updateCashRepaymentPreview();
  }

  function isPropertyLoanSelected() {
    return elements.liabilityTypeInput?.value === PROPERTY_LOAN_TYPE;
  }

  /* ========================================
     REPAYMENT INPUT CHANGES
  ======================================== */

  function handleRepaymentInputsChange() {
    const repaymentSource = getRepaymentSource();

    if (repaymentSource !== LIABILITY_REPAYMENT_SOURCES.MANUAL) {
      applyEstimatedRepayment();
    } else {
      updateRepaymentHelper();
    }

    updateCashRepaymentPreview();
  }

  function handleMonthlyRepaymentInput() {
    const monthlyRepayment = getMonthlyRepaymentInputValue();

    if (monthlyRepayment > 0) {
      setRepaymentSource(LIABILITY_REPAYMENT_SOURCES.MANUAL);
    } else {
      setRepaymentSource("");

      applyEstimatedRepayment();
    }

    updateRepaymentHelper();

    updateCashRepaymentPreview();
  }

  function useEstimatedRepayment() {
    setRepaymentSource(LIABILITY_REPAYMENT_SOURCES.CALCULATED);

    applyEstimatedRepayment({
      force: true,
    });

    updateCashRepaymentPreview();
  }

  /* ========================================
     REPAYMENT ESTIMATE
  ======================================== */

  function applyEstimatedRepayment({ force = false } = {}) {
    const repaymentSource = getRepaymentSource();

    if (!force && repaymentSource === LIABILITY_REPAYMENT_SOURCES.MANUAL) {
      updateRepaymentHelper();

      return;
    }

    const estimatedRepayment = calculateCurrentEstimatedRepayment();

    if (estimatedRepayment <= 0) {
      if (repaymentSource === LIABILITY_REPAYMENT_SOURCES.CALCULATED) {
        setMonthlyRepaymentInputValue("");
        setRepaymentSource("");
      }

      updateRepaymentHelper();

      return;
    }

    setMonthlyRepaymentInputValue(estimatedRepayment);

    setRepaymentSource(LIABILITY_REPAYMENT_SOURCES.CALCULATED);

    updateRepaymentHelper();
  }

  function calculateCurrentEstimatedRepayment() {
    return calculateEstimatedMonthlyRepayment({
      outstandingBalance: elements.liabilityOutstandingBalanceInput?.value,

      annualInterestRate: elements.liabilityInterestRateInput?.value,

      repaymentEndDate: elements.liabilityRepaymentEndDateInput?.value,
    });
  }

  function canCalculateEstimatedRepayment() {
    return calculateCurrentEstimatedRepayment() > 0;
  }

  /* ========================================
     REPAYMENT SOURCE
  ======================================== */

  function getRepaymentSource() {
    return elements.liabilityMonthlyRepaymentSourceInput?.value || "";
  }

  function setRepaymentSource(source) {
    if (elements.liabilityMonthlyRepaymentSourceInput) {
      elements.liabilityMonthlyRepaymentSourceInput.value = source;
    }
  }

  function resetRepaymentState() {
    setRepaymentSource("");

    setMonthlyRepaymentInputValue("");
  }

  /* ========================================
     REPAYMENT FIELD
  ======================================== */

  function getMonthlyRepaymentInputValue() {
    return Math.max(
      Number(elements.liabilityMonthlyRepaymentInput?.value) || 0,
      0,
    );
  }

  function setMonthlyRepaymentInputValue(value) {
    if (!elements.liabilityMonthlyRepaymentInput) {
      return;
    }

    elements.liabilityMonthlyRepaymentInput.value = value || "";
  }

  /* ========================================
     REPAYMENT HELPER
  ======================================== */

  function updateRepaymentHelper() {
    const repaymentSource = getRepaymentSource();

    const canEstimate = canCalculateEstimatedRepayment();

    const estimatedRepayment = calculateCurrentEstimatedRepayment();

    if (elements.liabilityRepaymentHelper) {
      elements.liabilityRepaymentHelper.textContent = getRepaymentHelperText({
        repaymentSource,
        canEstimate,
        estimatedRepayment,
      });
    }

    updateUseEstimatedButton({
      repaymentSource,
      canEstimate,
    });
  }

  function getRepaymentHelperText({
    repaymentSource,
    canEstimate,
    estimatedRepayment,
  }) {
    if (repaymentSource === LIABILITY_REPAYMENT_SOURCES.CALCULATED) {
      return (
        "Estimated from the outstanding balance, " +
        "interest rate and repayment date."
      );
    }

    if (repaymentSource === LIABILITY_REPAYMENT_SOURCES.MANUAL && canEstimate) {
      return (
        "Using the manually entered repayment. " +
        `Estimated repayment: ${formatCurrency(estimatedRepayment)}.`
      );
    }

    if (repaymentSource === LIABILITY_REPAYMENT_SOURCES.MANUAL) {
      return "Using the manually entered repayment.";
    }

    return (
      "Enter the outstanding balance, interest " +
      "rate and Repay By date to estimate the " +
      "monthly repayment."
    );
  }

  function updateUseEstimatedButton({ repaymentSource, canEstimate }) {
    if (!elements.useEstimatedRepaymentButton) {
      return;
    }

    elements.useEstimatedRepaymentButton.hidden = !(
      repaymentSource === LIABILITY_REPAYMENT_SOURCES.MANUAL && canEstimate
    );
  }

  /* ========================================
     CPF USAGE
  ======================================== */

  function handleCpfUsageChange() {
    updateCpfAmountVisibility();

    updateCashRepaymentPreview();
  }

  function handleCpfAmountInput() {
    updateCashRepaymentPreview();
  }

  function updateCpfVisibility() {
    const isPropertyLoan = isPropertyLoanSelected();

    if (elements.liabilityCpfPanel) {
      elements.liabilityCpfPanel.hidden = !isPropertyLoan;
    }

    if (!isPropertyLoan) {
      clearCpfFields();
    }
  }

  function updateCpfAmountVisibility() {
    const shouldShowCpfAmount =
      isPropertyLoanSelected() &&
      Boolean(elements.liabilityUsesCpfInput?.checked);

    if (elements.liabilityCpfAmountGroup) {
      elements.liabilityCpfAmountGroup.hidden = !shouldShowCpfAmount;
    }

    if (!shouldShowCpfAmount && elements.liabilityMonthlyCpfPaymentInput) {
      elements.liabilityMonthlyCpfPaymentInput.value = "";
    }
  }

  function clearCpfFields() {
    if (elements.liabilityUsesCpfInput) {
      elements.liabilityUsesCpfInput.checked = false;
    }

    if (elements.liabilityMonthlyCpfPaymentInput) {
      elements.liabilityMonthlyCpfPaymentInput.value = "";
    }

    if (elements.liabilityCpfAmountGroup) {
      elements.liabilityCpfAmountGroup.hidden = true;
    }
  }

  /* ========================================
     CASH REPAYMENT PREVIEW
  ======================================== */

  function updateCashRepaymentPreview() {
    if (!elements.liabilityMonthlyCashRepaymentValue) {
      return;
    }

    const liabilityPreview = {
      monthlyRepayment: getMonthlyRepaymentInputValue(),

      usesCpf:
        isPropertyLoanSelected() &&
        Boolean(elements.liabilityUsesCpfInput?.checked),

      monthlyCpfPayment: Math.max(
        Number(elements.liabilityMonthlyCpfPaymentInput?.value) || 0,
        0,
      ),
    };

    const monthlyCashRepayment =
      getLiabilityMonthlyCashRepayment(liabilityPreview);

    elements.liabilityMonthlyCashRepaymentValue.textContent =
      formatCurrency(monthlyCashRepayment);
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

      interestRate: elements.liabilityInterestRateInput,

      repaymentEndDate: elements.liabilityRepaymentEndDateInput,

      monthlyRepayment: elements.liabilityMonthlyRepaymentInput,

      usesCpf: elements.liabilityUsesCpfInput,

      monthlyCpfPayment: elements.liabilityMonthlyCpfPaymentInput,
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

    handleLiabilityTypeChange,

    handleRepaymentInputsChange,

    handleMonthlyRepaymentInput,

    useEstimatedRepayment,

    handleCpfUsageChange,

    handleCpfAmountInput,
  };
}