"use strict";

import {
    getGoals,
    setGoals,
} from "../state/client-plan.js";

/* ========================================
   GOAL QUERIES
======================================== */

export function getAllGoals() {
    return getGoals();
}

export function getGoal(goalId) {
    return getGoals().find(goal => goal.id === goalId) ?? null;
}

/* ========================================
   GOAL COMMANDS
======================================== */

export function addGoal(goal) {
    const goals = [...getGoals()];

    goals.push(goal);

    setGoals(goals);

    return goal;
}

export function updateGoal(goalId, updates) {
    const goals = getGoals().map(goal =>
        goal.id === goalId
            ? {
                ...goal,
                ...updates,
            }
            : goal,
    );

    setGoals(goals);
}

export function deleteGoal(goalId) {
    const goals = getGoals().filter(
        goal => goal.id !== goalId,
    );

    setGoals(goals);
}

export function replaceGoals(goals) {
    setGoals(goals);
}

export function clearGoals() {
    setGoals([]);
}