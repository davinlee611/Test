"use strict";

import {
    clientPlan,
} from "../state/client-state.js";

import {
    emit,
} from "../events/event-bus.js";

import {
    EVENTS,
} from "../events/events.js";

import {
    createUniqueId,
    formatCurrency,
    getInputWholeNumber,
} from "../utils/client-utils.js";

/* ========================================
   DOM REFERENCES
======================================== */



/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;


/* ========================================
   INITIALIZATION
======================================== */

export function initializeProperties() {
    if (moduleInitialized) {
        return;
    }

    attachPropertyListeners();

    renderProperties();

    moduleInitialized = true;
}


/* ========================================
   RESET
======================================== */

export function resetProperties() {
    clientPlan.priorities.assets.properties = [];

    renderProperties();
}


/* ========================================
   RENDER
======================================== */

export function renderProperties() {
    // We will move this later.
}


/* ========================================
   PRIVATE
======================================== */

function attachPropertyListeners() {

}