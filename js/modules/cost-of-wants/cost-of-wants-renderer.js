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

function formatCurrency(value) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}