"use strict";

import { clientPlan } from "../state/client-state.js";
import { emit } from "../events/event-bus.js";
import { EVENTS } from "../events/events.js";


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

export function initializeAssetsIncome() {
    if (moduleInitialized) {
        return;
    }

    attachAssetsIncomeListeners();
    syncAssetsIncomeInputs();

    moduleInitialized = true;
}


/* ========================================
   PUBLIC FUNCTIONS
======================================== */

export function resetAssetsIncome() {

}


/* ========================================
   EVENT LISTENERS
======================================== */

function attachAssetsIncomeListeners() {

}


/* ========================================
   RENDERING
======================================== */

function syncAssetsIncomeInputs() {

}


/* ========================================
   EVENTS
======================================== */

function emitAssetsChanged() {
    emit(EVENTS.ASSETS_CHANGED, {
        assets:
            clientPlan.priorities.assets,
    });
}

function emitIncomeChanged() {
    emit(EVENTS.INCOME_CHANGED, {
        income:
            clientPlan.priorities.assets.income,
    });
}

function emitCpfChanged() {
    emit(EVENTS.CPF_CHANGED, {
        cpf:
            clientPlan.priorities.assets.cpf,
    });
}