"use strict";

import { getExpenses, updateExpenses } from "../state/client-plan.js";

import { getInputWholeNumber, formatCurrency } from "../utils/client-utils.js";

import { emit } from "../events/event-bus.js";

import { EVENTS } from "../events/events.js";

/* ========================================
   EXPENSE ELEMENTS
======================================== */

const householdExpenseInput = document.getElementById("householdExpense");

const transportExpenseInput = document.getElementById("transportExpense");

const subscriptionsLifestyleExpenseInput = document.getElementById(
  "subscriptionsLifestyleExpense",
);

const parentsDependantsSupportExpenseInput = document.getElementById(
  "parentsDependantsSupportExpense",
);

const insurancePremiumsExpenseInput = document.getElementById(
  "insurancePremiumsExpense",
);

const otherRecurringExpensesInput = document.getElementById(
  "otherRecurringExpenses",
);

const totalMonthlyExpensesElement = document.getElementById(
  "totalMonthlyExpenses",
);

/* ========================================
   EXPENSE INPUTS
======================================== */

const expenseInputs = [
  householdExpenseInput,
  transportExpenseInput,
  subscriptionsLifestyleExpenseInput,
  parentsDependantsSupportExpenseInput,
  insurancePremiumsExpenseInput,
  otherRecurringExpensesInput,
];

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

/* ========================================
   INITIALIZATION
======================================== */

export function initializeExpenses() {
  if (moduleInitialized) {
    return;
  }

  attachExpenseListeners();
  syncExpenseInputs();
  renderExpenseTotal();

  moduleInitialized = true;
}

/* ========================================
   RESET
======================================== */

export function resetExpenses() {
  updateExpenses(createEmptyExpenses());

  syncExpenseInputs();
  renderExpenseTotal();

  emitExpensesChanged();
}

/* ========================================
   EVENT LISTENERS
======================================== */

function attachExpenseListeners() {
  expenseInputs.forEach(function (input) {
    if (!input) {
      return;
    }

    input.addEventListener("input", handleExpenseInput);
  });
}

function handleExpenseInput() {
  saveExpenseInputs();
  renderExpenseTotal();
  emitExpensesChanged();
}

/* ========================================
   STATE
======================================== */

function saveExpenseInputs() {
  updateExpenses({
    household: getInputWholeNumber(householdExpenseInput),

    transport: getInputWholeNumber(transportExpenseInput),

    subscriptionsLifestyle: getInputWholeNumber(
      subscriptionsLifestyleExpenseInput,
    ),

    parentsDependantsSupport: getInputWholeNumber(
      parentsDependantsSupportExpenseInput,
    ),

    insurancePremiums: getInputWholeNumber(insurancePremiumsExpenseInput),

    otherRecurringExpenses: getInputWholeNumber(otherRecurringExpensesInput),
  });
}

/* ========================================
   INPUT SYNCHRONIZATION
======================================== */

function syncExpenseInputs() {
  const expenses = getExpenses();

  setInputValue(householdExpenseInput, expenses.household);

  setInputValue(transportExpenseInput, expenses.transport);

  setInputValue(
    subscriptionsLifestyleExpenseInput,
    expenses.subscriptionsLifestyle,
  );

  setInputValue(
    parentsDependantsSupportExpenseInput,
    expenses.parentsDependantsSupport,
  );

  setInputValue(insurancePremiumsExpenseInput, expenses.insurancePremiums);

  setInputValue(otherRecurringExpensesInput, expenses.otherRecurringExpenses);
}

function setInputValue(input, value) {
  if (!input) {
    return;
  }

  const amount = Number(value) || 0;

  input.value = amount > 0 ? String(amount) : "";
}

/* ========================================
   CALCULATIONS
======================================== */

function calculateTotalMonthlyExpenses() {
  const expenses = getExpenses();

  return (
    expenses.household +
    expenses.transport +
    expenses.subscriptionsLifestyle +
    expenses.parentsDependantsSupport +
    expenses.insurancePremiums +
    expenses.otherRecurringExpenses
  );
}

/* ========================================
   RENDERING
======================================== */

function renderExpenseTotal() {
  if (!totalMonthlyExpensesElement) {
    return;
  }

  totalMonthlyExpensesElement.textContent = formatCurrency(
    calculateTotalMonthlyExpenses(),
  );
}

/* ========================================
   EVENTS
======================================== */

function emitExpensesChanged() {
  emit(EVENTS.EXPENSES_CHANGED, {
    expenses: {
      ...getExpenses(),
    },

    totalMonthlyExpenses: calculateTotalMonthlyExpenses(),
  });
}

/* ========================================
   FACTORY
======================================== */

function createEmptyExpenses() {
  return {
    household: 0,
    transport: 0,
    subscriptionsLifestyle: 0,
    parentsDependantsSupport: 0,
    insurancePremiums: 0,
    otherRecurringExpenses: 0,
  };
}
