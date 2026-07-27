"use strict";

import {
  getCommitments,
  getLiabilities,
  updateCommitments,
} from "../state/client-plan.js";

import { formatCurrency, getInputWholeNumber } from "../utils/client-utils.js";

import { emit, on } from "../events/event-bus.js";

import { EVENTS } from "../events/events.js";

import {
  COMMITMENT_FIELDS,
  createEmptyCommitments,
} from "./commitments/commitment-config.js";

import {
  calculateTotalMonthlyCommitments,
  calculateTotalMonthlyCpfCommitments,
} from "./commitments/commitment-calculator.js";

/* ========================================
   COMMITMENT ELEMENTS
======================================== */

const commitmentElements = createCommitmentElementMap();

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
    renderCommitments();

    return;
  }

  attachCommitmentListeners();
  attachApplicationListeners();

  syncCommitmentInputs();
  renderCommitments();

  moduleInitialized = true;
}

/* ========================================
   PUBLIC RENDER
======================================== */

export function renderCommitments() {
  renderTotalMonthlyCommitments();
}

/* ========================================
   RESET
======================================== */

export function resetCommitments() {
  updateCommitments(createEmptyCommitments());

  syncCommitmentInputs();
  renderCommitments();

  emitCommitmentsChanged();
}

/* ========================================
   EVENT LISTENERS
======================================== */

function attachCommitmentListeners() {
  COMMITMENT_FIELDS.forEach(function (field) {
    const input = commitmentElements[field.key];

    input?.addEventListener("input", handleCommitmentInput);
  });
}

function attachApplicationListeners() {
  on(EVENTS.LIABILITIES_CHANGED, handleLiabilitiesChanged);
}

function handleCommitmentInput() {
  saveCommitmentInputs();
  renderCommitments();
  emitCommitmentsChanged();
}

function handleLiabilitiesChanged() {
  renderCommitments();
  emitCommitmentsChanged();
}

/* ========================================
   STATE
======================================== */

function saveCommitmentInputs() {
  const commitments = COMMITMENT_FIELDS.reduce(function (
    updatedCommitments,
    field,
  ) {
    updatedCommitments[field.key] = getInputWholeNumber(
      commitmentElements[field.key],
    );

    return updatedCommitments;
  }, {});

  updateCommitments(commitments);
}

/* ========================================
   INPUT SYNCHRONISATION
======================================== */

function syncCommitmentInputs() {
  const commitments = getCommitments();

  COMMITMENT_FIELDS.forEach(function (field) {
    setInputValue(commitmentElements[field.key], commitments[field.key]);
  });
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

function getTotalMonthlyCommitments() {
  return calculateTotalMonthlyCommitments({
    commitments: getCommitments(),

    liabilities: getLiabilities(),
  });
}

function getTotalMonthlyCpfCommitments() {
  return calculateTotalMonthlyCpfCommitments({
    liabilities: getLiabilities(),
  });
}

/* ========================================
   RENDERING
======================================== */

function renderTotalMonthlyCommitments() {
  if (!totalMonthlyCommitmentsElement) {
    return;
  }

  const cashCommitments = getTotalMonthlyCommitments();

  const cpfCommitments = getTotalMonthlyCpfCommitments();

  totalMonthlyCommitmentsElement.textContent = formatCommitmentTotal({
    cashCommitments,
    cpfCommitments,
  });
}

function formatCommitmentTotal({ cashCommitments, cpfCommitments }) {
  const formattedCashCommitments = formatCurrency(cashCommitments);

  if (cpfCommitments <= 0) {
    return formattedCashCommitments;
  }

  return (
    `${formattedCashCommitments} ` + `(+${formatCurrency(cpfCommitments)} CPF)`
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

    totalMonthlyCommitments: getTotalMonthlyCommitments(),

    totalMonthlyCpfCommitments: getTotalMonthlyCpfCommitments(),
  });
}

/* ========================================
   ELEMENT FACTORY
======================================== */

function createCommitmentElementMap() {
  return COMMITMENT_FIELDS.reduce(function (elements, field) {
    elements[field.key] = document.getElementById(field.elementId);

    return elements;
  }, {});
}