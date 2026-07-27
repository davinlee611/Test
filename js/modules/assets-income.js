"use strict";

import { getClientAge } from "./client-profile.js";

import { getAssetsIncomeElements } from "./assets-income/assets-income-elements.js";

import { bindAssetsIncomeEvents } from "./assets-income/assets-income-event-binder.js";

import { createAssetsIncomeWorkflow } from "./assets-income/assets-income-workflow.js";

import { createAssetsIncomeController } from "./assets-income/assets-income-controller.js";

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

export function initializeAssetsIncome() {
  if (moduleInitialized) {
    controller?.render();

    return;
  }

  createAssetsIncomeComponents();

  bindModuleEvents();

  moduleInitialized = true;

  controller.initializeDisplay();
}

/* ========================================
   RESET
======================================== */

export function resetAssetsIncome() {
  controller?.reset();
}

/* ========================================
   RENDER
======================================== */

export function renderAssetsIncome() {
  controller?.render();
}

/* ========================================
   COMPONENT CREATION
======================================== */

function createAssetsIncomeComponents() {
  elements = getAssetsIncomeElements();

  workflow = createAssetsIncomeWorkflow();

  controller = createAssetsIncomeController({
    elements,

    workflow,

    getClientAge,
  });
}

/* ========================================
   EVENT BINDING
======================================== */

function bindModuleEvents() {
  bindAssetsIncomeEvents({
    elements,

    onFinancialInput: controller.handleFinancialInput,

    onProfileChanged: controller.handleProfileChanged,

    onPropertyChanged: controller.handlePropertyChanged,
  });
}