"use strict";

import {
  getCostOfWants,
  resetCostOfWantsState,
} from "../../state/client-plan.js";

import { getClientAge } from "../client-profile.js";

import { on, emit } from "../../events/event-bus.js";

import { EVENTS } from "../../events/events.js";

import { DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE } from "./cost-of-wants-calculator.js";

import {
  calculateClientCpfRetirementProjection,
  calculateFybcProjection,
  calculateMonthlyFinancialPosition,
  calculateMonthlySpendingBreakdown,
  getSelectedMonthlyIncome,
  saveFybcAssumptions,
  setCustomMonthlyIncome,
  setLifestyleOption,
} from "./cost-of-wants-service.js";

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
} from "./cost-of-wants-renderer.js";

import { costOfWantsElements } from "./cost-of-wants-elements.js";

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

  attachCalculationListeners();

  attachCpfRetirementOptionListeners();

  renderCostOfWants();

  moduleInitialized = true;
}

/* ========================================
   RESET
======================================== */

export function resetCostOfWants() {
  resetCostOfWantsState();

  selectedCpfRetirementOption = "frs";

  resetCpfGrowthRateInput();

  clearValidationMessage();

  collapseCalculatedBreakdown();

  collapseCpfCalculationDetails();

  collapseProjectionCalculationDetails();

  renderCostOfWants();

  emitCostOfWantsChanged();
}

function resetCpfGrowthRateInput() {
  if (!elements.inputs.cpfGrowthRate) {
    return;
  }

  elements.inputs.cpfGrowthRate.value = String(
    DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE,
  );
}

/* ========================================
   INPUT LISTENERS
======================================== */

function attachInputListeners() {
  const assumptionInputs = [
    elements.inputs.desiredFybcAge,
    elements.inputs.plannedMortalityAge,
    elements.inputs.inflationRate,
  ];

  assumptionInputs.forEach(function (input) {
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

function handleCostOfWantsInput() {
  saveCostOfWantsInputs();

  clearValidationMessage();

  renderFybcProjections();

  emitCostOfWantsChanged();
}

function handleCostOfWantsBlur() {
  saveCostOfWantsInputs();

  validateCostOfWants();
}

function handleCustomIncomeInput() {
  setCustomMonthlyIncome(elements.inputs.customIncome?.value);

  renderSelectedIncome(getSelectedMonthlyIncome());

  renderFybcProjections();

  emitCostOfWantsChanged();
}

function handleCpfGrowthRateInput() {
  renderCpfProjection();

  renderFybcProjections();
}

function saveCostOfWantsInputs() {
  saveFybcAssumptions({
    desiredFybcAge: elements.inputs.desiredFybcAge?.value,

    plannedMortalityAge: elements.inputs.plannedMortalityAge?.value,

    inflationRate: elements.inputs.inflationRate?.value,
  });
}

/* ========================================
   LIFESTYLE OPTIONS
======================================== */

function attachLifestyleListeners() {
  elements.lifestyle.optionButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectLifestyleOption(button.dataset.lifestyleOption);
    });
  });
}

function selectLifestyleOption(option) {
  const optionWasUpdated = setLifestyleOption(option);

  if (!optionWasUpdated) {
    return;
  }

  const costOfWants = getCostOfWants();

  renderLifestyleSelection(costOfWants);

  renderSelectedIncome(getSelectedMonthlyIncome());

  renderFybcProjections();

  emitCostOfWantsChanged();

  if (option === "custom") {
    elements.inputs.customIncome?.focus();
  }
}

/* ========================================
   FLOATING SUMMARY
======================================== */

function attachSummaryListeners() {
  elements.floatingSummary.toggleButton?.addEventListener(
    "click",
    toggleCalculatedBreakdown,
  );
}

function toggleCalculatedBreakdown() {
  const toggleButton = elements.floatingSummary.toggleButton;

  const calculatedBreakdown = elements.floatingSummary.calculatedBreakdown;

  if (!toggleButton || !calculatedBreakdown) {
    return;
  }

  const willExpand = calculatedBreakdown.hidden;

  calculatedBreakdown.hidden = !willExpand;

  toggleButton.setAttribute("aria-expanded", String(willExpand));

  elements.floatingSummary.container?.classList.toggle(
    "is-expanded",
    willExpand,
  );

  elements.floatingSummary.toggleIcon?.classList.toggle(
    "is-expanded",
    willExpand,
  );
}

function collapseCalculatedBreakdown() {
  const calculatedBreakdown = elements.floatingSummary.calculatedBreakdown;

  if (!calculatedBreakdown) {
    return;
  }

  calculatedBreakdown.hidden = true;

  elements.floatingSummary.toggleButton?.setAttribute("aria-expanded", "false");

  elements.floatingSummary.container?.classList.remove("is-expanded");

  elements.floatingSummary.toggleIcon?.classList.remove("is-expanded");
}

/* ========================================
   CALCULATION DETAILS
======================================== */

