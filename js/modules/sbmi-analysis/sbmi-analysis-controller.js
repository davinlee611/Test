"use strict";

import {
  renderCoverageGap,
  renderCoverageNeeded,
  renderExistingCoverage,
  renderMedicalProtectionCheck,
} from "./sbmi-analysis-renderer.js";

/* ========================================
   SBMI ANALYSIS CONTROLLER
======================================== */

export function createSbmiAnalysisController({ elements }) {
  function render() {
    const totalNeeded = renderCoverageNeeded(elements);

    const totalExisting = renderExistingCoverage(elements);

    renderCoverageGap(elements, totalNeeded, totalExisting);

    renderMedicalProtectionCheck(elements);
  }

  function reset() {
    render();
  }

  return {
    render,

    reset,
  };
}
