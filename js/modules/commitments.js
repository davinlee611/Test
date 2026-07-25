"use strict";

import {
  getCommitments,
  getLiabilities,
  updateCommitments,
} from "../state/client-plan.js";

import { formatCurrency, getInputWholeNumber } from "../utils/client-utils.js";

import { on, emit } from "../events/event-bus.js";

import { EVENTS } from "../events/events.js";

/* ========================================
   DOM REFERENCES
======================================== */

const generalInsurancePremiumInput = document.getElementById(
  "generalInsurancePremium",
);

const totalMonthlyCommitmentsElement = document.getElementById(
  "totalMonthlyCommitmentsValue",
);

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

/* ========================================
   INITIALIZATION
======================================== */

export function initializeCommitments() {
  if (moduleInitialized) {
    syncCommitmentInputs();
    renderTotalMonthlyCommitments();
    return;
  }

  attachCommitmentListeners();
  attachApplicationListeners();

  syncCommitmentInputs();
  renderTotalMonthlyCommitments();

  moduleInitialized = true;
}

/* ========================================
   RESET
======================================== */

export function resetCommitments() {
  updateCommitments(createEmptyCommitments());

  syncCommitmentInputs();
  renderTotalMonthlyCommitments();

  emitCommitmentsChanged();
}

/* ========================================
   EVENT LISTENERS
======================================== */

function attachCommitmentListeners() {
  generalInsurancePremiumInput?.addEventListener(
    "input",
    handleCommitmentInput,
  );
}

function attachApplicationListeners() {
  on(EVENTS.LIABILITIES_CHANGED, function () {
    renderTotalMonthlyCommitments();
  });
}

function handleCommitmentInput() {
  saveCommitmentInputs();
  renderTotalMonthlyCommitments();
  emitCommitmentsChanged();
}

/* ========================================
   STATE
======================================== */

function saveCommitmentInputs() {
  updateCommitments({
    insurancePremiums: getInputWholeNumber(generalInsurancePremiumInput),
  });
}

/* ========================================
   INPUT SYNCHRONISATION
======================================== */

function syncCommitmentInputs() {
  const commitments = getCommitments();

  setInputValue(generalInsurancePremiumInput, commitments.insurancePremiums);
}

function setInputValue(input, value) {
  if (!input) {
    return;
  }

  const amount = Number(value) || 0;

  input.value = amount > 0 ? String(amount) : "";
}

/* ========================================
   CALCULATIONS
======================================== */

function calculateMonthlyLiabilityRepayments() {
  return getLiabilities().reduce(function (runningTotal, liability) {
    return runningTotal + getValidAmount(liability?.monthlyRepayment);
  }, 0);
}

function calculateTotalMonthlyCommitments() {
  const commitments = getCommitments();

  return (
    getValidAmount(commitments.insurancePremiums) +
    calculateMonthlyLiabilityRepayments()
  );
}

function getValidAmount(value) {
  const amount = Number(value);

  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

/* ========================================
   RENDERING
======================================== */

function renderTotalMonthlyCommitments() {
  if (!totalMonthlyCommitmentsElement) {
    return;
  }

  totalMonthlyCommitmentsElement.textContent = formatCurrency(
    calculateTotalMonthlyCommitments(),
  );
}

/* ========================================
   EVENTS
======================================== */

function emitCommitmentsChanged() {
  emit(EVENTS.COMMITMENTS_CHANGED, {
    commitments: {
      ...getCommitments(),
    },

    totalMonthlyCommitments: calculateTotalMonthlyCommitments(),
  });
}

/* ========================================
   FACTORY
======================================== */

function createEmptyCommitments() {
  return {
    insurancePremiums: 0,
  };
}
