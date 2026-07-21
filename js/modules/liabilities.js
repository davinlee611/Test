"use strict";

import { emit } from "../events/event-bus.js";

import { EVENTS } from "../events/events.js";

import { formatCurrency, getWholeNumber } from "../utils/client-utils.js";

import {
  getAllLiabilities,
  getLiabilityById,
  createLiability,
  updateLiability,
  removeLiability,
  clearLiabilities,
} from "../services/liability-service.js";

import {
  createPlanningCard,
  createPlanningCardIcon,
  createPlanningCardDetails,
  createPlanningCardActions,
  createPlanningCardButton,
  renderPlanningEmptyState,
} from "../components/planning-card.js";

/* ========================================
   DOM REFERENCES
======================================== */

const addLiabilityButton = document.getElementById("addLiabilityButton");

const emptyLiabilityMessage = document.getElementById("emptyLiabilityMessage");

const totalLiabilitiesValueElement = document.getElementById(
  "totalLiabilitiesValue",
);

const liabilitiesList = document.getElementById("liabilitiesList");

const liabilityModal = document.getElementById("liabilityModal");

const liabilityForm = document.getElementById("liabilityForm");

const liabilityModalTitle = document.getElementById("liabilityModalTitle");

const editingLiabilityIdInput = document.getElementById("editingLiabilityId");

const liabilityTypeInput = document.getElementById("liabilityType");

const liabilityNameInput = document.getElementById("liabilityName");

const liabilityOutstandingBalanceInput = document.getElementById(
  "liabilityOutstandingBalance",
);

const liabilityMonthlyRepaymentInput = document.getElementById(
  "liabilityMonthlyRepayment",
);

const liabilityInterestRateInput = document.getElementById(
  "liabilityInterestRate",
);

const liabilityFormMessage = document.getElementById("liabilityFormMessage");

const closeLiabilityModalButton = document.getElementById(
  "closeLiabilityModalButton",
);

const cancelLiabilityButton = document.getElementById("cancelLiabilityButton");

const liabilityModalBackdrop = document.querySelector(
  "[data-close-liability-modal]",
);

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

/* ========================================
   INITIALIZATION
======================================== */

export function initializeLiabilities() {
  if (moduleInitialized) {
    renderLiabilities();
    return;
  }

  attachLiabilityListeners();
  renderLiabilities();

  moduleInitialized = true;
}

/* ========================================
   RESET
======================================== */

export function resetLiabilities() {
  clearLiabilities();

  closeLiabilityModal();
  renderLiabilities();
  emitLiabilitiesChanged();
}

/* ========================================
   EVENT LISTENERS
======================================== */

function attachLiabilityListeners() {
  addLiabilityButton?.addEventListener("click", openAddLiabilityModal);

  liabilityForm?.addEventListener("submit", handleLiabilitySubmit);

  closeLiabilityModalButton?.addEventListener("click", closeLiabilityModal);

  cancelLiabilityButton?.addEventListener("click", closeLiabilityModal);

  liabilityModalBackdrop?.addEventListener("click", closeLiabilityModal);

  document.addEventListener("keydown", handleDocumentKeydown);
}

function handleDocumentKeydown(event) {
  if (event.key === "Escape" && liabilityModal && !liabilityModal.hidden) {
    closeLiabilityModal();
  }
}

/* ========================================
   MODAL
======================================== */

function openAddLiabilityModal() {
  if (!liabilityModal || !liabilityForm) {
    return;
  }

  liabilityForm.reset();

  if (editingLiabilityIdInput) {
    editingLiabilityIdInput.value = "";
  }

  clearLiabilityFormMessage();

  if (liabilityModalTitle) {
    liabilityModalTitle.textContent = "Add Liability";
  }

  liabilityModal.hidden = false;

  document.body.classList.add("liability-modal-open");

  liabilityTypeInput?.focus();
}

