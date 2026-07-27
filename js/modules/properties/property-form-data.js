"use strict";

import { getWholeNumber } from "../../utils/client-utils.js";

import { DEFAULT_OWNERSHIP_PERCENTAGE } from "./property-config.js";

/* ========================================
   READ FORM
======================================== */

export function readPropertyFormData(elements) {
  return {
    propertyType: elements.propertyTypeInput?.value || "",

    marketValue: getWholeNumber(elements.propertyMarketValueInput?.value),

    ownershipPercentage: getWholeNumber(elements.propertyOwnershipInput?.value),
  };
}

/* ========================================
   WRITE FORM
======================================== */

export function writePropertyFormData(elements, property) {
  if (elements.editingPropertyIdInput) {
    elements.editingPropertyIdInput.value = property?.id || "";
  }

  if (elements.propertyTypeInput) {
    elements.propertyTypeInput.value = property?.type || "";
  }

  if (elements.propertyMarketValueInput) {
    elements.propertyMarketValueInput.value = property?.marketValue || "";
  }

  if (elements.propertyOwnershipInput) {
    elements.propertyOwnershipInput.value =
      property?.ownershipPercentage ?? DEFAULT_OWNERSHIP_PERCENTAGE;
  }
}

/* ========================================
   CLEAR FORM
======================================== */

export function clearPropertyForm(elements) {
  elements.propertyForm?.reset();

  if (elements.editingPropertyIdInput) {
    elements.editingPropertyIdInput.value = "";
  }

  if (elements.propertyOwnershipInput) {
    elements.propertyOwnershipInput.value = String(
      DEFAULT_OWNERSHIP_PERCENTAGE,
    );
  }
}