"use strict";

import {
  getAssets,
  getClientProfile,
  getCommitments,
  getCostOfWants,
  getExpenses,
  getLiabilities,
  getPolicies,
  updateCostOfWants,
} from "../state/client-plan.js";

import { getClientAge } from "./client-profile.js";

import { calculateIncomeSummary } from "../services/income-calculator.js";

import { on, emit } from "../events/event-bus.js";

import { EVENTS } from "../events/events.js";

/* ========================================
   PAGE ELEMENTS
======================================== */

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
   SPENDING BREAKDOWN ELEMENTS
======================================== */

const householdAmountElement = document.getElementById(
  "costOfWantsHouseholdAmount",
);

const transportAmountElement = document.getElementById(
  "costOfWantsTransportAmount",
);

const subscriptionsAmountElement = document.getElementById(
  "costOfWantsSubscriptionsAmount",
);

const dependantsAmountElement = document.getElementById(
  "costOfWantsDependantsAmount",
);

const otherExpensesAmountElement = document.getElementById(
  "costOfWantsOtherExpensesAmount",
);

const liabilityRepaymentsElement = document.getElementById(
  "costOfWantsLiabilityRepayments",
);

const insuranceAmountElement = document.getElementById(
  "costOfWantsInsuranceAmount",
);

const totalExpensesElement = document.getElementById(
  "costOfWantsTotalExpenses",
);

const totalCommitmentsElement = document.getElementById(
  "costOfWantsTotalCommitments",
);

const totalSpendingElement = document.getElementById(
  "costOfWantsTotalSpending",
);

/* ========================================
   FLOATING SUMMARY ELEMENTS
======================================== */

const floatingSummaryElement = document.getElementById(
  "costOfWantsFloatingSummary",
);

const summaryToggleButton = document.getElementById(
  "costOfWantsSummaryToggle",
);

const summaryToggleIcon = document.getElementById(
  "costOfWantsSummaryToggleIcon",
);

const calculatedBreakdownElement = document.getElementById(
  "costOfWantsCalculatedBreakdown",
);

const monthlySurplusElement = document.getElementById(
  "costOfWantsMonthlySurplus",
);

const goalSavingsElement = document.getElementById(
  "costOfWantsGoalSavings",
);

const netSurplusElement = document.getElementById(
  "costOfWantsNetSurplus",
);

const breakdownIncomeElement = document.getElementById(
  "costOfWantsBreakdownIncome",
);

const breakdownExpensesElement = document.getElementById(
  "costOfWantsBreakdownExpenses",
);

const breakdownCommitmentsElement = document.getElementById(
  "costOfWantsBreakdownCommitments",
);

const breakdownSurplusElement = document.getElementById(
  "costOfWantsBreakdownSurplus",
);

const breakdownGoalSavingsElement = document.getElementById(
  "costOfWantsBreakdownGoalSavings",
);

const breakdownNetSurplusElement = document.getElementById(
  "costOfWantsBreakdownNetSurplus",
);

const availableSurplusElement = document.getElementById(
  "costOfWantsAvailableSurplus",
);

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
  attachSummaryListeners();
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
  collapseCalculatedBreakdown();

  emitCostOfWantsChanged();
}

