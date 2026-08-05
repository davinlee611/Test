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

export function calculateCpfBalanceTotal(cpf, age = null) {
  /*
   * SA is the applicable retirement account before 55.
   * RA is the applicable retirement account from 55.
   *
   * If age is unavailable, retain the old behaviour and
   * include both so callers without age data do not
   * unexpectedly lose part of the recorded CPF balance.
   */
  const retirementBalance =
    Number.isFinite(age) && age >= 55
      ? toNonNegativeNumber(cpf?.ra)
      : Number.isFinite(age)
        ? toNonNegativeNumber(cpf?.sa)
        : toNonNegativeNumber(cpf?.sa) + toNonNegativeNumber(cpf?.ra);

  return (
    toNonNegativeNumber(cpf?.oa) +
    retirementBalance +
    toNonNegativeNumber(cpf?.ma)
  );
}

/* ========================================
   FULL FINANCIAL SUMMARY
======================================== */

export function calculateAssetsIncomeSummary({
  assets,
  employmentStatus,
  age,
  ageAtStartOfWorkYear,
}) {
  const safeAssets = assets || {};

  const income = safeAssets.income || {};

  return {
    totalLiquidAssets: calculateLiquidAssetTotal(safeAssets.liquidAssets),

    totalCpf: calculateCpfBalanceTotal(safeAssets.cpf, age),

    incomeSummary: calculateIncomeSummary({
      monthlyEmploymentIncome: income.monthlyEmployment,

      annualBonus: income.annualBonus,

      annualNetTradeIncome: income.annualNetTradeIncome,

      netPlatformEarnings: income.netPlatformEarnings,

      sepMedisaveOverrideEnabled: income.sepMedisaveOverrideEnabled,

      sepMedisaveOverrideAmount: income.sepMedisaveOverrideAmount,

      monthlyOtherIncome: income.otherMonthly,

      employmentStatus,

      age,

      ageAtStartOfWorkYear,
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