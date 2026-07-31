"use strict";

import {
  getClientProfile,
  getCostOfWants,
  resetCostOfWantsState,
} from "../state/client-plan.js";

import { getClientAge } from "./client-profile.js";

import { on, emit } from "../events/event-bus.js";

import { EVENTS } from "../events/events.js";

import { DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE } from "./cost-of-wants/cost-of-wants-calculator.js";

import {
  calculateClientCpfRetirementProjection,
  calculateFybcProjection,
  calculateMonthlyFinancialPosition,
  calculateMonthlySpendingBreakdown,
  getSelectedMonthlyIncome,
  saveFybcAssumptions,
  setCustomMonthlyIncome,
  setLifestyleOption,
} from "./cost-of-wants/cost-of-wants-service.js";

import {
  renderClientDetails,
  renderCpfRetirementOptionSelection,
  renderFloatingSummary,
  renderFybcProjection,
  renderLifestyleSelection,
  renderMonthlySpendingBreakdown,
  renderProjectedCpfRetirementSums,
  renderSelectedIncome,
  syncCostOfWantsInputs,
} from "./cost-of-wants/cost-of-wants-renderer.js";

import { costOfWantsElements } from "./cost-of-wants/cost-of-wants-elements.js";

/* ========================================
   PAGE ELEMENTS
======================================== */

const elements = costOfWantsElements;

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

let selectedCpfRetirementOption = getSelectedCpfRetirementOption();

/* ========================================
   INITIALIZATION
======================================== */

export function initializeCostOfWants() {
  if (moduleInitialized) {
    renderCostOfWants();
    return;
  }

  attachInputListeners();
  attachLifestyleListeners();
  attachSummaryListeners();
  attachApplicationListeners();
  attachCpfCalculationListeners();
  initializeCpfRetirementOptions();

  renderCostOfWants();

  moduleInitialized = true;
}

/* ========================================
   RESET
======================================== */

export function resetCostOfWants() {
  resetCostOfWantsState();

  selectedCpfRetirementOption = "frs";

  if (elements.inputs.cpfGrowthRate) {
    elements.inputs.cpfGrowthRate.value = String(
      DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE,
    );
  }

  renderCpfRetirementOptionSelection(selectedCpfRetirementOption);

  clearValidationMessage();

  renderCostOfWants();

  collapseCalculatedBreakdown();

  emitCostOfWantsChanged();
}

function collapseCalculatedBreakdown() {
  if (!elements.floatingSummary.calculatedBreakdown) {
    return;
  }

  elements.floatingSummary.calculatedBreakdown.hidden = true;

  elements.floatingSummary.toggleButton?.setAttribute("aria-expanded", "false");

  elements.floatingSummary.container?.classList.remove("is-expanded");

  elements.floatingSummary.toggleIcon?.classList.remove("is-expanded");
}

/* ========================================
   EVENT LISTENERS
======================================== */

function attachInputListeners() {
  const inputs = [
    elements.inputs.desiredFybcAge,
    elements.inputs.plannedMortalityAge,
    elements.inputs.inflationRate,
  ];

  inputs.forEach(function (input) {
    if (!input) {
      return;
    }

    input.addEventListener("input", handleCostOfWantsInput);

    input.addEventListener("blur", handleCostOfWantsBlur);
  });

  elements.inputs.cpfGrowthRate?.addEventListener(
    "input",
    handleCpfGrowthRateInput,
  );

  elements.inputs.customIncome?.addEventListener(
    "input",
    handleCustomIncomeInput,
  );
}

function handleCpfGrowthRateInput() {
  const cpfProjection = calculateClientCpfRetirementProjection({
    cpfGrowthRate: elements.inputs.cpfGrowthRate?.value,
  });

  renderProjectedCpfRetirementSums(cpfProjection);

  renderFybcProjections();
}

function attachLifestyleListeners() {
  elements.lifestyle.optionButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectLifestyleOption(button.dataset.lifestyleOption);
    });
  });
}

function toggleCalculatedBreakdown() {
  if (
    !elements.floatingSummary.toggleButton ||
    !elements.floatingSummary.calculatedBreakdown
  ) {
    return;
  }

  const willExpand = elements.floatingSummary.calculatedBreakdown.hidden;

  elements.floatingSummary.calculatedBreakdown.hidden = !willExpand;

  elements.floatingSummary.toggleButton.setAttribute(
    "aria-expanded",
    String(willExpand),
  );

  elements.floatingSummary.container?.classList.toggle(
    "is-expanded",
    willExpand,
  );

  elements.floatingSummary.toggleIcon?.classList.toggle(
    "is-expanded",
    willExpand,
  );
}

function attachSummaryListeners() {
  elements.floatingSummary.toggleButton?.addEventListener(
    "click",
    toggleCalculatedBreakdown,
  );
}

