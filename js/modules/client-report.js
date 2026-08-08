"use strict";

import { getClientReportElements } from "./client-report/client-report-elements.js";

import { bindClientReportEvents } from "./client-report/client-report-event-binder.js";

import { createClientReportController } from "./client-report/client-report-controller.js";

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

let elements = {};

let controller = null;

/* ========================================
   INITIALIZATION
======================================== */

export function initializeClientReport() {
  if (moduleInitialized) {
    return;
  }

  createClientReportComponents();

  bindModuleEvents();

  moduleInitialized = true;
}

/* ========================================
   RESET
======================================== */

export function resetClientReport() {
  controller?.reset();
}

/* ========================================
   COMPONENT CREATION
======================================== */

function createClientReportComponents() {
  elements = getClientReportElements();

  controller = createClientReportController({
    elements,
  });
}

/* ========================================
   EVENT BINDING
======================================== */

function bindModuleEvents() {
  bindClientReportEvents({
    elements,

    onGenerateReportClick: controller.handleGenerateReportClick,

    onContinueReportConfirm: controller.handleContinueReportConfirm,

    onCloseReportConfirm: controller.handleCloseReportConfirm,

    onReportModalKeydown: controller.handleReportModalKeydown,

    onPrint: controller.handlePrint,
  });
}
