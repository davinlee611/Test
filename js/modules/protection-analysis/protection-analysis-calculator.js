"use strict";

import { getExpenses, getLiabilities } from "../../state/client-plan.js";

import { EXPENSE_FIELDS } from "../expenses/expense-config.js";

/* ========================================
   PROTECTION HORIZON

   How many years of an ongoing obligation the Step 2 helper text
   assumes should be covered. A fixed planning assumption for now,
   not a calculated recommendation.
======================================== */

export const PROTECTION_HORIZON_YEARS = 5;

export const PROTECTION_HORIZON_MONTHS = PROTECTION_HORIZON_YEARS * 12;

/* ========================================
   SELECTABLE ITEMS
======================================== */

export function getSelectableExpenseItems() {
  const expenses = getExpenses();

  return EXPENSE_FIELDS.map(function (field) {
    return {
      key: field.key,
      label: field.label,
      amount: Number(expenses?.[field.key]) || 0,
    };
  }).filter(function (item) {
    return item.amount > 0;
  });
}

export function getSelectableLiabilities() {
  return getLiabilities() || [];
}

/* ========================================
   SELECTED TOTALS
======================================== */

export function getSelectedExpenseMonthlyTotal(protection) {
  const selectedExpenseKeys = protection.selectedExpenseKeys || [];

  return getSelectableExpenseItems().reduce(function (total, item) {
    if (!selectedExpenseKeys.includes(item.key)) {
      return total;
    }

    return total + item.amount;
  }, 0);
}

export function getSelectedLiabilityMonthlyTotal(protection) {
  const selectedLiabilityIds = protection.selectedLiabilityIds || [];

  return getSelectableLiabilities()
    .filter(function (liability) {
      return selectedLiabilityIds.includes(liability.id);
    })
    .reduce(function (total, liability) {
      return total + (Number(liability.monthlyRepayment) || 0);
    }, 0);
}

/*
 * Pure breakdown of the "Coverage Needed" figure, shared by this page's
 * own coverage total, SBMI Analysis, and the Client Report so all three
 * show the same number without recalculating it independently.
 */
export function getCoverageNeededBreakdown(protection) {
  const expenseItems = getSelectableExpenseItems();

  const selectedExpenseKeys = protection.selectedExpenseKeys || [];

  const selectedExpenseCount = expenseItems.filter(function (item) {
    return selectedExpenseKeys.includes(item.key);
  }).length;

  const expenseTotal =
    getSelectedExpenseMonthlyTotal(protection) * PROTECTION_HORIZON_MONTHS;

  const liabilities = getSelectableLiabilities();

  const selectedLiabilityIds = protection.selectedLiabilityIds || [];

  const selectedLiabilityCount = liabilities.filter(function (liability) {
    return selectedLiabilityIds.includes(liability.id);
  }).length;

  const liabilityTotal =
    getSelectedLiabilityMonthlyTotal(protection) * PROTECTION_HORIZON_MONTHS;

  return {
    expenseItemCount: expenseItems.length,
    selectedExpenseCount,
    expenseTotal,

    liabilityCount: liabilities.length,
    selectedLiabilityCount,
    liabilityTotal,

    totalNeeded: expenseTotal + liabilityTotal,
  };
}
