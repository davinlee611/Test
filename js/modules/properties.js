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

const addPropertyButton =
    document.getElementById(
        "addPropertyButton",
    );

const emptyPropertyMessage =
    document.getElementById(
        "emptyPropertyMessage",
    );

const totalPropertyValueElement =
    document.getElementById(
        "totalPropertyValue",
    );

const propertyModal =
    document.getElementById(
        "propertyModal",
    );

const propertyForm =
    document.getElementById(
        "propertyForm",
    );

const propertyList =
    document.getElementById(
        "propertyList",
    );

const propertyModalTitle =
    document.getElementById(
        "propertyModalTitle",
    );

const editingPropertyIdInput =
    document.getElementById(
        "editingPropertyId",
    );

const propertyTypeInput =
    document.getElementById(
        "propertyType",
    );

const propertyMarketValueInput =
    document.getElementById(
        "propertyMarketValue",
    );

const propertyOwnershipInput =
    document.getElementById(
        "propertyOwnership",
    );

const propertyFormMessage =
    document.getElementById(
        "propertyFormMessage",
    );

const closePropertyModalButton =
    document.getElementById(
        "closePropertyModalButton",
    );

const cancelPropertyButton =
    document.getElementById(
        "cancelPropertyButton",
    );

const propertyModalBackdrop =
    document.querySelector(
        "[data-close-property-modal]",
    );


/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;


/* ========================================
   INITIALIZATION
======================================== */

export function initializeProperties() {
    if (moduleInitialized) {
        return;
    }

    attachPropertyListeners();
    renderProperties();

    moduleInitialized = true;
}


/* ========================================
   RESET
======================================== */

export function resetProperties() {
    /*
     * resetClientPlan() normally clears this
     * before this function is called.
     *
     * Setting it again keeps this module safe
     * when reset independently.
     */
    clientPlan.priorities.assets.properties =
        [];

    closePropertyModal();
    renderProperties();

    emitPropertyChanged();
}


/* ========================================
   EVENT LISTENERS
======================================== */

function attachPropertyListeners() {
    if (addPropertyButton) {
        addPropertyButton.addEventListener(
            "click",
            openAddPropertyModal,
        );
    }

    if (propertyForm) {
        propertyForm.addEventListener(
            "submit",
            handlePropertySubmit,
        );
    }

    if (closePropertyModalButton) {
        closePropertyModalButton
            .addEventListener(
                "click",
                closePropertyModal,
            );
    }

    if (cancelPropertyButton) {
        cancelPropertyButton.addEventListener(
            "click",
            closePropertyModal,
        );
    }

    if (propertyModalBackdrop) {
        propertyModalBackdrop.addEventListener(
            "click",
            closePropertyModal,
        );
    }

    document.addEventListener(
        "keydown",
        handleDocumentKeydown,
    );
}


function handleDocumentKeydown(event) {
    if (
        event.key === "Escape" &&
        propertyModal &&
        !propertyModal.hidden
    ) {
        closePropertyModal();
    }
}


/* ========================================
   MODAL
======================================== */

function openAddPropertyModal() {
    if (!propertyModal || !propertyForm) {
        return;
    }

    propertyForm.reset();

    if (editingPropertyIdInput) {
        editingPropertyIdInput.value = "";
    }

    if (propertyOwnershipInput) {
        propertyOwnershipInput.value =
            "100";
    }

    clearPropertyFormMessage();

    if (propertyModalTitle) {
        propertyModalTitle.textContent =
            "Add Property";
    }

    propertyModal.hidden = false;

    document.body.classList.add(
        "property-modal-open",
    );

    propertyTypeInput?.focus();
}


