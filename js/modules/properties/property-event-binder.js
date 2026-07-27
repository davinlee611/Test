"use strict";

/* ========================================
   PROPERTY EVENT BINDER
======================================== */

export function bindPropertyEvents({
  elements,
  onAddProperty,
  onSubmitProperty,
  onCloseProperty,
}) {
  elements.addPropertyButton?.addEventListener("click", onAddProperty);

  elements.propertyForm?.addEventListener("submit", onSubmitProperty);

  elements.closePropertyModalButton?.addEventListener("click", onCloseProperty);

  elements.cancelPropertyButton?.addEventListener("click", onCloseProperty);

  elements.propertyModalBackdrop?.addEventListener("click", onCloseProperty);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      onCloseProperty();
    }
  });
}