function attachApplicationListeners() {
  on(EVENTS.PROFILE_CHANGED, function () {
    renderCostOfWants();

    clearValidationMessage();
  });

  on(EVENTS.INCOME_CHANGED, function () {
    renderFloatingSummary(calculateMonthlyFinancialPosition());
  });

  on(EVENTS.EXPENSES_CHANGED, function () {
    renderSpendingAndProjection();
  });

  on(EVENTS.COMMITMENTS_CHANGED, function () {
    renderSpendingAndProjection();
  });

  on(EVENTS.LIABILITIES_CHANGED, function () {
    renderSpendingAndProjection();
  });

  on(EVENTS.POLICIES_CHANGED, function () {
    renderSpendingAndProjection();
  });

  on(EVENTS.GOALS_CHANGED, function () {
    renderFloatingSummary(calculateMonthlyFinancialPosition());
  });

  on(EVENTS.SECTION_CHANGED, function ({ section }) {
    if (section === "cost") {
      renderCostOfWants();
    }
  });
}

function renderSpendingAndProjection() {
  renderMonthlySpendingBreakdown(calculateMonthlySpendingBreakdown());

  renderFloatingSummary(calculateMonthlyFinancialPosition());

  renderFybcProjections();
}

function handleCostOfWantsBlur() {
  saveCostOfWantsInputs();

  validateFybcAge();
  validateCostOfWants();
}

function handleCostOfWantsInput() {
  saveCostOfWantsInputs();

  clearValidationMessage();

  renderFybcProjections();

  emitCostOfWantsChanged();
}

function handleCustomIncomeInput() {
  setCustomMonthlyIncome(elements.inputs.customIncome?.value);

  renderSelectedIncome(getSelectedMonthlyIncome());

  renderMonthlySpendingBreakdown(calculateMonthlySpendingBreakdown());

  renderFybcProjections();

  emitCostOfWantsChanged();
}

/* ========================================
   STATE
======================================== */

function selectLifestyleOption(option) {
  const optionWasUpdated = setLifestyleOption(option);

  if (!optionWasUpdated) {
    return;
  }

  const costOfWants = getCostOfWants();

  const selectedMonthlyIncome = getSelectedMonthlyIncome();

  renderLifestyleSelection(costOfWants);

  renderSelectedIncome(selectedMonthlyIncome);

  renderMonthlySpendingBreakdown(calculateMonthlySpendingBreakdown());

  renderFybcProjections();

  emitCostOfWantsChanged();

  if (option === "custom") {
    elements.inputs.customIncome?.focus();
  }
}

function saveCostOfWantsInputs() {
  saveFybcAssumptions({
    desiredFybcAge: elements.inputs.desiredFybcAge?.value,

    plannedMortalityAge: elements.inputs.plannedMortalityAge?.value,

    inflationRate: elements.inputs.inflationRate?.value,
  });
}

/* ========================================
   RENDERING
======================================== */

function renderCostOfWants() {
  const costOfWants = getCostOfWants();

  const currentAge = getClientAge();

  const selectedMonthlyIncome = getSelectedMonthlyIncome();

  const spendingBreakdown = calculateMonthlySpendingBreakdown();

  const financialPosition = calculateMonthlyFinancialPosition();

  const cpfGrowthRate = elements.inputs.cpfGrowthRate?.value;

  const cpfProjection = calculateClientCpfRetirementProjection({
    cpfGrowthRate,
  });

  const fybcProjection = calculateFybcProjection({
    selectedCpfRetirementOption,
    cpfGrowthRate,
  });

  renderClientDetails(currentAge);

  syncCostOfWantsInputs(costOfWants);

  renderLifestyleSelection(costOfWants);

  renderSelectedIncome(selectedMonthlyIncome);

  renderMonthlySpendingBreakdown(spendingBreakdown);

  renderFloatingSummary(financialPosition);

  renderCpfRetirementOptionSelection(selectedCpfRetirementOption);

  renderProjectedCpfRetirementSums(cpfProjection);

  renderFybcProjection({
    projection: fybcProjection,

    cpfProjection,

    selectedCpfRetirementOption,
  });
}

/* ========================================
   CPF RETIREMENT OPTIONS
======================================== */

function attachCpfCalculationListeners() {
  elements.cpf.calculationToggleButton?.addEventListener(
    "click",
    toggleCpfCalculationDetails,
  );

  elements.projection.calculationToggleButton?.addEventListener(
    "click",
    toggleProjectionCalculationDetails,
  );
}

function toggleCpfCalculationDetails() {
  if (
    !elements.cpf.calculationToggleButton ||
    !elements.cpf.calculationDetails
  ) {
    return;
  }

  const willExpand = elements.cpf.calculationDetails.hidden;

  elements.cpf.calculationDetails.hidden = !willExpand;

  elements.cpf.calculationToggleButton.setAttribute(
    "aria-expanded",
    String(willExpand),
  );

  elements.cpf.calculationToggleIcon?.classList.toggle(
    "is-expanded",
    willExpand,
  );
}