function openEditPropertyModal(propertyId) {
    const property =
        clientPlan.priorities.assets
            .properties
            .find(function (savedProperty) {
                return (
                    savedProperty.id ===
                    propertyId
                );
            });

    if (!property || !propertyModal) {
        return;
    }

    if (editingPropertyIdInput) {
        editingPropertyIdInput.value =
            property.id;
    }

    if (propertyTypeInput) {
        propertyTypeInput.value =
            property.type;
    }

    if (propertyMarketValueInput) {
        propertyMarketValueInput.value =
            property.marketValue;
    }

    if (propertyOwnershipInput) {
        propertyOwnershipInput.value =
            property.ownershipPercentage;
    }

    clearPropertyFormMessage();

    if (propertyModalTitle) {
        propertyModalTitle.textContent =
            "Edit Property";
    }

    propertyModal.hidden = false;

    document.body.classList.add(
        "property-modal-open",
    );

    propertyTypeInput?.focus();
}


function closePropertyModal() {
    if (!propertyModal) {
        return;
    }

    propertyModal.hidden = true;

    document.body.classList.remove(
        "property-modal-open",
    );

    clearPropertyFormMessage();
}


function clearPropertyFormMessage() {
    if (propertyFormMessage) {
        propertyFormMessage.textContent = "";
    }
}


/* ========================================
   FORM SUBMISSION
======================================== */

function handlePropertySubmit(event) {
    event.preventDefault();

    const propertyType =
        propertyTypeInput?.value || "";

    const marketValue =
        getWholeNumber(
            propertyMarketValueInput?.value,
        );

    const ownershipPercentage =
        getWholeNumber(
            propertyOwnershipInput?.value,
        );

    const editingPropertyId =
        editingPropertyIdInput?.value || "";

    clearPropertyFormMessage();

    const validationResult =
        validateProperty(
            propertyType,
            marketValue,
            ownershipPercentage,
        );

    if (!validationResult.isValid) {
        showPropertyFormMessage(
            validationResult.message,
        );

        validationResult.element?.focus();
        return;
    }

    if (editingPropertyId) {
        updateProperty(
            editingPropertyId,
            propertyType,
            marketValue,
            ownershipPercentage,
        );
    } else {
        addProperty(
            propertyType,
            marketValue,
            ownershipPercentage,
        );
    }

    renderProperties();
    closePropertyModal();
    emitPropertyChanged();
}


function validateProperty(
    propertyType,
    marketValue,
    ownershipPercentage,
) {
    if (!propertyType) {
        return {
            isValid: false,
            message:
                "Please select a property type.",
            element: propertyTypeInput,
        };
    }

    if (marketValue <= 0) {
        return {
            isValid: false,
            message:
                "Please enter the property's market value.",
            element:
                propertyMarketValueInput,
        };
    }

    if (
        ownershipPercentage < 1 ||
        ownershipPercentage > 100
    ) {
        return {
            isValid: false,
            message:
                "Ownership percentage must be between 1% and 100%.",
            element:
                propertyOwnershipInput,
        };
    }

    return {
        isValid: true,
    };
}


function showPropertyFormMessage(message) {
    if (propertyFormMessage) {
        propertyFormMessage.textContent =
            message;
    }
}


/* ========================================
   PROPERTY DATA
======================================== */

function addProperty(
    propertyType,
    marketValue,
    ownershipPercentage,
) {
    clientPlan.priorities.assets.properties
        .push({
            id: createUniqueId(),
            type: propertyType,
            marketValue,
            ownershipPercentage,
        });
}


function updateProperty(
    propertyId,
    propertyType,
    marketValue,
    ownershipPercentage,
) {
    const property =
        clientPlan.priorities.assets
            .properties
            .find(function (savedProperty) {
                return (
                    savedProperty.id ===
                    propertyId
                );
            });

    if (!property) {
        return;
    }

    property.type = propertyType;
    property.marketValue = marketValue;
    property.ownershipPercentage =
        ownershipPercentage;
}


function deleteProperty(propertyId) {
    const shouldDelete =
        window.confirm(
            "Delete this property?",
        );

    if (!shouldDelete) {
        return;
    }

    clientPlan.priorities.assets.properties =
        clientPlan.priorities.assets
            .properties
            .filter(function (property) {
                return (
                    property.id !==
                    propertyId
                );
            });

    renderProperties();
    emitPropertyChanged();
}


