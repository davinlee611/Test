"use strict";

import { emit } from "../events/event-bus.js";
import { EVENTS } from "../events/events.js";

import { getPropertyElements } from "./properties/property-elements.js";
import { bindPropertyEvents } from "./properties/property-event-binder.js";
import { readPropertyFormData } from "./properties/property-form-data.js";
import { createPropertyModal } from "./properties/property-modal.js";
import { renderPropertyList } from "./properties/property-renderer.js";
import { createPropertyWorkflow } from "./properties/property-workflow.js";

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;
let elements = {};
let propertyModal = null;
let propertyWorkflow = null;

/* ========================================
   INITIALIZATION
======================================== */

export function initializeProperties() {
  elements = getPropertyElements();

  createPropertyComponents();

  if (!moduleInitialized) {
    bindModuleEvents();
    moduleInitialized = true;
  }

  renderProperties();
}

/* ========================================
   RESET
======================================== */

export function resetProperties() {
  propertyWorkflow?.resetProperties();
  propertyModal?.close();

  renderProperties();
  emitPropertiesChanged();
}

/* ========================================
   RENDERING
======================================== */

export function renderProperties() {
  if (!propertyWorkflow) {
    return;
  }

  renderPropertyList({
    list: elements.propertyList,
    emptyMessage: elements.emptyPropertyMessage,
    totalElement: elements.totalPropertyValue,
    properties: propertyWorkflow.getProperties(),
    onEditProperty: openEditProperty,
    onDeleteProperty: confirmDeleteProperty,
  });
}

/* ========================================
   COMPONENT CREATION
======================================== */

function createPropertyComponents() {
  propertyWorkflow = createPropertyWorkflow();

  propertyModal = createPropertyModal({
    elements,
  });
}

/* ========================================
   EVENT BINDING
======================================== */

function bindModuleEvents() {
  bindPropertyEvents({
    elements,

    onAddProperty() {
      propertyModal.openAdd();
    },

    onSubmitProperty: handlePropertySubmit,

    onCloseProperty() {
      if (propertyModal.isOpen()) {
        propertyModal.close();
      }
    },
  });
}

/* ========================================
   FORM SUBMISSION
======================================== */

function handlePropertySubmit(event) {
  event.preventDefault();

  propertyModal.clearMessage();

  const editingPropertyId = elements.editingPropertyIdInput?.value || "";

  const formData = readPropertyFormData(elements);

  const result = propertyWorkflow.save({
    formData,
    editingPropertyId,
  });

  if (!result.success) {
    propertyModal.showMessage(result.validation.message);

    propertyModal.focusField(result.validation.field);

    return;
  }

  renderProperties();
  propertyModal.close();
  emitPropertiesChanged();
}

/* ========================================
   EDITING
======================================== */

function openEditProperty(propertyId) {
  const property = propertyWorkflow.getProperty(propertyId);

  if (!property) {
    return;
  }

  propertyModal.openEdit(property);
}

/* ========================================
   DELETION
======================================== */

function confirmDeleteProperty(propertyId) {
  const shouldDelete = window.confirm("Delete this property?");

  if (!shouldDelete) {
    return;
  }

  const wasRemoved = propertyWorkflow.deleteProperty(propertyId);

  if (!wasRemoved) {
    return;
  }

  renderProperties();
  emitPropertiesChanged();
}

/* ========================================
   EVENTS
======================================== */

function emitPropertiesChanged() {
  emit(EVENTS.PROPERTY_CHANGED, {
    properties: [...propertyWorkflow.getProperties()],
  });
}