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

let draftBenefits = [];

let editingBenefitId = null;


/* ========================================
   BENEFIT CONFIGURATION
======================================== */

const POLICY_TYPE_LABELS = {
    whole_life:
        "Whole Life",

    term:
        "Term",

    endowment:
        "Endowment",

    investment_linked:
        "Investment-Linked (ILP)",

    integrated_shield:
        "Integrated Shield Plan",

    critical_illness:
        "Standalone Critical Illness",

    personal_accident:
        "Personal Accident",

    disability_income:
        "Disability Income",

    long_term_care:
        "Long-Term Care",

    annuity:
        "Annuity",

    other:
        "Other",
};


const POLICY_STATUS_LABELS = {
    active:
        "Active",

    paid_up:
        "Paid-Up",

    lapsed:
        "Lapsed",
};


const PREMIUM_FREQUENCY_LABELS = {
    annual:
        "Annual",

    half_yearly:
        "Half-Yearly",

    quarterly:
        "Quarterly",

    monthly:
        "Monthly",

    single:
        "Single Premium",
};

const BENEFIT_LABELS = {
    death:
        "Death",

    tpd:
        "Total and Permanent Disability",

    critical_illness:
        "Critical Illness",

    early_critical_illness:
        "Early Critical Illness",

    hospitalisation:
        "Hospitalisation",

    hospital_cash:
        "Hospital Cash",

    personal_accident:
        "Personal Accident",

    disability_income:
        "Disability Income",
};


const PAYOUT_TYPE_LABELS = {
    accelerated:
        "Accelerated",

    additional:
        "Additional",

    standalone:
        "Standalone",
};


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

    draftBenefits = [];

    editingBenefitId = null;

    closePolicyModal();

    renderInsurancePortfolio();
}


/* ========================================
   CACHE ELEMENTS
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

        policyTypeSelect:
            document.getElementById(
                "policyTypeSelect",
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

        policyNumberInput:
            document.getElementById(
                "policyNumberInput",
            ),

        policyOwnerInput:
            document.getElementById(
                "policyOwnerInput",
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

        policyFormMessage:
            document.getElementById(
                "policyFormMessage",
            ),

        addBenefitButton:
            document.getElementById(
                "addBenefitButton",
            ),

        benefitEditor:
            document.getElementById(
                "benefitEditor",
            ),

        benefitEditorTitle:
            document.getElementById(
                "benefitEditorTitle",
            ),

        closeBenefitEditorButton:
            document.getElementById(
                "closeBenefitEditorButton",
            ),

        benefitTypeSelect:
            document.getElementById(
                "benefitTypeSelect",
            ),

        benefitLifeAssuredInput:
            document.getElementById(
                "benefitLifeAssuredInput",
            ),

        benefitAmountGroup:
            document.getElementById(
                "benefitAmountGroup",
            ),

        benefitAmountLabel:
            document.getElementById(
                "benefitAmountLabel",
            ),

        benefitAmountInput:
            document.getElementById(
                "benefitAmountInput",
            ),

        benefitPayoutTypeGroup:
            document.getElementById(
                "benefitPayoutTypeGroup",
            ),

        benefitPayoutTypeSelect:
            document.getElementById(
                "benefitPayoutTypeSelect",
            ),

        benefitNotesInput:
            document.getElementById(
                "benefitNotesInput",
            ),

        benefitFormMessage:
            document.getElementById(
                "benefitFormMessage",
            ),

        cancelBenefitButton:
            document.getElementById(
                "cancelBenefitButton",
            ),

        saveBenefitButton:
            document.getElementById(
                "saveBenefitButton",
            ),

        policyBenefitList:
            document.getElementById(
                "policyBenefitList",
            ),

        emptyPolicyBenefitMessage:
            document.getElementById(
                "emptyPolicyBenefitMessage",
            ),
    };
}


/* ========================================
   EVENT BINDING
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

    elements.savePolicyButton?.addEventListener(
        "click",
        savePolicy,
    );

    elements.insurerSelect?.addEventListener(
        "change",
        toggleOtherInsurer,
    );

    elements.addBenefitButton?.addEventListener(
        "click",
        openAddBenefitEditor,
    );

    elements.closeBenefitEditorButton?.addEventListener(
        "click",
        closeBenefitEditor,
    );

    elements.cancelBenefitButton?.addEventListener(
        "click",
        closeBenefitEditor,
    );

    elements.benefitTypeSelect?.addEventListener(
        "change",
        updateBenefitFields,
    );

    elements.saveBenefitButton?.addEventListener(
        "click",
        saveBenefit,
    );

    elements.policyBenefitList?.addEventListener(
        "click",
        handleBenefitListClick,
    );

    closeModalOnOverlayClick(
        elements.policyModal,
    );

    closeModalOnEscape(
        elements.policyModal,
    );
}


/* ========================================
   POLICY MODAL
======================================== */

