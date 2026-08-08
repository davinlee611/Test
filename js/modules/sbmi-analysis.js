"use strict";

import { getSbmiAnalysisElements } from "./sbmi-analysis/sbmi-analysis-elements.js";

import { bindSbmiAnalysisEvents } from "./sbmi-analysis/sbmi-analysis-event-binder.js";

import { createSbmiAnalysisController } from "./sbmi-analysis/sbmi-analysis-controller.js";

export {
  getInjuryCheckResult,
  getWaitTimeCheckResult,
} from "./sbmi-analysis/sbmi-analysis-check-calculator.js";

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

let elements = {};

let controller = null;

/* ========================================
   INITIALIZATION
======================================== */

export function initializeSbmiAnalysis() {
  if (moduleInitialized) {
    controller?.render();

    return;
  }

  createSbmiAnalysisComponents();

  bindModuleEvents();

  moduleInitialized = true;

  controller.render();
}

/* ========================================
   RESET
======================================== */

export function resetSbmiAnalysis() {
  controller?.reset();
}

/* ========================================
   RENDER (also invoked directly on section entry)
======================================== */

export function renderSbmiAnalysis() {
  controller?.render();
}

/* ========================================
   COMPONENT CREATION
======================================== */

function createSbmiAnalysisComponents() {
  elements = getSbmiAnalysisElements();

  controller = createSbmiAnalysisController({
    elements,
  });
}

/* ========================================
   EVENT BINDING
======================================== */

function bindModuleEvents() {
  bindSbmiAnalysisEvents({
    onApplicationDataChanged: renderSbmiAnalysis,
  });
}