function toggleProjectionCalculationDetails() {
  if (
    !elements.projection.calculationToggleButton ||
    !elements.projection.calculationDetails
  ) {
    return;
  }

  const willExpand = elements.projection.calculationDetails.hidden;

  elements.projection.calculationDetails.hidden = !willExpand;

  elements.projection.calculationToggleButton.setAttribute(
    "aria-expanded",
    String(willExpand),
  );

  elements.projection.calculationToggleIcon?.classList.toggle(
    "is-expanded",
    willExpand,
  );
}

function initializeCpfRetirementOptions() {
  elements.cpf.optionButtons.forEach(function (button) {
    button.addEventListener("click", handleCpfRetirementOptionClick);
  });
}

function handleCpfRetirementOptionClick(event) {
  const selectedButton = event.currentTarget;

  const selectedOption = selectedButton.dataset.cpfRetirementOption;

  if (!selectedOption) {
    return;
  }

  selectedCpfRetirementOption = selectedOption;

  renderCpfRetirementOptionSelection(selectedCpfRetirementOption);

  renderFybcProjections();

  emitCostOfWantsChanged();
}

function getSelectedCpfRetirementOption() {
  const selectedButton = document.querySelector(
    '[data-cpf-retirement-option][aria-checked="true"]',
  );

  return selectedButton?.dataset.cpfRetirementOption || "brs";
}

/* ========================================
   FYBC PROJECTIONS
======================================== */

function renderFybcProjections() {
  const cpfGrowthRate = elements.inputs.cpfGrowthRate?.value;

  const cpfProjection = calculateClientCpfRetirementProjection({
    cpfGrowthRate,
  });

  const projection = calculateFybcProjection({
    selectedCpfRetirementOption,
    cpfGrowthRate,
  });

  renderFybcProjection({
    projection,
    cpfProjection,
    selectedCpfRetirementOption,
  });
}

/* ========================================
   VALIDATION
======================================== */

function validateFybcAge() {
  const currentAge = getClientAge();

  const { desiredFybcAge, plannedMortalityAge } = getCostOfWants();

  if (currentAge === null || currentAge <= 0) {
    showValidationMessage("Complete the client's date of birth.");

    return false;
  }

  if (desiredFybcAge <= 0) {
    showValidationMessage(
      "Please enter the age you want to FYBC.",
      elements.inputs.desiredFybcAge,
    );

    return false;
  }

  if (desiredFybcAge <= currentAge) {
    showValidationMessage(
      `Desired FYBC Age must be above the client's current age of ${currentAge}.`,
      elements.inputs.desiredFybcAge,
    );

    return false;
  }

  if (plannedMortalityAge > 0 && desiredFybcAge >= plannedMortalityAge) {
    showValidationMessage(
      "Desired FYBC Age must be below the planned mortality age.",
      elements.inputs.desiredFybcAge,
    );

    return false;
  }

  clearValidationMessage();

  return true;
}

function validateCostOfWants() {
  const { plannedMortalityAge, inflationRate } = getCostOfWants();

  if (!validateFybcAge()) {
    return false;
  }

  if (plannedMortalityAge <= 65) {
    showValidationMessage(
      "Planned mortality age must be above age 65.",
      elements.inputs.plannedMortalityAge,
    );

    return false;
  }

  if (inflationRate < 0) {
    showValidationMessage(
      "Inflation rate cannot be negative.",
      elements.inputs.inflationRate,
    );

    return false;
  }

  clearValidationMessage();

  return true;
}

/* ========================================
   INPUT HELPERS
======================================== */

function formatCurrency(value) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

/* ========================================
   VALIDATION MESSAGE
======================================== */

function showValidationMessage(message, inputElement = null) {
  if (!elements.validation.message) {
    return;
  }

  clearInvalidInputs();

  elements.validation.message.textContent = message;

  elements.validation.message.hidden = false;

  inputElement?.setAttribute("aria-invalid", "true");
}

function clearValidationMessage() {
  if (elements.validation.message) {
    elements.validation.message.textContent = "";

    elements.validation.message.hidden = true;
  }

  clearInvalidInputs();
}

function clearInvalidInputs() {
  [
    elements.inputs.desiredFybcAge,
    elements.inputs.plannedMortalityAge,
    elements.inputs.inflationRate,
    elements.inputs.customIncome,
  ].forEach(function (input) {
    input?.removeAttribute("aria-invalid");
  });
}

/* ========================================
   EVENTS
======================================== */

function emitCostOfWantsChanged() {
  emit(EVENTS.COST_OF_WANTS_CHANGED, {
    costOfWants: {
      ...getCostOfWants(),
    },

    currentAge: getClientAge(),
    selectedMonthlyIncome: getSelectedMonthlyIncome(),
  });
}

/* ========================================
   LIFESTYLE AMOUNTS
======================================== */

const LIFESTYLE_AMOUNTS = Object.freeze({
  basic: 3000,
  average: 5000,
  comfort: 8000,
});
