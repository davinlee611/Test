"use strict";

import { calculateIncomeSummary } from "../../services/income-calculator.js";

/* ========================================
   LIQUID ASSET TOTAL
======================================== */

export function calculateLiquidAssetTotal(liquidAssets) {
  return (
    toNonNegativeNumber(liquidAssets?.cashInBank) +
    toNonNegativeNumber(liquidAssets?.fixedDeposits) +
    toNonNegativeNumber(liquidAssets?.tBills) +
    toNonNegativeNumber(liquidAssets?.investments) +
    toNonNegativeNumber(liquidAssets?.others)
  );
}

/* ========================================
   CPF BALANCE TOTAL
======================================== */

export function calculateCpfBalanceTotal(cpf) {
  return (
    toNonNegativeNumber(cpf?.oa) +
    toNonNegativeNumber(cpf?.sa) +
    toNonNegativeNumber(cpf?.ma) +
    toNonNegativeNumber(cpf?.ra)
  );
}

/* ========================================
   FULL FINANCIAL SUMMARY
======================================== */

export function calculateAssetsIncomeSummary({
  assets,

  employmentStatus,

  age,
}) {
  const safeAssets = assets || {};

  const income = safeAssets.income || {};

  return {
    totalLiquidAssets: calculateLiquidAssetTotal(safeAssets.liquidAssets),

    totalCpf: calculateCpfBalanceTotal(safeAssets.cpf),

    incomeSummary: calculateIncomeSummary({
      monthlyEmploymentIncome: income.monthlyEmployment,

      annualBonus: income.annualBonus,

      monthlyOtherIncome: income.otherMonthly,

      employmentStatus,

      age,
    }),
  };
}

/* ========================================
   INTERNAL NUMBER NORMALISATION
======================================== */

function toNonNegativeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return number;
}