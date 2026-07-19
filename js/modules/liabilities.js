"use strict";

import {
    clientPlan,
} from "../state/client-plan.js";

import {
    emit,
} from "../events/event-bus.js";

import {
    EVENTS,
} from "../events/events.js";

import {
    createUniqueId,
    formatCurrency,
    getWholeNumber,
} from "../utils/client-utils.js";


/* ========================================
   DOM REFERENCES
======================================== */

const addLiabilityButton =
    document.getElementById(
        "addLiabilityButton",
    );

const emptyLiabilityMessage =
    document.getElementById(
        "emptyLiabilityMessage",
    );

const totalLiabilitiesValueElement =
    document.getElementById(
        "totalLiabilitiesValue",
    );

const liabilitiesList =
    document.getElementById(
        "liabilitiesList",
    );

const liabilityModal =
    document.getElementById(
        "liabilityModal",
    );

const liabilityForm =
    document.getElementById(
        "liabilityForm",
    );

const liabilityModalTitle =
    document.getElementById(
        "liabilityModalTitle",
    );

const editingLiabilityIdInput =
    document.getElementById(
        "editingLiabilityId",
    );

const liabilityTypeInput =
    document.getElementById(
        "liabilityType",
    );

const liabilityNameInput =
    document.getElementById(
        "liabilityName",
    );

const liabilityOutstandingBalanceInput =
    document.getElementById(
        "liabilityOutstandingBalance",
    );

const liabilityMonthlyRepaymentInput =
    document.getElementById(
        "liabilityMonthlyRepayment",
    );

const liabilityInterestRateInput =
    document.getElementById(
        "liabilityInterestRate",
    );

const liabilityFormMessage =
    document.getElementById(
        "liabilityFormMessage",
    );

const closeLiabilityModalButton =
    document.getElementById(
        "closeLiabilityModalButton",
    );

const cancelLiabilityButton =
    document.getElementById(
        "cancelLiabilityButton",
    );

const liabilityModalBackdrop =
    document.querySelector(
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
    clientPlan.priorities.liabilities = [];

    closeLiabilityModal();
    renderLiabilities();
    emitLiabilitiesChanged();
}


/* ========================================
   EVENT LISTENERS
======================================== */

function attachLiabilityListeners() {
    addLiabilityButton?.addEventListener(
        "click",
        openAddLiabilityModal,
    );

    liabilityForm?.addEventListener(
        "submit",
        handleLiabilitySubmit,
    );

    closeLiabilityModalButton?.addEventListener(
        "click",
        closeLiabilityModal,
    );

    cancelLiabilityButton?.addEventListener(
        "click",
        closeLiabilityModal,
    );

    liabilityModalBackdrop?.addEventListener(
        "click",
        closeLiabilityModal,
    );

    document.addEventListener(
        "keydown",
        handleDocumentKeydown,
    );
}


function handleDocumentKeydown(event) {
    if (
        event.key === "Escape" &&
        liabilityModal &&
        !liabilityModal.hidden
    ) {
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
        liabilityModalTitle.textContent =
            "Add Liability";
    }

    liabilityModal.hidden = false;

    document.body.classList.add(
        "liability-modal-open",
    );

    liabilityTypeInput?.focus();
}


function openEditLiabilityModal(
    liabilityId,
) {
    const liability =
        clientPlan.priorities.liabilities
            .find(function (savedLiability) {
                return (
                    savedLiability.id ===
                    liabilityId
                );
            });

    if (!liability || !liabilityModal) {
        return;
    }

    if (editingLiabilityIdInput) {
        editingLiabilityIdInput.value =
            liability.id;
    }

    if (liabilityTypeInput) {
        liabilityTypeInput.value =
            liability.type;
    }

    if (liabilityNameInput) {
        liabilityNameInput.value =
            liability.name;
    }

    if (
        liabilityOutstandingBalanceInput
    ) {
        liabilityOutstandingBalanceInput.value =
            liability.outstandingBalance;
    }

    if (liabilityMonthlyRepaymentInput) {
        liabilityMonthlyRepaymentInput.value =
            liability.monthlyRepayment;
    }

    if (liabilityInterestRateInput) {
        liabilityInterestRateInput.value =
            liability.interestRate;
    }

    clearLiabilityFormMessage();

    if (liabilityModalTitle) {
        liabilityModalTitle.textContent =
            "Edit Liability";
    }

    liabilityModal.hidden = false;

    document.body.classList.add(
        "liability-modal-open",
    );

    liabilityTypeInput?.focus();
}


