"use strict";

/* ========================================
   PROTECTION ANALYSIS ELEMENTS
======================================== */

export function getProtectionAnalysisElements() {
  return {
    waitTimeInputs: Array.from(
      document.querySelectorAll('input[name="protectionWaitTimeImportance"]'),
    ),

    injuryProneInputs: Array.from(
      document.querySelectorAll(
        'input[name="protectionActiveExerciseInjuryProne"]',
      ),
    ),

    expenseChecklist: document.getElementById("protectionExpenseChecklist"),

    emptyExpenseMessage: document.getElementById(
      "protectionEmptyExpenseMessage",
    ),

    liabilityChecklist: document.getElementById(
      "protectionLiabilityChecklist",
    ),

    emptyLiabilityMessage: document.getElementById(
      "protectionEmptyLiabilityMessage",
    ),

    coverageTotalValue: document.getElementById("protectionCoverageTotalValue"),
  };
}