function collapseCalculatedBreakdown() {
  if (!calculatedBreakdownElement) {
    return;
  }

  calculatedBreakdownElement.hidden = true;

  summaryToggleButton?.setAttribute("aria-expanded", "false");

  floatingSummaryElement?.classList.remove("is-expanded");

  summaryToggleIcon?.classList.remove("is-expanded");
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

function attachSummaryListeners() {
  summaryToggleButton?.addEventListener("click", toggleCalculatedBreakdown);
}

function toggleCalculatedBreakdown() {
  if (!summaryToggleButton || !calculatedBreakdownElement) {
    return;
  }

  const willExpand = calculatedBreakdownElement.hidden;

  calculatedBreakdownElement.hidden = !willExpand;

  summaryToggleButton.setAttribute("aria-expanded", String(willExpand));

  floatingSummaryElement?.classList.toggle("is-expanded", willExpand);

  summaryToggleIcon?.classList.toggle("is-expanded", willExpand);
}

function attachApplicationListeners() {
  on(EVENTS.PROFILE_CHANGED, function () {
    renderClientDetails();
    validateCostOfWants();
    renderFloatingSummary();
  });

  on(EVENTS.INCOME_CHANGED, function () {
    renderFloatingSummary();
  });

  on(EVENTS.EXPENSES_CHANGED, function () {
    renderMonthlySpendingBreakdown();
    renderFloatingSummary();
  });

  on(EVENTS.COMMITMENTS_CHANGED, function () {
    renderMonthlySpendingBreakdown();
    renderFloatingSummary();
  });

  on(EVENTS.LIABILITIES_CHANGED, function () {
    renderMonthlySpendingBreakdown();
    renderFloatingSummary();
  });

  on(EVENTS.POLICIES_CHANGED, function () {
    renderMonthlySpendingBreakdown();
    renderFloatingSummary();
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
  renderMonthlySpendingBreakdown();

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
  renderMonthlySpendingBreakdown();

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
  renderMonthlySpendingBreakdown();
  renderFloatingSummary();
}

function renderClientDetails() {
  if (!currentAgeInput) {
    return;
  }

  const currentAge = getClientAge();

  currentAgeInput.value = currentAge === null ? "" : String(currentAge);
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
   MONTHLY SPENDING BREAKDOWN
======================================== */

function renderMonthlySpendingBreakdown() {
  const breakdown = calculateMonthlySpendingBreakdown();

  setCurrencyText(
    householdAmountElement,
    breakdown.expenses.household,
  );

  setCurrencyText(
    transportAmountElement,
    breakdown.expenses.transport,
  );

  setCurrencyText(
    subscriptionsAmountElement,
    breakdown.expenses.subscriptionsLifestyle,
  );

  setCurrencyText(
    dependantsAmountElement,
    breakdown.expenses.parentsDependantsSupport,
  );

  setCurrencyText(
    otherExpensesAmountElement,
    breakdown.expenses.otherRecurringExpenses,
  );

  setCurrencyText(
    liabilityRepaymentsElement,
    breakdown.commitments.liabilityRepayments,
  );

  setCurrencyText(
    insuranceAmountElement,
    breakdown.commitments.insurancePremiums,
  );

  setCurrencyText(
    totalExpensesElement,
    breakdown.totalMonthlyExpenses,
  );

  setCurrencyText(
    totalCommitmentsElement,
    breakdown.totalMonthlyCommitments,
  );

  setCurrencyText(
    totalSpendingElement,
    breakdown.totalMonthlyOutflow,
  );
}

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

function renderFloatingSummary() {
  const position = calculateMonthlyFinancialPosition();

  setSignedCurrencyText(monthlySurplusElement, position.monthlySurplus);

  setCurrencyText(goalSavingsElement, position.minimumGoalSavings);

  setSignedCurrencyText(netSurplusElement, position.netSurplus);

  setCurrencyText(breakdownIncomeElement, position.monthlyTakeHomeIncome);

  setDeductionCurrencyText(breakdownExpensesElement, position.monthlyExpenses);

  setDeductionCurrencyText(
    breakdownCommitmentsElement,
    position.monthlyCommitments,
  );

  setSignedCurrencyText(breakdownSurplusElement, position.monthlySurplus);

  setDeductionCurrencyText(
    breakdownGoalSavingsElement,
    position.minimumGoalSavings,
  );

  setSignedCurrencyText(breakdownNetSurplusElement, position.netSurplus);

  setSignedCurrencyText(availableSurplusElement, position.netSurplus);

  applyFinancialPositionClass(floatingSummaryElement, position.netSurplus);
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

  /*
   * Temporary value.
   * This will be replaced by the goal-savings
   * calculation later.
   */
  const minimumGoalSavings = 0;

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
    return runningTotal + getValidAmount(liability?.monthlyRepayment);
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