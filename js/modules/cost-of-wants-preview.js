"use strict";

import {
  getCostOfWantsState,
  getGrossRetirementGoalSummary,
  getSelectedMonthlyIncome,
  saveFybcAssumptions,
  setCustomMonthlyIncome,
  setLifestyleOption,
} from "./cost-of-wants/cost-of-wants-service.js";

import { getClientAge } from "./client-profile.js";

import { formatCurrency } from "../utils/client-utils.js";

import { emit, on } from "../events/event-bus.js";

import { EVENTS } from "../events/events.js";

/* ========================================
   ELEMENTS
======================================== */

const elements = {
  currentAge: document.getElementById("costOfWantsPreviewCurrentAge"),

  desiredFybcAgeInput: document.getElementById(
    "costOfWantsPreviewDesiredFybcAgeInput",
  ),

  mortalityAgeInput: document.getElementById(
    "costOfWantsPreviewMortalityAgeInput",
  ),

  inflationRateInput: document.getElementById(
    "costOfWantsPreviewInflationRateInput",
  ),

  postFybcReturnRateInput: document.getElementById(
    "costOfWantsPreviewPostFybcReturnRateInput",
  ),

  lifestyleButtons: Array.from(
    document.querySelectorAll("[data-preview-lifestyle-option]"),
  ),

  customIncomeGroup: document.getElementById(
    "costOfWantsPreviewCustomIncomeGroup",
  ),

  customIncomeInput: document.getElementById(
    "costOfWantsPreviewCustomIncomeInput",
  ),

  selectedIncome: document.getElementById("costOfWantsPreviewSelectedIncome"),

  validationMessage: document.getElementById(
    "costOfWantsPreviewValidationMessage",
  ),

  yearsRemaining: document.getElementById("costOfWantsPreviewYearsRemaining"),

  incomeAtFybcLabel: document.getElementById(
    "costOfWantsPreviewIncomeAtFybcLabel",
  ),

  incomeAtFybc: document.getElementById("costOfWantsPreviewIncomeAtFybc"),

  incomeAtFybcBasis: document.getElementById(
    "costOfWantsPreviewIncomeAtFybcBasis",
  ),

  incomeAt65: document.getElementById("costOfWantsPreviewIncomeAt65"),

  grossCapital: document.getElementById("costOfWantsPreviewGrossCapital"),

  emptyMessage: document.getElementById("costOfWantsPreviewEmptyMessage"),

  analysisButton: document.getElementById("costOfWantsPreviewAnalysisButton"),
};

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

let isSavingPreviewInputs = false;

/* ========================================
   INITIALIZATION
======================================== */

export function initializeCostOfWantsPreview() {
  if (moduleInitialized) {
    renderCostOfWantsPreview();

    return;
  }

  attachInputListeners();

  attachLifestyleListeners();

  attachNavigationListeners();

  attachApplicationListeners();

  renderCostOfWantsPreview();

  moduleInitialized = true;
}

/* ========================================
   INPUT LISTENERS
======================================== */

function attachInputListeners() {
  const assumptionInputs = [
    elements.desiredFybcAgeInput,
    elements.mortalityAgeInput,
    elements.inflationRateInput,
    elements.postFybcReturnRateInput,
  ];

  assumptionInputs.forEach(function (input) {
    input?.addEventListener("input", handleAssumptionInput);

    input?.addEventListener("blur", handleAssumptionBlur);
  });

  elements.customIncomeInput?.addEventListener(
    "input",
    handleCustomIncomeInput,
  );

  elements.customIncomeInput?.addEventListener("blur", validatePreviewInputs);
}

function handleAssumptionInput() {
  savePreviewAssumptions();

  clearValidationMessage();

  renderProjectionResults();

  emitCostOfWantsChanged();
}

function handleAssumptionBlur() {
  savePreviewAssumptions();

  validatePreviewInputs();

  renderProjectionResults();
}

function handleCustomIncomeInput() {
  setCustomMonthlyIncome(elements.customIncomeInput?.value);

  clearValidationMessage();

  renderSelectedIncome();

  renderProjectionResults();

  emitCostOfWantsChanged();
}

