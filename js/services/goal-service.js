"use strict";

import { getGoals, setGoals } from "../state/client-plan.js";

import {
  appendItem,
  findItemById,
  removeItemById,
  updateItemById,
} from "../utils/collection-utils.js";

import { createPlannerId } from "../utils/client-utils.js";

/* ========================================
   GOAL QUERIES
======================================== */

export function getAllGoals() {
  return getGoals();
}

export function getGoalById(goalId) {
  return findItemById(getGoals(), goalId);
}

/* ========================================
   GOAL COMMANDS
======================================== */

export function createGoal({ goalType, goalName, targetAmount, targetDate }) {
  const newGoal = {
    id: createPlannerId(),
    type: goalType,
    name: goalName,
    targetAmount,
    targetDate,
  };

  setGoals(appendItem(getGoals(), newGoal));

  return newGoal;
}

export function updateGoal(
  goalId,
  { goalType, goalName, targetAmount, targetDate },
) {
  const { items, updatedItem } = updateItemById(getGoals(), goalId, (goal) => {
    const updatedGoal = {
      ...goal,
      type: goalType,
      name: goalName,
      targetAmount,
      targetDate,
    };

    /*
     * Remove the legacy targetYear
     * property when an older goal is
     * updated.
     */
    delete updatedGoal.targetYear;

    return updatedGoal;
  });

  if (!updatedItem) {
    return null;
  }

  setGoals(items);

  return updatedItem;
}

export function removeGoal(goalId) {
  const { items, removedItem } = removeItemById(getGoals(), goalId);

  if (!removedItem) {
    return false;
  }

  setGoals(items);

  return true;
}

export function clearGoals() {
  setGoals([]);
}