function openAddPolicyModal() {
    resetPolicyForm();

    elements.policyModalTitle.textContent =
        "Add Policy";

    elements.policyOwnerInput.value =
        clientPlan.profile.fullName || "";

    openModal(
        elements.policyModal,
    );
}


function closePolicyModal() {
    closeBenefitEditor();

    closeModal(
        elements.policyModal,
    );
}


function resetPolicyForm() {
    elements.policyNameInput.value = "";

    elements.policyTypeSelect.value = "";

    elements.insurerSelect.value = "";

    elements.otherInsurerInput.value = "";

    elements.otherInsurerGroup.hidden = true;

    elements.policyNumberInput.value = "";

    elements.policyOwnerInput.value = "";

    elements.policyStatusSelect.value = "";

    elements.premiumInput.value = "";

    elements.premiumFrequencySelect.value =
        "annual";

    elements.policyFormMessage.textContent = "";

    draftBenefits = [];

    editingBenefitId = null;

    closeBenefitEditor();

    renderDraftBenefits();
}


function toggleOtherInsurer() {
    const showOtherInsurer =
        elements.insurerSelect.value ===
        "other";

    elements.otherInsurerGroup.hidden =
        !showOtherInsurer;

    if (!showOtherInsurer) {
        elements.otherInsurerInput.value =
            "";
    }
}

/* ========================================
   SAVE POLICY
======================================== */

function savePolicy() {
    clearPolicyFormMessage();

    const formData =
        getPolicyFormData();

    const validationMessage =
        validatePolicyForm(formData);

    if (validationMessage) {
        showPolicyFormMessage(
            validationMessage,
        );

        return;
    }

    const policy =
        createPolicyObject(formData);

    clientPlan.priorities.policies.push(
        policy,
    );

    renderInsurancePortfolio();

    closePolicyModal();
}


function getPolicyFormData() {
    const selectedInsurer =
        elements.insurerSelect.value;

    const insurer =
        selectedInsurer === "other"
            ? elements.otherInsurerInput
                .value
                .trim()
            : selectedInsurer;

    return {
        policyName:
            elements.policyNameInput
                .value
                .trim(),

        policyType:
            elements.policyTypeSelect.value,

        insurer,

        policyNumber:
            elements.policyNumberInput
                .value
                .trim(),

        policyOwner:
            elements.policyOwnerInput
                .value
                .trim(),

        status:
            elements.policyStatusSelect.value,

        premiumAmount:
            parseWholeNumber(
                elements.premiumInput.value,
            ),

        premiumFrequency:
            elements
                .premiumFrequencySelect
                .value,
    };
}


function validatePolicyForm(formData) {
    if (!formData.policyName) {
        return "Enter the policy name.";
    }

    if (!formData.policyType) {
        return "Select a policy type.";
    }

    if (!elements.insurerSelect.value) {
        return "Select an insurer.";
    }

    if (
        elements.insurerSelect.value ===
        "other" &&
        !formData.insurer
    ) {
        return "Enter the insurer name.";
    }

    if (!formData.status) {
        return "Select the policy status.";
    }

    if (
        elements.premiumInput.value !== "" &&
        formData.premiumAmount <= 0
    ) {
        return "Enter a premium greater than zero, or leave the premium blank.";
    }

    if (draftBenefits.length === 0) {
        return "Add at least one benefit to the policy.";
    }

    return "";
}


function createPolicyObject(formData) {
    return {
        id:
            createId(),

        policyName:
            formData.policyName,

        policyType:
            formData.policyType,

        insurer:
            formData.insurer,

        policyNumber:
            formData.policyNumber,

        policyOwner:
            formData.policyOwner,

        status:
            formData.status,

        premium: {
            amount:
                formData.premiumAmount,

            frequency:
                formData.premiumFrequency,
        },

        benefits:
            cloneBenefits(draftBenefits),
    };
}


function cloneBenefits(benefits) {
    return benefits.map(function (benefit) {
        return {
            ...benefit,
        };
    });
}


function showPolicyFormMessage(message) {
    elements.policyFormMessage.textContent =
        message;

    elements.policyFormMessage.scrollIntoView({
        behavior:
            "smooth",

        block:
            "nearest",
    });
}


function clearPolicyFormMessage() {
    elements.policyFormMessage.textContent =
        "";
}

/* ========================================
   BENEFIT EDITOR
======================================== */

