"use strict";

/* ========================================
   CLIENT PROPERTY VALUE
======================================== */

export function calculateClientPropertyValue(property) {
  const marketValue = Number(property?.marketValue) || 0;

  const ownershipPercentage = Number(property?.ownershipPercentage) || 0;

  return Math.round(marketValue * (ownershipPercentage / 100));
}

/* ========================================
   TOTAL PROPERTY VALUE
======================================== */

export function calculateTotalPropertyValue(properties) {
  if (!Array.isArray(properties)) {
    return 0;
  }

  return properties.reduce(function (total, property) {
    return total + calculateClientPropertyValue(property);
  }, 0);
}