"use strict";

import { openSection } from "../sidebar.js";

import {
  buildClientReportData,
  hasProtectionAnalysisContent,
} from "./client-report-data-builder.js";

import {
  renderClientReport,
  resetClientReportDisplay,
} from "./client-report-renderer.js";

/* ========================================
   CLIENT REPORT CONTROLLER
======================================== */

export function createClientReportController({ elements }) {
  /* ========================================
     GENERATE REPORT TRIGGER
  ======================================== */

  function handleGenerateReportClick() {
    if (hasProtectionAnalysisContent()) {
      generateAndShowReport();

      return;
    }

    showReportConfirmModal();
  }

  function generateAndShowReport() {
    const data = buildClientReportData();

    renderClientReport(elements, data);

    openSection("client-report");
  }

  /* ========================================
     CONFIRMATION MODAL
  ======================================== */

  function showReportConfirmModal() {
    if (!elements.reportConfirmModal) {
      generateAndShowReport();

      return;
    }

    elements.reportConfirmModal.hidden = false;

    document.body.classList.add("validation-modal-open");

    elements.continueReportConfirmButton?.focus();
  }

  function closeReportConfirmModal() {
    if (!elements.reportConfirmModal) {
      return;
    }

    elements.reportConfirmModal.hidden = true;

    document.body.classList.remove("validation-modal-open");
  }

  function handleContinueReportConfirm() {
    closeReportConfirmModal();

    generateAndShowReport();
  }

  function handleReportModalKeydown(event) {
    if (
      event.key === "Escape" &&
      elements.reportConfirmModal &&
      !elements.reportConfirmModal.hidden
    ) {
      closeReportConfirmModal();
    }
  }

  /* ========================================
     PRINT
  ======================================== */

  function handlePrint() {
    window.print();
  }

  /* ========================================
     RESET
  ======================================== */

  function reset() {
    resetClientReportDisplay(elements);
  }

  return {
    handleGenerateReportClick,

    handleContinueReportConfirm,

    handleCloseReportConfirm: closeReportConfirmModal,

    handleReportModalKeydown,

    handlePrint,

    reset,
  };
}