function savePreviewAssumptions() {
  if (isSavingPreviewInputs) {
    return;
  }

  isSavingPreviewInputs = true;

  saveFybcAssumptions({
    desiredFybcAge: elements.desiredFybcAgeInput?.value,

    plannedMortalityAge: elements.mortalityAgeInput?.value,

    inflationRate: elements.inflationRateInput?.value,

    postFybcReturnRate: elements.postFybcReturnRateInput?.value,
  });

  isSavingPreviewInputs = false;
}

/* ========================================
   LIFESTYLE SELECTION
======================================== */

function attachLifestyleListeners() {
  elements.lifestyleButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectLifestyleOption(button.dataset.previewLifestyleOption);
    });
  });
}

function selectLifestyleOption(option) {
  const optionWasSaved = setLifestyleOption(option);

  if (!optionWasSaved) {
    return;
  }

  clearValidationMessage();

  renderLifestyleSelection();

  renderSelectedIncome();

  renderProjectionResults();

  emitCostOfWantsChanged();

  if (option === "custom") {
    elements.customIncomeInput?.focus();
  }
}

/* ========================================
   NAVIGATION
======================================== */

function attachNavigationListeners() {
  elements.analysisButton?.addEventListener("click", function () {
    navigateToSection("cost-analysis");
  });
}

function navigateToSection(sectionName) {
  const sidebarButton = document.querySelector(
    `.sidebar-item[data-section="${sectionName}"]`,
  );

  sidebarButton?.click();
}

/* ========================================
   APPLICATION EVENTS
======================================== */

function attachApplicationListeners() {
  on(EVENTS.COST_OF_WANTS_CHANGED, renderCostOfWantsPreview);

  on(EVENTS.PROFILE_CHANGED, renderCostOfWantsPreview);

  on(EVENTS.SECTION_CHANGED, function ({ section }) {
    if (section === "cost") {
      renderCostOfWantsPreview();
    }
  });
}

/* ========================================
   MAIN RENDER
======================================== */

export function renderCostOfWantsPreview() {
  syncInputValues();

  renderCurrentAge();

  renderLifestyleSelection();

  renderSelectedIncome();

  renderProjectionResults();
}

function syncInputValues() {
  const costOfWants = getCostOfWantsState();

  setInputValue(elements.desiredFybcAgeInput, costOfWants.desiredFybcAge);

  setInputValue(elements.mortalityAgeInput, costOfWants.plannedMortalityAge);

  setInputValue(elements.inflationRateInput, costOfWants.inflationRate);

  setInputValue(
    elements.postFybcReturnRateInput,
    costOfWants.postFybcReturnRate,
  );

  setInputValue(elements.customIncomeInput, costOfWants.customMonthlyIncome);
}

function renderCurrentAge() {
  const currentAge = getClientAge();

  setText(
    elements.currentAge,
    Number.isFinite(currentAge) ? String(currentAge) : "—",
  );
}

function renderLifestyleSelection() {
  const { lifestyleOption } = getCostOfWantsState();

  elements.lifestyleButtons.forEach(function (button) {
    const isSelected =
      button.dataset.previewLifestyleOption === lifestyleOption;

    button.classList.toggle("selected", isSelected);

    button.setAttribute("aria-checked", String(isSelected));
  });

  if (elements.customIncomeGroup) {
    elements.customIncomeGroup.hidden = lifestyleOption !== "custom";
  }
}

function renderSelectedIncome() {
  const selectedIncome = getSelectedMonthlyIncome();

  setText(
    elements.selectedIncome,
    selectedIncome > 0
      ? `${formatCurrency(selectedIncome)}/mth`
      : "Not selected",
  );
}

/* ========================================
   PROJECTION RESULTS
======================================== */

function renderProjectionResults() {
  const summary = getGrossRetirementGoalSummary();

  const desiredFybcAge = Number(getCostOfWantsState().desiredFybcAge);

  setText(
    elements.incomeAtFybcLabel,
    desiredFybcAge > 0
      ? `Income Needed at FYBC Age ${desiredFybcAge}`
      : "Income Needed at FYBC Age",
  );

  if (!summary.isValid) {
    renderIncompleteSummary();

    return;
  }

  setText(
    elements.yearsRemaining,
    `${summary.yearsRemaining} ${
      summary.yearsRemaining === 1 ? "year" : "years"
    }`,
  );

  setText(
    elements.incomeAtFybc,
    `${formatCurrency(summary.monthlyIncomeAtFybc)}/mth`,
  );

  setText(
    elements.incomeAtFybcBasis,
    `After ${formatNumber(summary.inflationRate)}% annual inflation`,
  );

  setText(
    elements.incomeAt65,
    `${formatCurrency(summary.monthlyIncomeAt65)}/mth`,
  );

  setText(elements.grossCapital, formatCurrency(summary.grossCapitalRequired));

  if (elements.emptyMessage) {
    elements.emptyMessage.hidden = true;
  }
}

