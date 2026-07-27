"use strict";

import {
  getAllGoals,
  getGoalById,
  createGoal,
  updateGoal,
  removeGoal,
  clearGoals,
} from "../../services/goal-service.js";

import { validateGoalDraft } from "./goal-validation.js";

/* ========================================
   GOAL WORKFLOW
======================================== */

export function createGoalWorkflow() {
  /* ========================================
     QUERIES
  ======================================== */

  function getGoals() {
    return getAllGoals();
  }

  function getGoal(goalId) {
    return getGoalById(goalId);
  }

  /* ========================================
     SAVE
  ======================================== */

  function save({
    formData,

    editingGoalId = "",
  }) {
    const existingGoal = editingGoalId ? getGoalById(editingGoalId) : null;

    const validation = validateGoalDraft({
      formData,

      editingGoalId,

      existingGoal,
    });

    if (!validation.isValid) {
      return {
        success: false,

        validation,

        goal: null,
      };
    }

    const goal = editingGoalId
      ? updateGoal(editingGoalId, formData)
      : createGoal(formData);

    if (!goal) {
      return {
        success: false,

        validation: {
          isValid: false,

          field: "",

          message: "The goal could not be saved.",
        },

        goal: null,
      };
    }

    return {
      success: true,

      validation,

      goal,
    };
  }

  /* ========================================
     DELETE
  ======================================== */

  function deleteGoal(goalId) {
    return removeGoal(goalId);
  }

  /* ========================================
     RESET
  ======================================== */

  function resetGoals() {
    clearGoals();
  }

  return {
    getGoals,

    getGoal,

    save,

    deleteGoal,

    resetGoals,
  };
}