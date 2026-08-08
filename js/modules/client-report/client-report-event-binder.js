"use strict";

/* ========================================
   CLIENT REPORT EVENT BINDING
======================================== */

export function bindClientReportEvents({
  elements,

  onGenerateReportClick,

  onContinueReportConfirm,

  onCloseReportConfirm,

  onReportModalKeydown,

  onPrint,
}) {
  elements.generateReportButtons.forEach(function (button) {
    button.addEventListener("click", onGenerateReportClick);
  });

  elements.continueReportConfirmButton?.addEventListener(
    "click",
    onContinueReportConfirm,
  );

  elements.reportConfirmCloseTriggers.forEach(function (trigger) {
    trigger.addEventListener("click", onCloseReportConfirm);
  });

  document.addEventListener("keydown", onReportModalKeydown);

  elements.printClientReportButton?.addEventListener("click", onPrint);
}
