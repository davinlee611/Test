"use strict";

import {
  getAssets,
  getClientProfile,
  getCommitments,
  getCostOfWants,
  getExpenses,
  getLiabilities,
  getPolicies,
  resetCostOfWantsState,
  updateCostOfWants,
} from "../state/client-plan.js";

import { getClientAge } from "./client-profile.js";

import { calculateIncomeSummary } from "../services/income-calculator.js";

import { getAllGoals } from "../services/goal-service.js";

import { calculateGoalSavings } from "../services/goal-savings-calculator.js";

import { on, emit } from "../events/event-bus.js";

import { EVENTS } from "../events/events.js";

import { getLiabilityMonthlyCashRepayment } from "./liabilities/liability-calculator.js";

import {
  DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE,
  calculateClientCpfRetirementProjection as calculateCpfRetirementProjection,
  calculateFybcProjection as calculateFybcProjectionValues,
} from "./cost-of-wants/cost-of-wants-calculator.js";

import { costOfWantsElements } from "./cost-of-wants/cost-of-wants-elements.js";

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
  renderProjectedCpfRetirementSums(calculateClientCpfRetirementProjection());

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
    renderClientDetails(getClientAge());

    renderProjectedCpfRetirementSums(calculateClientCpfRetirementProjection());

    renderFybcProjections();

    clearValidationMessage();

    renderFloatingSummary(calculateMonthlyFinancialPosition());
  });

  on(EVENTS.INCOME_CHANGED, function () {
    renderFloatingSummary(calculateMonthlyFinancialPosition());
  });

  on(EVENTS.EXPENSES_CHANGED, function () {
    renderMonthlySpendingBreakdown(calculateMonthlySpendingBreakdown());

    renderFloatingSummary(calculateMonthlyFinancialPosition());

    renderFybcProjections();
  });

  on(EVENTS.COMMITMENTS_CHANGED, function () {
    renderMonthlySpendingBreakdown(calculateMonthlySpendingBreakdown());

    renderFloatingSummary(calculateMonthlyFinancialPosition());

    renderFybcProjections();
  });

  on(EVENTS.LIABILITIES_CHANGED, function () {
    renderMonthlySpendingBreakdown(calculateMonthlySpendingBreakdown());

    renderFloatingSummary(calculateMonthlyFinancialPosition());

    renderFybcProjections();
  });

  on(EVENTS.POLICIES_CHANGED, function () {
    renderMonthlySpendingBreakdown(calculateMonthlySpendingBreakdown());

    renderFloatingSummary(calculateMonthlyFinancialPosition());

    renderFybcProjections();
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
  updateCostOfWants({
    customMonthlyIncome: getWholeNumberInput(elements.inputs.customIncome),
  });

  renderSelectedIncome(getSelectedMonthlyIncome());

  renderMonthlySpendingBreakdown(calculateMonthlySpendingBreakdown());

  renderFybcProjections();

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

  renderLifestyleSelection(getCostOfWants());

  renderSelectedIncome(getSelectedMonthlyIncome());

  renderMonthlySpendingBreakdown(calculateMonthlySpendingBreakdown());

  renderFybcProjections();

  emitCostOfWantsChanged();

  if (option === "custom") {
    elements.inputs.customIncome?.focus();
  }
}

function saveCostOfWantsInputs() {
  updateCostOfWants({
    desiredFybcAge: getWholeNumberInput(elements.inputs.desiredFybcAge),

    plannedMortalityAge: getWholeNumberInput(elements.inputs.plannedMortalityAge),

    inflationRate: getDecimalInput(elements.inputs.inflationRate),
  });
}

/* ========================================
   RENDERING
======================================== */

function renderCostOfWants() {
  const costOfWants = getCostOfWants();

  const spendingBreakdown = calculateMonthlySpendingBreakdown();

  const financialPosition = calculateMonthlyFinancialPosition();

  renderClientDetails(getClientAge());

  syncCostOfWantsInputs(costOfWants);

  renderLifestyleSelection(costOfWants);

  renderSelectedIncome(getSelectedMonthlyIncome());

  renderMonthlySpendingBreakdown(spendingBreakdown);

  renderFloatingSummary(financialPosition);

  renderCpfRetirementOptionSelection(selectedCpfRetirementOption);

  renderProjectedCpfRetirementSums(calculateClientCpfRetirementProjection());

  renderFybcProjections();
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

function getSelectedMonthlyPassiveIncome() {
  return getSelectedMonthlyIncome();
}

/* ========================================
   MONTHLY SPENDING BREAKDOWN
======================================== */

function calculateMonthlySpendingBreakdown() {
  const expenses = getExpenses();

  const monthlyExpenses = {
    household: getValidAmount(
      expenses.household,
    ),

    transport: getValidAmount(
      expenses.transport,
    ),

    subscriptionsLifestyle: getValidAmount(
      expenses.subscriptionsLifestyle,
    ),

    parentsDependantsSupport: getValidAmount(
      expenses.parentsDependantsSupport,
    ),

    otherRecurringExpenses: getValidAmount(
      expenses.otherRecurringExpenses,
    ),
  };

  const monthlyCommitments = {
    liabilityRepayments: calculateTotalMonthlyLiabilityRepayments(),

    insurancePremiums: calculateMonthlyInsurancePremiums(),
  };

  const totalMonthlyExpenses =
    monthlyExpenses.household +
    monthlyExpenses.transport +
    monthlyExpenses.subscriptionsLifestyle +
    monthlyExpenses.parentsDependantsSupport +
    monthlyExpenses.otherRecurringExpenses;

  const totalMonthlyCommitments =
    monthlyCommitments.liabilityRepayments +
    monthlyCommitments.insurancePremiums;

  return {
    expenses: monthlyExpenses,
    commitments: monthlyCommitments,
    totalMonthlyExpenses,
    totalMonthlyCommitments,

    totalMonthlyOutflow:
      totalMonthlyExpenses +
      totalMonthlyCommitments,
  };
}

function calculateTotalMonthlyExpenses() {
  return calculateMonthlySpendingBreakdown().totalMonthlyExpenses;
}

/* ========================================
   MONTHLY FINANCIAL POSITION
======================================== */

function calculateMonthlyFinancialPosition() {
  const incomeSummary =
    calculateCurrentIncomeSummary();

  const spendingBreakdown =
    calculateMonthlySpendingBreakdown();

  const monthlyTakeHomeIncome =
    getValidAmount(
      incomeSummary.monthlyTakeHomeIncome,
    );

  const monthlyExpenses =
    spendingBreakdown.totalMonthlyExpenses;

  const monthlyCommitments =
    spendingBreakdown.totalMonthlyCommitments;

  const monthlySurplus =
    monthlyTakeHomeIncome -
    monthlyExpenses -
    monthlyCommitments;

  const goalSavingsSummary = calculateGoalSavings(getAllGoals());

  const minimumGoalSavings = goalSavingsSummary.totalMonthlySavings;

  const netSurplus =
    monthlySurplus -
    minimumGoalSavings;

  return {
    monthlyTakeHomeIncome,
    monthlyExpenses,
    monthlyCommitments,
    monthlySurplus,
    minimumGoalSavings,
    netSurplus,
    goalSavingsSummary,
  };
}

function calculateCurrentIncomeSummary() {
  const assets = getAssets();

  const profile = getClientProfile();

  const income = assets.income;

  return calculateIncomeSummary({
    monthlyEmploymentIncome:
      income.monthlyEmployment,

    annualBonus:
      income.annualBonus,

    monthlyOtherIncome:
      income.otherMonthly,

    employmentStatus:
      profile.employmentStatus,

    age:
      getClientAge(),
  });
}

function calculateTotalMonthlyLiabilityRepayments() {
  return getLiabilities().reduce(function (runningTotal, liability) {
    return runningTotal + getLiabilityMonthlyCashRepayment(liability);
  }, 0);
}

function calculateMonthlyInsurancePremiums() {
  const portfolioMonthlyPremium = calculatePortfolioMonthlyPremium();

  if (portfolioMonthlyPremium > 0) {
    return portfolioMonthlyPremium;
  }

  const commitments = getCommitments();

  return getValidAmount(commitments.insurancePremiums);
}

function calculatePortfolioMonthlyPremium() {
  return getPolicies().reduce(function (runningTotal, policy) {
    return runningTotal + convertPremiumToMonthly(policy?.premium);
  }, 0);
}

function convertPremiumToMonthly(premium) {
  const amount = getValidAmount(premium?.amount);

  if (amount <= 0) {
    return 0;
  }

  switch (premium?.frequency) {
    case "monthly":
      return amount;

    case "quarterly":
      return amount / 3;

    case "half_yearly":
      return amount / 6;

    case "annual":
      return amount / 12;

    default:
      return 0;
  }
}

function getValidAmount(value) {
  const amount = Number(value);

  return Number.isFinite(amount) && amount > 0 ? amount : 0;
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
  const selectedButton =
    document.querySelector(
      '[data-cpf-retirement-option][aria-checked="true"]',
    );

  return (
    selectedButton?.dataset
      .cpfRetirementOption ||
    "brs"
  );
}

/* ========================================
   PROJECTED CPF RETIREMENT SUMS
======================================== */

function calculateClientCpfRetirementProjection() {
  const profile = getClientProfile();

  return calculateCpfRetirementProjection({
    currentAge: getClientAge(),
    gender: profile?.gender,
    dateOfBirth: profile?.dateOfBirth,
    annualGrowthRate: getCpfRetirementSumGrowthRate(),
  });
}

function getCpfRetirementSumGrowthRate() {
  const enteredValue = elements.inputs.cpfGrowthRate?.value.trim();

  if (!enteredValue) {
    return DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE;
  }

  const enteredRate = Number(enteredValue);

  if (!Number.isFinite(enteredRate)) {
    return DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE;
  }

  return Math.min(Math.max(enteredRate, 0), 10);
}


/* ========================================
   FYBC PROJECTIONS
======================================== */

function renderFybcProjections() {
  renderFybcProjection({
    projection: calculateFybcProjection(),

    cpfProjection: calculateClientCpfRetirementProjection(),

    selectedCpfRetirementOption,
  });
}

function calculateFybcProjection() {
  return calculateFybcProjectionValues({
    currentAge: getClientAge(),
    desiredFybcAge: getDesiredFybcAge(),
    mortalityAge: getPlannedMortalityAge(),
    inflationRatePercent: getInflationRate(),
    monthlyPassiveIncome: getSelectedMonthlyPassiveIncome(),
    cpfLifePayout: getSelectedCpfLifeMonthlyPayout(),
  });
}

function getSelectedCpfLifeMonthlyPayout() {
  const cpfProjection =
    calculateClientCpfRetirementProjection();

  if (!cpfProjection.isValid) {
    return 0;
  }

  const selectedPayout =
    cpfProjection.monthlyPayouts[
      selectedCpfRetirementOption
    ];

  return Number.isFinite(selectedPayout)
    ? selectedPayout
    : 0;
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

function getDesiredFybcAge() {
  if (!elements.inputs.desiredFybcAge) {
    return null;
  }

  const value = parseInt(elements.inputs.desiredFybcAge.value, 10);

  return Number.isFinite(value) ? value : null;
}

function getInflationRate() {
  if (!elements.inputs.inflationRate) {
    return 0;
  }

  const value = parseFloat(elements.inputs.inflationRate.value);

  return Number.isFinite(value) ? value : 0;
}

function getPlannedMortalityAge() {
  if (!elements.inputs.plannedMortalityAge) {
    return null;
  }

  const value = parseInt(elements.inputs.plannedMortalityAge.value, 10);

  return Number.isFinite(value) ? value : null;
}

/* ========================================
   VALIDATION MESSAGE
======================================== */

function showValidationMessage(
  message,
  inputElement = null,
) {
  if (!elements.validation.message) {
    return;
  }

  clearInvalidInputs();

  elements.validation.message.textContent = message;

  elements.validation.message.hidden = false;

  inputElement?.setAttribute(
    "aria-invalid",
    "true",
  );
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