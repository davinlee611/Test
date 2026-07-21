"use strict";

import { getGoals, setGoals } from "../state/client-plan.js";

import { createUniqueId } from "../utils/client-utils.js";

/* ========================================
   GOAL QUERIES
======================================== */

export function getAllGoals() {
  return getGoals();
}

export function getGoalById(goalId) {
  return getGoals().find((goal) => goal.id === goalId) ?? null;
}

/* ========================================
   GOAL COMMANDS
======================================== */

export function createGoal({ goalType, goalName, targetAmount, targetDate }) {
  const newGoal = {
    id: createUniqueId(),
    type: goalType,
    name: goalName,
    targetAmount,
    targetDate,
  };

  setGoals([...getGoals(), newGoal]);

  return newGoal;
}

export function updateGoal(
  goalId,
  { goalType, goalName, targetAmount, targetDate },
) {
  let updatedGoal = null;

  const goals = getGoals().map((goal) => {
    if (goal.id !== goalId) {
      return goal;
    }

    updatedGoal = {
      ...goal,
      type: goalType,
      name: goalName,
      targetAmount,
      targetDate,
    };

    /*
     * Remove the legacy targetYear property
     * after the goal has been updated.
     */
    delete updatedGoal.targetYear;

    return updatedGoal;
  });

  if (!updatedGoal) {
    return null;
  }

  setGoals(goals);

  return updatedGoal;
}

export function removeGoal(goalId) {
  const existingGoal = getGoalById(goalId);

  if (!existingGoal) {
    return false;
  }

  setGoals(getGoals().filter((goal) => goal.id !== goalId));

  return true;
}

export function clearGoals() {
  setGoals([]);
}
