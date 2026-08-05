"use strict";

/* ========================================
   MODAL FOCUS STATE
======================================== */

const previouslyFocusedElements = new WeakMap();

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/* ========================================
   OPEN / CLOSE
======================================== */

export function openModal(modal) {
  if (!modal) {
    return;
  }

  const activeElement = document.activeElement;

  if (activeElement instanceof HTMLElement) {
    previouslyFocusedElements.set(modal, activeElement);
  }

  modal.hidden = false;

  document.body.classList.add("modal-open");

  const firstFocusableElement = modal.querySelector(FOCUSABLE_SELECTOR);

  if (firstFocusableElement instanceof HTMLElement) {
    firstFocusableElement.focus();
  }
}

export function closeModal(modal) {
  if (!modal) {
    return;
  }

  modal.hidden = true;

  document.body.classList.remove("modal-open");

  const previouslyFocusedElement = previouslyFocusedElements.get(modal);

  if (
    previouslyFocusedElement instanceof HTMLElement &&
    previouslyFocusedElement.isConnected
  ) {
    previouslyFocusedElement.focus();
  }

  previouslyFocusedElements.delete(modal);
}

/* ========================================
   OVERLAY
======================================== */

export function closeModalOnOverlayClick(modal) {
  if (!modal) {
    return;
  }

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
}

/* ========================================
   KEYBOARD
======================================== */

export function closeModalOnEscape(modal) {
  if (!modal) {
    return;
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal(modal);
    }
  });
}