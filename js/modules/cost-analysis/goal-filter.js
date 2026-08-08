"use strict";

import { formatCurrency } from "../../utils/client-utils.js";

import { getNonNegativeNumber } from "./cost-analysis-format-utils.js";

import { excludedProjectionGoalIds } from "./cost-analysis-state.js";

/* ========================================
   GOAL PROJECTION FILTER
======================================== */

export function renderGoalFilter(elements, goals) {
  const { goalFilterOptions, selectAllGoalsButton } = elements;

  if (!goalFilterOptions) {
    return;
  }

  goalFilterOptions.replaceChildren();

  removeMissingGoalExclusions(goals);

  if (!Array.isArray(goals) || goals.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.className = "analysis-goal-filter-empty";

    emptyMessage.textContent = "No current goals have been added.";

    goalFilterOptions.append(emptyMessage);

    if (selectAllGoalsButton) {
      selectAllGoalsButton.hidden = true;
    }

    return;
  }

  if (selectAllGoalsButton) {
    selectAllGoalsButton.hidden = false;
  }

  const fragment = document.createDocumentFragment();

  goals.forEach(function (goal, index) {
    const goalId = getProjectionGoalId(goal, index);

    const label = document.createElement("label");

    label.className = "analysis-goal-filter-option";

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.value = goalId;
    checkbox.checked = !excludedProjectionGoalIds.has(goalId);

    const marker = document.createElement("span");

    marker.className = "analysis-goal-filter-checkbox";

    const details = document.createElement("span");

    details.className = "analysis-goal-filter-details";

    const name = document.createElement("strong");

    name.textContent = goal?.name || "Goal";

    const amount = document.createElement("small");

    amount.textContent = formatCurrency(
      getNonNegativeNumber(goal?.targetAmount),
    );

    details.append(name, amount);

    label.append(checkbox, marker, details);

    fragment.append(label);
  });

  goalFilterOptions.append(fragment);
}

export function handleGoalFilterChange(event) {
  const checkbox = event.target.closest('input[type="checkbox"]');

  if (!checkbox) {
    return;
  }

  if (checkbox.checked) {
    excludedProjectionGoalIds.delete(checkbox.value);
  } else {
    excludedProjectionGoalIds.add(checkbox.value);
  }
}

export function handleSelectAllGoals() {
  excludedProjectionGoalIds.clear();
}

function removeMissingGoalExclusions(goals) {
  const currentGoalIds = new Set(
    goals.map(function (goal, index) {
      return getProjectionGoalId(goal, index);
    }),
  );

  excludedProjectionGoalIds.forEach(function (goalId) {
    if (!currentGoalIds.has(goalId)) {
      excludedProjectionGoalIds.delete(goalId);
    }
  });
}

export function getProjectionGoalId(goal, index) {
  return String(goal?.id || `projection-goal-${index}`);
}

export function isGoalIncludedInProjection(goal, index) {
  return !excludedProjectionGoalIds.has(getProjectionGoalId(goal, index));
}