function openEditLiabilityModal(liabilityId) {
  const liability = getLiabilityById(liabilityId);

  if (!liability || !liabilityModal) {
    return;
  }

  if (editingLiabilityIdInput) {
    editingLiabilityIdInput.value = liability.id;
  }

  if (liabilityTypeInput) {
    liabilityTypeInput.value = liability.type;
  }

  if (liabilityNameInput) {
    liabilityNameInput.value = liability.name;
  }

  if (liabilityOutstandingBalanceInput) {
    liabilityOutstandingBalanceInput.value = liability.outstandingBalance;
  }

  if (liabilityMonthlyRepaymentInput) {
    liabilityMonthlyRepaymentInput.value = liability.monthlyRepayment;
  }

  if (liabilityInterestRateInput) {
    liabilityInterestRateInput.value = liability.interestRate;
  }

  clearLiabilityFormMessage();

  if (liabilityModalTitle) {
    liabilityModalTitle.textContent = "Edit Liability";
  }

  liabilityModal.hidden = false;

  document.body.classList.add("liability-modal-open");

  liabilityTypeInput?.focus();
}

function closeLiabilityModal() {
  if (!liabilityModal) {
    return;
  }

  liabilityModal.hidden = true;

  document.body.classList.remove("liability-modal-open");

  clearLiabilityFormMessage();
}

function clearLiabilityFormMessage() {
  if (liabilityFormMessage) {
    liabilityFormMessage.textContent = "";
  }
}

/* ========================================
   FORM SUBMISSION
======================================== */

function handleLiabilitySubmit(event) {
  event.preventDefault();

  const liabilityType = liabilityTypeInput?.value || "";

  const liabilityName = liabilityNameInput?.value.trim() || "";

  const outstandingBalance = getWholeNumber(
    liabilityOutstandingBalanceInput?.value,
  );

  const monthlyRepayment = getWholeNumber(
    liabilityMonthlyRepaymentInput?.value,
  );

  const interestRate = Number(liabilityInterestRateInput?.value) || 0;

  const editingLiabilityId = editingLiabilityIdInput?.value || "";

  clearLiabilityFormMessage();

  const validationResult = validateLiability({
    liabilityType,
    liabilityName,
    outstandingBalance,
    monthlyRepayment,
    interestRate,
  });

  if (!validationResult.isValid) {
    showLiabilityFormMessage(validationResult.message);

    validationResult.element?.focus();

    return;
  }

  if (editingLiabilityId) {
    updateLiability(editingLiabilityId, {
      liabilityType,
      liabilityName,
      outstandingBalance,
      monthlyRepayment,
      interestRate,
    });
  } else {
    createLiability({
      liabilityType,
      liabilityName,
      outstandingBalance,
      monthlyRepayment,
      interestRate,
    });
  }

  renderLiabilities();
  closeLiabilityModal();
  emitLiabilitiesChanged();
}

function validateLiability({
  liabilityType,
  liabilityName,
  outstandingBalance,
  monthlyRepayment,
  interestRate,
}) {
  if (!liabilityType) {
    return {
      isValid: false,
      message: "Please select a liability type.",
      element: liabilityTypeInput,
    };
  }

  if (!liabilityName) {
    return {
      isValid: false,
      message: "Please enter a liability name.",
      element: liabilityNameInput,
    };
  }

  if (outstandingBalance <= 0) {
    return {
      isValid: false,
      message: "Please enter the outstanding balance.",
      element: liabilityOutstandingBalanceInput,
    };
  }

  if (monthlyRepayment < 0) {
    return {
      isValid: false,
      message: "Monthly repayment cannot be negative.",
      element: liabilityMonthlyRepaymentInput,
    };
  }

  if (interestRate < 0 || interestRate > 100) {
    return {
      isValid: false,
      message: "Interest rate must be between 0% and 100%.",
      element: liabilityInterestRateInput,
    };
  }

  return {
    isValid: true,
  };
}

function showLiabilityFormMessage(message) {
  if (liabilityFormMessage) {
    liabilityFormMessage.textContent = message;
  }
}

/* ========================================
   LIABILITY DELETION
======================================== */

