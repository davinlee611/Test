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
   CPF RETIREMENT CONFIGURATION
======================================== */

const DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE = 3.5;

const LATEST_OFFICIAL_RETIREMENT_SUM_YEAR = 2027;

/*
 * CPF Retirement Sums applicable when the member turns 55.
 *
 * ERS:
 * - 2022 to 2024: 1.5 times FRS
 * - 2025 onwards: 2 times FRS
 *
 * Store official ERS amounts explicitly so historical policy changes
 * are not lost by deriving ERS from the current rule.
 */
const OFFICIAL_RETIREMENT_SUMS = {
  2022: {
    brs: 96000,
    frs: 192000,
    ers: 288000,
  },

  2023: {
    brs: 99400,
    frs: 198800,
    ers: 298200,
  },

  2024: {
    brs: 102900,
    frs: 205800,
    ers: 308700,
  },

  2025: {
    brs: 106500,
    frs: 213000,
    ers: 426000,
  },

  2026: {
    brs: 110200,
    frs: 220400,
    ers: 440800,
  },

  2027: {
    brs: 114100,
    frs: 228200,
    ers: 456400,
  },
};

const LATEST_OFFICIAL_FRS =
  OFFICIAL_RETIREMENT_SUMS[
    LATEST_OFFICIAL_RETIREMENT_SUM_YEAR
  ].frs;

/*
 * CPF LIFE payout figures obtained from the available CPF LIFE
 * calculator cohorts.
 *
 * These are used directly when a matching cohort is available.
 * Later cohorts use the locked 2026 conversion relationship.
 */
const OFFICIAL_CPF_LIFE_PAYOUTS = {
  2022: {
    male: {
      brs: 720,
      frs: 1320,
      ers: 1940,
    },

    female: {
      brs: 670,
      frs: 1230,
      ers: 1810,
    },
  },

  2023: {
    male: {
      brs: 750,
      frs: 1420,
      ers: 2100,
    },

    female: {
      brs: 700,
      frs: 1330,
      ers: 1950,
    },
  },

  2024: {
    male: {
      brs: 820,
      frs: 1520,
      ers: 2250,
    },

    female: {
      brs: 770,
      frs: 1420,
      ers: 2100,
    },
  },

  2025: {
    male: {
      brs: 880,
      frs: 1650,
      ers: 3210,
    },

    female: {
      brs: 820,
      frs: 1540,
      ers: 2990,
    },
  },

  2026: {
    male: {
      brs: 930,
      frs: 1750,
      ers: 3410,
    },

    female: {
      brs: 890,
      frs: 1640,
      ers: 3180,
    },
  },
};

/*
 * Locked future CPF LIFE payout model.
 *
 * Male:
 * monthly payout = 100 + RA at 65 × 0.00507067220929381
 *
 * Female:
 * monthly payout = 120 + RA at 65 × 0.004685336151938148
 *
 * The model is based on the relationship between the 2026 BRS,
 * FRS and ERS RA balances and their corresponding payouts.
 */
const CPF_LIFE_PAYOUT_MODEL = {
  basisYear: 2026,

  male: {
    fixedAmount: 100,
    raFactor: 0.00507067220929381,
  },

  female: {
    fixedAmount: 120,
    raFactor: 0.004685336151938148,
  },

  roundingIncrement: 10,
};

/*
 * Retirement Sums are assumed to remain in the RA from age 55 to
 * age 65 and compound at 4% per year for 10 years.
 *
 * 1.04 ^ 10 = approximately 1.4802442849
 */
const CPF_RA_INTEREST_RATE = 4;
const CPF_RA_COMPOUNDING_YEARS = 10;

/* ========================================
   PAGE ELEMENTS
======================================== */

const currentAgeInput = document.getElementById("costOfWantsCurrentAge");

const desiredFybcAgeInput = document.getElementById("desiredFybcAge");

const plannedMortalityAgeInput = document.getElementById("plannedMortalityAge");

const inflationRateInput = document.getElementById("costOfWantsInflationRate");

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

const projectedBrsPayoutElement = document.getElementById(
  "costOfWantsProjectedBrsPayout",
);

const projectedFrsPayoutElement = document.getElementById(
  "costOfWantsProjectedFrsPayout",
);

const projectedErsPayoutElement = document.getElementById(
  "costOfWantsProjectedErsPayout",
);

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

const fybcYearsRemainingElement = document.getElementById(
  "costOfWantsFybcYearsRemaining",
);

const fybcIncomeElement = document.getElementById("costOfWantsFybcIncome");

