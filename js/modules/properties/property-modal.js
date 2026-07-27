"use strict";

import {
  clearPropertyForm,
  writePropertyFormData,
} from "./property-form-data.js";

/* ========================================
   PROPERTY MODAL
======================================== */

export function createPropertyModal({ elements }) {
  /* ========================================
     OPEN ADD
  ======================================== */

  function openAdd() {
    if (!elements.propertyModal || !elements.propertyForm) {
      return;
    }

    clearPropertyForm(elements);
    clearMessage();
    setTitle("Add Property");
    show();
  }

  /* ========================================
     OPEN EDIT
  ======================================== */

  function openEdit(property) {
    if (!property || !elements.propertyModal) {
      return;
    }

    writePropertyFormData(elements, property);

    clearMessage();
    setTitle("Edit Property");
    show();
  }

  /* ========================================
     CLOSE
  ======================================== */

  function close() {
    if (!elements.propertyModal) {
      return;
    }

    elements.propertyModal.hidden = true;

    document.body.classList.remove("property-modal-open");

    clearMessage();
  }

  function isOpen() {
    return Boolean(elements.propertyModal && !elements.propertyModal.hidden);
  }

  /* ========================================
     MESSAGE
  ======================================== */

  function showMessage(message) {
    if (elements.propertyFormMessage) {
      elements.propertyFormMessage.textContent = message;
    }
  }

  function clearMessage() {
    showMessage("");
  }

  /* ========================================
     FOCUS
  ======================================== */

  function focusField(field) {
    const fieldMap = {
      propertyType: elements.propertyTypeInput,

      marketValue: elements.propertyMarketValueInput,

      ownershipPercentage: elements.propertyOwnershipInput,
    };

    fieldMap[field]?.focus();
  }

  /* ========================================
     INTERNAL DISPLAY
  ======================================== */

  function show() {
    elements.propertyModal.hidden = false;

    document.body.classList.add("property-modal-open");

    elements.propertyTypeInput?.focus();
  }

  function setTitle(title) {
    if (elements.propertyModalTitle) {
      elements.propertyModalTitle.textContent = title;
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