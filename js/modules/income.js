"use strict";

import { clientPlan } from "../state/client-state.js";
import { emit } from "../events/event-bus.js";
import { EVENTS } from "../events/events.js";

let moduleInitialized = false;

export function initializeIncome() {
    if (moduleInitialized) {
        return;
    }

    attachIncomeListeners();
    syncIncomeInputs();

    moduleInitialized = true;
}

export function resetIncome() {
    clientPlan.priorities.assets.income = {
        annualIncome: 0,
        annualBonus: 0,
        annualInvestmentIncome: 0,
        annualRentalIncome: 0,
        otherAnnualIncome: 0,
    };

    syncIncomeInputs();

    emitIncomeChanged();
}

function attachIncomeListeners() {}

function syncIncomeInputs() {}

function emitIncomeChanged() {
    emit(EVENTS.INCOME_CHANGED, {
        income:
            clientPlan.priorities.assets.income,
    });
}