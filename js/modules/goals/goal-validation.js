"use strict";

import { getMinimumGoalMonth, getSavedGoalDate } from "./goal-date.js";

/* ========================================
   GOAL VALIDATION
======================================== */

export function validateGoalDraft({
  formData,

  editingGoalId = "",

  existingGoal = null,

  referenceDate = new Date(),
}) {
  if (!formData.goalType) {
    return createInvalidResult(
      "goalType",

      "Please select a goal type.",
    );
  }

  if (!formData.goalName) {
    return createInvalidResult(
      "goalName",

      "Please enter a goal name.",
    );
  }

  if (formData.targetAmount <= 0) {
    return createInvalidResult(
      "targetAmount",

      "Please enter the target amount.",
    );
  }

  if (!formData.targetDate) {
    return createInvalidResult(
      "targetDate",

      "Please select the target month and year.",
    );
  }

  const minimumTargetDate = getMinimumGoalMonth(referenceDate);

  /*
   * New goals must have a future date.
   */
  if (!editingGoalId && formData.targetDate < minimumTargetDate) {
    return createInvalidResult(
      "targetDate",

      "The target month must be in the future.",
    );
  }

  /*
   * Existing past dates may remain unchanged.
   * A changed date must be in the future.
   */
  if (editingGoalId) {
    const existingTargetDate = getSavedGoalDate(existingGoal);

    const dateWasChanged = formData.targetDate !== existingTargetDate;

    if (dateWasChanged && formData.targetDate < minimumTargetDate) {
      return createInvalidResult(
        "targetDate",

        "The new target month must be in the future.",
      );
    }
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