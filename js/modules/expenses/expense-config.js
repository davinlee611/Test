"use strict";

/* ========================================
   EXPENSE FIELD CONFIGURATION
======================================== */

export const EXPENSE_FIELDS = Object.freeze([
  Object.freeze({
    key: "household",
    elementId: "householdExpense",
  }),

  Object.freeze({
    key: "transport",
    elementId: "transportExpense",
  }),

  Object.freeze({
    key: "subscriptionsLifestyle",
    elementId: "subscriptionsLifestyleExpense",
  }),

  Object.freeze({
    key: "parentsDependantsSupport",
    elementId: "parentsDependantsSupportExpense",
  }),

  Object.freeze({
    key: "otherRecurringExpenses",
    elementId: "otherRecurringExpenses",
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