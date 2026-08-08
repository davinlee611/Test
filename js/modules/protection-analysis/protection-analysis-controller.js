"use strict";

import {
  renderCoverageTotal,
  renderExpenseChecklist,
  renderLiabilityChecklist,
  syncRadioGroup,
} from "./protection-analysis-renderer.js";

/* ========================================
   PROTECTION ANALYSIS CONTROLLER
======================================== */

export function createProtectionAnalysisController({ elements, workflow }) {
  /* ========================================
     RENDER
  ======================================== */

  function render() {
    const protection = workflow.getProtectionData();

    syncRadioGroup(
      elements.waitTimeInputs,
      protection.waitTimeImportance
        ? String(protection.waitTimeImportance)
        : "",
    );

    syncRadioGroup(
      elements.injuryProneInputs,
      protection.activeExerciseInjuryProne === null
        ? ""
        : protection.activeExerciseInjuryProne
          ? "yes"
          : "no",
    );

    renderExpenseChecklist({
      elements,
      protection,
      onToggle: handleExpenseToggle,
    });

    renderLiabilityChecklist({
      elements,
      protection,
      onToggle: handleLiabilityToggle,
    });

    renderCoverageTotal({ elements, protection });
  }

  /* ========================================
     STEP 1 HANDLERS
  ======================================== */

  function handleWaitTimeChange(input) {
    workflow.setWaitTimeImportance(Number(input.value));
  }

  function handleInjuryProneChange(input) {
    workflow.setInjuryProne(input.value === "yes");
  }

  /* ========================================
     STEP 2 HANDLERS
  ======================================== */

  function handleExpenseToggle(key, checked) {
    workflow.toggleSelection("selectedExpenseKeys", key, checked);

    const protection = workflow.getProtectionData();

    renderExpenseChecklist({
      elements,
      protection,
      onToggle: handleExpenseToggle,
    });

    renderCoverageTotal({ elements, protection });
  }

  function handleLiabilityToggle(liabilityId, checked) {
    workflow.toggleSelection("selectedLiabilityIds", liabilityId, checked);

    const protection = workflow.getProtectionData();

    renderLiabilityChecklist({
      elements,
      protection,
      onToggle: handleLiabilityToggle,
    });

    renderCoverageTotal({ elements, protection });
  }

  /* ========================================
     APPLICATION EVENTS
  ======================================== */

  function handleExpensesChanged() {
    const protection = workflow.getProtectionData();

    renderExpenseChecklist({
      elements,
      protection,
      onToggle: handleExpenseToggle,
    });

    renderCoverageTotal({ elements, protection });
  }

  function handleLiabilitiesChanged() {
    const protection = workflow.getProtectionData();

    renderLiabilityChecklist({
      elements,
      protection,
      onToggle: handleLiabilityToggle,
    });

    renderCoverageTotal({ elements, protection });
  }

  /* ========================================
     RESET
  ======================================== */

  function reset() {
    workflow.reset();

    render();
  }

  return {
    render,

    handleWaitTimeChange,

    handleInjuryProneChange,

    handleExpensesChanged,

    handleLiabilitiesChanged,

    reset,
  };
}
