"use strict";

/* ========================================
   PROPERTY ELEMENTS
======================================== */

export function getPropertyElements() {
  return {
    addPropertyButton: document.getElementById("addPropertyButton"),

    emptyPropertyMessage: document.getElementById("emptyPropertyMessage"),

    totalPropertyValue: document.getElementById("totalPropertyValue"),

    propertyModal: document.getElementById("propertyModal"),

    propertyForm: document.getElementById("propertyForm"),

    propertyList: document.getElementById("propertyList"),

    propertyModalTitle: document.getElementById("propertyModalTitle"),

    editingPropertyIdInput: document.getElementById("editingPropertyId"),

    propertyTypeInput: document.getElementById("propertyType"),

    propertyMarketValueInput: document.getElementById("propertyMarketValue"),

    propertyOwnershipInput: document.getElementById("propertyOwnership"),

    propertyFormMessage: document.getElementById("propertyFormMessage"),

    closePropertyModalButton: document.getElementById(
      "closePropertyModalButton",
    ),

    cancelPropertyButton: document.getElementById("cancelPropertyButton"),

    propertyModalBackdrop: document.querySelector(
      "[data-close-property-modal]",
    ),
  };
}