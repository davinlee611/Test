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

/* ========================================
   CPF RETIREMENT SUM CONFIGURATION
======================================== */

const DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE =
  3.5;

const LATEST_OFFICIAL_FRS_YEAR = 2027;

const CPF_RETIREMENT_SUM_BASE_FRS =
  228200;

const OFFICIAL_RETIREMENT_SUMS = {
  2025: {
    brs: 106500,
    frs: 213000,
  },

  2026: {
    brs: 110200,
    frs: 220400,
  },

  2027: {
    brs: 114100,
    frs: 228200,
  },
};

/* ========================================
   PAGE ELEMENTS
======================================== */

const currentAgeInput = document.getElementById("costOfWantsCurrentAge");

const desiredFybcAgeInput = document.getElementById("desiredFybcAge");

const plannedMortalityAgeInput = document.getElementById("plannedMortalityAge");

const inflationRateInput = document.getElementById("costOfWantsInflationRate");

const postFybcReturnRateInput = document.getElementById("postFybcReturnRate");

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

const validationMessageElement = document.getElementById(
  "costOfWantsValidationMessage",
);

const projectionButton = document.getElementById("costOfWantsProjectionButton");

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

const goalSavingsListElement = document.getElementById(
  "costOfWantsGoalSavingsList",
);

const breakdownGoalSavingsElement = document.getElementById(
  "costOfWantsBreakdownGoalSavings",
);

const goalSavingsStatusElement = document.getElementById(
  "costOfWantsGoalSavingsStatus",
);

const breakdownNetSurplusElement = document.getElementById(
  "costOfWantsBreakdownNetSurplus",
);

const availableSurplusElement = document.getElementById(
  "costOfWantsAvailableSurplus",
);

const cpfRetirementOptionButtons = document.querySelectorAll(
  "[data-cpf-retirement-option]",
);

const cpfGrowthRateInput = document.getElementById("costOfWantsCpfGrowthRate");

const projectedBrsElement = document.getElementById("costOfWantsProjectedBrs");

const projectedFrsElement = document.getElementById("costOfWantsProjectedFrs");

const projectedErsElement = document.getElementById("costOfWantsProjectedErs");

const cpfProjectionCaptionElement = document.getElementById(
  "costOfWantsCpfProjectionCaption",
);

const projectedBrsBasisElement = document.getElementById(
  "costOfWantsProjectedBrsBasis",
);

const projectedFrsBasisElement = document.getElementById(
  "costOfWantsProjectedFrsBasis",
);

const projectedErsBasisElement = document.getElementById(
  "costOfWantsProjectedErsBasis",
);

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
  attachProjectionListeners();
  attachApplicationListeners();
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

  renderCpfRetirementOptionSelection();

  clearValidationMessage();

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
    desiredFybcAgeInput,
    plannedMortalityAgeInput,
    inflationRateInput,
    postFybcReturnRateInput,
  ];

  inputs.forEach(function (input) {
    if (!input) {
      return;
    }

    input.addEventListener("input", handleCostOfWantsInput);

    input.addEventListener("blur", handleCostOfWantsBlur);
  });

  cpfGrowthRateInput?.addEventListener("input", handleCpfGrowthRateInput);

  customIncomeInput?.addEventListener("input", handleCustomIncomeInput);
}

function handleCpfGrowthRateInput() {
  renderProjectedCpfRetirementSums();
}

function attachLifestyleListeners() {
  lifestyleOptionButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectLifestyleOption(button.dataset.lifestyleOption);
    });
  });
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

function attachSummaryListeners() {
  summaryToggleButton?.addEventListener("click", toggleCalculatedBreakdown);
}

function attachProjectionListeners() {
  projectionButton?.addEventListener("click", handleProjectionRequest);
}

