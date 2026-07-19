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

const POLICY_TYPES = [
    "life",
    "critical_illness",
    "hospitalisation",
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
    document
        .querySelectorAll("[data-policy-type]")
        .forEach((button) => {
            button.addEventListener("click", () => {
                const policyType =
                    button.dataset.policyType;

                openPolicyModal(policyType);
            });
        });
}

function renderInsurancePortfolio() {
    POLICY_TYPES.forEach((policyType) => {
        renderPolicyType(policyType);
    });
}

function renderPolicyType(policyType) {
    const list = policyLists[policyType];
    const emptyMessage = emptyMessages[policyType];

    if (!list || !emptyMessage) {
        return;
    }

    const policies =
        clientPlan.priorities.policies.filter(
            (policy) => policy.type === policyType
        );

    list
        .querySelectorAll(".planning-item")
        .forEach((item) => item.remove());

    emptyMessage.hidden = policies.length > 0;

    policies.forEach((policy) => {
        list.appendChild(createPolicyElement(policy));
    });
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

function openPolicyModal(policyType) {
    console.log("Open policy modal:", policyType);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}