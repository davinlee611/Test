"use strict";

import { getProtectionAnalysisElements } from "./protection-analysis/protection-analysis-elements.js";

import { bindProtectionAnalysisEvents } from "./protection-analysis/protection-analysis-event-binder.js";

import { createProtectionAnalysisWorkflow } from "./protection-analysis/protection-analysis-workflow.js";

import { createProtectionAnalysisController } from "./protection-analysis/protection-analysis-controller.js";

export {
  PROTECTION_HORIZON_MONTHS,
  PROTECTION_HORIZON_YEARS,
  getCoverageNeededBreakdown,
  getSelectableExpenseItems,
  getSelectableLiabilities,
  getSelectedExpenseMonthlyTotal,
  getSelectedLiabilityMonthlyTotal,
} from "./protection-analysis/protection-analysis-calculator.js";

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

let elements = {};

let workflow = null;

let controller = null;

/* ========================================
   INITIALIZATION
======================================== */

export function initializeProtectionAnalysis() {
  if (moduleInitialized) {
    controller?.render();

    return;
  }

  createProtectionAnalysisComponents();

  bindModuleEvents();

  moduleInitialized = true;

  controller.render();
}

/* ========================================
   RESET
======================================== */

export function resetProtectionAnalysis() {
  controller?.reset();
}

/* ========================================
   RENDER (also invoked directly on section entry)
======================================== */

export function renderProtectionAnalysis() {
  controller?.render();
}

/* ========================================
   COMPONENT CREATION
======================================== */

function createProtectionAnalysisComponents() {
  elements = getProtectionAnalysisElements();

  workflow = createProtectionAnalysisWorkflow();

  controller = createProtectionAnalysisController({
    elements,

    workflow,
  });
}

/* ========================================
   EVENT BINDING
======================================== */

function bindModuleEvents() {
  bindProtectionAnalysisEvents({
    elements,

    onWaitTimeChange: controller.handleWaitTimeChange,

    onInjuryProneChange: controller.handleInjuryProneChange,

    onExpensesChanged: controller.handleExpensesChanged,

    onLiabilitiesChanged: controller.handleLiabilitiesChanged,
  });
}
