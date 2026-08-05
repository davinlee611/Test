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

export function createGoal(goalData) {
  const newGoal = createGoalRecord(goalData);

  setGoals(appendItem(getGoals(), newGoal));

  return newGoal;
}

export function updateGoal(goalId, goalData) {
  const { items, updatedItem } = updateItemById(getGoals(), goalId, (goal) => {
    const updatedGoal = {
      ...goal,

      type: goalData.goalType,
      name: goalData.goalName,
      targetAmount: goalData.targetAmount,
      targetDate: goalData.targetDate,
    };

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

/* ========================================
   PRIVATE GOAL FACTORY
======================================== */

function createGoalRecord({ goalType, goalName, targetAmount, targetDate }) {
  return {
    id: createPlannerId(),
    type: goalType,
    name: goalName,
    targetAmount,
    targetDate,
  };
}