const fybcInflationNoteElement = document.getElementById(
  "costOfWantsFybcInflationNote",
);

const cpfLifeIncomeElement = document.getElementById(
  "costOfWantsCpfLifeIncome",
);

const fybcRequiredElement = document.getElementById("costOfWantsFybcRequired");

const cpfPayoutHelperElement = document.getElementById(
  "costOfWantsCpfPayoutHelper",
);

const cpfCalculationToggleButton = document.getElementById(
  "costOfWantsCpfCalculationToggle",
);

const cpfCalculationToggleIcon = document.getElementById(
  "costOfWantsCpfCalculationToggleIcon",
);

const cpfCalculationDetailsElement = document.getElementById(
  "costOfWantsCpfCalculationDetails",
);

const cpfCalculationSummaryElement = document.getElementById(
  "costOfWantsCpfCalculationSummary",
);

const cpfCalculationDataElement = document.getElementById(
  "costOfWantsCpfCalculationData",
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

  if (cpfGrowthRateInput) {
    cpfGrowthRateInput.value = String(DEFAULT_CPF_RETIREMENT_SUM_GROWTH_RATE);
  }

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
  renderFybcProjections();
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
    customMonthlyIncome: getWholeNumberInput(customIncomeInput),
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
    customIncomeInput?.focus();
  }
}

