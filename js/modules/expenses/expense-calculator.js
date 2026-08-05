"use strict";

import { EXPENSE_FIELDS } from "./expense-config.js";

/* ========================================
   MONTHLY EXPENSE TOTAL
======================================== */

export function calculateTotalMonthlyExpenses(expenses) {
  const safeExpenses = expenses && typeof expenses === "object" ? expenses : {};

  return EXPENSE_FIELDS.reduce(function (total, field) {
    return total + getValidExpenseAmount(safeExpenses[field.key]);
  }, 0);
}

/* ========================================
   AMOUNT NORMALISATION
======================================== */

function getValidExpenseAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return amount;
}