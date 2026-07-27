"use strict";

/* ========================================
   LIABILITY EVENT BINDER
======================================== */

export function bindLiabilityEvents({
  elements,
  onAddLiability,
  onSubmitLiability,
  onCloseLiability,
  onLiabilityTypeChange,
  onRepaymentInputsChange,
  onMonthlyRepaymentInput,
  onUseEstimatedRepayment,
  onCpfUsageChange,
  onCpfAmountInput,
}) {
  elements.addLiabilityButton?.addEventListener("click", onAddLiability);

  elements.liabilityForm?.addEventListener("submit", onSubmitLiability);

  elements.closeLiabilityModalButton?.addEventListener(
    "click",
    onCloseLiability,
  );

  elements.cancelLiabilityButton?.addEventListener("click", onCloseLiability);

  elements.liabilityModalBackdrop?.addEventListener("click", onCloseLiability);

  elements.liabilityTypeInput?.addEventListener(
    "change",
    onLiabilityTypeChange,
  );

  [
    elements.liabilityOutstandingBalanceInput,
    elements.liabilityInterestRateInput,
    elements.liabilityRepaymentEndDateInput,
  ].forEach((input) => {
    input?.addEventListener("input", onRepaymentInputsChange);

    input?.addEventListener("change", onRepaymentInputsChange);
  });

  elements.liabilityMonthlyRepaymentInput?.addEventListener(
    "input",
    onMonthlyRepaymentInput,
  );

  elements.useEstimatedRepaymentButton?.addEventListener(
    "click",
    onUseEstimatedRepayment,
  );

  elements.liabilityUsesCpfInput?.addEventListener("change", onCpfUsageChange);

  elements.liabilityMonthlyCpfPaymentInput?.addEventListener(
    "input",
    onCpfAmountInput,
  );

  document.addEventListener("keydown", function handleLiabilityKeydown(event) {
    if (event.key === "Escape") {
      onCloseLiability();
    }
  });
}