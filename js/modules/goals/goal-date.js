"use strict";

/* ========================================
   SAVED DATE
======================================== */

export function getSavedGoalDate(goal) {
  if (goal?.targetDate) {
    return goal.targetDate;
  }

  /*
   * Compatibility with older goal records
   * that only stored targetYear.
   */
  if (goal?.targetYear) {
    return `${goal.targetYear}-01`;
  }

  return "";
}

/* ========================================
   DATE DISPLAY
======================================== */

export function formatGoalDate(targetDate) {
  if (!targetDate) {
    return "No target date";
  }

  const [year, month] = targetDate.split("-");

  const date = new Date(Number(year), Number(month) - 1, 1);

  if (Number.isNaN(date.getTime())) {
    return targetDate;
  }

  return new Intl.DateTimeFormat("en-SG", {
    month: "long",

    year: "numeric",
  }).format(date);
}

/* ========================================
   MINIMUM DATE
======================================== */

export function getMinimumGoalMonth(referenceDate = new Date()) {
  const minimumDate = new Date(referenceDate);

  minimumDate.setDate(1);

  minimumDate.setMonth(minimumDate.getMonth() + 1);

  const year = minimumDate.getFullYear();

  const month = String(minimumDate.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

/* ========================================
   EDIT DATE
======================================== */

export function getGoalMinimumMonthForEdit(goal, referenceDate = new Date()) {
  const savedTargetDate = getSavedGoalDate(goal);

  const minimumFutureMonth = getMinimumGoalMonth(referenceDate);

  /*
   * Preserve an existing past target date
   * while editing.
   */
  if (savedTargetDate && savedTargetDate < minimumFutureMonth) {
    return savedTargetDate;
  }

  return minimumFutureMonth;
}