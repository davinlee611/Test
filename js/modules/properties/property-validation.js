"use strict";

import {
  MAXIMUM_OWNERSHIP_PERCENTAGE,
  MINIMUM_OWNERSHIP_PERCENTAGE,
} from "./property-config.js";

/* ========================================
   PROPERTY VALIDATION
======================================== */

export function validatePropertyDraft(formData) {
  if (!formData.propertyType) {
    return createInvalidResult(
      "propertyType",
      "Please select a property type.",
    );
  }

  if (formData.marketValue <= 0) {
    return createInvalidResult(
      "marketValue",
      "Please enter the property's market value.",
    );
  }

  if (
    formData.ownershipPercentage < MINIMUM_OWNERSHIP_PERCENTAGE ||
    formData.ownershipPercentage > MAXIMUM_OWNERSHIP_PERCENTAGE
  ) {
    return createInvalidResult(
      "ownershipPercentage",
      "Ownership percentage must be between 1% and 100%.",
    );
  }

  return {
    isValid: true,
    field: "",
    message: "",
  };
}

/* ========================================
   INVALID RESULT
======================================== */

function createInvalidResult(field, message) {
  return {
    isValid: false,
    field,
    message,
  };
}