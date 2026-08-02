"use strict";

import { getInputWholeNumber } from "../../utils/client-utils.js";

/* ========================================
   READ ALL FINANCIAL INPUTS
======================================== */

export function readAssetsIncomeFormData(elements) {
  return {
    liquidAssets: {
      cashInBank: getInputWholeNumber(elements.cashInBankInput),

      fixedDeposits: getInputWholeNumber(elements.fixedDepositsInput),

      tBills: getInputWholeNumber(elements.tBillsInput),

      investments: getInputWholeNumber(elements.investmentsInput),

      others: getInputWholeNumber(elements.otherLiquidAssetsInput),
    },

    income: {
      monthlyEmployment: getInputWholeNumber(
        elements.monthlyEmploymentIncomeInput,
      ),

      annualBonus: getInputWholeNumber(elements.annualBonusInput),

      annualNetTradeIncome: getInputWholeNumber(
        elements.annualNetTradeIncomeInput,
      ),

      netPlatformEarnings: getInputWholeNumber(
        elements.netPlatformEarningsInput,
      ),

      sepMedisaveOverrideEnabled: Boolean(
        elements.sepMedisaveOverrideInput?.checked,
      ),

      sepMedisaveOverrideAmount: getInputWholeNumber(
        elements.sepMedisaveOverrideAmountInput,
      ),

      otherMonthly: getInputWholeNumber(elements.otherMonthlyIncomeInput),
    },

    cpf: {
      oa: getInputWholeNumber(elements.cpfOaInput),

      sa: getInputWholeNumber(elements.cpfSaInput),

      ma: getInputWholeNumber(elements.cpfMaInput),

      ra: getInputWholeNumber(elements.cpfRaInput),
    },
  };
}

/* ========================================
   WRITE ALL FINANCIAL INPUTS
======================================== */

export function writeAssetsIncomeFormData(elements, assets) {
  const liquidAssets = assets?.liquidAssets || {};

  const income = assets?.income || {};

  const cpf = assets?.cpf || {};

  setInputValue(elements.cashInBankInput, liquidAssets.cashInBank);

  setInputValue(elements.fixedDepositsInput, liquidAssets.fixedDeposits);

  setInputValue(elements.tBillsInput, liquidAssets.tBills);

  setInputValue(elements.investmentsInput, liquidAssets.investments);

  setInputValue(elements.otherLiquidAssetsInput, liquidAssets.others);

  setInputValue(
    elements.monthlyEmploymentIncomeInput,
    income.monthlyEmployment,
  );

  setInputValue(elements.annualBonusInput, income.annualBonus);

  setInputValue(
    elements.annualNetTradeIncomeInput,
    income.annualNetTradeIncome,
  );

  setInputValue(elements.netPlatformEarningsInput, income.netPlatformEarnings);

  if (elements.sepMedisaveOverrideInput) {
    elements.sepMedisaveOverrideInput.checked = Boolean(
      income.sepMedisaveOverrideEnabled,
    );
  }

  setInputValue(
    elements.sepMedisaveOverrideAmountInput,
    income.sepMedisaveOverrideAmount,
  );

  setInputValue(elements.otherMonthlyIncomeInput, income.otherMonthly);

  setInputValue(elements.cpfOaInput, cpf.oa);

  setInputValue(elements.cpfSaInput, cpf.sa);

  setInputValue(elements.cpfMaInput, cpf.ma);

  setInputValue(elements.cpfRaInput, cpf.ra);
}

/* ========================================
   INPUT VALUE
======================================== */

function setInputValue(inputElement, value) {
  if (!inputElement) {
    return;
  }

  inputElement.value = Number(value) > 0 ? String(value) : "";
}