function openAddBenefitEditor() {
    editingBenefitId = null;

    resetBenefitForm();

    elements.benefitEditorTitle.textContent =
        "Add Benefit";

    elements.saveBenefitButton.textContent =
        "Add Benefit";

    elements.benefitEditor.hidden = false;

    elements.benefitTypeSelect.focus();
}


function openEditBenefitEditor(benefitId) {
    const benefit =
        draftBenefits.find(function (item) {
            return item.id === benefitId;
        });

    if (!benefit) {
        return;
    }

    editingBenefitId = benefit.id;

    elements.benefitEditorTitle.textContent =
        "Edit Benefit";

    elements.saveBenefitButton.textContent =
        "Save Changes";

    elements.benefitTypeSelect.value =
        benefit.type;

    elements.benefitLifeAssuredInput.value =
        benefit.lifeAssured;

    elements.benefitAmountInput.value =
        benefit.amount;

    elements.benefitPayoutTypeSelect.value =
        benefit.payoutType ?? "";

    elements.benefitNotesInput.value =
        benefit.notes;

    elements.benefitFormMessage.textContent =
        "";

    updateBenefitFields();

    elements.benefitEditor.hidden = false;

    elements.benefitTypeSelect.focus();
}


function closeBenefitEditor() {
    if (!elements.benefitEditor) {
        return;
    }

    elements.benefitEditor.hidden = true;

    editingBenefitId = null;

    resetBenefitForm();
}


function resetBenefitForm() {
    if (!elements.benefitTypeSelect) {
        return;
    }

    elements.benefitTypeSelect.value = "";

    elements.benefitLifeAssuredInput.value =
        "";

    elements.benefitAmountInput.value = "";

    elements.benefitPayoutTypeSelect.value =
        "";

    elements.benefitNotesInput.value = "";

    elements.benefitFormMessage.textContent =
        "";

    updateBenefitFields();
}


function updateBenefitFields() {
    const benefitType =
        elements.benefitTypeSelect.value;

    const requiresPayoutType =
        benefitType ===
        "critical_illness" ||
        benefitType ===
        "early_critical_illness";

    elements.benefitPayoutTypeGroup.hidden =
        !requiresPayoutType;

    if (!requiresPayoutType) {
        elements.benefitPayoutTypeSelect.value =
            "";
    }

    elements.benefitAmountLabel.innerHTML =
        getBenefitAmountLabel(benefitType);
}


function getBenefitAmountLabel(benefitType) {
    switch (benefitType) {
        case "hospital_cash":
            return `
                Daily Cash Benefit
                <span class="required-label">*</span>
            `;

        case "disability_income":
            return `
                Monthly Benefit
                <span class="required-label">*</span>
            `;

        case "hospitalisation":
            return `
                Coverage Amount
                <span class="optional-label">
                    (Optional)
                </span>
            `;

        default:
            return `
                Coverage Amount
                <span class="required-label">*</span>
            `;
    }
}


/* ========================================
   SAVE BENEFIT
======================================== */

function saveBenefit() {
    const formData =
        getBenefitFormData();

    const validationMessage =
        validateBenefit(formData);

    if (validationMessage) {
        elements.benefitFormMessage.textContent =
            validationMessage;

        return;
    }

    if (editingBenefitId) {
        updateDraftBenefit(formData);
    } else {
        addDraftBenefit(formData);
    }

    renderDraftBenefits();

    closeBenefitEditor();
}


function getBenefitFormData() {
    return {
        type:
            elements.benefitTypeSelect.value,

        lifeAssured:
            elements.benefitLifeAssuredInput
                .value
                .trim(),

        amount:
            parseWholeNumber(
                elements.benefitAmountInput
                    .value,
            ),

        payoutType:
            elements.benefitPayoutTypeSelect
                .value || null,

        notes:
            elements.benefitNotesInput
                .value
                .trim(),
    };
}


function validateBenefit(formData) {
    if (!formData.type) {
        return "Select a benefit type.";
    }

    const amountIsOptional =
        formData.type ===
        "hospitalisation";

    if (
        !amountIsOptional &&
        formData.amount <= 0
    ) {
        return "Enter a coverage amount greater than zero.";
    }

    const requiresPayoutType =
        formData.type ===
        "critical_illness" ||
        formData.type ===
        "early_critical_illness";

    if (
        requiresPayoutType &&
        !formData.payoutType
    ) {
        return "Select whether the payout is accelerated, additional or standalone.";
    }

    return "";
}