function saveCostOfWantsInputs() {
  updateCostOfWants({
    desiredFybcAge: getWholeNumberInput(desiredFybcAgeInput),

    plannedMortalityAge: getWholeNumberInput(plannedMortalityAgeInput),

    inflationRate: getDecimalInput(inflationRateInput),
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

function getSelectedMonthlyPassiveIncome() {
  return getSelectedMonthlyIncome();
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

function calculateTotalMonthlyExpenses() {
  return calculateMonthlySpendingBreakdown().totalMonthlyExpenses;
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

function attachCpfCalculationListeners() {
  cpfCalculationToggleButton?.addEventListener(
    "click",
    toggleCpfCalculationDetails,
  );
}

function toggleCpfCalculationDetails() {
  if (!cpfCalculationToggleButton || !cpfCalculationDetailsElement) {
    return;
  }

  const willExpand = cpfCalculationDetailsElement.hidden;

  cpfCalculationDetailsElement.hidden = !willExpand;

  cpfCalculationToggleButton.setAttribute("aria-expanded", String(willExpand));

  cpfCalculationToggleIcon?.classList.toggle("is-expanded", willExpand);
}

function renderCpfPayoutMethodology(projection) {
  if (
    !cpfPayoutHelperElement ||
    !cpfCalculationSummaryElement ||
    !cpfCalculationDataElement
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

  cpfPayoutHelperElement.textContent =
    `RA payout projection using a conversion factor of ` +
    `${formatCpfPayoutFactor(conversionFactor)}.`;

  cpfCalculationSummaryElement.textContent = [
    `The projected ${genderLabel.toLowerCase()} CPF LIFE payout`,
    `uses the relationship observed from the 2026 BRS, FRS`,
    `and ERS payout figures.`,
    `A fixed monthly amount of ${formatCurrency(model.fixedAmount)}`,
    `is added to ${formatCpfPayoutFactor(conversionFactor)}`,
    `of the projected RA balance at age 65.`,
  ].join(" ");

  cpfCalculationDataElement.replaceChildren(
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
  cpfPayoutHelperElement.textContent =
    "Published CPF LIFE payout figures are used for this cohort.";

  cpfCalculationSummaryElement.textContent = [
    `The client belongs to the ${projection.yearTurning55}`,
    `CPF Retirement Sum cohort.`,
    `The displayed monthly payouts are taken directly from`,
    `the stored CPF LIFE figures for that cohort and gender.`,
  ].join(" ");

  cpfCalculationDataElement.replaceChildren(
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
  if (cpfPayoutHelperElement) {
    cpfPayoutHelperElement.textContent = "--";
  }

  if (cpfCalculationSummaryElement) {
    cpfCalculationSummaryElement.textContent = "--";
  }

  cpfCalculationDataElement?.replaceChildren();

  if (cpfCalculationDetailsElement) {
    cpfCalculationDetailsElement.hidden = true;
  }

  cpfCalculationToggleButton?.setAttribute("aria-expanded", "false");

  cpfCalculationToggleIcon?.classList.remove("is-expanded");
}

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
  const projection = calculateClientCpfRetirementProjection();

  if (!projection.isValid) {
    renderEmptyCpfRetirementSums(projection.message);
    return;
  }

  const cohortAgeText = getCpfCohortAgeText(projection.yearTurning55);

  if (projectedBrsElement) {
    projectedBrsElement.textContent = formatCurrency(
      projection.retirementSums.brs,
    );
  }

  if (projectedFrsElement) {
    projectedFrsElement.textContent = formatCurrency(
      projection.retirementSums.frs,
    );
  }

  if (projectedErsElement) {
    projectedErsElement.textContent = formatCurrency(
      projection.retirementSums.ers,
    );
  }

  if (projectedBrsPayoutElement) {
    projectedBrsPayoutElement.textContent = formatCurrency(
      projection.monthlyPayouts.brs,
    );
  }

  if (projectedFrsPayoutElement) {
    projectedFrsPayoutElement.textContent = formatCurrency(
      projection.monthlyPayouts.frs,
    );
  }

  if (projectedErsPayoutElement) {
    projectedErsPayoutElement.textContent = formatCurrency(
      projection.monthlyPayouts.ers,
    );
  }

  renderCpfProjectionBasis({
    retirementSumBasis: projection.retirementSumBasis,
    payoutBasis: projection.payoutBasis,
  });

  renderCpfPayoutMethodology(projection);

  if (!cpfProjectionCaptionElement) {
    return;
  }

  const genderLabel = projection.gender === "male" ? "male" : "female";

  if (
    projection.retirementSumBasis === "official" &&
    projection.payoutBasis === "official"
  ) {
    cpfProjectionCaptionElement.textContent = [
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
    cpfProjectionCaptionElement.textContent = [
      cohortAgeText,
      `Published CPF Retirement Sums are used.`,
      `CPF LIFE payouts are estimated using the locked`,
      `${CPF_LIFE_PAYOUT_MODEL.basisYear} ${genderLabel}`,
      `payout relationship and a projected RA balance at age 65.`,
    ].join(" ");

    return;
  }

  cpfProjectionCaptionElement.textContent = [
    cohortAgeText,
    `Retirement Sums assume an annual increase of`,
    `${formatPercentage(projection.annualGrowthRate)}.`,
    `CPF LIFE payouts are estimated using the locked`,
    `${CPF_LIFE_PAYOUT_MODEL.basisYear} ${genderLabel}`,
    `payout relationship and a projected RA balance at age 65.`,
  ].join(" ");
}

function calculateClientCpfRetirementProjection() {
  const currentAge = getClientAge();
  const profile = getClientProfile();

  if (currentAge === null) {
    return {
      isValid: false,
      message:
        "Complete the client's date of birth to calculate the projection.",
    };
  }

  const gender = profile?.gender;

  if (gender !== "male" && gender !== "female") {
    return {
      isValid: false,
      message:
        "Select the client's gender to calculate the estimated CPF LIFE payout.",
    };
  }

  const yearTurning55 = getClientYearTurning55();

  if (!yearTurning55) {
    return {
      isValid: false,
      message: "Unable to determine the year the client turns 55.",
    };
  }

  const earliestOfficialRetirementSumYear = Math.min(
    ...Object.keys(OFFICIAL_RETIREMENT_SUMS).map(Number),
  );

  if (yearTurning55 < earliestOfficialRetirementSumYear) {
    return {
      isValid: false,
      message: [
        `The client turned 55 in ${yearTurning55}.`,
        `CPF Retirement Sum data is currently available from`,
        `${earliestOfficialRetirementSumYear} onwards.`,
      ].join(" "),
    };
  }

  const annualGrowthRate = getCpfRetirementSumGrowthRate();

  const calculatedRetirementSums = calculateCpfRetirementSums({
    yearTurning55,
    annualGrowthRate,
  });

  if (
    !Number.isFinite(calculatedRetirementSums.frs) ||
    calculatedRetirementSums.frs <= 0
  ) {
    return {
      isValid: false,
      message: "Unable to calculate the CPF Retirement Sums.",
    };
  }

  const retirementSums = {
    brs: roundCpfProjectionAmount(calculatedRetirementSums.brs),

    frs: roundCpfProjectionAmount(calculatedRetirementSums.frs),

    ers: roundCpfProjectionAmount(calculatedRetirementSums.ers),
  };

  const raAt65 = {
    brs: calculateCpfRaAt65(retirementSums.brs),
    frs: calculateCpfRaAt65(retirementSums.frs),
    ers: calculateCpfRaAt65(retirementSums.ers),
  };

  const cpfLifeProjection = calculateCpfLifePayouts({
    yearTurning55,
    gender,
    raAt65,
  });

  return {
    isValid: true,
    yearTurning55,
    gender,
    annualGrowthRate,
    retirementSumBasis: calculatedRetirementSums.basis,
    payoutBasis: cpfLifeProjection.basis,
    retirementSums,
    raAt65,
    monthlyPayouts: cpfLifeProjection.monthlyPayouts,
  };
}

function calculateCpfRetirementSums({ yearTurning55, annualGrowthRate }) {
  const officialRetirementSums = OFFICIAL_RETIREMENT_SUMS[yearTurning55];

  if (officialRetirementSums) {
    return {
      brs: officialRetirementSums.brs,
      frs: officialRetirementSums.frs,
      ers: officialRetirementSums.ers,
      basis: "official",
    };
  }

  if (yearTurning55 < LATEST_OFFICIAL_RETIREMENT_SUM_YEAR) {
    return {
      brs: 0,
      frs: 0,
      ers: 0,
      basis: "unavailable",
    };
  }

  const projectionYears = yearTurning55 - LATEST_OFFICIAL_RETIREMENT_SUM_YEAR;

  const decimalGrowthRate = annualGrowthRate / 100;

  const projectedFrs =
    LATEST_OFFICIAL_FRS * Math.pow(1 + decimalGrowthRate, projectionYears);

  return {
    brs: projectedFrs / 2,
    frs: projectedFrs,
    ers: projectedFrs * 2,
    basis: "projected",
  };
}

function calculateCpfRaAt65(retirementSumAt55) {
  if (!Number.isFinite(retirementSumAt55) || retirementSumAt55 <= 0) {
    return 0;
  }

  const decimalInterestRate = CPF_RA_INTEREST_RATE / 100;

  return (
    retirementSumAt55 *
    Math.pow(1 + decimalInterestRate, CPF_RA_COMPOUNDING_YEARS)
  );
}

function calculateCpfLifePayouts({ yearTurning55, gender, raAt65 }) {
  const officialPayouts = OFFICIAL_CPF_LIFE_PAYOUTS[yearTurning55]?.[gender];

  if (officialPayouts) {
    return {
      basis: "official",

      monthlyPayouts: {
        brs: officialPayouts.brs,
        frs: officialPayouts.frs,
        ers: officialPayouts.ers,
      },
    };
  }

  return {
    basis: "projected",

    monthlyPayouts: {
      brs: calculateProjectedCpfLifePayout({
        raAt65: raAt65.brs,
        gender,
      }),

      frs: calculateProjectedCpfLifePayout({
        raAt65: raAt65.frs,
        gender,
      }),

      ers: calculateProjectedCpfLifePayout({
        raAt65: raAt65.ers,
        gender,
      }),
    },
  };
}

function calculateProjectedCpfLifePayout({ raAt65, gender }) {
  const model = CPF_LIFE_PAYOUT_MODEL[gender];

  if (!model || !Number.isFinite(raAt65) || raAt65 <= 0) {
    return 0;
  }

  const unroundedMonthlyPayout = model.fixedAmount + raAt65 * model.raFactor;

  return roundCpfLifePayout(unroundedMonthlyPayout);
}

function roundCpfLifePayout(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const increment = CPF_LIFE_PAYOUT_MODEL.roundingIncrement;

  return Math.round(value / increment) * increment;
}

function getCpfCohortAgeText(yearTurning55) {
  const currentYear = new Date().getFullYear();

  if (yearTurning55 < currentYear) {
    return `Client turned 55 in ${yearTurning55}.`;
  }

  if (yearTurning55 === currentYear) {
    return `Client turns 55 in ${yearTurning55}.`;
  }

  return `Client will turn 55 in ${yearTurning55}.`;
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
  const enteredValue = cpfGrowthRateInput?.value.trim();

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
    projectedBrsElement,
    projectedFrsElement,
    projectedErsElement,
  ];

  const payoutElements = [
    projectedBrsPayoutElement,
    projectedFrsPayoutElement,
    projectedErsPayoutElement,
  ];

  const basisElements = [
    projectedBrsBasisElement,
    projectedFrsBasisElement,
    projectedErsBasisElement,
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

  if (cpfProjectionCaptionElement) {
    cpfProjectionCaptionElement.textContent = message;
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
    projectedBrsBasisElement,
    projectedFrsBasisElement,
    projectedErsBasisElement,
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
  if (fybcYearsRemainingElement) {
    const yearLabel =
      projection.yearsRemaining === 1
        ? "Year"
        : "Years";

    fybcYearsRemainingElement.textContent =
      `${projection.yearsRemaining} ${yearLabel}`;
  }

  if (fybcIncomeElement) {
    fybcIncomeElement.textContent = formatCurrency(
      projection.monthlyIncomeAtFybc,
    );
  }

  if (fybcInflationNoteElement) {
    fybcInflationNoteElement.textContent =
      `Assuming ${formatPercentage(
        projection.inflationRate * 100,
      )} annual inflation`;
  }

  if (cpfLifeIncomeElement) {
    cpfLifeIncomeElement.textContent = formatCurrency(
      projection.monthlyIncomeAfterCpf,
    );
  }

  if (fybcRequiredElement) {
    fybcRequiredElement.textContent = formatCurrency(
      projection.netFundNeeded,
    );
  }
}

function calculateFybcProjection() {
  const currentAge = getClientAge();

  const desiredFybcAge = getDesiredFybcAge();

  const mortalityAge = getPlannedMortalityAge();

  const inflationRate = getInflationRate() / 100;

  const monthlyPassiveIncome =
    getSelectedMonthlyPassiveIncome();

  if (
    currentAge === null ||
    desiredFybcAge === null ||
    mortalityAge === null
  ) {
    return {
      isValid: false,
    };
  }

  if (
    monthlyPassiveIncome <= 0 ||
    desiredFybcAge <= currentAge ||
    mortalityAge <= 65
  ) {
    return {
      isValid: false,
    };
  }

  const yearsRemaining =
    desiredFybcAge - currentAge;

  const monthlyIncomeAtFybc =
    monthlyPassiveIncome *
    Math.pow(
      1 + inflationRate,
      yearsRemaining,
    );

  const cpfLifePayout =
    getSelectedCpfLifeMonthlyPayout();

  const monthlyIncomeAfterCpf =
    Math.max(
      0,
      monthlyIncomeAtFybc - cpfLifePayout,
    );

  const netFundNeeded =
    calculateNetFundNeeded({
      monthlyIncomeAfterCpf,
      mortalityAge,
      inflationRate,
    });

  return {
    isValid: true,
    yearsRemaining,
    monthlyIncomeAtFybc,
    cpfLifePayout,
    monthlyIncomeAfterCpf,
    netFundNeeded,
    inflationRate,
  };
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

function calculateNetFundNeeded({
  monthlyIncomeAfterCpf,
  mortalityAge,
  inflationRate,
}) {
  if (
    !Number.isFinite(monthlyIncomeAfterCpf) ||
    monthlyIncomeAfterCpf <= 0 ||
    !Number.isFinite(mortalityAge) ||
    mortalityAge <= 65
  ) {
    return 0;
  }

  let total = 0;

  for (
    let age = 65;
    age < mortalityAge;
    age += 1
  ) {
    const yearsSince65 = age - 65;

    const yearlyIncome =
      monthlyIncomeAfterCpf *
      Math.pow(
        1 + inflationRate,
        yearsSince65,
      ) *
      12;

    total += yearlyIncome;
  }

  return total;
}

function renderEmptyFybcProjection() {
  if (fybcYearsRemainingElement) {
    fybcYearsRemainingElement.textContent = "--";
  }

  if (fybcIncomeElement) {
    fybcIncomeElement.textContent = "--";
  }

  if (fybcInflationNoteElement) {
    fybcInflationNoteElement.textContent =
      "Enter the projection assumptions above";
  }

  if (cpfLifeIncomeElement) {
    cpfLifeIncomeElement.textContent = "--";
  }

  if (fybcRequiredElement) {
    fybcRequiredElement.textContent = "--";
  }
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
      desiredFybcAgeInput,
    );

    return false;
  }

  if (desiredFybcAge <= currentAge) {
    showValidationMessage(
      `Desired FYBC Age must be above the client's current age of ${currentAge}.`,
      desiredFybcAgeInput,
    );

    return false;
  }

  if (plannedMortalityAge > 0 && desiredFybcAge >= plannedMortalityAge) {
    showValidationMessage(
      "Desired FYBC Age must be below the planned mortality age.",
      desiredFybcAgeInput,
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
  if (!desiredFybcAgeInput) {
    return null;
  }

  const value = parseInt(desiredFybcAgeInput.value, 10);

  return Number.isFinite(value) ? value : null;
}

function getInflationRate() {
  if (!inflationRateInput) {
    return 0;
  }

  const value = parseFloat(inflationRateInput.value);

  return Number.isFinite(value) ? value : 0;
}

function getPlannedMortalityAge() {
  if (!plannedMortalityAgeInput) {
    return null;
  }

  const value = parseInt(plannedMortalityAgeInput.value, 10);

  return Number.isFinite(value) ? value : null;
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
    customIncomeInput,
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