function attachCalculationListeners() {
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
  const toggleButton = elements.cpf.calculationToggleButton;

  const calculationDetails = elements.cpf.calculationDetails;

  if (!toggleButton || !calculationDetails) {
    return;
  }

  const willExpand = calculationDetails.hidden;

  calculationDetails.hidden = !willExpand;

  toggleButton.setAttribute("aria-expanded", String(willExpand));

  elements.cpf.calculationToggleIcon?.classList.toggle(
    "is-expanded",
    willExpand,
  );
}

function toggleProjectionCalculationDetails() {
  const toggleButton = elements.projection.calculationToggleButton;

  const calculationDetails = elements.projection.calculationDetails;

  if (!toggleButton || !calculationDetails) {
    return;
  }

  const willExpand = calculationDetails.hidden;

  calculationDetails.hidden = !willExpand;

  toggleButton.setAttribute("aria-expanded", String(willExpand));

  elements.projection.calculationToggleIcon?.classList.toggle(
    "is-expanded",
    willExpand,
  );
}

function collapseCpfCalculationDetails() {
  if (elements.cpf.calculationDetails) {
    elements.cpf.calculationDetails.hidden = true;
  }

  elements.cpf.calculationToggleButton?.setAttribute("aria-expanded", "false");

  elements.cpf.calculationToggleIcon?.classList.remove("is-expanded");
}

function collapseProjectionCalculationDetails() {
  if (elements.projection.calculationDetails) {
    elements.projection.calculationDetails.hidden = true;
  }

  elements.projection.calculationToggleButton?.setAttribute(
    "aria-expanded",
    "false",
  );

  elements.projection.calculationToggleIcon?.classList.remove("is-expanded");
}

/* ========================================
   CPF RETIREMENT OPTIONS
======================================== */

function attachCpfRetirementOptionListeners() {
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
    ["[data-cpf-retirement-option]", '[aria-checked="true"]'].join(""),
  );

  return selectedButton?.dataset.cpfRetirementOption || "brs";
}

/* ========================================
   APPLICATION EVENTS
======================================== */

function attachApplicationListeners() {
  on(EVENTS.PROFILE_CHANGED, function () {
    renderCostOfWants();

    clearValidationMessage();
  });

  on(EVENTS.INCOME_CHANGED, renderFloatingFinancialSummary);

  on(EVENTS.EXPENSES_CHANGED, renderSpendingAndFinancialSummary);

  on(EVENTS.COMMITMENTS_CHANGED, renderSpendingAndFinancialSummary);

  on(EVENTS.LIABILITIES_CHANGED, renderSpendingAndFinancialSummary);

  on(EVENTS.POLICIES_CHANGED, renderSpendingAndFinancialSummary);

  on(EVENTS.GOALS_CHANGED, renderFloatingFinancialSummary);

  on(EVENTS.SECTION_CHANGED, function ({ section }) {
    if (section === "cost") {
      renderCostOfWants();
    }
  });
}

/* ========================================
   RENDERING ORCHESTRATION
======================================== */

export function renderCostOfWants() {
  const costOfWants = getCostOfWants();

  renderClientDetails(getClientAge());

  syncCostOfWantsInputs(costOfWants);

  renderLifestyleSelection(costOfWants);

  renderSelectedIncome(getSelectedMonthlyIncome());

  renderMonthlySpendingBreakdown(calculateMonthlySpendingBreakdown());

  renderFloatingFinancialSummary();

  renderCpfRetirementOptionSelection(selectedCpfRetirementOption);

  renderCpfProjection();

  renderFybcProjections();
}

function renderSpendingAndFinancialSummary() {
  renderMonthlySpendingBreakdown(calculateMonthlySpendingBreakdown());

  renderFloatingFinancialSummary();
}

function renderFloatingFinancialSummary() {
  renderFloatingSummary(calculateMonthlyFinancialPosition());
}

function renderCpfProjection() {
  const cpfProjection = calculateClientCpfRetirementProjection({
    cpfGrowthRate: getCpfGrowthRateInputValue(),
  });

  renderProjectedCpfRetirementSums(cpfProjection);
}

function renderFybcProjections() {
  const cpfGrowthRate = getCpfGrowthRateInputValue();

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

function getCpfGrowthRateInputValue() {
  return elements.inputs.cpfGrowthRate?.value;
}

/* ========================================
   VALIDATION
======================================== */

function validateCostOfWants() {
  if (!validateFybcAge()) {
    return false;
  }

  const { plannedMortalityAge, inflationRate } = getCostOfWants();

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
      [
        "Desired FYBC Age must be above ",
        `the client's current age of ${currentAge}.`,
      ].join(""),
      elements.inputs.desiredFybcAge,
    );

    return false;
  }

  if (plannedMortalityAge > 0 && desiredFybcAge >= plannedMortalityAge) {
    showValidationMessage(
      ["Desired FYBC Age must be below ", "the planned mortality age."].join(
        "",
      ),
      elements.inputs.desiredFybcAge,
    );

    return false;
  }

  clearValidationMessage();

  return true;
}

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