function addDraftBenefit(formData) {
    draftBenefits.push({
        id:
            createId(),

        type:
            formData.type,

        lifeAssured:
            formData.lifeAssured,

        amount:
            formData.amount,

        payoutType:
            formData.payoutType,

        notes:
            formData.notes,
    });
}


function updateDraftBenefit(formData) {
    const benefitIndex =
        draftBenefits.findIndex(
            function (benefit) {
                return (
                    benefit.id ===
                    editingBenefitId
                );
            },
        );

    if (benefitIndex === -1) {
        return;
    }

    draftBenefits[benefitIndex] = {
        ...draftBenefits[benefitIndex],

        type:
            formData.type,

        lifeAssured:
            formData.lifeAssured,

        amount:
            formData.amount,

        payoutType:
            formData.payoutType,

        notes:
            formData.notes,
    };
}


/* ========================================
   BENEFIT ACTIONS
======================================== */

function handleBenefitListClick(event) {
    const actionButton =
        event.target.closest(
            "[data-benefit-action]",
        );

    if (!actionButton) {
        return;
    }

    const benefitId =
        actionButton.dataset.benefitId;

    const action =
        actionButton.dataset.benefitAction;

    if (action === "edit") {
        openEditBenefitEditor(benefitId);

        return;
    }

    if (action === "delete") {
        deleteDraftBenefit(benefitId);
    }
}


function deleteDraftBenefit(benefitId) {
    draftBenefits =
        draftBenefits.filter(
            function (benefit) {
                return (
                    benefit.id !== benefitId
                );
            },
        );

    if (editingBenefitId === benefitId) {
        closeBenefitEditor();
    }

    renderDraftBenefits();
}


/* ========================================
   DRAFT BENEFIT RENDERING
======================================== */

function renderDraftBenefits() {
    if (!elements.policyBenefitList) {
        return;
    }

    elements.policyBenefitList.innerHTML =
        "";

    if (draftBenefits.length === 0) {
        renderEmptyBenefitMessage();

        return;
    }

    draftBenefits.forEach(function (benefit) {
        elements.policyBenefitList.appendChild(
            createBenefitElement(benefit),
        );
    });
}


function renderEmptyBenefitMessage() {
    const message =
        document.createElement("p");

    message.id =
        "emptyPolicyBenefitMessage";

    message.className =
        "empty-state-message";

    message.textContent =
        "No benefits added yet.";

    elements.emptyPolicyBenefitMessage =
        message;

    elements.policyBenefitList.appendChild(
        message,
    );
}


function createBenefitElement(benefit) {
    const item =
        document.createElement("article");

    item.className =
        "planning-item benefit-item";

    const benefitLabel =
        BENEFIT_LABELS[benefit.type] ??
        "Insurance Benefit";

    const amountLabel =
        getBenefitAmountDescription(
            benefit,
        );

    const payoutLabel =
        benefit.payoutType
            ? PAYOUT_TYPE_LABELS[
            benefit.payoutType
            ]
            : "";

    const lifeAssuredText =
        benefit.lifeAssured
            ? `
                <span>
                    Life Assured:
                    ${escapeHtml(
                benefit.lifeAssured,
            )}
                </span>
            `
            : "";

    const payoutText =
        payoutLabel
            ? `
                <span>
                    ${escapeHtml(payoutLabel)}
                </span>
            `
            : "";

    item.innerHTML = `
        <div class="planning-item-main">

            <div class="planning-item-icon">
                <i class="fa-solid fa-shield-heart"></i>
            </div>

            <div class="planning-item-details">

                <h4>
                    ${escapeHtml(benefitLabel)}
                </h4>

                <p>
                    ${escapeHtml(amountLabel)}
                </p>

                <div class="benefit-item-meta">
                    ${lifeAssuredText}
                    ${payoutText}
                </div>

            </div>

        </div>

        <div class="planning-item-actions">

            <button
                type="button"
                class="planning-item-button"
                data-benefit-action="edit"
                data-benefit-id="${escapeHtml(
        benefit.id,
    )}"
            >
                <i class="fa-solid fa-pen"></i>
                Edit
            </button>

            <button
                type="button"
                class="planning-item-button planning-item-button-danger"
                data-benefit-action="delete"
                data-benefit-id="${escapeHtml(
        benefit.id,
    )}"
            >
                <i class="fa-solid fa-trash"></i>
                Delete
            </button>

        </div>
    `;

    return item;
}


function getBenefitAmountDescription(benefit) {
    if (
        benefit.type === "hospitalisation" &&
        benefit.amount <= 0
    ) {
        return "Hospitalisation coverage";
    }

    const formattedAmount =
        formatCurrency(benefit.amount);

    switch (benefit.type) {
        case "hospital_cash":
            return `${formattedAmount} per day`;

        case "disability_income":
            return `${formattedAmount} per month`;

        default:
            return formattedAmount;
    }
}

