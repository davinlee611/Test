"use strict";

import { on } from "../../events/event-bus.js";

import { EVENTS } from "../../events/events.js";

/* ========================================
   SBMI ANALYSIS EVENT BINDING
======================================== */

export function bindSbmiAnalysisEvents({ onApplicationDataChanged }) {
  on(EVENTS.EXPENSES_CHANGED, onApplicationDataChanged);

  on(EVENTS.LIABILITIES_CHANGED, onApplicationDataChanged);

  on(EVENTS.POLICIES_CHANGED, onApplicationDataChanged);
}
