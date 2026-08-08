"use strict";

import { openSection } from "../sidebar.js";

import { initializeCostAnalysis } from "../cost-analysis.js";

import {
  buildClientReportData,
  hasCostOfWantsContent,
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
    const missingCostOfWants = !hasCostOfWantsContent();

    const missingProtection = !hasProtectionAnalysisContent();

    if (!missingCostOfWants && !missingProtection) {
      generateAndShowReport();

      return;
    }

    showReportConfirmModal({ missingCostOfWants, missingProtection });
  }

  function generateAndShowReport() {
    /*
     * The Cost of Wants Analysis section reuses the Analysis page's
     * cached Your Path / Your Next Steps results rather than
     * recalculating them (see client-report-data-builder.js). That
     * cache is only refreshed when the Analysis page itself renders,
     * so re-initializing it here guarantees the report reflects the
     * latest Cost of Wants inputs even if the adviser generated the
     * report from SBMI Analysis without ever revisiting Analysis.
     */
    initializeCostAnalysis();

    const data = buildClientReportData();

    renderClientReport(elements, data);

    openSection("client-report");
  }

  /* ========================================
     CONFIRMATION MODAL
  ======================================== */

  function showReportConfirmModal({ missingCostOfWants, missingProtection }) {
    if (!elements.reportConfirmModal) {
      generateAndShowReport();

      return;
    }

    setReportConfirmCopy({ missingCostOfWants, missingProtection });

    elements.reportConfirmModal.hidden = false;

    document.body.classList.add("validation-modal-open");

    elements.continueReportConfirmButton?.focus();
  }

  function setReportConfirmCopy({ missingCostOfWants, missingProtection }) {
    let title = "";

    let message = "";

    if (missingCostOfWants && missingProtection) {
      title = "Cost of Wants Analysis and Protection Analysis not completed";

      message =
        "This client report will not include a retirement plan or a coverage-gap analysis. Continue anyway?";
    } else if (missingCostOfWants) {
      title = "Cost of Wants Analysis not completed";

      message = "This client report will not include a retirement plan. Continue without it?";
    } else {
      title = "Protection Analysis not completed";

      message =
        "This client report will only cover the retirement plan. Continue without Protection Analysis?";
    }

    if (elements.reportConfirmTitle) {
      elements.reportConfirmTitle.textContent = title;
    }

    if (elements.reportConfirmMessage) {
      elements.reportConfirmMessage.textContent = message;
    }
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