/* ========================================
   RENDERING
======================================== */

export function renderProperties() {
    if (!propertyList) {
        return;
    }

    const properties =
        clientPlan.priorities.assets
            .properties;

    propertyList.innerHTML = "";

    properties.forEach(function (property) {
        const propertyItem =
            createPropertyItem(property);

        propertyList.appendChild(
            propertyItem,
        );
    });

    if (
        properties.length === 0 &&
        emptyPropertyMessage
    ) {
        propertyList.appendChild(
            emptyPropertyMessage,
        );
    }

    updatePropertyTotal();
}


function createPropertyItem(property) {
    const clientPropertyValue =
        calculateClientPropertyValue(
            property,
        );

    const propertyItem =
        document.createElement("div");

    propertyItem.className =
        "planning-item";

    const propertyMain =
        document.createElement("div");

    propertyMain.className =
        "planning-item-main";

    const propertyIcon =
        document.createElement("div");

    propertyIcon.className =
        "planning-item-icon";

    propertyIcon.innerHTML = '<i class="fa-solid fa-house"></i>';

    const propertyDetails =
        document.createElement("div");

    propertyDetails.className =
        "planning-item-details";

    const propertyTitle =
        document.createElement("h4");

    propertyTitle.textContent =
        property.type;

    const propertyDescription =
        document.createElement("p");

    propertyDescription.textContent =
        `${formatCurrency(
            property.marketValue,
        )} market value · ` +
        `${property.ownershipPercentage}% ownership · ` +
        `${formatCurrency(
            clientPropertyValue,
        )} client value`;

    propertyDetails.append(
        propertyTitle,
        propertyDescription,
    );

    propertyMain.append(
        propertyIcon,
        propertyDetails,
    );

    const propertyActions =
        document.createElement("div");

    propertyActions.className =
        "planning-item-actions";

    const editButton =
        createEditButton(property);

    const deleteButton =
        createDeleteButton(property);

    propertyActions.append(
        editButton,
        deleteButton,
    );

    propertyItem.append(
        propertyMain,
        propertyActions,
    );

    return propertyItem;
}


function createEditButton(property) {
    const editButton =
        document.createElement("button");

    editButton.type = "button";

    editButton.className =
        "planning-item-button";

    editButton.setAttribute(
        "aria-label",
        `Edit ${property.type}`,
    );

    editButton.innerHTML = '<i class="fa-solid fa-pen"></i>';

    editButton.addEventListener(
        "click",
        function () {
            openEditPropertyModal(
                property.id,
            );
        },
    );

    return editButton;
}


function createDeleteButton(property) {
    const deleteButton =
        document.createElement("button");

    deleteButton.type = "button";

    deleteButton.className =
        "planning-item-button delete";

    deleteButton.setAttribute(
        "aria-label",
        `Delete ${property.type}`,
    );

    deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';

    deleteButton.addEventListener(
        "click",
        function () {
            deleteProperty(property.id);
        },
    );

    return deleteButton;
}


/* ========================================
   PROPERTY TOTAL
======================================== */

function updatePropertyTotal() {
    if (!totalPropertyValueElement) {
        return;
    }

    const totalPropertyValue =
        clientPlan.priorities.assets
            .properties
            .reduce(
                function (
                    total,
                    property,
                ) {
                    return (
                        total +
                        calculateClientPropertyValue(
                            property,
                        )
                    );
                },
                0,
            );

    totalPropertyValueElement.textContent =
        formatCurrency(
            totalPropertyValue,
        );
}


function calculateClientPropertyValue(
    property,
) {
    return Math.round(
        property.marketValue *
        (
            property
                .ownershipPercentage /
            100
        ),
    );
}


/* ========================================
   EVENTS
======================================== */

function emitPropertyChanged() {
    emit(EVENTS.PROPERTY_CHANGED, {
        properties:
            clientPlan.priorities.assets
                .properties,
    });
}