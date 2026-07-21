"use strict";

import { clientPlan } from "../state/client-plan.js";
import { emit } from "../events/event-bus.js";
import { EVENTS } from "../events/events.js";

/* ========================================
   DOM REFERENCES
======================================== */

const wealthTypeCards = document.querySelectorAll(".wealth-type-card");

const wealthTypeProgress = document.getElementById("wealthTypeProgress");

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
  clientPlan.priorities.selectedWealthTypes = [];

  renderWealthTypeSelections();
  emitWealthTypeChanged();
}

/* ========================================
   EVENT LISTENERS
======================================== */

function attachWealthTypeListeners() {
  wealthTypeCards.forEach(function (card) {
    card.addEventListener("click", function () {
      handleWealthTypeClick(card);
    });
  });
}

function handleWealthTypeClick(card) {
  const wealthType = card.dataset.wealthType;

  if (!wealthType) {
    return;
  }

  const selectedWealthTypes = clientPlan.priorities.selectedWealthTypes;

  const isAlreadySelected = selectedWealthTypes.includes(wealthType);

  if (isAlreadySelected) {
    clientPlan.priorities.selectedWealthTypes = selectedWealthTypes.filter(
      function (selectedType) {
        return selectedType !== wealthType;
      },
    );
  } else {
    selectedWealthTypes.push(wealthType);
  }

  renderWealthTypeSelections();
  emitWealthTypeChanged();
}

/* ========================================
   RENDERING
======================================== */

function renderWealthTypeSelections() {
  const selectedWealthTypes = clientPlan.priorities.selectedWealthTypes;

  wealthTypeCards.forEach(function (card) {
    const wealthType = card.dataset.wealthType;

    const selectedIndex = selectedWealthTypes.indexOf(wealthType);

    const isSelected = selectedIndex !== -1;

    const ranking = isSelected ? selectedIndex + 1 : "";

    card.classList.toggle("selected", isSelected);

    card.setAttribute("aria-pressed", String(isSelected));

    card.setAttribute("aria-label", createWealthTypeAriaLabel(card, ranking));

    const selectionIndicator = card.querySelector(".selection-indicator");

    if (selectionIndicator) {
      selectionIndicator.textContent = ranking;
    }
  });

  if (wealthTypeProgress) {
    const selectedCount = selectedWealthTypes.length;

    wealthTypeProgress.textContent = `${selectedCount} of 4 ranked`;

    wealthTypeProgress.classList.toggle("complete", selectedCount === 4);
  }
}

function createWealthTypeAriaLabel(card, ranking) {
  const heading = card.querySelector("h4");

  const wealthTypeName = heading?.textContent?.trim() || "Wealth priority";

  if (!ranking) {
    return `${wealthTypeName}. ` + "Not currently ranked.";
  }

  return `${wealthTypeName}. ` + `Ranked number ${ranking}.`;
}

/* ========================================
   EVENTS
======================================== */

function emitWealthTypeChanged() {
  emit(EVENTS.WEALTH_TYPE_CHANGED, {
    selectedWealthTypes: [...clientPlan.priorities.selectedWealthTypes],
  });
}
