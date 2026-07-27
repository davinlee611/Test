"use strict";

/* ========================================
   LIABILITY EVENT BINDER
======================================== */

export function bindLiabilityEvents({
  elements,

  onAddLiability,

  onSubmitLiability,

  onCloseLiability,
}) {
  elements.addLiabilityButton?.addEventListener("click", onAddLiability);

  elements.liabilityForm?.addEventListener("submit", onSubmitLiability);

  elements.closeLiabilityModalButton?.addEventListener(
    "click",
    onCloseLiability,
  );

  elements.cancelLiabilityButton?.addEventListener("click", onCloseLiability);

  elements.liabilityModalBackdrop?.addEventListener("click", onCloseLiability);

  document.addEventListener("keydown", function handleLiabilityKeydown(event) {
    if (event.key === "Escape") {
      onCloseLiability();
    }
  });
}