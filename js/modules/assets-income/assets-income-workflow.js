"use strict";

import { getAssets, updateAssets } from "../../state/client-plan.js";

/* ========================================
   EMPTY FEATURE VALUES
======================================== */

function createEmptyLiquidAssets() {
  return {
    cashInBank: 0,
    fixedDeposits: 0,
    tBills: 0,
    investments: 0,
    others: 0,
  };
}

function createEmptyIncome() {
  return {
    monthlyEmployment: 0,

    annualBonus: 0,

    annualNetTradeIncome: 0,

    netPlatformEarnings: 0,

    sepMedisaveOverrideEnabled: false,

    sepMedisaveOverrideAmount: 0,

    otherMonthly: 0,

    otherMonthlyContinuesAfterFybc: true,
  };
}

function createEmptyCpf() {
  return {
    oa: 0,
    sa: 0,
    ma: 0,
    ra: 0,
  };
}

/* ========================================
   ASSETS AND INCOME WORKFLOW
======================================== */

export function createAssetsIncomeWorkflow() {
  /* ========================================
     QUERIES
  ======================================== */

  function getAssetsIncomeData() {
    return getAssets();
  }

  /* ========================================
     SAVE
  ======================================== */

  function save(formData) {
    const currentAssets = getAssets();

    return updateAssets({
      ...currentAssets,

      liquidAssets: {
        ...createEmptyLiquidAssets(),
        ...formData.liquidAssets,
      },

      income: {
        ...createEmptyIncome(),
        ...formData.income,
      },

      cpf: {
        ...createEmptyCpf(),
        ...formData.cpf,
      },

      properties: Array.isArray(currentAssets.properties)
        ? [...currentAssets.properties]
        : [],
    });
  }

  /* ========================================
     CPF AGE ADJUSTMENT
  ======================================== */

  function applyCpfAccountRules() {
    /*
     * Do not erase SA or RA when the client's DOB changes.
     *
     * The controller decides which account is visible based
     * on age, while calculations decide which account is
     * applicable.
     *
     * Keeping both recorded balances in state prevents a
     * temporary DOB correction from permanently deleting
     * previously entered CPF information.
     */
    return getAssets();
  }

  /* ========================================
   EMPLOYMENT STATUS CHANGE
  ======================================== */

  function clearEmploymentSpecificIncome() {
    const currentAssets = getAssets();

    return updateAssets({
      ...currentAssets,

      income: {
        ...createEmptyIncome(),

        /*
         * Other Monthly Income is not tied to
         * employment status, so preserve it.
         */
        otherMonthly: Number(currentAssets.income?.otherMonthly) || 0,

        otherMonthlyContinuesAfterFybc:
          currentAssets.income?.otherMonthlyContinuesAfterFybc !== false,
      },

      properties: Array.isArray(currentAssets.properties)
        ? [...currentAssets.properties]
        : [],
    });
  }

  /* ========================================
     RESET
  ======================================== */

  function reset() {
    const currentAssets = getAssets();

    return updateAssets({
      ...currentAssets,

      liquidAssets: createEmptyLiquidAssets(),

      income: createEmptyIncome(),

      cpf: createEmptyCpf(),

      properties: Array.isArray(currentAssets.properties)
        ? [...currentAssets.properties]
        : [],
    });
  }

  return {
    getAssetsIncomeData,

    save,

    applyCpfAccountRules,

    clearEmploymentSpecificIncome,

    reset,
  };
}