function createBenefitBadge(
    benefit,
) {

    if (
        benefit.type ===
        "critical_illness"
    ) {

        if (
            benefit.payoutType ===
            "accelerated"
        ) {

            return `
                <span class="benefit-badge badge-accelerated">
                    Accelerated
                </span>
            `;
        }

        if (
            benefit.payoutType ===
            "additional"
        ) {

            return `
                <span class="benefit-badge badge-additional">
                    Additional
                </span>
            `;
        }

        return `
            <span class="benefit-badge badge-standalone">
                Standalone
            </span>
        `;
    }

    if (
        benefit.type ===
        "early_critical_illness"
    ) {

        return `
            <span class="benefit-badge badge-eci">
                Early CI
            </span>
        `;
    }

    return "";
}


/* ========================================
   POLICY LIST RENDERING
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
        renderEmptyPolicyMessage();

        return;
    }

    policies.forEach(function (policy) {
        elements.policyList.appendChild(
            createPolicyElement(policy),
        );
    });
}


function renderEmptyPolicyMessage() {
    const message =
        document.createElement("p");

    message.id =
        "emptyPolicyMessage";

    message.className =
        "empty-state-message";

    message.textContent =
        "No policies added yet.";

    elements.emptyPolicyMessage =
        message;

    elements.policyList.appendChild(
        message,
    );
}


function createPolicyElement(policy) {
    const item =
        document.createElement("article");

    item.className =
        "planning-item policy-item";

    const policyName =
        policy.policyName ||
        "Unnamed Policy";

    const policyType =
        POLICY_TYPE_LABELS[
        policy.policyType
        ] ||
        "Other";

    const insurer =
        policy.insurer ||
        "Insurer not specified";

    const status =
        POLICY_STATUS_LABELS[
        policy.status
        ] ||
        "Status not specified";

    const premiumDescription =
        getPremiumDescription(
            policy.premium,
        );

    const benefitCount =
        Array.isArray(policy.benefits)
            ? policy.benefits.length
            : 0;

    const benefitText =
        benefitCount === 1
            ? "1 benefit"
            : `${benefitCount} benefits`;

    const policyNumberText =
        policy.policyNumber
            ? `
                <span>
                    Policy No:
                    ${escapeHtml(
                policy.policyNumber,
            )}
                </span>
            `
            : "";

    const policyOwnerText =
        policy.policyOwner
            ? `
                <span>
                    Owner:
                    ${escapeHtml(
                policy.policyOwner,
            )}
                </span>
            `
            : "";

    item.innerHTML = `
        <div class="planning-item-main">

            <div class="planning-item-icon">
                <i class="fa-solid fa-shield-halved"></i>
            </div>

            <div class="planning-item-details">

                <h4>
                    ${escapeHtml(policyName)}
                </h4>

                <p>
                    ${escapeHtml(insurer)}
                    ·
                    ${escapeHtml(policyType)}
                </p>

                <div class="benefit-item-meta">

                    <span>
                        ${escapeHtml(status)}
                    </span>

                    <span>
                        ${escapeHtml(
        premiumDescription,
    )}
                    </span>

                    <span>
                        ${escapeHtml(
        benefitText,
    )}
                    </span>

                    ${policyNumberText}

                    ${policyOwnerText}

                </div>

            </div>

        </div>
    `;

    return item;
}


/* ========================================
   HELPERS
======================================== */

function getPremiumDescription(premium) {
    if (
        !premium ||
        premium.amount <= 0
    ) {
        return "Premium not provided";
    }

    const frequencyLabel =
        PREMIUM_FREQUENCY_LABELS[
        premium.frequency
        ] ||
        "Premium";

    return [
        formatCurrency(
            premium.amount,
        ),

        frequencyLabel,
    ].join(" · ");
}

function createId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID ===
        "function"
    ) {
        return crypto.randomUUID();
    }

    return [
        Date.now(),
        Math.random()
            .toString(16)
            .slice(2),
    ].join("-");
}


function parseWholeNumber(value) {
    const parsedValue =
        Number.parseInt(value, 10);

    if (
        !Number.isFinite(parsedValue) ||
        parsedValue < 0
    ) {
        return 0;
    }

    return parsedValue;
}


function formatCurrency(value) {
    return new Intl.NumberFormat(
        "en-SG",
        {
            style: "currency",
            currency: "SGD",
            maximumFractionDigits: 0,
        },
    ).format(value ?? 0);
}


function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}