"use strict";

/* ========================================
   EXPENSE FIELD CONFIGURATION
======================================== */

export const EXPENSE_FIELDS = Object.freeze([
  Object.freeze({
    key: "household",
    elementId: "householdExpense",
    label: "Household",
  }),

  Object.freeze({
    key: "transport",
    elementId: "transportExpense",
    label: "Transport",
  }),

  Object.freeze({
    key: "subscriptionsLifestyle",
    elementId: "subscriptionsLifestyleExpense",
    label: "Subscriptions & Lifestyle",
  }),

  Object.freeze({
    key: "parentsDependantsSupport",
    elementId: "parentsDependantsSupportExpense",
    label: "Parents / Dependants Support",
  }),

  Object.freeze({
    key: "otherRecurringExpenses",
    elementId: "otherRecurringExpenses",
    label: "Other Recurring Expenses",
  }),

  Object.freeze({
    key: "savings",
    elementId: "savingsExpense",
    label: "Savings",
  }),
]);

/* ========================================
   EMPTY EXPENSES
======================================== */

export function createEmptyExpenses() {
  return EXPENSE_FIELDS.reduce(function (expenses, field) {
    expenses[field.key] = 0;

    return expenses;
  }, {});
}