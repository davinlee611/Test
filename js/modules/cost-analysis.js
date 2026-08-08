"use strict";

import { getCostAnalysisElements } from "./cost-analysis/cost-analysis-elements.js";

import { bindCostAnalysisEvents } from "./cost-analysis/cost-analysis-event-binder.js";

import { createCostAnalysisController } from "./cost-analysis/cost-analysis-controller.js";

import {
  getCurrentCashflowState,
  getYourNextStepsResultState,
  getYourPathProjectedPositionState,
} from "./cost-analysis/cost-analysis-state.js";

export { calculateMonthlyContributionFutureValue } from "./cost-analysis/your-path-calculator.js";

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

let elements = {};

let controller = null;

/* ========================================
   INITIALIZATION
======================================== */

export function initializeCostAnalysis() {
  if (moduleInitialized) {
    controller?.render();

    return;
  }

  createCostAnalysisComponents();

  bindModuleEvents();

  moduleInitialized = true;

  controller.render();
}

/* ========================================
   RESET
======================================== */

export function resetCostAnalysis() {
  controller?.reset();
}

/* ========================================
   REPORT ACCESSORS

   Read-only access to the latest computed Analysis results, for the
   Client Report to reuse rather than recalculating independently.
======================================== */

export function getLatestCurrentCashflow() {
  return getCurrentCashflowState();
}

export function getLatestYourPathProjectedPosition() {
  return getYourPathProjectedPositionState();
}

export function getLatestYourNextStepsResult() {
  return getYourNextStepsResultState();
}

/* ========================================
   COMPONENT CREATION
======================================== */

function createCostAnalysisComponents() {
  elements = getCostAnalysisElements();

  controller = createCostAnalysisController({
    elements,
  });
}

/* ========================================
   EVENT BINDING
======================================== */

function bindModuleEvents() {
  bindCostAnalysisEvents({
    elements,

    onRender: controller.render,

    onExpenseInflationInput: controller.handleExpenseInflationInput,

    onCpfLifeStartAgeChange: controller.handleCpfLifeStartAgeChange,

    onRetirementStrategyChange: controller.handleRetirementStrategyChange,

    onStrategyDetailLinkClick: controller.handleStrategyDetailLinkClick,

    onAnalysisSectionCollapse: controller.handleAnalysisSectionCollapse,

    onGoalFilterChange: controller.handleGoalFilterChange,

    onSelectAllGoals: controller.handleSelectAllGoals,

    onMonthlyAmountInput: controller.handleMonthlyAmountInput,

    onIncludeAssetsChange: controller.handleIncludeAssetsChange,

    onCapitalMethodologyClick: controller.handleCapitalMethodologyClick,
  });
}