function renderIncompleteSummary() {
  [
    elements.yearsRemaining,
    elements.incomeAtFybc,
    elements.incomeAt65,
    elements.grossCapital,
  ].forEach(function (element) {
    setText(element, "—");
  });

  setText(elements.incomeAtFybcBasis, "Complete the retirement target inputs");

  if (elements.emptyMessage) {
    elements.emptyMessage.hidden = false;
  }
}

/* ========================================
   VALIDATION
======================================== */

function validatePreviewInputs() {
  const currentAge = getClientAge();

  const desiredFybcAge = Number(elements.desiredFybcAgeInput?.value);

  const mortalityAge = Number(elements.mortalityAgeInput?.value);

  const inflationRate = Number(elements.inflationRateInput?.value);

  const postFybcReturnRate = Number(elements.postFybcReturnRateInput?.value);

  if (!Number.isFinite(currentAge)) {
    showValidationMessage(
      "Complete the client's date of birth first.",
      elements.desiredFybcAgeInput,
    );

    return false;
  }

  if (!Number.isInteger(desiredFybcAge) || desiredFybcAge <= currentAge) {
    showValidationMessage(
      `Desired FYBC age must be above the current age of ${currentAge}.`,
      elements.desiredFybcAgeInput,
    );

    return false;
  }

  if (!Number.isInteger(mortalityAge) || mortalityAge <= desiredFybcAge) {
    showValidationMessage(
      "Planned mortality age must be above the desired FYBC age.",
      elements.mortalityAgeInput,
    );

    return false;
  }

  if (mortalityAge <= 65) {
    showValidationMessage(
      "Planned mortality age must be above age 65.",
      elements.mortalityAgeInput,
    );

    return false;
  }

  if (!Number.isFinite(inflationRate) || inflationRate < 0) {
    showValidationMessage(
      "Inflation rate cannot be negative.",
      elements.inflationRateInput,
    );

    return false;
  }

  if (
    !Number.isFinite(postFybcReturnRate) ||
    postFybcReturnRate < 0 ||
    postFybcReturnRate > 20
  ) {
    showValidationMessage(
      "Post-FYBC return must be between 0% and 20%.",
      elements.postFybcReturnRateInput,
    );

    return false;
  }

  if (getSelectedMonthlyIncome() <= 0) {
    showValidationMessage("Select an ideal monthly passive income.");

    return false;
  }

  clearValidationMessage();

  return true;
}

function showValidationMessage(message, input) {
  if (elements.validationMessage) {
    elements.validationMessage.textContent = message;

    elements.validationMessage.hidden = false;
  }

  input?.classList.add("is-invalid");
}

function clearValidationMessage() {
  if (elements.validationMessage) {
    elements.validationMessage.textContent = "";

    elements.validationMessage.hidden = true;
  }

  [
    elements.desiredFybcAgeInput,
    elements.mortalityAgeInput,
    elements.inflationRateInput,
    elements.customIncomeInput,
  ].forEach(function (input) {
    input?.classList.remove("is-invalid");
  });
}

/* ========================================
   EVENTS
======================================== */

function emitCostOfWantsChanged() {
  emit(EVENTS.COST_OF_WANTS_CHANGED, {
    costOfWants: {
      ...getCostOfWantsState(),
    },
  });
}

/* ========================================
   HELPERS
======================================== */

function setInputValue(input, value) {
  if (!input) {
    return;
  }

  const nextValue = Number(value) > 0 ? String(value) : "";

  if (document.activeElement !== input && input.value !== nextValue) {
    input.value = nextValue;
  }
}

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return new Intl.NumberFormat("en-SG", {
    maximumFractionDigits: 1,
  }).format(number);
}

function setText(element, value) {
  if (!element) {
    return;
  }

  element.textContent = value;
}