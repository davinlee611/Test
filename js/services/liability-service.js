"use strict";

import { getLiabilities, setLiabilities } from "../state/client-plan.js";

import {
  appendItem,
  findItemById,
  removeItemById,
  updateItemById,
} from "../utils/collection-utils.js";

import { createPlannerId } from "../utils/client-utils.js";

import { PROPERTY_LOAN_TYPE } from "../modules/liabilities/liability-config.js";

import { normalizeRepaymentEndDate } from "../modules/liabilities/liability-calculator.js";

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

export function createLiability(liabilityData) {
  const newLiability = createLiabilityRecord(liabilityData);

  setLiabilities(appendItem(getLiabilities(), newLiability));

  return newLiability;
}

export function updateLiability(
  liabilityId,
  {
    liabilityType,
    liabilityName,
    outstandingBalance,
    interestRate,
    repaymentEndDate,
    monthlyRepayment,
    monthlyRepaymentSource,
    monthlyCpfPayment,
  },
) {
  const normalizedCpfPayment = normalizeMonthlyCpfPayment({
    liabilityType,
    monthlyCpfPayment,
  });

  const { items, updatedItem } = updateItemById(
    getLiabilities(),
    liabilityId,
    (liability) => {
      /*
       * Remove the obsolete usesCpf property
       * from older saved liability objects.
       */
      const { usesCpf, ...existingLiability } = liability;

      return {
        ...existingLiability,

        type: liabilityType,
        name: liabilityName,

        outstandingBalance,
        interestRate,

        repaymentEndDate: normalizeRepaymentEndDate(repaymentEndDate),

        monthlyRepayment,
        monthlyRepaymentSource,

        monthlyCpfPayment: normalizedCpfPayment,
      };
    },
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

/* ========================================
   PRIVATE LIABILITY FACTORY
======================================== */

function createLiabilityRecord({
  liabilityType,
  liabilityName,
  outstandingBalance,
  interestRate,
  repaymentEndDate,
  monthlyRepayment,
  monthlyRepaymentSource,
  monthlyCpfPayment,
}) {
  return {
    id: createPlannerId(),

    type: liabilityType,
    name: liabilityName,

    outstandingBalance,
    interestRate,
    
    repaymentEndDate: normalizeRepaymentEndDate(repaymentEndDate),

    monthlyRepayment,
    monthlyRepaymentSource,

    monthlyCpfPayment: normalizeMonthlyCpfPayment({
      liabilityType,
      monthlyCpfPayment,
    }),
  };
}

/* ========================================
   CPF NORMALISATION
======================================== */

function normalizeMonthlyCpfPayment({ liabilityType, monthlyCpfPayment }) {
  if (liabilityType !== PROPERTY_LOAN_TYPE) {
    return 0;
  }

  const amount = Number(monthlyCpfPayment);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Math.round(amount);
}