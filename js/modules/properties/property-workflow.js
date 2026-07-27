"use strict";

import {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  removeProperty,
  clearProperties,
} from "../../services/property-service.js";

import { validatePropertyDraft } from "./property-validation.js";

/* ========================================
   PROPERTY WORKFLOW
======================================== */

export function createPropertyWorkflow() {
  /* ========================================
     QUERIES
  ======================================== */

  function getProperties() {
    return getAllProperties();
  }

  function getProperty(propertyId) {
    return getPropertyById(propertyId);
  }

  /* ========================================
     SAVE
  ======================================== */

  function save({ formData, editingPropertyId = "" }) {
    const validation = validatePropertyDraft(formData);

    if (!validation.isValid) {
      return {
        success: false,
        validation,
        property: null,
      };
    }

    const property = editingPropertyId
      ? updateProperty(editingPropertyId, formData)
      : createProperty(formData);

    if (!property) {
      return {
        success: false,

        validation: {
          isValid: false,
          field: "",
          message: "The property could not be saved.",
        },

        property: null,
      };
    }

    return {
      success: true,
      validation,
      property,
    };
  }

  /* ========================================
     DELETE
  ======================================== */

  function deleteProperty(propertyId) {
    return removeProperty(propertyId);
  }

  /* ========================================
     RESET
  ======================================== */

  function resetProperties() {
    clearProperties();
  }

  return {
    getProperties,
    getProperty,
    save,
    deleteProperty,
    resetProperties,
  };
}