function handleDeleteLiability(liabilityId) {
  const shouldDelete = window.confirm("Delete this liability?");

  if (!shouldDelete) {
    return;
  }

  const wasRemoved = removeLiability(liabilityId);

  if (!wasRemoved) {
    return;
  }

  renderLiabilities();
  emitLiabilitiesChanged();
}

/* ========================================
   RENDERING
======================================== */

export function renderLiabilities() {
  if (!liabilitiesList) {
    return;
  }

  const liabilities = getAllLiabilities();

  liabilitiesList.innerHTML = "";

  if (liabilities.length === 0) {
    renderPlanningEmptyState(
      liabilitiesList,
      "No liabilities added yet.",
      emptyLiabilityMessage,
    );

    renderTotalLiabilities();

    return;
  }

  liabilities.forEach(function (liability) {
    liabilitiesList.appendChild(createLiabilityItem(liability));
  });

  renderTotalLiabilities();
}

function createLiabilityItem(liability) {
  return createPlanningCard({
    itemClass: "liability-item",

    icon: createLiabilityIcon(liability),

    details: createLiabilityDetails(liability),

    actions: createLiabilityActions(liability),
  });
}

function createLiabilityIcon(liability) {
  return createPlanningCardIcon(getLiabilityIconClass(liability.type));
}

function createLiabilityDetails(liability) {
  return createPlanningCardDetails({
    title: liability.name,

    description: createLiabilityDescription(liability),
  });
}

function createLiabilityActions(liability) {
  const actions = createPlanningCardActions();

  actions.append(createEditButton(liability), createDeleteButton(liability));

  return actions;
}

function createEditButton(liability) {
  return createPlanningCardButton({
    iconClass: "fa-solid fa-pen",

    label: `Edit ${liability.name}`,

    onClick() {
      openEditLiabilityModal(liability.id);
    },
  });
}

function createDeleteButton(liability) {
  return createPlanningCardButton({
    iconClass: "fa-solid fa-trash",

    variant: "delete",

    label: `Delete ${liability.name}`,

    onClick() {
      handleDeleteLiability(liability.id);
    },
  });
}

function renderTotalLiabilities() {
  if (!totalLiabilitiesValueElement) {
    return;
  }

  const total = getAllLiabilities().reduce(function (runningTotal, liability) {
    return runningTotal + getWholeNumber(liability.outstandingBalance);
  }, 0);

  totalLiabilitiesValueElement.textContent = formatCurrency(total);
}

/* ========================================
   DISPLAY HELPERS
======================================== */

function createLiabilityDescription(liability) {
  const parts = [
    getLiabilityTypeLabel(liability.type),
    `${formatCurrency(liability.outstandingBalance)} outstanding`,
  ];

  if (liability.monthlyRepayment > 0) {
    parts.push(`${formatCurrency(liability.monthlyRepayment)} monthly`);
  }

  if (liability.interestRate > 0) {
    parts.push(`${liability.interestRate}% interest`);
  }

  return parts.join(" · ");
}

function getLiabilityTypeLabel(type) {
  const labels = {
    mortgage: "Mortgage",
    car_loan: "Car Loan",
    personal_loan: "Personal Loan",
    education_loan: "Education Loan",
    credit_card: "Credit Card",
    business_loan: "Business Loan",
    other: "Other Liability",
  };

  return labels[type] || "Liability";
}

function getLiabilityIconClass(type) {
  const icons = {
    mortgage: "fa-solid fa-house",
    car_loan: "fa-solid fa-car",
    personal_loan: "fa-solid fa-money-bill-wave",
    education_loan: "fa-solid fa-graduation-cap",
    credit_card: "fa-solid fa-credit-card",
    business_loan: "fa-solid fa-briefcase",
    other: "fa-solid fa-file-invoice-dollar",
  };

  return icons[type] || icons.other;
}

/* ========================================
   EVENTS
======================================== */

function emitLiabilitiesChanged() {
  emit(EVENTS.LIABILITIES_CHANGED, {
    liabilities: [...getAllLiabilities()],
  });
}
