"use strict";

import { getWholeNumber } from "../../utils/client-utils.js";

import { getSavedGoalDate } from "./goal-date.js";

/* ========================================
   READ FORM
======================================== */

export function readGoalFormData(elements) {
  return {
    goalType: elements.goalTypeInput?.value || "",

    goalName: elements.goalNameInput?.value.trim() || "",

    targetAmount: getWholeNumber(elements.goalTargetAmountInput?.value),

    targetDate: elements.goalTargetDateInput?.value || "",
  };
}

/* ========================================
   WRITE FORM
======================================== */

export function writeGoalFormData(elements, goal) {
  if (elements.editingGoalIdInput) {
    elements.editingGoalIdInput.value = goal?.id || "";
  }

  if (elements.goalTypeInput) {
    elements.goalTypeInput.value = goal?.type || "";
  }

  if (elements.goalNameInput) {
    elements.goalNameInput.value = goal?.name || "";
  }

  if (elements.goalTargetAmountInput) {
    elements.goalTargetAmountInput.value = goal?.targetAmount || "";
  }

  if (elements.goalTargetDateInput) {
    elements.goalTargetDateInput.value = getSavedGoalDate(goal);
  }
}

/* ========================================
   CLEAR FORM
======================================== */

export function clearGoalForm(elements) {
  elements.goalForm?.reset();

  if (elements.editingGoalIdInput) {
    elements.editingGoalIdInput.value = "";
  }
}