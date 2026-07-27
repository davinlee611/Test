"use strict";

import { on } from "../../events/event-bus.js";

import { EVENTS } from "../../events/events.js";

import { getFinancialInputs } from "./assets-income-elements.js";

/* ========================================
   ASSETS AND INCOME EVENT BINDING
======================================== */

export function bindAssetsIncomeEvents({
  elements,

  onFinancialInput,

  onProfileChanged,

  onPropertyChanged,
}) {
  const financialInputs = getFinancialInputs(elements);

  financialInputs.forEach(function (input) {
    input.addEventListener("input", onFinancialInput);
  });

  on(EVENTS.PROFILE_CHANGED, onProfileChanged);

  on(EVENTS.PROPERTY_CHANGED, onPropertyChanged);
}