"use strict";

import { on } from "../../events/event-bus.js";

import { EVENTS } from "../../events/events.js";

/* ========================================
   PROTECTION ANALYSIS EVENT BINDING
======================================== */

export function bindProtectionAnalysisEvents({
  elements,

  onWaitTimeChange,

  onInjuryProneChange,

  onExpensesChanged,

  onLiabilitiesChanged,
}) {
  elements.waitTimeInputs.forEach(function (input) {
    input.addEventListener("change", function () {
      onWaitTimeChange(input);
    });
  });

  elements.injuryProneInputs.forEach(function (input) {
    input.addEventListener("change", function () {
      onInjuryProneChange(input);
    });
  });

  on(EVENTS.EXPENSES_CHANGED, onExpensesChanged);

  on(EVENTS.LIABILITIES_CHANGED, onLiabilitiesChanged);
}
