"use strict";

import { emit } from "../events/event-bus.js";

import { EVENTS } from "../events/events.js";

import { formatCurrency, getWholeNumber } from "../utils/client-utils.js";

import {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  removeProperty,
  clearProperties,
} from "../services/property-service.js";

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

const addPropertyButton = document.getElementById("addPropertyButton");

const emptyPropertyMessage = document.getElementById("emptyPropertyMessage");

const totalPropertyValueElement = document.getElementById("totalPropertyValue");

const propertyModal = document.getElementById("propertyModal");

const propertyForm = document.getElementById("propertyForm");

const propertyList = document.getElementById("propertyList");

const propertyModalTitle = document.getElementById("propertyModalTitle");

const editingPropertyIdInput = document.getElementById("editingPropertyId");

const propertyTypeInput = document.getElementById("propertyType");

const propertyMarketValueInput = document.getElementById("propertyMarketValue");

const propertyOwnershipInput = document.getElementById("propertyOwnership");

const propertyFormMessage = document.getElementById("propertyFormMessage");

const closePropertyModalButton = document.getElementById(
  "closePropertyModalButton",
);

const cancelPropertyButton = document.getElementById("cancelPropertyButton");

const propertyModalBackdrop = document.querySelector(
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
    renderProperties();
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
  clearProperties();

  closePropertyModal();
  renderProperties();

  emitPropertiesChanged();
}

/* ========================================
   EVENT LISTENERS
======================================== */

function attachPropertyListeners() {
  if (addPropertyButton) {
    addPropertyButton.addEventListener("click", openAddPropertyModal);
  }

  if (propertyForm) {
    propertyForm.addEventListener("submit", handlePropertySubmit);
  }

  if (closePropertyModalButton) {
    closePropertyModalButton.addEventListener("click", closePropertyModal);
  }

  if (cancelPropertyButton) {
    cancelPropertyButton.addEventListener("click", closePropertyModal);
  }

  if (propertyModalBackdrop) {
    propertyModalBackdrop.addEventListener("click", closePropertyModal);
  }

  document.addEventListener("keydown", handleDocumentKeydown);
}

function handleDocumentKeydown(event) {
  if (event.key === "Escape" && propertyModal && !propertyModal.hidden) {
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
    propertyOwnershipInput.value = "100";
  }

  clearPropertyFormMessage();

  if (propertyModalTitle) {
    propertyModalTitle.textContent = "Add Property";
  }

  propertyModal.hidden = false;

  document.body.classList.add("property-modal-open");

  propertyTypeInput?.focus();
}

function openEditPropertyModal(propertyId) {
  const property = getPropertyById(propertyId);

  if (!property || !propertyModal) {
    return;
  }

  if (editingPropertyIdInput) {
    editingPropertyIdInput.value = property.id;
  }

  if (propertyTypeInput) {
    propertyTypeInput.value = property.type;
  }

  if (propertyMarketValueInput) {
    propertyMarketValueInput.value = property.marketValue;
  }

  if (propertyOwnershipInput) {
    propertyOwnershipInput.value = property.ownershipPercentage;
  }

  clearPropertyFormMessage();

  if (propertyModalTitle) {
    propertyModalTitle.textContent = "Edit Property";
  }

  propertyModal.hidden = false;

  document.body.classList.add("property-modal-open");

  propertyTypeInput?.focus();
}

function closePropertyModal() {
  if (!propertyModal) {
    return;
  }

  propertyModal.hidden = true;

  document.body.classList.remove("property-modal-open");

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

  const propertyType = propertyTypeInput?.value || "";

  const marketValue = getWholeNumber(propertyMarketValueInput?.value);

  const ownershipPercentage = getWholeNumber(propertyOwnershipInput?.value);

  const editingPropertyId = editingPropertyIdInput?.value || "";

  clearPropertyFormMessage();

  const validationResult = validateProperty(
    propertyType,
    marketValue,
    ownershipPercentage,
  );

  if (!validationResult.isValid) {
    showPropertyFormMessage(validationResult.message);

    validationResult.element?.focus();
    return;
  }

  if (editingPropertyId) {
    updateProperty(editingPropertyId, {
      propertyType,
      marketValue,
      ownershipPercentage,
    });
  } else {
    createProperty({
      propertyType,
      marketValue,
      ownershipPercentage,
    });
  }

  renderProperties();
  closePropertyModal();
  emitPropertiesChanged();
}

