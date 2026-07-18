"use strict";

import { clientPlan } from "../state/client-state.js";
import { emit } from "../events/event-bus.js";
import { EVENTS } from "../events/events.js";


/* ========================================
   DOM REFERENCES
======================================== */

const wealthTypeCards =
    document.querySelectorAll(
        ".wealth-type-card",
    );


/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;


/* ========================================
   INITIALIZATION
======================================== */

export function initializeWealthType() {
    if (moduleInitialized) {
        return;
    }

    attachWealthTypeListeners();
    renderWealthTypeSelections();

    moduleInitialized = true;
}


/* ========================================
   RESET
======================================== */

export function resetWealthType() {
    clientPlan.priorities.selectedWealthTypes =
        [];

    renderWealthTypeSelections();
    emitWealthTypeChanged();
}


/* ========================================
   EVENT LISTENERS
======================================== */

function attachWealthTypeListeners() {
    wealthTypeCards.forEach(function (card) {
        card.addEventListener(
            "click",
            function () {
                handleWealthTypeClick(card);
            },
        );
    });
}


function handleWealthTypeClick(card) {
    const wealthType =
        card.dataset.wealthType;

    if (!wealthType) {
        return;
    }

    const selectedWealthTypes =
        clientPlan.priorities
            .selectedWealthTypes;

    const isAlreadySelected =
        selectedWealthTypes.includes(
            wealthType,
        );

    if (isAlreadySelected) {
        clientPlan.priorities
            .selectedWealthTypes =
            selectedWealthTypes.filter(
                function (selectedType) {
                    return (
                        selectedType !==
                        wealthType
                    );
                },
            );
    } else {
        selectedWealthTypes.push(
            wealthType,
        );
    }

    renderWealthTypeSelections();
    emitWealthTypeChanged();
}


/* ========================================
   RENDERING
======================================== */

function renderWealthTypeSelections() {
    const selectedWealthTypes =
        clientPlan.priorities
            .selectedWealthTypes;

    wealthTypeCards.forEach(function (card) {
        const wealthType =
            card.dataset.wealthType;

        const isSelected =
            selectedWealthTypes.includes(
                wealthType,
            );

        card.classList.toggle(
            "selected",
            isSelected,
        );

        card.setAttribute(
            "aria-pressed",
            String(isSelected),
        );
    });
}


/* ========================================
   EVENTS
======================================== */

function emitWealthTypeChanged() {
    emit(
        EVENTS.WEALTH_TYPE_CHANGED,
        {
            selectedWealthTypes:
                [
                    ...clientPlan.priorities
                        .selectedWealthTypes,
                ],
        },
    );
}