"use strict";

import {
  getCostOfWantsState,
  getGrossRetirementGoalSummary,
  getSelectedMonthlyIncome,
} from "./cost-of-wants/cost-of-wants-service.js";

import { getClientAge } from "./client-profile.js";

import { on } from "../events/event-bus.js";

import { EVENTS } from "../events/events.js";

/* ========================================
   ELEMENTS
======================================== */

const elements = {
  currentAge: document.getElementById("costOfWantsPreviewCurrentAge"),

  desiredFybcAge: document.getElementById("costOfWantsPreviewDesiredFybcAge"),

  mortalityAge: document.getElementById("costOfWantsPreviewMortalityAge"),

  inflationRate: document.getElementById("costOfWantsPreviewInflationRate"),

  lifestyleName: document.getElementById("costOfWantsPreviewLifestyleName"),

  selectedIncome: document.getElementById("costOfWantsPreviewSelectedIncome"),

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

/* ========================================
   INITIALIZATION
======================================== */

export function initializeCostOfWantsPreview() {
  if (moduleInitialized) {
    renderCostOfWantsPreview();

    return;
  }

  attachNavigationListeners();

  attachApplicationListeners();

  renderCostOfWantsPreview();

  moduleInitialized = true;
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
   EVENTS
======================================== */

function attachApplicationListeners() {
  on(EVENTS.COST_OF_WANTS_CHANGED, renderCostOfWantsPreview);

  on(EVENTS.PROFILE_CHANGED, renderCostOfWantsPreview);

  on(EVENTS.EXPENSES_CHANGED, renderCostOfWantsPreview);

  on(EVENTS.COMMITMENTS_CHANGED, renderCostOfWantsPreview);

  on(EVENTS.LIABILITIES_CHANGED, renderCostOfWantsPreview);

  on(EVENTS.POLICIES_CHANGED, renderCostOfWantsPreview);

  on(EVENTS.SECTION_CHANGED, function ({ section }) {
    if (section === "cost") {
      renderCostOfWantsPreview();
    }
  });
}

/* ========================================
   RENDERING
======================================== */

export function renderCostOfWantsPreview() {
  const costOfWants = getCostOfWantsState();

  const summary = getGrossRetirementGoalSummary();

  const selectedIncome = getSelectedMonthlyIncome();

  const currentAge = getClientAge();

  const lifestyleName = getLifestyleName(costOfWants.lifestyleOption);

  setText(
    elements.currentAge,
    Number.isFinite(currentAge) ? String(currentAge) : "—",
  );

  setText(elements.desiredFybcAge, getAgeText(costOfWants.desiredFybcAge));

  setText(elements.mortalityAge, getAgeText(costOfWants.plannedMortalityAge));

  setText(
    elements.inflationRate,
    `${formatNumber(costOfWants.inflationRate)}% p.a.`,
  );

  setText(elements.lifestyleName, lifestyleName);

  setText(
    elements.selectedIncome,
    selectedIncome > 0
      ? `${formatCurrency(selectedIncome)}/mth`
      : "Not selected",
  );

  setText(
    elements.incomeAtFybcLabel,
    summary.desiredFybcAge > 0
      ? `Income Needed at FYBC Age ${summary.desiredFybcAge}`
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

  setText(
    elements.incomeAtFybcBasis,
    "Complete the existing Cost of Wants inputs",
  );

  if (elements.emptyMessage) {
    elements.emptyMessage.hidden = false;
  }
}

/* ========================================
   HELPERS
======================================== */

function getLifestyleName(option) {
  switch (option) {
    case "basic":
      return "Basic";

    case "average":
      return "Average";

    case "comfort":
      return "Comfort";

    case "custom":
      return "Custom";

    default:
      return "Not selected";
  }
}

function getAgeText(value) {
  const age = Number(value);

  return Number.isFinite(age) && age > 0 ? String(age) : "—";
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

function formatCurrency(value) {
  const number = Number(value);

  const safeValue = Number.isFinite(number) ? number : 0;

  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(safeValue);
}

function setText(element, value) {
  if (!element) {
    return;
  }

  element.textContent = value;
}
