"use strict";

import {
  getClientProfile,
  getCostOfWants,
  updateCostOfWants,
} from "../state/client-plan.js";

import { getClientAge } from "./client-profile.js";

import { on, emit } from "../events/event-bus.js";

import { EVENTS } from "../events/events.js";

/* ========================================
   PAGE ELEMENTS
======================================== */

const costOfWantsHeading = document.getElementById("costOfWantsHeading");

const currentAgeInput = document.getElementById("costOfWantsCurrentAge");

const desiredRetirementAgeInput = document.getElementById(
  "desiredRetirementAge",
);

const plannedMortalityAgeInput = document.getElementById("plannedMortalityAge");

const inflationRateInput = document.getElementById("costOfWantsInflationRate");

const postRetirementReturnRateInput = document.getElementById(
  "postRetirementReturnRate",
);

const lifestyleOptionButtons = Array.from(
  document.querySelectorAll("[data-lifestyle-option]"),
);

const customIncomeGroup = document.getElementById(
  "costOfWantsCustomIncomeGroup",
);

const customIncomeInput = document.getElementById("costOfWantsCustomIncome");

const selectedIncomeSummary = document.getElementById(
  "costOfWantsSelectedIncome",
);

const selectedIncomeAmount = document.getElementById(
  "costOfWantsSelectedIncomeAmount",
);

const formMessage = document.getElementById("costOfWantsFormMessage");

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

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
    attachApplicationListeners();

  renderCostOfWants();

  moduleInitialized = true;
}

/* ========================================
   RESET
======================================== */

export function resetCostOfWants() {
  updateCostOfWants(createDefaultCostOfWants());

  clearFormMessage();
  renderCostOfWants();

  emitCostOfWantsChanged();
}

/* ========================================
   EVENT LISTENERS
======================================== */

function attachInputListeners() {
  const inputs = [
    desiredRetirementAgeInput,
    plannedMortalityAgeInput,
    inflationRateInput,
    postRetirementReturnRateInput,
  ];

  inputs.forEach(function (input) {
    if (!input) {
      return;
    }

    input.addEventListener("input", handleCostOfWantsInput);
    input.addEventListener("blur", validateCostOfWants);
  });

  customIncomeInput?.addEventListener("input", handleCustomIncomeInput);
}

function attachLifestyleListeners() {
  lifestyleOptionButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectLifestyleOption(button.dataset.lifestyleOption);
    });
  });
}

function attachApplicationListeners() {
  on(EVENTS.PROFILE_CHANGED, function () {
    renderClientDetails();
    validateCostOfWants();
  });

  on(EVENTS.SECTION_CHANGED, function ({ section }) {
    if (section === "cost") {
      renderCostOfWants();
    }
  });
}

function handleCostOfWantsInput() {
  saveCostOfWantsInputs();
  clearFormMessage();

  emitCostOfWantsChanged();
}

function handleCustomIncomeInput() {
  updateCostOfWants({
    customMonthlyIncome: getWholeNumberInput(customIncomeInput),
  });

  renderSelectedIncome();
  emitCostOfWantsChanged();
}

/* ========================================
   STATE
======================================== */

function selectLifestyleOption(option) {
  const validOptions = ["basic", "average", "comfort", "custom"];

  if (!validOptions.includes(option)) {
    return;
  }

  updateCostOfWants({
    lifestyleOption: option,
  });

  renderLifestyleSelection();
  renderSelectedIncome();

  emitCostOfWantsChanged();

  if (option === "custom") {
    customIncomeInput?.focus();
  }
}

function saveCostOfWantsInputs() {
  updateCostOfWants({
    desiredRetirementAge: getWholeNumberInput(desiredRetirementAgeInput),

    plannedMortalityAge: getWholeNumberInput(plannedMortalityAgeInput),

    inflationRate: getDecimalInput(inflationRateInput),

    postRetirementReturnRate: getDecimalInput(postRetirementReturnRateInput),
  });
}

/* ========================================
   RENDERING
======================================== */

function renderCostOfWants() {
  renderClientDetails();
  syncCostOfWantsInputs();
  renderLifestyleSelection();
  renderSelectedIncome();
}

