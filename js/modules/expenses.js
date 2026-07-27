"use strict";

import { getExpenses, updateExpenses } from "../state/client-plan.js";

import { formatCurrency, getInputWholeNumber } from "../utils/client-utils.js";

import { emit } from "../events/event-bus.js";

import { EVENTS } from "../events/events.js";

import {
  createEmptyExpenses,
  EXPENSE_FIELDS,
} from "./expenses/expense-config.js";

import { calculateTotalMonthlyExpenses } from "./expenses/expense-calculator.js";

/* ========================================
   EXPENSE ELEMENTS
======================================== */

const expenseElements = createExpenseElementMap();

const totalMonthlyExpensesElement = document.getElementById(
  "totalMonthlyExpenses",
);

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

/* ========================================
   INITIALIZATION
======================================== */

export function initializeExpenses() {
  if (moduleInitialized) {
    syncExpenseInputs();
    renderExpenses();

    return;
  }

  attachExpenseListeners();

  syncExpenseInputs();
  renderExpenses();

  moduleInitialized = true;
}

/* ========================================
   PUBLIC RENDER
======================================== */

export function renderExpenses() {
  renderExpenseTotal();
}

/* ========================================
   RESET
======================================== */

export function resetExpenses() {
  updateExpenses(createEmptyExpenses());

  syncExpenseInputs();
  renderExpenses();

  emitExpensesChanged();
}

/* ========================================
   EVENT LISTENERS
======================================== */

function attachExpenseListeners() {
  EXPENSE_FIELDS.forEach(function (field) {
    const input = expenseElements[field.key];

    input?.addEventListener("input", handleExpenseInput);
  });
}

function handleExpenseInput() {
  saveExpenseInputs();
  renderExpenses();
  emitExpensesChanged();
}

/* ========================================
   STATE
======================================== */

function saveExpenseInputs() {
  const expenses = EXPENSE_FIELDS.reduce(function (updatedExpenses, field) {
    updatedExpenses[field.key] = getInputWholeNumber(
      expenseElements[field.key],
    );

    return updatedExpenses;
  }, {});

  updateExpenses(expenses);
}

/* ========================================
   INPUT SYNCHRONISATION
======================================== */

function syncExpenseInputs() {
  const expenses = getExpenses();

  EXPENSE_FIELDS.forEach(function (field) {
    setInputValue(expenseElements[field.key], expenses[field.key]);
  });
}

function setInputValue(input, value) {
  if (!input) {
    return;
  }

  const amount = Number(value) || 0;

  input.value = amount > 0 ? String(amount) : "";
}

/* ========================================
   RENDERING
======================================== */

function renderExpenseTotal() {
  if (!totalMonthlyExpensesElement) {
    return;
  }

  totalMonthlyExpensesElement.textContent = formatCurrency(
    calculateTotalMonthlyExpenses(getExpenses()),
  );
}

/* ========================================
   EVENTS
======================================== */

function emitExpensesChanged() {
  const expenses = getExpenses();

  emit(EVENTS.EXPENSES_CHANGED, {
    expenses: {
      ...expenses,
    },

    totalMonthlyExpenses: calculateTotalMonthlyExpenses(expenses),
  });
}

/* ========================================
   ELEMENT FACTORY
======================================== */

function createExpenseElementMap() {
  return EXPENSE_FIELDS.reduce(function (elements, field) {
    elements[field.key] = document.getElementById(field.elementId);

    return elements;
  }, {});
}