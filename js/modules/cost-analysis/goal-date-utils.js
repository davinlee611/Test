"use strict";

import { formatYearMonth } from "./cost-analysis-date-utils.js";

import { isGoalIncludedInProjection } from "./goal-filter.js";

/* ========================================
   GOAL HELPERS
======================================== */

export function getGoalsDueInMonth(goals, projectionDate) {
  const projectionMonth = formatYearMonth(projectionDate);

  return goals.filter(function (goal, index) {
    return (
      isGoalIncludedInProjection(goal, index) &&
      getGoalProjectionMonth(goal) === projectionMonth
    );
  });
}

export function getGoalProjectionMonth(goal) {
  const targetDate = goal?.targetDate;

  if (typeof targetDate !== "string") {
    return "";
  }

  if (/^\d{4}-\d{2}$/.test(targetDate)) {
    return targetDate;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return targetDate.slice(0, 7);
  }

  return "";
}