function renderClientDetails() {
  const profile = getClientProfile();

  const fullName = profile.fullName.trim();

  if (costOfWantsHeading) {
    costOfWantsHeading.textContent = fullName
      ? `Cost of Wants for ${fullName}`
      : "Cost of Wants";
  }

  if (currentAgeInput) {
    const currentAge = getClientAge();

    currentAgeInput.value = currentAge === null ? "" : String(currentAge);
  }
}

function syncCostOfWantsInputs() {
  const costOfWants = getCostOfWants();

  setOptionalNumberInput(
    desiredRetirementAgeInput,
    costOfWants.desiredRetirementAge,
  );

  setNumberInput(plannedMortalityAgeInput, costOfWants.plannedMortalityAge);

  setNumberInput(inflationRateInput, costOfWants.inflationRate);

  setNumberInput(
    postRetirementReturnRateInput,
    costOfWants.postRetirementReturnRate,
  );
}

function renderLifestyleSelection() {
  const { lifestyleOption, customMonthlyIncome } = getCostOfWants();

  lifestyleOptionButtons.forEach(function (button) {
    const isSelected = button.dataset.lifestyleOption === lifestyleOption;

    button.classList.toggle("is-selected", isSelected);

    button.setAttribute("aria-checked", String(isSelected));
  });

  if (customIncomeGroup) {
    customIncomeGroup.hidden = lifestyleOption !== "custom";
  }

  if (customIncomeInput) {
    customIncomeInput.value =
      customMonthlyIncome > 0 ? String(customMonthlyIncome) : "";
  }
}

function renderSelectedIncome() {
  if (!selectedIncomeSummary || !selectedIncomeAmount) {
    return;
  }

  const monthlyIncome = getSelectedMonthlyIncome();

  selectedIncomeSummary.hidden = monthlyIncome <= 0;

  selectedIncomeAmount.textContent = formatCurrency(monthlyIncome);
}

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

/* ========================================
   LIFESTYLE CALCULATION
======================================== */

function getSelectedMonthlyIncome() {
  const {
    lifestyleOption,
    customMonthlyIncome,
  } = getCostOfWants();

  if (lifestyleOption === "custom") {
    return Number(customMonthlyIncome) || 0;
  }

  return LIFESTYLE_AMOUNTS[lifestyleOption] || 0;
}

/* ========================================
   VALIDATION
======================================== */

function validateCostOfWants() {
  const currentAge = getClientAge();

  const {
    desiredRetirementAge,
    plannedMortalityAge,
    inflationRate,
    postRetirementReturnRate,
  } = getCostOfWants();

  if (
    desiredRetirementAge > 0 &&
    currentAge !== null &&
    desiredRetirementAge <= currentAge
  ) {
    showFormMessage(
      "Desired retirement age must be greater than the client's current age.",
    );

    return false;
  }

  if (desiredRetirementAge > 0 && plannedMortalityAge <= desiredRetirementAge) {
    showFormMessage(
      "Planned mortality age must be greater than the desired retirement age.",
    );

    return false;
  }

  if (plannedMortalityAge <= 0) {
    showFormMessage("Enter a valid planned mortality age.");

    return false;
  }

  if (inflationRate < 0) {
    showFormMessage("Inflation rate cannot be negative.");

    return false;
  }

  if (postRetirementReturnRate < 0) {
    showFormMessage("Post-retirement return rate cannot be negative.");

    return false;
  }

  clearFormMessage();

  return true;
}

/* ========================================
   INPUT HELPERS
======================================== */

function getWholeNumberInput(input) {
  const value = Number(input?.value);

  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.trunc(value);
}

function getDecimalInput(input) {
  const value = Number(input?.value);

  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

/* ========================================
   FORM MESSAGE
======================================== */

function showFormMessage(message) {
  if (!formMessage) {
    return;
  }

  formMessage.textContent = message;
}

function clearFormMessage() {
  if (!formMessage) {
    return;
  }

  formMessage.textContent = "";
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
   FACTORY
======================================== */

function createDefaultCostOfWants() {
  return {
    desiredRetirementAge: 0,
    plannedMortalityAge: 85,
    inflationRate: 2.5,
    postRetirementReturnRate: 3.5,

    lifestyleOption: "",
    customMonthlyIncome: 0,
  };
}

/* ========================================
   LIFESTYLE AMOUNTS
======================================== */

const LIFESTYLE_AMOUNTS = Object.freeze({
  basic: 3000,
  average: 5000,
  comfort: 8000,
});