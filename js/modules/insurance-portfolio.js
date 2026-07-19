"use strict";

import { clientPlan } from "../state/client-plan.js";

import {
    openModal,
    closeModal,
    closeModalOnOverlayClick,
    closeModalOnEscape,
} from "../utils/modal.js";

let moduleInitialized = false;
let elements = {};

const BENEFIT_TYPES = [
    "death",
    "tpd",
    "critical_illness",
    "early_critical_illness",
    "hospitalisation",
    "hospital_cash",
    "personal_accident",
    "disability_income",
];

const policyLists = {};
const emptyMessages = {};

export function initializeInsurancePortfolio() {
    cacheInsuranceElements();

    if (!moduleInitialized) {
        bindInsuranceEvents();
        moduleInitialized = true;
    }

    renderInsurancePortfolio();
}

export function resetInsurancePortfolio() {
    clientPlan.priorities.policies = [];
    renderInsurancePortfolio();
}

function cacheInsuranceElements() {
    policyLists.life =
        document.getElementById("lifePolicyList");

    policyLists.critical_illness =
        document.getElementById("criticalIllnessPolicyList");

    policyLists.hospitalisation =
        document.getElementById("hospitalisationPolicyList");

    policyLists.personal_accident =
        document.getElementById("personalAccidentPolicyList");

    policyLists.disability_income =
        document.getElementById("disabilityIncomePolicyList");

    emptyMessages.life =
        document.getElementById("emptyLifePolicyMessage");

    emptyMessages.critical_illness =
        document.getElementById(
            "emptyCriticalIllnessPolicyMessage"
        );

    emptyMessages.hospitalisation =
        document.getElementById(
            "emptyHospitalisationPolicyMessage"
        );

    emptyMessages.personal_accident =
        document.getElementById(
            "emptyPersonalAccidentPolicyMessage"
        );

    emptyMessages.disability_income =
        document.getElementById(
            "emptyDisabilityIncomePolicyMessage"
        );

    elements.policyModal =
        document.getElementById("policyModal");

    elements.policyModalTitle =
        document.getElementById("policyModalTitle");

    elements.closePolicyModalButton =
        document.getElementById("closePolicyModalButton");

    elements.cancelPolicyButton =
        document.getElementById("cancelPolicyButton");

    elements.savePolicyButton =
        document.getElementById("savePolicyButton");
}

function bindInsuranceEvents() {

    elements.addPolicyButton?.addEventListener(
        "click",
        () => {

            openPolicyModal();

        },
    );

    elements.closePolicyModalButton?.addEventListener(
        "click",
        closePolicyModal,
    );

    elements.cancelPolicyButton?.addEventListener(
        "click",
        closePolicyModal,
    );

    closeModalOnOverlayClick(
        elements.policyModal,
    );

    closeModalOnEscape(
        elements.policyModal,
    );

}

function renderInsurancePortfolio() {

    renderPolicies();

}

function createPolicyElement(policy) {
    const item = document.createElement("article");
    item.className = "planning-item";

    item.innerHTML = `
        <div class="planning-item-main">
            <div class="planning-item-details">
                <h4>${escapeHtml(policy.policyName)}</h4>

                <p>
                    ${escapeHtml(policy.insurer)}
                </p>
            </div>
        </div>
    `;

    return item;
}

function openPolicyModal() {

    elements.policyModalTitle.textContent =
        "Add Policy";

    openModal(
        elements.policyModal,
    );

}

function closePolicyModal() {
    closeModal(elements.policyModal);

    delete elements.policyModal.dataset.policyType;
}

function getPolicyTypeLabel(policyType) {
    const labels = {
        life: "Life Insurance",
        critical_illness: "Critical Illness",
        hospitalisation: "Hospitalisation",
        personal_accident: "Personal Accident",
        disability_income: "Disability Income",
    };

    return labels[policyType] ?? "Insurance";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}