function validateProperty(propertyType, marketValue, ownershipPercentage) {
  if (!propertyType) {
    return {
      isValid: false,
      message: "Please select a property type.",
      element: propertyTypeInput,
    };
  }

  if (marketValue <= 0) {
    return {
      isValid: false,
      message: "Please enter the property's market value.",
      element: propertyMarketValueInput,
    };
  }

  if (ownershipPercentage < 1 || ownershipPercentage > 100) {
    return {
      isValid: false,
      message: "Ownership percentage must be between 1% and 100%.",
      element: propertyOwnershipInput,
    };
  }

  return {
    isValid: true,
  };
}

function showPropertyFormMessage(message) {
  if (propertyFormMessage) {
    propertyFormMessage.textContent = message;
  }
}

/* ========================================
   PROPERTY DELETION
======================================== */

function handleDeleteProperty(propertyId) {
  const shouldDelete = window.confirm("Delete this property?");

  if (!shouldDelete) {
    return;
  }

  const wasRemoved = removeProperty(propertyId);

  if (!wasRemoved) {
    return;
  }

  renderProperties();
  emitPropertiesChanged();
}

/* ========================================
   RENDERING
======================================== */

export function renderProperties() {
  if (!propertyList) {
    return;
  }

  const properties = getAllProperties();

  propertyList.innerHTML = "";

  if (properties.length === 0) {
    renderPlanningEmptyState(
      propertyList,
      "No properties added yet.",
      emptyPropertyMessage,
    );

    updatePropertyTotal();

    return;
  }

  properties.forEach(function (property) {
    propertyList.appendChild(createPropertyItem(property));
  });

  updatePropertyTotal();
}

function createPropertyItem(property) {
  return createPlanningCard({
    itemClass: "property-item",

    icon: createPropertyIcon(),

    details: createPropertyDetails(property),

    actions: createPropertyActions(property),
  });
}

function createPropertyIcon() {
  return createPlanningCardIcon("fa-solid fa-house");
}

function createPropertyDetails(property) {
  const clientPropertyValue = calculateClientPropertyValue(property);

  return createPlanningCardDetails({
    title: property.type,

    description: [
      `${formatCurrency(property.marketValue)} market value`,

      `${property.ownershipPercentage}% ownership`,

      `${formatCurrency(clientPropertyValue)} client value`,
    ].join(" · "),
  });
}

function createPropertyActions(property) {
  const actions = createPlanningCardActions();

  actions.append(createEditButton(property), createDeleteButton(property));

  return actions;
}

function createEditButton(property) {
  return createPlanningCardButton({
    iconClass: "fa-solid fa-pen",

    label: `Edit ${property.type}`,

    onClick() {
      openEditPropertyModal(property.id);
    },
  });
}

function createDeleteButton(property) {
  return createPlanningCardButton({
    iconClass: "fa-solid fa-trash",

    variant: "delete",

    label: `Delete ${property.type}`,

    onClick() {
      handleDeleteProperty(property.id);
    },
  });
}

/* ========================================
   PROPERTY TOTAL
======================================== */

function updatePropertyTotal() {
  if (!totalPropertyValueElement) {
    return;
  }

  const totalPropertyValue = getAllProperties().reduce(function (
    total,
    property,
  ) {
    return total + calculateClientPropertyValue(property);
  }, 0);

  totalPropertyValueElement.textContent = formatCurrency(totalPropertyValue);
}

function calculateClientPropertyValue(property) {
  return Math.round(
    property.marketValue * (property.ownershipPercentage / 100),
  );
}

/* ========================================
   EVENTS
======================================== */

function emitPropertiesChanged() {
  emit(EVENTS.PROPERTY_CHANGED, {
    properties: [...getAllProperties()],
  });
}