function closeLiabilityModal() {
    if (!liabilityModal) {
        return;
    }

    liabilityModal.hidden = true;

    document.body.classList.remove(
        "liability-modal-open",
    );

    clearLiabilityFormMessage();
}


function clearLiabilityFormMessage() {
    if (liabilityFormMessage) {
        liabilityFormMessage.textContent =
            "";
    }
}


/* ========================================
   FORM SUBMISSION
======================================== */

function handleLiabilitySubmit(event) {
    event.preventDefault();

    const liabilityType =
        liabilityTypeInput?.value || "";

    const liabilityName =
        liabilityNameInput?.value.trim() ||
        "";

    const outstandingBalance =
        getWholeNumber(
            liabilityOutstandingBalanceInput
                ?.value,
        );

    const monthlyRepayment =
        getWholeNumber(
            liabilityMonthlyRepaymentInput
                ?.value,
        );

    const interestRate =
        Number(
            liabilityInterestRateInput
                ?.value,
        ) || 0;

    const editingLiabilityId =
        editingLiabilityIdInput?.value ||
        "";

    clearLiabilityFormMessage();

    const validationResult =
        validateLiability({
            liabilityType,
            liabilityName,
            outstandingBalance,
            monthlyRepayment,
            interestRate,
        });

    if (!validationResult.isValid) {
        showLiabilityFormMessage(
            validationResult.message,
        );

        validationResult.element?.focus();

        return;
    }

    if (editingLiabilityId) {
        updateLiability({
            liabilityId:
                editingLiabilityId,
            liabilityType,
            liabilityName,
            outstandingBalance,
            monthlyRepayment,
            interestRate,
        });
    } else {
        addLiability({
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
            message:
                "Please select a liability type.",
            element: liabilityTypeInput,
        };
    }

    if (!liabilityName) {
        return {
            isValid: false,
            message:
                "Please enter a liability name.",
            element: liabilityNameInput,
        };
    }

    if (outstandingBalance <= 0) {
        return {
            isValid: false,
            message:
                "Please enter the outstanding balance.",
            element:
                liabilityOutstandingBalanceInput,
        };
    }

    if (monthlyRepayment < 0) {
        return {
            isValid: false,
            message:
                "Monthly repayment cannot be negative.",
            element:
                liabilityMonthlyRepaymentInput,
        };
    }

    if (
        interestRate < 0 ||
        interestRate > 100
    ) {
        return {
            isValid: false,
            message:
                "Interest rate must be between 0% and 100%.",
            element:
                liabilityInterestRateInput,
        };
    }

    return {
        isValid: true,
    };
}


function showLiabilityFormMessage(message) {
    if (liabilityFormMessage) {
        liabilityFormMessage.textContent =
            message;
    }
}


/* ========================================
   LIABILITY DATA
======================================== */

function addLiability({
    liabilityType,
    liabilityName,
    outstandingBalance,
    monthlyRepayment,
    interestRate,
}) {
    clientPlan.priorities.liabilities.push({
        id: createUniqueId(),
        type: liabilityType,
        name: liabilityName,
        outstandingBalance,
        monthlyRepayment,
        interestRate,
    });
}


function updateLiability({
    liabilityId,
    liabilityType,
    liabilityName,
    outstandingBalance,
    monthlyRepayment,
    interestRate,
}) {
    const liability =
        clientPlan.priorities.liabilities
            .find(function (
                savedLiability,
            ) {
                return (
                    savedLiability.id ===
                    liabilityId
                );
            });

    if (!liability) {
        return;
    }

    liability.type = liabilityType;
    liability.name = liabilityName;
    liability.outstandingBalance =
        outstandingBalance;
    liability.monthlyRepayment =
        monthlyRepayment;
    liability.interestRate =
        interestRate;
}


function deleteLiability(liabilityId) {
    const shouldDelete =
        window.confirm(
            "Delete this liability?",
        );

    if (!shouldDelete) {
        return;
    }

    clientPlan.priorities.liabilities =
        clientPlan.priorities.liabilities
            .filter(function (liability) {
                return (
                    liability.id !==
                    liabilityId
                );
            });

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

    const liabilities =
        clientPlan.priorities.liabilities;

    liabilitiesList.innerHTML = "";

    liabilities.forEach(
        function (liability) {
            liabilitiesList.appendChild(
                createLiabilityItem(
                    liability,
                ),
            );
        },
    );

    if (
        liabilities.length === 0 &&
        emptyLiabilityMessage
    ) {
        liabilitiesList.appendChild(
            emptyLiabilityMessage,
        );
    }

    renderTotalLiabilities();
}


function createLiabilityItem(liability) {
    const liabilityItem =
        document.createElement("div");

    liabilityItem.className =
        "planning-item";

    const liabilityMain =
        document.createElement("div");

    liabilityMain.className =
        "planning-item-main";

    const liabilityIcon =
        document.createElement("div");

    liabilityIcon.className =
        "planning-item-icon";

    liabilityIcon.innerHTML =
        getLiabilityIcon(
            liability.type,
        );

    const liabilityDetails =
        document.createElement("div");

    liabilityDetails.className =
        "planning-item-details";

    const liabilityTitle =
        document.createElement("h4");

    liabilityTitle.textContent =
        liability.name;

    const liabilityDescription =
        document.createElement("p");

    liabilityDescription.textContent =
        createLiabilityDescription(
            liability,
        );

    liabilityDetails.append(
        liabilityTitle,
        liabilityDescription,
    );

    liabilityMain.append(
        liabilityIcon,
        liabilityDetails,
    );

    const liabilityActions =
        document.createElement("div");

    liabilityActions.className =
        "planning-item-actions";

    liabilityActions.append(
        createEditButton(liability),
        createDeleteButton(liability),
    );

    liabilityItem.append(
        liabilityMain,
        liabilityActions,
    );

    return liabilityItem;
}


function createEditButton(liability) {
    const editButton =
        document.createElement("button");

    editButton.type = "button";

    editButton.className =
        "planning-item-button";

    editButton.setAttribute(
        "aria-label",
        `Edit ${liability.name}`,
    );

    editButton.innerHTML =
        '<i class="fa-solid fa-pen"></i>';

    editButton.addEventListener(
        "click",
        function () {
            openEditLiabilityModal(
                liability.id,
            );
        },
    );

    return editButton;
}


function createDeleteButton(liability) {
    const deleteButton =
        document.createElement("button");

    deleteButton.type = "button";

    deleteButton.className =
        "planning-item-button delete";

    deleteButton.setAttribute(
        "aria-label",
        `Delete ${liability.name}`,
    );

    deleteButton.innerHTML =
        '<i class="fa-solid fa-trash"></i>';

    deleteButton.addEventListener(
        "click",
        function () {
            deleteLiability(
                liability.id,
            );
        },
    );

    return deleteButton;
}


function renderTotalLiabilities() {
    if (!totalLiabilitiesValueElement) {
        return;
    }

    const total =
        clientPlan.priorities.liabilities
            .reduce(function (
                runningTotal,
                liability,
            ) {
                return (
                    runningTotal +
                    getWholeNumber(
                        liability
                            .outstandingBalance,
                    )
                );
            }, 0);

    totalLiabilitiesValueElement
        .textContent =
        formatCurrency(total);
}


/* ========================================
   DISPLAY HELPERS
======================================== */

function createLiabilityDescription(
    liability,
) {
    const parts = [
        getLiabilityTypeLabel(
            liability.type,
        ),
        `${formatCurrency(
            liability.outstandingBalance,
        )} outstanding`,
    ];

    if (liability.monthlyRepayment > 0) {
        parts.push(
            `${formatCurrency(
                liability.monthlyRepayment,
            )} monthly`,
        );
    }

    if (liability.interestRate > 0) {
        parts.push(
            `${liability.interestRate}% interest`,
        );
    }

    return parts.join(" · ");
}


function getLiabilityTypeLabel(type) {
    const labels = {
        mortgage: "Mortgage",
        car_loan: "Car Loan",
        personal_loan: "Personal Loan",
        education_loan:
            "Education Loan",
        credit_card: "Credit Card",
        business_loan:
            "Business Loan",
        other: "Other Liability",
    };

    return labels[type] || "Liability";
}


function getLiabilityIcon(type) {
    const icons = {
        mortgage:
            "fa-solid fa-house",
        car_loan:
            "fa-solid fa-car",
        personal_loan:
            "fa-solid fa-money-bill-wave",
        education_loan:
            "fa-solid fa-graduation-cap",
        credit_card:
            "fa-solid fa-credit-card",
        business_loan:
            "fa-solid fa-briefcase",
        other:
            "fa-solid fa-file-invoice-dollar",
    };

    const iconClass =
        icons[type] || icons.other;

    return `
        <i
            class="${iconClass}"
            aria-hidden="true"
        ></i>
    `;
}


/* ========================================
   EVENTS
======================================== */

function emitLiabilitiesChanged() {
    emit(
        EVENTS.LIABILITIES_CHANGED,
        {
            liabilities: [
                ...clientPlan.priorities
                    .liabilities,
            ],
        },
    );
}