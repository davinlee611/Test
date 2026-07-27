"use strict";

import { formatCurrency } from "../../utils/client-utils.js";

import { calculateGoalSavings } from "../../services/goal-savings-calculator.js";

import {
  createPlanningCard,
  createPlanningCardIcon,
  createPlanningCardDetails,
  createPlanningCardActions,
  createPlanningCardButton,
  renderPlanningEmptyState,
} from "../../components/planning-card.js";

import { formatGoalDate, getSavedGoalDate } from "./goal-date.js";

import { getGoalIconClass, getGoalTypeLabel } from "./goal-config.js";

/* ========================================
   GOAL LIST
======================================== */

export function renderGoalList({
  list,

  emptyMessage,

  goals,

  onEditGoal,

  onDeleteGoal,
}) {
  if (!list) {
    return;
  }

  list.innerHTML = "";

  if (goals.length === 0) {
    renderPlanningEmptyState(
      list,

      "No goals added yet.",

      emptyMessage,
    );

    return;
  }

  goals.forEach(function (goal) {
    list.appendChild(
      createGoalItem({
        goal,

        onEditGoal,

        onDeleteGoal,
      }),
    );
  });
}

/* ========================================
   GOAL ITEM
======================================== */

function createGoalItem({
  goal,

  onEditGoal,

  onDeleteGoal,
}) {
  return createPlanningCard({
    itemClass: "goal-item",

    icon: createPlanningCardIcon(getGoalIconClass(goal.type)),

    details: createGoalDetails(goal),

    actions: createGoalActions({
      goal,

      onEditGoal,

      onDeleteGoal,
    }),
  });
}

/* ========================================
   GOAL DETAILS
======================================== */

function createGoalDetails(goal) {
  const calculation = calculateGoalSavings([goal]);

  const goalResult = calculation.goals[0];

  const descriptionParts = [
    getGoalTypeLabel(goal.type),

    `${formatCurrency(goal.targetAmount)} target amount`,

    `${formatGoalDate(getSavedGoalDate(goal))} target date`,
  ];

  if (goalResult?.status === "valid") {
    descriptionParts.push(
      `${formatCurrency(goalResult.monthlySavings)} per month required`,
    );
  }

  if (goalResult?.status === "review") {
    descriptionParts.push("Review required");
  }

  if (goalResult?.status === "incomplete") {
    descriptionParts.push("Incomplete goal details");
  }

  return createPlanningCardDetails({
    title: goal.name || "Unnamed Goal",

    description: descriptionParts.join(" · "),
  });
}

/* ========================================
   GOAL ACTIONS
======================================== */

function createGoalActions({
  goal,

  onEditGoal,

  onDeleteGoal,
}) {
  const actions = createPlanningCardActions();

  actions.append(
    createPlanningCardButton({
      iconClass: "fa-solid fa-pen",

      label: `Edit ${goal.name}`,

      onClick() {
        onEditGoal(goal.id);
      },
    }),

    createPlanningCardButton({
      iconClass: "fa-solid fa-trash",

      variant: "delete",

      label: `Delete ${goal.name}`,

      onClick() {
        onDeleteGoal(goal.id);
      },
    }),
  );

  return actions;
}
