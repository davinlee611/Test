"use strict";

/* ========================================
   CLIENT REPORT ELEMENTS
======================================== */

export function getClientReportElements() {
  return {
    generateReportButtons: [
      document.getElementById("analysisGenerateReportButton"),
      document.getElementById("sbmiGenerateReportButton"),
    ].filter(Boolean),

    printClientReportButton: document.getElementById(
      "printClientReportButton",
    ),

    clientReportEmptyState: document.getElementById("clientReportEmptyState"),

    clientReportBody: document.getElementById("clientReportBody"),

    reportConfirmModal: document.getElementById("reportConfirmModal"),

    reportConfirmTitle: document.getElementById("reportConfirmTitle"),

    reportConfirmMessage: document.getElementById("reportConfirmMessage"),

    continueReportConfirmButton: document.getElementById(
      "continueReportConfirmButton",
    ),

    reportConfirmCloseTriggers: document.querySelectorAll(
      "[data-close-report-confirm-modal]",
    ),
  };
}
