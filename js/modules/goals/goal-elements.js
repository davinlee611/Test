"use strict";

/* ========================================
   GOAL ELEMENTS
======================================== */

export function getGoalElements() {
  return {
    addGoalButton: document.getElementById("addGoalButton"),

    emptyGoalMessage: document.getElementById("emptyGoalMessage"),

    goalsList: document.getElementById("goalsList"),

    goalModal: document.getElementById("goalModal"),

    goalForm: document.getElementById("goalForm"),

    goalModalTitle: document.getElementById("goalModalTitle"),

    editingGoalIdInput: document.getElementById("editingGoalId"),

    goalTypeInput: document.getElementById("goalType"),

    goalNameInput: document.getElementById("goalName"),

    goalTargetAmountInput: document.getElementById("goalTargetAmount"),

    goalTargetDateInput: document.getElementById("goalTargetDate"),

    goalFormMessage: document.getElementById("goalFormMessage"),

    closeGoalModalButton: document.getElementById("closeGoalModalButton"),

    cancelGoalButton: document.getElementById("cancelGoalButton"),

    goalModalBackdrop: document.querySelector("[data-close-goal-modal]"),
  };
}