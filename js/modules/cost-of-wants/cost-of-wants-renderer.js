"use strict";

import { costOfWantsElements } from "./cost-of-wants-elements.js";

const elements = costOfWantsElements;

/* ========================================
   CLIENT DETAILS
======================================== */

export function renderClientDetails(currentAge) {
  if (!elements.inputs.currentAge) {
    return;
  }

  elements.inputs.currentAge.value =
    currentAge === null ? "" : String(currentAge);
}

/* ========================================
   SAVED INPUTS
======================================== */

export function syncCostOfWantsInputs(costOfWants) {
  setOptionalNumberInput(
    elements.inputs.desiredFybcAge,
    costOfWants.desiredFybcAge,
  );

  setNumberInput(
    elements.inputs.plannedMortalityAge,
    costOfWants.plannedMortalityAge,
  );

  setNumberInput(elements.inputs.inflationRate, costOfWants.inflationRate);
}

/* ========================================
   LIFESTYLE SELECTION
======================================== */

export function renderLifestyleSelection(costOfWants) {
  const { lifestyleOption, customMonthlyIncome } = costOfWants;

  elements.lifestyle.optionButtons.forEach(function (button) {
    const isSelected = button.dataset.lifestyleOption === lifestyleOption;

    button.classList.toggle("is-selected", isSelected);

    button.setAttribute("aria-checked", String(isSelected));
  });

  if (elements.lifestyle.customIncomeGroup) {
    elements.lifestyle.customIncomeGroup.hidden = lifestyleOption !== "custom";
  }

  if (elements.inputs.customIncome) {
    elements.inputs.customIncome.value =
      customMonthlyIncome > 0 ? String(customMonthlyIncome) : "";
  }
}

/* ========================================
   SELECTED INCOME
======================================== */

export function renderSelectedIncome(monthlyIncome) {
  if (
    !elements.lifestyle.selectedIncomeSummary ||
    !elements.lifestyle.selectedIncomeAmount
  ) {
    return;
  }

  elements.lifestyle.selectedIncomeSummary.hidden = false;

  elements.lifestyle.selectedIncomeAmount.textContent =
    monthlyIncome > 0 ? formatCurrency(monthlyIncome) : "Not selected";
}

/* ========================================
   MONTHLY SPENDING BREAKDOWN
======================================== */

export function renderMonthlySpendingBreakdown(breakdown) {
  if (!breakdown) {
    return;
  }

  setCurrencyText(
    elements.spending.householdAmount,
    breakdown.expenses.household,
  );

  setCurrencyText(
    elements.spending.transportAmount,
    breakdown.expenses.transport,
  );

  setCurrencyText(
    elements.spending.subscriptionsAmount,
    breakdown.expenses.subscriptionsLifestyle,
  );

  setCurrencyText(
    elements.spending.dependantsAmount,
    breakdown.expenses.parentsDependantsSupport,
  );

  setCurrencyText(
    elements.spending.otherExpensesAmount,
    breakdown.expenses.otherRecurringExpenses,
  );

  setCurrencyText(
    elements.spending.liabilityRepayments,
    breakdown.commitments.liabilityRepayments,
  );

  setCurrencyText(
    elements.spending.insuranceAmount,
    breakdown.commitments.insurancePremiums,
  );

  setCurrencyText(
    elements.spending.totalExpenses,
    breakdown.totalMonthlyExpenses,
  );

  setCurrencyText(
    elements.spending.totalCommitments,
    breakdown.totalMonthlyCommitments,
  );

  setCurrencyText(
    elements.spending.totalSpending,
    breakdown.totalMonthlyOutflow,
  );
}

/* ========================================
   FLOATING SUMMARY
======================================== */

export function renderFloatingSummary(position) {
  if (!position) {
    return;
  }

  setSignedCurrencyText(
    elements.floatingSummary.monthlySurplus,
    position.monthlySurplus,
  );

  setCurrencyText(
    elements.floatingSummary.goalSavings,
    position.minimumGoalSavings,
  );

  setSignedCurrencyText(
    elements.floatingSummary.breakdown.netSurplus,
    position.netSurplus,
  );

  setCurrencyText(
    elements.floatingSummary.breakdown.income,
    position.monthlyTakeHomeIncome,
  );

  setDeductionCurrencyText(
    elements.floatingSummary.breakdown.expenses,
    position.monthlyExpenses,
  );

  setDeductionCurrencyText(
    elements.floatingSummary.breakdown.commitments,
    position.monthlyCommitments,
  );

  setSignedCurrencyText(
    elements.floatingSummary.breakdown.surplus,
    position.monthlySurplus,
  );

  setDeductionCurrencyText(
    elements.floatingSummary.breakdown.goalSavings,
    position.minimumGoalSavings,
  );

  renderGoalSavingsBreakdown(
    position.goalSavingsSummary,
  );

  renderGoalSavingsStatus(
    position.goalSavingsSummary,
  );

  setSignedCurrencyText(
    elements.floatingSummary.availableSurplus,
    position.netSurplus,
  );

  applyFinancialPositionClass(
    elements.floatingSummary.container,
    position.netSurplus,
  );
}

