"use strict";

import { getProperties, setProperties } from "../state/client-plan.js";

import {
  appendItem,
  findItemById,
  removeItemById,
  updateItemById,
} from "../utils/collection-utils.js";

import { createPlannerId } from "../utils/client-utils.js";

/* ========================================
   PROPERTY QUERIES
======================================== */

export function getAllProperties() {
  return getProperties();
}

export function getPropertyById(propertyId) {
  return findItemById(getProperties(), propertyId);
}

/* ========================================
   PROPERTY COMMANDS
======================================== */

export function createProperty(propertyData) {
  const newProperty = createPropertyRecord(propertyData);

  setProperties(appendItem(getProperties(), newProperty));

  return newProperty;
}

export function updateProperty(
  propertyId,
  { propertyType, marketValue, ownershipPercentage },
) {
  const { items, updatedItem } = updateItemById(
    getProperties(),
    propertyId,
    (property) => ({
      ...property,
      type: propertyType,
      marketValue,
      ownershipPercentage,
    }),
  );

  if (!updatedItem) {
    return null;
  }

  setProperties(items);

  return updatedItem;
}

export function removeProperty(propertyId) {
  const { items, removedItem } = removeItemById(getProperties(), propertyId);

  if (!removedItem) {
    return false;
  }

  setProperties(items);

  return true;
}

export function clearProperties() {
  setProperties([]);
}

/* ========================================
   PRIVATE PROPERTY FACTORY
======================================== */

function createPropertyRecord({
  propertyType,
  marketValue,
  ownershipPercentage,
}) {
  return {
    id: createPlannerId(),
    type: propertyType,
    marketValue,
    ownershipPercentage,
  };
}
