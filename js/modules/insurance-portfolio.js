"use strict";

import {
    clientPlan,
} from "../state/client-plan.js";

import {
    openModal,
    closeModal,
    closeModalOnOverlayClick,
    closeModalOnEscape,
} from "../utils/modal.js";


/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

let elements = {};


/* ========================================
   INITIALIZATION
======================================== */

export function initializeInsurancePortfolio() {
    cacheInsuranceElements();

    if (!moduleInitialized) {
        bindInsuranceEvents();

        moduleInitialized = true;
    }

    renderInsurancePortfolio();
}


/* ========================================
   RESET
======================================== */

export function resetInsurancePortfolio() {
    clientPlan.priorities.policies = [];

    closePolicyModal();

    renderInsurancePortfolio();
}


/* ========================================
   DOM ELEMENTS
======================================== */

function cacheInsuranceElements() {
    elements = {
        policyList:
            document.getElementById(
                "policyList",
            ),

        emptyPolicyMessage:
            document.getElementById(
                "emptyPolicyMessage",
            ),

        addPolicyButton:
            document.getElementById(
                "addPolicyButton",
            ),

        policyModal:
            document.getElementById(
                "policyModal",
            ),

        policyModalTitle:
            document.getElementById(
                "policyModalTitle",
            ),

        closePolicyModalButton:
            document.getElementById(
                "closePolicyModalButton",
            ),

        cancelPolicyButton:
            document.getElementById(
                "cancelPolicyButton",
            ),

        savePolicyButton:
            document.getElementById(
                "savePolicyButton",
            ),

        policyNameInput:
            document.getElementById(
                "policyNameInput",
            ),

        insurerSelect:
            document.getElementById(
                "insurerSelect",
            ),

        otherInsurerGroup:
            document.getElementById(
                "otherInsurerGroup",
            ),

        otherInsurerInput:
            document.getElementById(
                "otherInsurerInput",
            ),

        policyOwnerInput:
            document.getElementById(
                "policyOwnerInput",
            ),

        lifeAssuredInput:
            document.getElementById(
                "lifeAssuredInput",
            ),

        policyStatusSelect:
            document.getElementById(
                "policyStatusSelect",
            ),

        premiumInput:
            document.getElementById(
                "premiumInput",
            ),

        premiumFrequencySelect:
            document.getElementById(
                "premiumFrequencySelect",
            ),
    };
}

function toggleOtherInsurer() {

    const showOther =
        elements.insurerSelect.value ===
        "other";

    elements.otherInsurerGroup.hidden =
        !showOther;

    if (!showOther) {

        elements.otherInsurerInput.value = "";

    }

}

function resetPolicyForm() {

    elements.policyNameInput.value = "";

    elements.insurerSelect.value = "";

    elements.otherInsurerInput.value = "";

    elements.policyOwnerInput.value = "";

    elements.lifeAssuredInput.value = "";

    elements.policyStatusSelect.value = "";

    elements.premiumInput.value = "";

    elements.premiumFrequencySelect.value =
        "annual";

}


/* ========================================
   EVENTS
======================================== */

function bindInsuranceEvents() {
    elements.addPolicyButton?.addEventListener(
        "click",
        openAddPolicyModal,
    );

    elements.closePolicyModalButton?.addEventListener(
        "click",
        closePolicyModal,
    );

    elements.cancelPolicyButton?.addEventListener(
        "click",
        closePolicyModal,
    );

    elements.insurerSelect?.addEventListener(
        "change",
        toggleOtherInsurer,
    );

    closeModalOnOverlayClick(
        elements.policyModal,
    );

    closeModalOnEscape(
        elements.policyModal,
    );
    
}


/* ========================================
   MODAL
======================================== */

function openAddPolicyModal() {
    if (elements.policyModalTitle) {
        elements.policyModalTitle.textContent =
            "Add Policy";
    }

    resetPolicyForm();

    toggleOtherInsurer();

    openModal(
        elements.policyModal,
    );
    
}


function closePolicyModal() {
    closeModal(
        elements.policyModal,
    );
}


/* ========================================
   RENDERING
======================================== */

function renderInsurancePortfolio() {
    renderPolicies();
}


function renderPolicies() {
    if (!elements.policyList) {
        return;
    }

    const policies =
        clientPlan.priorities.policies;

    elements.policyList.innerHTML = "";

    if (policies.length === 0) {
        renderEmptyState();

        return;
    }

    policies.forEach(function (policy) {
        const policyElement =
            createPolicyElement(policy);

        elements.policyList.appendChild(
            policyElement,
        );
    });
}


function renderEmptyState() {
    const emptyMessage =
        document.createElement("p");

    emptyMessage.id =
        "emptyPolicyMessage";

    emptyMessage.className =
        "empty-state-message";

    emptyMessage.textContent =
        "No policies added yet.";

    elements.emptyPolicyMessage =
        emptyMessage;

    elements.policyList.appendChild(
        emptyMessage,
    );
}


function createPolicyElement(policy) {
    const item =
        document.createElement("article");

    item.className =
        "planning-item";

    const policyName =
        escapeHtml(
            policy.policyName ||
            "Unnamed Policy",
        );

    const insurer =
        escapeHtml(
            policy.insurer ||
            "Insurer not specified",
        );

    item.innerHTML = `
        <div class="planning-item-main">
            <div class="planning-item-icon">
                <i class="fa-solid fa-shield-heart"></i>
            </div>

            <div class="planning-item-details">
                <h4>${policyName}</h4>
                <p>${insurer}</p>
            </div>
        </div>

        <div class="planning-item-actions">
            <button
                type="button"
                class="planning-item-button"
                data-policy-action="edit"
                data-policy-id="${escapeHtml(policy.id)}"
            >
                <i class="fa-solid fa-pen"></i>
                Edit
            </button>

            <button
                type="button"
                class="planning-item-button planning-item-button-danger"
                data-policy-action="delete"
                data-policy-id="${escapeHtml(policy.id)}"
            >
                <i class="fa-solid fa-trash"></i>
                Delete
            </button>
        </div>
    `;

    return item;
}


/* ========================================
   SECURITY
======================================== */

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}