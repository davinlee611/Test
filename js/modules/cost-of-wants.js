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
  CPF_LIFE_PAYOUT_MODEL,
  CPF_RA_COMPOUNDING_YEARS,
  CPF_RA_INTEREST_RATE,
  DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE,
  calculateClientCpfRetirementProjection as calculateCpfRetirementProjection,
  calculateFybcProjection as calculateFybcProjectionValues,
  getCpfCohortAgeText,
} from "./cost-of-wants/cost-of-wants-calculator.js";

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

  renderCpfRetirementOptionSelection();

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
  renderProjectedCpfRetirementSums();
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
    renderClientDetails();
    renderProjectedCpfRetirementSums();

    renderFybcProjections();

    clearValidationMessage();

    renderFloatingSummary();
  });

  on(EVENTS.INCOME_CHANGED, function () {
    renderFloatingSummary();
  });

  on(EVENTS.EXPENSES_CHANGED, function () {
    renderMonthlySpendingBreakdown();
    renderFloatingSummary();

    renderFybcProjections();
  });

  on(EVENTS.COMMITMENTS_CHANGED, function () {
    renderMonthlySpendingBreakdown();
    renderFloatingSummary();

    renderFybcProjections();
  });

  on(EVENTS.LIABILITIES_CHANGED, function () {
    renderMonthlySpendingBreakdown();
    renderFloatingSummary();

    renderFybcProjections();
  });

  on(EVENTS.POLICIES_CHANGED, function () {
    renderMonthlySpendingBreakdown();
    renderFloatingSummary();

    renderFybcProjections();
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

  renderFybcProjections();

  emitCostOfWantsChanged();
}

function handleCustomIncomeInput() {
  updateCostOfWants({
    customMonthlyIncome: getWholeNumberInput(elements.inputs.customIncome),
  });

  renderSelectedIncome();
  renderMonthlySpendingBreakdown();

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

  renderLifestyleSelection();
  renderSelectedIncome();
  renderMonthlySpendingBreakdown();

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
  renderClientDetails();
  syncCostOfWantsInputs();
  renderLifestyleSelection();
  renderSelectedIncome();
  renderMonthlySpendingBreakdown();
  renderFloatingSummary();

  renderCpfRetirementOptionSelection();
  renderProjectedCpfRetirementSums();
  renderFybcProjections();
}

function renderClientDetails() {
  if (!elements.inputs.currentAge) {
    return;
  }

  const currentAge = getClientAge();

  elements.inputs.currentAge.value =
    currentAge === null ? "" : String(currentAge);
}

function syncCostOfWantsInputs() {
  const costOfWants = getCostOfWants();

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

function renderLifestyleSelection() {
  const { lifestyleOption, customMonthlyIncome } = getCostOfWants();

  elements.lifestyle.optionButtons.forEach(function (button) {
    const isSelected =
      button.dataset.lifestyleOption === lifestyleOption;

    button.classList.toggle("is-selected", isSelected);

    button.setAttribute("aria-checked", String(isSelected));
  });

  if (elements.lifestyle.customIncomeGroup) {
    elements.lifestyle.customIncomeGroup.hidden =
      lifestyleOption !== "custom";
  }

  if (elements.inputs.customIncome) {
    elements.inputs.customIncome.value =
      customMonthlyIncome > 0 ? String(customMonthlyIncome) : "";
  }
}

function renderSelectedIncome() {
  if (
    !elements.lifestyle.selectedIncomeSummary ||
    !elements.lifestyle.selectedIncomeAmount
  ) {
    return;
  }

  const monthlyIncome = getSelectedMonthlyIncome();

  elements.lifestyle.selectedIncomeSummary.hidden = false;

  elements.lifestyle.selectedIncomeAmount.textContent =
    monthlyIncome > 0
      ? formatCurrency(monthlyIncome)
      : "Not selected";
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

function getSelectedMonthlyPassiveIncome() {
  return getSelectedMonthlyIncome();
}

/* ========================================
   MONTHLY SPENDING BREAKDOWN
======================================== */

function renderMonthlySpendingBreakdown() {
  const breakdown = calculateMonthlySpendingBreakdown();

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

function renderFloatingSummary() {
  const position = calculateMonthlyFinancialPosition();

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

  renderGoalSavingsBreakdown(position.goalSavingsSummary);

  renderGoalSavingsStatus(position.goalSavingsSummary);

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

function renderCpfPayoutMethodology(projection) {
  if (
    !elements.cpf.payoutHelper ||
    !elements.cpf.calculationSummary ||
    !elements.cpf.calculationData
  ) {
    return;
  }

  if (projection.payoutBasis === "official") {
    renderOfficialCpfPayoutMethodology(projection);
    return;
  }

  renderProjectedCpfPayoutMethodology(projection);
}

function renderProjectedCpfPayoutMethodology(projection) {
  const model = CPF_LIFE_PAYOUT_MODEL[projection.gender];

  if (!model) {
    renderEmptyCpfPayoutMethodology();
    return;
  }

  const genderLabel = projection.gender === "male" ? "Male" : "Female";

  const conversionFactor = model.raFactor * 100;

  elements.cpf.payoutHelper.textContent =
    `RA payout projection using a conversion factor of ` +
    `${formatCpfPayoutFactor(conversionFactor)}.`;

  elements.cpf.calculationSummary.textContent = [
    `The projected ${genderLabel.toLowerCase()} CPF LIFE payout`,
    `uses the relationship observed from the 2026 BRS, FRS`,
    `and ERS payout figures.`,
    `A fixed monthly amount of ${formatCurrency(model.fixedAmount)}`,
    `is added to ${formatCpfPayoutFactor(conversionFactor)}`,
    `of the projected RA balance at age 65.`,
  ].join(" ");

  elements.cpf.calculationData.replaceChildren(
    createCpfMethodologyRow(
      "Model basis",
      `${CPF_LIFE_PAYOUT_MODEL.basisYear} ${genderLabel} CPF LIFE figures`,
    ),

    createCpfMethodologyRow(
      "Monthly payout formula",
      `${formatCurrency(model.fixedAmount)} + RA at age 65 × ` +
        `${formatCpfPayoutFactor(conversionFactor)}`,
    ),

    createCpfMethodologyRow(
      "RA projection",
      `Retirement Sum at age 55 compounded at ` +
        `${formatPercentage(CPF_RA_INTEREST_RATE)} annually for ` +
        `${CPF_RA_COMPOUNDING_YEARS} years`,
    ),

    createCpfMethodologyRow(
      "RA compounding multiplier",
      formatCpfMultiplier(
        Math.pow(1 + CPF_RA_INTEREST_RATE / 100, CPF_RA_COMPOUNDING_YEARS),
      ),
    ),
  );
}

function renderOfficialCpfPayoutMethodology(projection) {
  elements.cpf.payoutHelper.textContent =
    "Published CPF LIFE payout figures are used for this cohort.";

  elements.cpf.calculationSummary.textContent = [
    `The client belongs to the ${projection.yearTurning55}`,
    `CPF Retirement Sum cohort.`,
    `The displayed monthly payouts are taken directly from`,
    `the stored CPF LIFE figures for that cohort and gender.`,
  ].join(" ");

  elements.cpf.calculationData.replaceChildren(
    createCpfMethodologyRow("Cohort year", String(projection.yearTurning55)),

    createCpfMethodologyRow(
      "Gender",
      projection.gender === "male" ? "Male" : "Female",
    ),

    createCpfMethodologyRow("Retirement Sum basis", "Published cohort values"),

    createCpfMethodologyRow(
      "CPF LIFE payout basis",
      "Published cohort payout figures",
    ),
  );
}

function createCpfMethodologyRow(label, value) {
  const row = document.createElement("div");

  row.className = "cost-of-wants-cpf-calculation-row";

  const labelElement = document.createElement("span");

  labelElement.textContent = label;

  const valueElement = document.createElement("strong");

  valueElement.textContent = value;

  row.append(labelElement, valueElement);

  return row;
}

function formatCpfPayoutFactor(value) {
  return (
    new Intl.NumberFormat("en-SG", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value) + "%"
  );
}

function formatCpfMultiplier(value) {
  return new Intl.NumberFormat("en-SG", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
}

function renderEmptyCpfPayoutMethodology() {
  if (elements.cpf.payoutHelper) {
    elements.cpf.payoutHelper.textContent = "--";
  }

  if (elements.cpf.calculationSummary) {
    elements.cpf.calculationSummary.textContent = "--";
  }

  elements.cpf.calculationData?.replaceChildren();

  if (elements.cpf.calculationDetails) {
    elements.cpf.calculationDetails.hidden = true;
  }

  elements.cpf.calculationToggleButton?.setAttribute("aria-expanded", "false");

  elements.cpf.calculationToggleIcon?.classList.remove("is-expanded");
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

  renderCpfRetirementOptionSelection();
  renderFybcProjections();

  emitCostOfWantsChanged();
}

function renderCpfRetirementOptionSelection() {
  elements.cpf.optionButtons.forEach(function (button) {
    const isSelected =
      button.dataset.cpfRetirementOption === selectedCpfRetirementOption;

    button.classList.toggle("selected", isSelected);

    button.setAttribute("aria-checked", String(isSelected));
  });
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
  const projection = calculateClientCpfRetirementProjection();

  if (!projection.isValid) {
    renderEmptyCpfRetirementSums(projection.message);
    return;
  }

  const cohortAgeText = getCpfCohortAgeText(projection.yearTurning55);

  if (elements.cpf.projectedBrs) {
    elements.cpf.projectedBrs.textContent = formatCurrency(
      projection.retirementSums.brs,
    );
  }

  if (elements.cpf.projectedFrs) {
    elements.cpf.projectedFrs.textContent = formatCurrency(
      projection.retirementSums.frs,
    );
  }

  if (elements.cpf.projectedErs) {
    elements.cpf.projectedErs.textContent = formatCurrency(
      projection.retirementSums.ers,
    );
  }

  if (elements.cpf.projectedBrsPayout) {
    elements.cpf.projectedBrsPayout.textContent = formatCurrency(
      projection.monthlyPayouts.brs,
    );
  }

  if (elements.cpf.projectedFrsPayout) {
    elements.cpf.projectedFrsPayout.textContent = formatCurrency(
      projection.monthlyPayouts.frs,
    );
  }

  if (elements.cpf.projectedErsPayout) {
    elements.cpf.projectedErsPayout.textContent = formatCurrency(
      projection.monthlyPayouts.ers,
    );
  }

  renderCpfProjectionBasis({
    retirementSumBasis: projection.retirementSumBasis,
    payoutBasis: projection.payoutBasis,
  });

  renderCpfPayoutMethodology(projection);

  if (!elements.cpf.projectionCaption) {
    return;
  }

  const genderLabel = projection.gender === "male" ? "male" : "female";

  if (
    projection.retirementSumBasis === "official" &&
    projection.payoutBasis === "official"
  ) {
    elements.cpf.projectionCaption.textContent = [
      cohortAgeText,
      `Published Retirement Sums and available ${genderLabel}`,
      `CPF LIFE payout figures are used.`,
    ].join(" ");

    return;
  }

  if (
    projection.retirementSumBasis === "official" &&
    projection.payoutBasis === "projected"
  ) {
    elements.cpf.projectionCaption.textContent = [
      cohortAgeText,
      `Published CPF Retirement Sums are used.`,
      `CPF LIFE payouts are estimated using the locked`,
      `${CPF_LIFE_PAYOUT_MODEL.basisYear} ${genderLabel}`,
      `payout relationship and a projected RA balance at age 65.`,
    ].join(" ");

    return;
  }

  elements.cpf.projectionCaption.textContent = [
    cohortAgeText,
    `Retirement Sums assume an annual increase of`,
    `${formatPercentage(projection.annualGrowthRate)}.`,
    `CPF LIFE payouts are estimated using the locked`,
    `${CPF_LIFE_PAYOUT_MODEL.basisYear} ${genderLabel}`,
    `payout relationship and a projected RA balance at age 65.`,
  ].join(" ");
}

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

function renderEmptyCpfRetirementSums(message) {

renderEmptyCpfPayoutMethodology();

  const retirementSumElements = [
    elements.cpf.projectedBrs,
    elements.cpf.projectedFrs,
    elements.cpf.projectedErs,
  ];

  const payoutElements = [
    elements.cpf.projectedBrsPayout,
    elements.cpf.projectedFrsPayout,
    elements.cpf.projectedErsPayout,
  ];

  const basisElements = [
    elements.cpf.projectedBrsBasis,
    elements.cpf.projectedFrsBasis,
    elements.cpf.projectedErsBasis,
  ];

  retirementSumElements.forEach(function (element) {
    if (element) {
      element.textContent = "--";
    }
  });

  payoutElements.forEach(function (element) {
    if (element) {
      element.textContent = "--";
    }
  });

  basisElements.forEach(function (element) {
    if (!element) {
      return;
    }

    element.textContent = "--";

    element.classList.remove("is-official", "is-projected", "is-mixed");
  });

  if (elements.cpf.projectionCaption) {
    elements.cpf.projectionCaption.textContent = message;
  }
}

function renderCpfProjectionBasis({ retirementSumBasis, payoutBasis }) {
  let label = "Projected";
  let stateClass = "is-projected";

  if (retirementSumBasis === "official" && payoutBasis === "official") {
    label = "Official";
    stateClass = "is-official";
  } else if (retirementSumBasis === "official" && payoutBasis === "projected") {
    label = "Official sum / Projected payout";
    stateClass = "is-mixed";
  }

  const basisElements = [
    elements.cpf.projectedBrsBasis,
    elements.cpf.projectedFrsBasis,
    elements.cpf.projectedErsBasis,
  ];

  basisElements.forEach(function (element) {
    if (!element) {
      return;
    }

    element.textContent = label;

    element.classList.remove("is-official", "is-projected", "is-mixed");

    element.classList.add(stateClass);
  });
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
   FYBC PROJECTIONS
======================================== */

function renderFybcProjections() {
  const projection = calculateFybcProjection();

  if (!projection.isValid) {
    renderEmptyFybcProjection();
    return;
  }

  renderFybcProjectionResults(projection);
}

function renderFybcProjectionResults(projection) {

  if (elements.fybc.yearsRemaining) {
    const yearLabel = projection.yearsRemaining === 1 ? "Year" : "Years";

    elements.fybc.yearsRemaining.textContent = `${projection.yearsRemaining} ${yearLabel}`;
  }

  if (elements.fybc.income) {
    elements.fybc.income.textContent = formatCurrency(
      projection.monthlyIncomeAtFybc,
    );
  }

  if (elements.fybc.incomeAt65) {
    elements.fybc.incomeAt65.textContent = formatCurrency(
      projection.monthlyIncomeAt65,
    );
  }

  if (elements.fybc.inflationNote) {
    elements.fybc.inflationNote.textContent = `Assuming ${formatPercentage(
      projection.inflationRate * 100,
    )} annual inflation`;
  }

  if (elements.fybc.cpfLifeIncome) {
    elements.fybc.cpfLifeIncome.textContent = formatCurrency(
      projection.cpfLifePayout,
    );
  }

  if (elements.fybc.requiredCapital) {
    elements.fybc.requiredCapital.textContent = formatCurrency(
      projection.totalCapitalRequired,
    );
  }

  if (elements.outcome.capitalNeededHelper) {
    elements.outcome.capitalNeededHelper.textContent = `After accounting monthly income needed until planned mortality age of ${projection.mortalityAge}`;
  }

  renderFybcProjectionMethodology(projection);
  renderCostOfWantsTimeline(projection);
}

function renderCostOfWantsTimeline(projection) {
  const cpfProjection = calculateClientCpfRetirementProjection();

  if (!cpfProjection.isValid) {
    renderEmptyCostOfWantsTimeline();
    return;
  }

  const brsPayout = cpfProjection.monthlyPayouts.brs;

  const frsPayout = cpfProjection.monthlyPayouts.frs;

  const ersPayout = cpfProjection.monthlyPayouts.ers;

  const incomeNeeded = projection.monthlyIncomeAt65;

  const selectedCpfPayout =
    selectedCpfRetirementOption === "self_employed"
      ? 0
      : (cpfProjection.monthlyPayouts[selectedCpfRetirementOption] ?? 0);

  const incomeGap = Math.max(0, incomeNeeded - selectedCpfPayout);

  if (elements.outcome.incomeGap) {
    elements.outcome.incomeGap.textContent = `${formatCurrency(incomeGap)}/mth`;
  }

  if (elements.outcome.remainingCapital) {
    elements.outcome.remainingCapital.textContent = formatCurrency(
      projection.totalCapitalRequired,
    );
  }

  const payoutProgressPercentage =
    incomeNeeded > 0
      ? Math.min(100, Math.max(0, (selectedCpfPayout / incomeNeeded) * 100))
      : 0;

  if (elements.timeline.progress) {
    elements.timeline.progress.style.width = `${payoutProgressPercentage}%`;
  }

  elements.timeline.content?.classList.add("is-ready");

  if (elements.timeline.brsAmount) {
    elements.timeline.brsAmount.textContent = `${formatCurrency(brsPayout)}/mth`;
  }

  if (elements.timeline.frsAmount) {
    elements.timeline.frsAmount.textContent = `${formatCurrency(frsPayout)}/mth`;
  }

  if (elements.timeline.ersAmount) {
    elements.timeline.ersAmount.textContent = `${formatCurrency(ersPayout)}/mth`;
  }

  if (elements.timeline.goalAmount) {
    elements.timeline.goalAmount.textContent = `${formatCurrency(incomeNeeded)}/mth`;
  }

  if (elements.timeline.incomeNeeded) {
    elements.timeline.incomeNeeded.textContent = `${formatCurrency(incomeNeeded)}/mth`;
  }

  if (elements.timeline.totalPayouts) {
    elements.timeline.totalPayouts.textContent = `${formatCurrency(selectedCpfPayout)}/mth`;
  }

  positionCostOfWantsTimelineMarkers({
    brsPayout,
    frsPayout,
    ersPayout,
    incomeNeeded,
  });
}

function positionCostOfWantsTimelineMarkers({
  brsPayout,
  frsPayout,
  ersPayout,
  incomeNeeded,
}) {
  if (!Number.isFinite(incomeNeeded) || incomeNeeded <= 0) {
    return;
  }

  const getPayoutPosition = function (payout) {
    if (!Number.isFinite(payout) || payout <= 0) {
      return 0;
    }

    const percentage = (payout / incomeNeeded) * 100;

    /*
     * Keep payout indicators within the visible timeline.
     * The goal flag remains fixed at 100%.
     */
    return Math.min(94, Math.max(4, percentage));
  };

  if (elements.timeline.brsMarker) {
    elements.timeline.brsMarker.style.left = `${getPayoutPosition(brsPayout)}%`;
  }

  if (elements.timeline.frsMarker) {
    elements.timeline.frsMarker.style.left = `${getPayoutPosition(frsPayout)}%`;
  }

  if (elements.timeline.ersMarker) {
    elements.timeline.ersMarker.style.left = `${getPayoutPosition(ersPayout)}%`;
  }

  if (elements.timeline.goalMarker) {
    elements.timeline.goalMarker.style.left = "100%";
  }
}

function renderFybcProjectionMethodology(projection) {
  if (
    !elements.projection.calculationSummary ||
    !elements.projection.calculationData
  ) {
    return;
  }

  const cpfLifeStartAge = 65;

  const monthlyIncomeAtCpfLifeStart = projection.monthlyIncomeAt65;

  const passiveIncomeNeededAfterCpf = Math.max(
    0,
    monthlyIncomeAtCpfLifeStart - projection.cpfLifePayout,
  );

  elements.projection.calculationSummary.textContent =
    "Your desired passive income is adjusted for inflation. " +
    "Before age 65, the full amount must be funded privately. " +
    "From age 65, estimated CPF LIFE income reduces the amount required.";

  elements.projection.calculationData.innerHTML = `
    <div class="cost-of-wants-projection-flow">
      <div class="cost-of-wants-projection-flow-step">
        <span class="cost-of-wants-projection-flow-label">
          Today's Desired Passive Income
        </span>

        <strong class="cost-of-wants-projection-flow-value">
          ${formatCurrency(projection.monthlyPassiveIncome)}/mth
        </strong>
      </div>

      ${createProjectionFlowChevron()}

      <div class="cost-of-wants-projection-flow-step">
        <span class="cost-of-wants-projection-flow-label">
          Inflation
        </span>

        <strong class="cost-of-wants-projection-flow-value">
          ${formatPercentage(projection.inflationRate * 100)}
          p.a. for ${projection.yearsRemaining}
          ${projection.yearsRemaining === 1 ? "year" : "years"}
        </strong>
      </div>

      ${createProjectionFlowChevron()}

      <div class="cost-of-wants-projection-flow-step">
        <span class="cost-of-wants-projection-flow-label">
          Projected Passive Income Needed at Age
          ${projection.desiredFybcAge}
        </span>

        <strong class="cost-of-wants-projection-flow-value">
          ${formatCurrency(projection.monthlyIncomeAtFybc)}/mth
        </strong>
      </div>

      ${
        projection.desiredFybcAge < cpfLifeStartAge
          ? createPreAndPostCpfProjectionFlow({
              projection,
              monthlyIncomeAtCpfLifeStart,
              passiveIncomeNeededAfterCpf,
            })
          : createPostCpfOnlyProjectionFlow({
              projection,
              passiveIncomeNeededAfterCpf,
            })
      }

      ${createProjectionFlowChevron()}

      <div
        class="
          cost-of-wants-projection-flow-step
          cost-of-wants-projection-flow-step--total
        "
      >
        <span class="cost-of-wants-projection-flow-label">
          Total Capital Required
        </span>

        <strong class="cost-of-wants-projection-flow-total">
          ${formatCurrency(projection.totalCapitalRequired)}
        </strong>

        <small class="cost-of-wants-projection-flow-note">
          Annual income requirements are increased by inflation
          until age ${projection.mortalityAge}.
        </small>
      </div>
    </div>
  `;
}

function createProjectionFlowChevron() {
  return `
    <div
      class="cost-of-wants-projection-flow-chevron"
      aria-hidden="true"
    >
      <i class="fa-solid fa-chevron-down"></i>
    </div>
  `;
}

function createPreAndPostCpfProjectionFlow({
  projection,
  monthlyIncomeAtCpfLifeStart,
  passiveIncomeNeededAfterCpf,
}) {
  return `
    <div
      class="cost-of-wants-projection-flow-branch"
      aria-hidden="true"
    >
      <span></span>
      <i class="fa-solid fa-chevron-down"></i>
      <i class="fa-solid fa-chevron-down"></i>
    </div>

    <div class="cost-of-wants-projection-flow-split">
      <div class="cost-of-wants-projection-flow-period">
        <span class="cost-of-wants-projection-flow-period-age">
          Age ${projection.desiredFybcAge}–64
        </span>

        <span class="cost-of-wants-projection-flow-period-description">
          CPF LIFE Not Yet Paid
        </span>

        <span class="cost-of-wants-projection-flow-label">
          Passive Income Needed
        </span>

        <strong class="cost-of-wants-projection-flow-value">
          ${formatCurrency(projection.monthlyIncomeAtFybc)}/mth
        </strong>

        <small class="cost-of-wants-projection-flow-note">
          Starting at age ${projection.desiredFybcAge}
        </small>
      </div>

      <div class="cost-of-wants-projection-flow-period">
        <span class="cost-of-wants-projection-flow-period-age">
          Age 65–${projection.mortalityAge}
        </span>

        <span class="cost-of-wants-projection-flow-period-description">
          CPF LIFE Starts
        </span>

        <span class="cost-of-wants-projection-flow-label">
          Passive Income Needed
        </span>

        <strong class="cost-of-wants-projection-flow-value">
          ${formatCurrency(passiveIncomeNeededAfterCpf)}/mth
        </strong>

        <small class="cost-of-wants-projection-flow-note">
          ${formatCurrency(monthlyIncomeAtCpfLifeStart)}
          less ${formatCurrency(projection.cpfLifePayout)}
          CPF LIFE
        </small>
      </div>
    </div>
  `;
}

function createPostCpfOnlyProjectionFlow({
  projection,
  passiveIncomeNeededAfterCpf,
}) {
  return `
    ${createProjectionFlowChevron()}

    <div class="cost-of-wants-projection-flow-period">
      <span class="cost-of-wants-projection-flow-period-age">
        Age ${projection.desiredFybcAge}–${projection.mortalityAge}
      </span>

      <span class="cost-of-wants-projection-flow-period-description">
        CPF LIFE Included
      </span>

      <span class="cost-of-wants-projection-flow-label">
        Passive Income Needed
      </span>

      <strong class="cost-of-wants-projection-flow-value">
        ${formatCurrency(passiveIncomeNeededAfterCpf)}/mth
      </strong>

      <small class="cost-of-wants-projection-flow-note">
        ${formatCurrency(projection.monthlyIncomeAtFybc)}
        less ${formatCurrency(projection.cpfLifePayout)}
        CPF LIFE
      </small>
    </div>
  `;
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

function renderEmptyFybcProjection() {
  if (elements.fybc.yearsRemaining) {
    elements.fybc.yearsRemaining.textContent = "--";
  }

  if (elements.fybc.income) {
    elements.fybc.income.textContent = "--";
  }

  if (elements.fybc.inflationNote) {
    elements.fybc.inflationNote.textContent =
      "Enter the projection assumptions above";
  }

  if (elements.fybc.cpfLifeIncome) {
    elements.fybc.cpfLifeIncome.textContent = "--";
  }

  if (elements.fybc.requiredCapital) {
    elements.fybc.requiredCapital.textContent = "--";
  }

  if (elements.fybc.incomeAt65) {
    elements.fybc.incomeAt65.textContent = "--";
  }

  renderEmptyCostOfWantsTimeline();

  renderEmptyFybcProjectionMethodology();
}

function renderEmptyCostOfWantsTimeline() {
  elements.timeline.content?.classList.remove("is-ready");

  if (elements.timeline.brsAmount) {
    elements.timeline.brsAmount.textContent = "--";
  }

  if (elements.timeline.frsAmount) {
    elements.timeline.frsAmount.textContent = "--";
  }

  if (elements.timeline.ersAmount) {
    elements.timeline.ersAmount.textContent = "--";
  }

  if (elements.timeline.goalAmount) {
    elements.timeline.goalAmount.textContent = "--";
  }

  if (elements.timeline.incomeNeeded) {
    elements.timeline.incomeNeeded.textContent = "--";
  }

  if (elements.timeline.totalPayouts) {
    elements.timeline.totalPayouts.textContent = "--";
  }

  if (elements.outcome.incomeGap) {
    elements.outcome.incomeGap.textContent = "--";
  }

  if (elements.outcome.remainingCapital) {
    elements.outcome.remainingCapital.textContent = "--";
  }

  if (elements.timeline.progress) {
    elements.timeline.progress.style.width = "0%";
  }

  [
    elements.timeline.brsMarker,
    elements.timeline.frsMarker,
    elements.timeline.ersMarker,
    elements.timeline.goalMarker,
  ].forEach(function (marker) {
    marker?.style.removeProperty("left");
  });
}

function renderEmptyFybcProjectionMethodology() {
  if (elements.projection.calculationSummary) {
    elements.projection.calculationSummary.textContent =
      "Complete the FYBC assumptions to view the calculation details.";
  }

  elements.projection.calculationData?.replaceChildren();

  if (elements.projection.calculationDetails) {
    elements.projection.calculationDetails.hidden = true;
  }

  if (elements.outcome.capitalNeededHelper) {
    elements.outcome.capitalNeededHelper.textContent =
      "After accounting monthly income needed until planned mortality age of --";
  }

  elements.projection.calculationToggleButton?.setAttribute(
    "aria-expanded",
    "false",
  );

  elements.projection.calculationToggleIcon?.classList.remove("is-expanded");
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