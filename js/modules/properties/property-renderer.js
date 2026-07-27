"use strict";

import { formatCurrency } from "../../utils/client-utils.js";

import {
  createPlanningCard,
  createPlanningCardIcon,
  createPlanningCardDetails,
  createPlanningCardActions,
  createPlanningCardButton,
  renderPlanningEmptyState,
} from "../../components/planning-card.js";

import { PROPERTY_ICON_CLASS } from "./property-config.js";

import {
  calculateClientPropertyValue,
  calculateTotalPropertyValue,
} from "./property-calculator.js";

/* ========================================
   PROPERTY LIST
======================================== */

export function renderPropertyList({
  list,
  emptyMessage,
  totalElement,
  properties,
  onEditProperty,
  onDeleteProperty,
}) {
  if (!list) {
    updatePropertyTotal(totalElement, properties);

    return;
  }

  list.innerHTML = "";

  if (properties.length === 0) {
    renderPlanningEmptyState(list, "No properties added yet.", emptyMessage);

    updatePropertyTotal(totalElement, properties);

    return;
  }

  properties.forEach(function (property) {
    list.appendChild(
      createPropertyItem({
        property,
        onEditProperty,
        onDeleteProperty,
      }),
    );
  });

  updatePropertyTotal(totalElement, properties);
}

/* ========================================
   PROPERTY ITEM
======================================== */

function createPropertyItem({ property, onEditProperty, onDeleteProperty }) {
  return createPlanningCard({
    itemClass: "property-item",

    icon: createPlanningCardIcon(PROPERTY_ICON_CLASS),

    details: createPropertyDetails(property),

    actions: createPropertyActions({
      property,
      onEditProperty,
      onDeleteProperty,
    }),
  });
}

/* ========================================
   PROPERTY DETAILS
======================================== */

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

/* ========================================
   PROPERTY ACTIONS
======================================== */

function createPropertyActions({ property, onEditProperty, onDeleteProperty }) {
  const actions = createPlanningCardActions();

  actions.append(
    createPlanningCardButton({
      iconClass: "fa-solid fa-pen",

      label: `Edit ${property.type}`,

      onClick() {
        onEditProperty(property.id);
      },
    }),

    createPlanningCardButton({
      iconClass: "fa-solid fa-trash",

      variant: "delete",

      label: `Delete ${property.type}`,

      onClick() {
        onDeleteProperty(property.id);
      },
    }),
  );

  return actions;
}

/* ========================================
   PROPERTY TOTAL
======================================== */

function updatePropertyTotal(totalElement, properties) {
  if (!totalElement) {
    return;
  }

  totalElement.textContent = formatCurrency(
    calculateTotalPropertyValue(properties),
  );
}