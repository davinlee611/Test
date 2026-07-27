"use strict";

/* ========================================
   GOAL SAVINGS CALCULATOR
======================================== */

export function calculateGoalSavings(goals, calculationDate = new Date()) {
  const safeGoals = Array.isArray(goals) ? goals : [];

  const goalResults = safeGoals.map(function (goal) {
    return calculateSingleGoalSavings(goal, calculationDate);
  });

  const validGoals = goalResults.filter(function (goal) {
    return goal.status === "valid";
  });

  const reviewGoals = goalResults.filter(function (goal) {
    return goal.status === "review";
  });

  const incompleteGoals = goalResults.filter(function (goal) {
    return goal.status === "incomplete";
  });

  const totalMonthlySavings = validGoals.reduce(function (total, goal) {
    return total + goal.monthlySavings;
  }, 0);

  return {
    goals: goalResults,
    validGoals,
    reviewGoals,
    incompleteGoals,

    totalMonthlySavings,

    validGoalCount: validGoals.length,
    reviewGoalCount: reviewGoals.length,
    incompleteGoalCount: incompleteGoals.length,
  };
}

/* ========================================
   SINGLE GOAL CALCULATION
======================================== */

function calculateSingleGoalSavings(goal, calculationDate) {
  const targetAmount = getValidAmount(goal?.targetAmount);

  const targetDate = parseTargetDate(getGoalTargetDate(goal));

  const baseResult = {
    id: goal?.id || "",
    type: goal?.type || "",
    name: goal?.name || "Unnamed Goal",
    targetAmount,
    targetDate: getGoalTargetDate(goal),

    monthsRemaining: 0,
    monthlySavings: 0,

    status: "incomplete",
    message: "",
  };

  if (targetAmount <= 0) {
    return {
      ...baseResult,
      message: "Target amount is missing.",
    };
  }

  if (!targetDate) {
    return {
      ...baseResult,
      message: "Target date is missing or invalid.",
    };
  }

  const monthsUntilTarget = calculateInclusiveMonths(
    calculationDate,
    targetDate,
  );

  if (monthsUntilTarget <= 0) {
    return {
      ...baseResult,
      status: "review",
      message: "Target date has passed.",
    };
  }

  return {
    ...baseResult,

    monthsRemaining: monthsUntilTarget,

    monthlySavings: Math.ceil(targetAmount / monthsUntilTarget),

    status: "valid",
    message: "",
  };
}

/* ========================================
   DATE CALCULATION
======================================== */

function calculateInclusiveMonths(calculationDate, targetDate) {
  const currentYear = calculationDate.getFullYear();

  const currentMonth = calculationDate.getMonth();

  const targetYear = targetDate.getFullYear();

  const targetMonth = targetDate.getMonth();

  const monthDifference =
    (targetYear - currentYear) * 12 + (targetMonth - currentMonth);

  /*
   * Include the current month as a saving month.
   *
   * Example:
   * July to December =
   * July, August, September, October,
   * November and December = 6 months.
   */
  return monthDifference + 1;
}

function parseTargetDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearText, monthText] = value.split("-");

  const year = Number(yearText);
  const month = Number(monthText);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  const date = new Date(year, month - 1, 1);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/* ========================================
   LEGACY COMPATIBILITY
======================================== */

function getGoalTargetDate(goal) {
  if (
    typeof goal?.targetDate === "string" &&
    /^\d{4}-\d{2}$/.test(goal.targetDate)
  ) {
    return goal.targetDate;
  }

  /*
   * Supports records that stored a full
   * YYYY-MM-DD date.
   */
  if (
    typeof goal?.targetDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(goal.targetDate)
  ) {
    return goal.targetDate.slice(0, 7);
  }

  /*
   * Supports older records that stored
   * only targetYear.
   */
  if (goal?.targetYear) {
    return `${goal.targetYear}-01`;
  }

  return "";
}

/* ========================================
   NUMBER HELPERS
======================================== */

function getValidAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Math.trunc(amount);
}
