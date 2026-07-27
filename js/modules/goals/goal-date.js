"use strict";

/* ========================================
   SAVED DATE
======================================== */

export function getSavedGoalDate(goal) {
  if (isMonthString(goal?.targetDate)) {
    return goal.targetDate;
  }

  /*
   * Compatibility with records that stored
   * a full YYYY-MM-DD date.
   */
  if (
    typeof goal?.targetDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(goal.targetDate)
  ) {
    return goal.targetDate.slice(0, 7);
  }

  /*
   * Compatibility with older records that
   * stored only a target year.
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
  const normalizedDate = normalizeMonthString(targetDate);

  if (!normalizedDate) {
    return "No target date";
  }

  const [year, month] = normalizedDate.split("-").map(Number);

  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat("en-SG", {
    month: "long",
    year: "numeric",
  }).format(date);
}

/* ========================================
   MINIMUM DATE
======================================== */

export function getMinimumGoalDate(referenceDate = new Date()) {
  const minimumDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    1,
  );

  return toMonthString(minimumDate);
}

/* ========================================
   EDIT DATE
======================================== */

export function getGoalMinimumDateForEdit(goal, referenceDate = new Date()) {
  const savedTargetDate = getSavedGoalDate(goal);

  const minimumFutureDate = getMinimumGoalDate(referenceDate);

  /*
   * Preserve an existing past target date
   * while editing.
   */
  if (savedTargetDate && savedTargetDate < minimumFutureDate) {
    return savedTargetDate;
  }

  return minimumFutureDate;
}

/* ========================================
   NORMALISATION
======================================== */

export function normalizeMonthString(value) {
  if (isMonthString(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value.slice(0, 7);
  }

  return "";
}

function isMonthString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month] = value.split("-").map(Number);

  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12
  );
}

function toMonthString(date) {
  return [
    date.getFullYear(),

    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}