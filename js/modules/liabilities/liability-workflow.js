"use strict";

import {
  clearLiabilities,
  createLiability,
  getAllLiabilities,
  getLiabilityById,
  removeLiability,
  updateLiability,
} from "../../services/liability-service.js";

import { validateLiabilityDraft } from "./liability-validation.js";

/* ========================================
   LIABILITY WORKFLOW
======================================== */

export function createLiabilityWorkflow() {
  /* ========================================
     QUERIES
  ======================================== */

  function getLiabilities() {
    return getAllLiabilities();
  }

  function getLiability(liabilityId) {
    return getLiabilityById(liabilityId);
  }

  /* ========================================
     SAVE
  ======================================== */

  function save({
    formData,

    editingLiabilityId = "",
  }) {
    const validation = validateLiabilityDraft(formData);

    if (!validation.isValid) {
      return {
        success: false,

        validation,

        liability: null,
      };
    }

    const liability = editingLiabilityId
      ? updateLiability(editingLiabilityId, formData)
      : createLiability(formData);

    if (!liability) {
      return {
        success: false,

        validation: {
          isValid: false,

          field: "",

          message: "The liability could not be saved.",
        },

        liability: null,
      };
    }

    return {
      success: true,

      validation,

      liability,
    };
  }

  /* ========================================
     DELETE
  ======================================== */

  function deleteLiability(liabilityId) {
    return removeLiability(liabilityId);
  }

  /* ========================================
     RESET
  ======================================== */

  function resetLiabilities() {
    clearLiabilities();
  }

  return {
    getLiabilities,

    getLiability,

    save,

    deleteLiability,

    resetLiabilities,
  };
}