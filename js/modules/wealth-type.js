"use strict";

import { clientPlan } from "../state/client-state.js";
import { emit } from "../events/event-bus.js";
import { EVENTS } from "../events/events.js";

let moduleInitialized = false;

export function initializeWealthType() {
    if (moduleInitialized) {
        return;
    }

    attachWealthTypeListeners();
    renderWealthTypeSelections();

    moduleInitialized = true;
}

export function resetWealthType() {
    clientPlan.priorities.selectedWealthTypes = [];

    renderWealthTypeSelections();

    emit(EVENTS.WEALTH_TYPE_CHANGED, {
        selectedWealthTypes:
            clientPlan.priorities.selectedWealthTypes,
    });
}

function attachWealthTypeListeners() {
}

function renderWealthTypeSelections() {
}