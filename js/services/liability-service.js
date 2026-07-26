"use strict";

import { getLiabilities, setLiabilities } from "../state/client-plan.js";

import {
  appendItem,
  findItemById,
  removeItemById,
  updateItemById,
} from "../utils/collection-utils.js";

import { createPlannerId } from "../utils/client-utils.js";

/* ========================================
   LIABILITY QUERIES
======================================== */

export function getAllLiabilities() {
  return getLiabilities();
}

export function getLiabilityById(liabilityId) {
  return findItemById(getLiabilities(), liabilityId);
}

/* ========================================
   LIABILITY COMMANDS
======================================== */

export function createLiability({
  liabilityType,
  liabilityName,
  outstandingBalance,
  monthlyRepayment,
  interestRate,
}) {
  const newLiability = {
    id: createPlannerId(),
    type: liabilityType,
    name: liabilityName,
    outstandingBalance,
    monthlyRepayment,
    interestRate,
  };

  setLiabilities(appendItem(getLiabilities(), newLiability));

  return newLiability;
}

export function updateLiability(
  liabilityId,
  {
    liabilityType,
    liabilityName,
    outstandingBalance,
    monthlyRepayment,
    interestRate,
  },
) {
  const { items, updatedItem } = updateItemById(
    getLiabilities(),
    liabilityId,
    (liability) => ({
      ...liability,
      type: liabilityType,
      name: liabilityName,
      outstandingBalance,
      monthlyRepayment,
      interestRate,
    }),
  );

  if (!updatedItem) {
    return null;
  }

  setLiabilities(items);

  return updatedItem;
}

export function removeLiability(liabilityId) {
  const { items, removedItem } = removeItemById(getLiabilities(), liabilityId);

  if (!removedItem) {
    return false;
  }

  setLiabilities(items);

  return true;
}

export function clearLiabilities() {
  setLiabilities([]);
}