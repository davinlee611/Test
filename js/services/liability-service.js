"use strict";

import { getLiabilities, setLiabilities } from "../state/client-plan.js";

import { createUniqueId } from "../utils/client-utils.js";

/* ========================================
   LIABILITY QUERIES
======================================== */

export function getAllLiabilities() {
  return getLiabilities();
}

export function getLiabilityById(liabilityId) {
  return (
    getLiabilities().find((liability) => liability.id === liabilityId) ?? null
  );
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
    id: createUniqueId(),
    type: liabilityType,
    name: liabilityName,
    outstandingBalance,
    monthlyRepayment,
    interestRate,
  };

  setLiabilities([...getLiabilities(), newLiability]);

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
  let updatedLiability = null;

  const liabilities = getLiabilities().map((liability) => {
    if (liability.id !== liabilityId) {
      return liability;
    }

    updatedLiability = {
      ...liability,
      type: liabilityType,
      name: liabilityName,
      outstandingBalance,
      monthlyRepayment,
      interestRate,
    };

    return updatedLiability;
  });

  if (!updatedLiability) {
    return null;
  }

  setLiabilities(liabilities);

  return updatedLiability;
}

export function removeLiability(liabilityId) {
  const existingLiability = getLiabilityById(liabilityId);

  if (!existingLiability) {
    return false;
  }

  setLiabilities(
    getLiabilities().filter((liability) => liability.id !== liabilityId),
  );

  return true;
}

export function clearLiabilities() {
  setLiabilities([]);
}
