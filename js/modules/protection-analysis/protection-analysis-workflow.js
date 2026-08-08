"use strict";

import {
  createEmptyProtection,
  getProtection,
  updateProtection,
} from "../../state/client-plan.js";

/* ========================================
   PROTECTION ANALYSIS WORKFLOW
======================================== */

export function createProtectionAnalysisWorkflow() {
  /* ========================================
     QUERIES
  ======================================== */

  function getProtectionData() {
    return getProtection();
  }

  /* ========================================
     STEP 1 UPDATES
  ======================================== */

  function setWaitTimeImportance(value) {
    return updateProtection({ waitTimeImportance: value });
  }

  function setInjuryProne(value) {
    return updateProtection({ activeExerciseInjuryProne: value });
  }

  /* ========================================
     STEP 2 UPDATES
  ======================================== */

  function toggleSelection(fieldKey, itemId, isSelected) {
    const protection = getProtection();

    const current = protection[fieldKey] || [];

    const next = isSelected
      ? [...current, itemId]
      : current.filter(function (id) {
          return id !== itemId;
        });

    return updateProtection({ [fieldKey]: next });
  }

  /* ========================================
     RESET
  ======================================== */

  function reset() {
    return updateProtection(createEmptyProtection());
  }

  return {
    getProtectionData,

    setWaitTimeImportance,

    setInjuryProne,

    toggleSelection,

    reset,
  };
}
