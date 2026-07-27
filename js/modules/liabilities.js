"use strict";

import { getLiabilityElements } from "./liabilities/liability-elements.js";

import { bindLiabilityEvents } from "./liabilities/liability-event-binder.js";

import { createLiabilityModal } from "./liabilities/liability-modal.js";

import { createLiabilityWorkflow } from "./liabilities/liability-workflow.js";

import { createLiabilityController } from "./liabilities/liability-controller.js";

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

let elements = {};

let liabilityModal = null;

let liabilityWorkflow = null;

let liabilityController = null;

/* ========================================
   INITIALIZATION
======================================== */

export function initializeLiabilities() {
  if (moduleInitialized) {
    liabilityController?.render();

    return;
  }

  createLiabilityComponents();

  bindModuleEvents();

  moduleInitialized = true;

  liabilityController.render();
}

/* ========================================
   RESET
======================================== */

export function resetLiabilities() {
  liabilityController?.reset();
}

/* ========================================
   RENDERING
======================================== */

export function renderLiabilities() {
  liabilityController?.render();
}

/* ========================================
   COMPONENT CREATION
======================================== */

function createLiabilityComponents() {
  elements = getLiabilityElements();

  liabilityWorkflow = createLiabilityWorkflow();

  liabilityModal = createLiabilityModal({
    elements,
  });

  liabilityController = createLiabilityController({
    elements,

    modal: liabilityModal,

    workflow: liabilityWorkflow,
  });
}

/* ========================================
   EVENT BINDING
======================================== */

function bindModuleEvents() {
  bindLiabilityEvents({
    elements,

    onAddLiability: liabilityController.openAddLiability,

    onSubmitLiability: liabilityController.submitLiability,

    onCloseLiability: liabilityController.closeLiability,
  });
}