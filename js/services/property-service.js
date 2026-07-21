"use strict";

import { getProperties, setProperties } from "../state/client-plan.js";

import { createUniqueId } from "../utils/client-utils.js";

/* ========================================
   PROPERTY QUERIES
======================================== */

export function getAllProperties() {
  return getProperties();
}

export function getPropertyById(propertyId) {
  return getProperties().find((property) => property.id === propertyId) ?? null;
}

/* ========================================
   PROPERTY COMMANDS
======================================== */

export function createProperty({
  propertyType,
  marketValue,
  ownershipPercentage,
}) {
  const newProperty = {
    id: createUniqueId(),
    type: propertyType,
    marketValue,
    ownershipPercentage,
  };

  setProperties([...getProperties(), newProperty]);

  return newProperty;
}

export function updateProperty(
  propertyId,
  { propertyType, marketValue, ownershipPercentage },
) {
  let updatedProperty = null;

  const properties = getProperties().map((property) => {
    if (property.id !== propertyId) {
      return property;
    }

    updatedProperty = {
      ...property,
      type: propertyType,
      marketValue,
      ownershipPercentage,
    };

    return updatedProperty;
  });

  if (!updatedProperty) {
    return null;
  }

  setProperties(properties);

  return updatedProperty;
}

export function removeProperty(propertyId) {
  const existingProperty = getPropertyById(propertyId);

  if (!existingProperty) {
    return false;
  }

  setProperties(
    getProperties().filter((property) => property.id !== propertyId),
  );

  return true;
}

export function clearProperties() {
  setProperties([]);
}