function renderGoalSavingsBreakdown(goalSavingsSummary) {
  if (!elements.floatingSummary.goalSavingsList) {
    return;
  }

  elements.floatingSummary.goalSavingsList.replaceChildren();

  const validGoals = goalSavingsSummary?.validGoals || [];

  if (validGoals.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.className = "cost-of-wants-goal-savings-empty";

    emptyMessage.textContent = "No active goal savings required.";

    elements.floatingSummary.goalSavingsList.append(emptyMessage);

    return;
  }

  const fragment = document.createDocumentFragment();

  validGoals.forEach(function (goal) {
    fragment.append(createGoalSavingsRow(goal));
  });

  elements.floatingSummary.goalSavingsList.append(fragment);
}

function createGoalSavingsRow(goal) {
  const row = document.createElement("div");

  row.className = "cost-of-wants-goal-savings-row";

  const nameElement = document.createElement("span");

  nameElement.className = "cost-of-wants-goal-savings-name";

  const goalName = goal.name || "Unnamed Goal";

  nameElement.textContent = goalName;
  nameElement.title = goalName;

  const amountElement = document.createElement("strong");

  amountElement.className = "cost-of-wants-goal-savings-amount";

  amountElement.textContent = `-${formatCurrency(
    Math.abs(goal.monthlySavings),
  )}`;

  row.append(nameElement, amountElement);

  return row;
}

function renderGoalSavingsStatus(goalSavingsSummary) {
  if (!elements.floatingSummary.goalSavingsStatus) {
    return;
  }

  const reviewCount = goalSavingsSummary?.reviewGoalCount || 0;

  const incompleteCount = goalSavingsSummary?.incompleteGoalCount || 0;

  const messages = [];

  if (reviewCount > 0) {
    messages.push(
      `${reviewCount} overdue ${
        reviewCount === 1 ? "goal requires" : "goals require"
      } review`,
    );
  }

  if (incompleteCount > 0) {
    messages.push(
      `${incompleteCount} incomplete ${
        incompleteCount === 1 ? "goal is" : "goals are"
      } excluded`,
    );
  }

  elements.floatingSummary.goalSavingsStatus.hidden = messages.length === 0;

  elements.floatingSummary.goalSavingsStatus.textContent = messages.join(" · ");

  elements.floatingSummary.goalSavingsStatus.classList.toggle(
    "is-review",
    messages.length > 0,
  );
}

/* ========================================
   PRIVATE HELPERS
======================================== */

function setOptionalNumberInput(input, value) {
  if (!input) {
    return;
  }

  const number = Number(value);

  input.value = Number.isFinite(number) && number > 0 ? String(number) : "";
}

function setNumberInput(input, value) {
  if (!input) {
    return;
  }

  const number = Number(value);

  input.value = Number.isFinite(number) ? String(number) : "";
}

function setCurrencyText(element, value) {
  if (!element) {
    return;
  }

  element.textContent = formatCurrency(value);
}

function setDeductionCurrencyText(element, value) {
  if (!element) {
    return;
  }

  const amount = getValidAmount(value);

  element.textContent =
    amount > 0 ? `-${formatCurrency(amount)}` : formatCurrency(0);
}

function setSignedCurrencyText(element, value) {
  if (!element) {
    return;
  }

  const amount = Number(value);

  const safeAmount = Number.isFinite(amount) ? amount : 0;

  element.textContent = formatCurrency(safeAmount);

  applyFinancialPositionClass(element, safeAmount);
}

function applyFinancialPositionClass(element, value) {
  if (!element) {
    return;
  }

  element.classList.remove("is-positive", "is-negative", "is-neutral");

  if (value > 0) {
    element.classList.add("is-positive");
    return;
  }

  if (value < 0) {
    element.classList.add("is-negative");
    return;
  }

  element.classList.add("is-neutral");
}

function getValidAmount(value) {
  const amount = Number(value);

  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}