function handleProjectionRequest() {
  saveCostOfWantsInputs();

  const isValid = validateCostOfWantsForProjection();

  if (!isValid) {
    return;
  }

  renderProjection();
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

  on(EVENTS.GOALS_CHANGED, function () {
    renderFloatingSummary();
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
    desiredFybcAge: getWholeNumberInput(desiredFybcAgeInput),

    plannedMortalityAge: getWholeNumberInput(plannedMortalityAgeInput),

    inflationRate: getDecimalInput(inflationRateInput),

    postFybcReturnRate: getDecimalInput(postFybcReturnRateInput),
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

  renderCpfRetirementOptionSelection();
  renderProjectedCpfRetirementSums();
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

  setOptionalNumberInput(desiredFybcAgeInput, costOfWants.desiredFybcAge);

  setNumberInput(plannedMortalityAgeInput, costOfWants.plannedMortalityAge);

  setNumberInput(inflationRateInput, costOfWants.inflationRate);

  setNumberInput(postFybcReturnRateInput, costOfWants.postFybcReturnRate);
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

  selectedIncomeSummary.hidden = false;

  selectedIncomeAmount.textContent =
    monthlyIncome > 0 ? formatCurrency(monthlyIncome) : "Not selected";
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

  renderGoalSavingsBreakdown(position.goalSavingsSummary);

  renderGoalSavingsStatus(position.goalSavingsSummary);

  setSignedCurrencyText(breakdownNetSurplusElement, position.netSurplus);

  setSignedCurrencyText(availableSurplusElement, position.netSurplus);

  applyFinancialPositionClass(floatingSummaryElement, position.netSurplus);
}

function renderGoalSavingsBreakdown(goalSavingsSummary) {
  if (!goalSavingsListElement) {
    return;
  }

  goalSavingsListElement.replaceChildren();

  const validGoals = goalSavingsSummary?.validGoals || [];

  if (validGoals.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.className = "cost-of-wants-goal-savings-empty";

    emptyMessage.textContent = "No active goal savings required.";

    goalSavingsListElement.append(emptyMessage);

    return;
  }

  const fragment = document.createDocumentFragment();

  validGoals.forEach(function (goal) {
    fragment.append(createGoalSavingsRow(goal));
  });

  goalSavingsListElement.append(fragment);
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
  if (!goalSavingsStatusElement) {
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

  goalSavingsStatusElement.hidden = messages.length === 0;

  goalSavingsStatusElement.textContent = messages.join(" · ");

  goalSavingsStatusElement.classList.toggle("is-review", messages.length > 0);
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
   CPF RETIREMENT OPTIONS
======================================== */

function initializeCpfRetirementOptions() {
  cpfRetirementOptionButtons.forEach(
    function (button) {
      button.addEventListener(
        "click",
        handleCpfRetirementOptionClick,
      );
    },
  );
}

function handleCpfRetirementOptionClick(
  event,
) {
  const selectedButton =
    event.currentTarget;

  const selectedOption =
    selectedButton.dataset
      .cpfRetirementOption;

  if (!selectedOption) {
    return;
  }

  selectedCpfRetirementOption =
    selectedOption;

  renderCpfRetirementOptionSelection();

  console.log(
    "Selected CPF retirement assumption:",
    selectedCpfRetirementOption,
  );
}

function renderCpfRetirementOptionSelection() {
  cpfRetirementOptionButtons.forEach(
    function (button) {
      const isSelected =
        button.dataset
          .cpfRetirementOption ===
        selectedCpfRetirementOption;

      button.classList.toggle(
        "selected",
        isSelected,
      );

      button.setAttribute(
        "aria-checked",
        String(isSelected),
      );
    },
  );
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

function renderProjectedCpfRetirementSums() {
  const projection =
    calculateClientCpfRetirementSums();

  if (!projection.isValid) {
    renderEmptyCpfRetirementSums(
      projection.message,
    );

    return;
  }

  if (projectedBrsElement) {
    projectedBrsElement.textContent =
      formatCurrency(projection.brs);
  }

  if (projectedFrsElement) {
    projectedFrsElement.textContent =
      formatCurrency(projection.frs);
  }

  if (projectedErsElement) {
    projectedErsElement.textContent =
      formatCurrency(projection.ers);
  }

  renderCpfProjectionBasis(
    projection.basis,
  );

  if (cpfProjectionCaptionElement) {
    cpfProjectionCaptionElement.textContent =
      [
        `Client turns 55 in ${projection.yearTurning55}.`,
        `Figures use an annual retirement-sum increase`,
        `of ${formatPercentage(
          projection.annualGrowthRate,
        )}.`,
      ].join(" ");
  }
}

function calculateClientCpfRetirementSums() {
  const currentAge = getClientAge();

  if (currentAge === null) {
    return {
      isValid: false,

      message:
        "Complete the client's date of birth to calculate the projection.",
    };
  }

  if (currentAge >= 55) {
    return {
      isValid: false,

      message:
        "CPF Retirement Sum projections currently support clients below age 55.",
    };
  }

  const yearTurning55 = getClientYearTurning55();

  if (!yearTurning55) {
    return {
      isValid: false,

      message: "Unable to determine the year the client turns 55.",
    };
  }

  const annualGrowthRate = getCpfRetirementSumGrowthRate();

  const frsProjection = calculateProjectedFrs({
    yearTurning55,
    annualGrowthRate,
  });

  if (!Number.isFinite(frsProjection.amount) || frsProjection.amount <= 0) {
    return {
      isValid: false,

      message: "Unable to calculate the projected CPF Retirement Sums.",
    };
  }

  const projectedFrs = roundCpfProjectionAmount(frsProjection.amount);

  return {
    isValid: true,

    yearTurning55,

    annualGrowthRate,

    basis: frsProjection.basis,

    brs: roundCpfProjectionAmount(projectedFrs / 2),

    frs: projectedFrs,

    /*
     * ERS is four times BRS,
     * which equals twice FRS.
     */
    ers: roundCpfProjectionAmount(projectedFrs * 2),
  };
}

function calculateProjectedFrs({ yearTurning55, annualGrowthRate }) {
  const officialFrs = OFFICIAL_FRS_BY_YEAR[yearTurning55];

  if (Number.isFinite(officialFrs)) {
    return {
      amount: officialFrs,
      basis: "official",
    };
  }

  if (yearTurning55 < CPF_RETIREMENT_SUM_BASE_YEAR) {
    return {
      amount: 0,
      basis: "unavailable",
    };
  }

  const projectionYears = yearTurning55 - CPF_RETIREMENT_SUM_BASE_YEAR;

  const decimalGrowthRate = annualGrowthRate / 100;

  const projectedAmount =
    CPF_RETIREMENT_SUM_BASE_FRS *
    Math.pow(1 + decimalGrowthRate, projectionYears);

  return {
    amount: projectedAmount,
    basis: "projected",
  };
}

function getClientYearTurning55() {
  const profile = getClientProfile();

  const dateOfBirth = profile?.dateOfBirth;

  if (
    typeof dateOfBirth !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
  ) {
    return null;
  }

  const birthYear = Number(dateOfBirth.slice(0, 4));

  if (!Number.isInteger(birthYear) || birthYear <= 0) {
    return null;
  }

  return birthYear + 55;
}

function getCpfRetirementSumGrowthRate() {
  const enteredRate = Number(cpfGrowthRateInput?.value);

  if (!Number.isFinite(enteredRate)) {
    return DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE;
  }

  return Math.min(Math.max(enteredRate, 0), 10);
}

function renderEmptyCpfRetirementSums(message) {
  if (projectedBrsElement) {
    projectedBrsElement.textContent = "--";
  }

  if (projectedFrsElement) {
    projectedFrsElement.textContent = "--";
  }

  if (projectedErsElement) {
    projectedErsElement.textContent = "--";
  }

  if (projectedBrsBasisElement) {
    projectedBrsBasisElement.textContent = "--";
  }

  if (projectedFrsBasisElement) {
    projectedFrsBasisElement.textContent = "--";
  }

  if (projectedErsBasisElement) {
    projectedErsBasisElement.textContent = "--";
  }

  if (cpfProjectionCaptionElement) {
    cpfProjectionCaptionElement.textContent = message;
  }
}

function renderCpfProjectionBasis(basis) {
  const label = basis === "official" ? "Official" : "Projected";

  const basisElements = [
    projectedBrsBasisElement,
    projectedFrsBasisElement,
    projectedErsBasisElement,
  ];

  basisElements.forEach(function (element) {
    if (!element) {
      return;
    }

    element.textContent = label;

    element.classList.toggle("is-official", basis === "official");

    element.classList.toggle("is-projected", basis === "projected");
  });
}

function roundCpfProjectionAmount(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value / 100) * 100;
}

function formatPercentage(value) {
  return (
    new Intl.NumberFormat("en-SG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value) + "%"
  );
}

/* ========================================
   VALIDATION
======================================== */

function validateFybcAge() {
  const currentAge = getClientAge();

  const { desiredFybcAge, plannedMortalityAge } = getCostOfWants();

  if (currentAge === null || currentAge <= 0) {
    showValidationMessage(
      "Complete the client's date of birth before generating projections.",
    );

    return false;
  }

  if (desiredFybcAge <= currentAge || desiredFybcAge >= plannedMortalityAge) {
    showValidationMessage(
      `Desired FYBC Age must be between ${currentAge + 1} and ${
        plannedMortalityAge - 1
      }.`,
      desiredFybcAgeInput,
    );

    return false;
  }

  clearValidationMessage();

  return true;
}

function validateCostOfWantsForProjection() {
  clearValidationMessage();

  if (!validateFybcAge()) {
    return false;
  }

  const {
    plannedMortalityAge,
    inflationRate,
    postFybcReturnRate,
    lifestyleOption,
    customMonthlyIncome,
  } = getCostOfWants();

  if (plannedMortalityAge <= 0) {
    showValidationMessage(
      "Enter a valid planned mortality age.",
      plannedMortalityAgeInput,
    );

    return false;
  }

  if (inflationRate < 0) {
    showValidationMessage(
      "Inflation rate cannot be negative.",
      inflationRateInput,
    );

    return false;
  }

  if (postFybcReturnRate < 0) {
    showValidationMessage(
      "Post-FYBC return rate cannot be negative.",
      postFybcReturnRateInput,
    );

    return false;
  }

  if (!lifestyleOption) {
    showValidationMessage("Please select your desired monthly passive income.");

    return false;
  }

  if (lifestyleOption === "custom" && customMonthlyIncome <= 0) {
    showValidationMessage(
      "Enter a custom monthly passive income.",
      customIncomeInput,
    );

    return false;
  }

  clearValidationMessage();

  return true;
}

function validateCostOfWants() {
  const currentAge = getClientAge();

  const {
    desiredFybcAge,
    plannedMortalityAge,
    inflationRate,
    postFybcReturnRate,
  } = getCostOfWants();

  if (!validateFybcAge()) {
    return false;
  }

  if (plannedMortalityAge <= 0) {
    showValidationMessage(
      "Enter a valid planned mortality age.",
      plannedMortalityAgeInput,
    );

    return false;
  }

  if (inflationRate < 0) {
    showValidationMessage(
      "Inflation rate cannot be negative.",
      inflationRateInput,
    );

    return false;
  }

  if (postFybcReturnRate < 0) {
    showValidationMessage(
      "Post-FYBC return rate cannot be negative.",
      postFybcReturnRateInput,
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

/* ========================================
   VALIDATION MESSAGE
======================================== */

function showValidationMessage(
  message,
  inputElement = null,
) {
  if (!validationMessageElement) {
    return;
  }

  clearInvalidInputs();

  validationMessageElement.textContent =
    message;

  validationMessageElement.hidden =
    false;

  inputElement?.setAttribute(
    "aria-invalid",
    "true",
  );
}

function clearValidationMessage() {
  if (validationMessageElement) {
    validationMessageElement.textContent =
      "";

    validationMessageElement.hidden =
      true;
  }

  clearInvalidInputs();
}

function clearInvalidInputs() {
  [
    desiredFybcAgeInput,
    plannedMortalityAgeInput,
    inflationRateInput,
    postFybcReturnRateInput,
    customIncomeInput,
  ].forEach(function (input) {
    input?.removeAttribute(
      "aria-invalid",
    );
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