"use strict";

/* ========================================
   ASSETS AND INCOME ELEMENTS
======================================== */

export function getAssetsIncomeElements() {
  return {
    /* Withdrawable assets */

    cashInBankInput: document.getElementById("cashInBank"),

    fixedDepositsInput: document.getElementById("fixedDeposits"),

    tBillsInput: document.getElementById("tBills"),

    investmentsInput: document.getElementById("investments"),

    otherLiquidAssetsInput: document.getElementById("otherLiquidAssets"),

    totalLiquidAssetsElement: document.getElementById("totalLiquidAssets"),

    /* Income */

    monthlyEmploymentIncomeInput: document.getElementById(
      "monthlyEmploymentIncome",
    ),

    annualBonusInput: document.getElementById("annualBonus"),

    otherMonthlyIncomeInput: document.getElementById("otherMonthlyIncome"),

    /* Income summary */

    employeeCpfContributionElement: document.getElementById(
      "employeeCpfContribution",
    ),

    employeeCpfContributionNote: document.getElementById(
      "employeeCpfContributionNote",
    ),

    monthlyTakeHomeIncomeElement: document.getElementById(
      "monthlyTakeHomeIncome",
    ),

    annualEmploymentIncomeElement: document.getElementById("annualGrossIncome"),

    annualTakeHomeIncomeElement: document.getElementById(
      "annualTakeHomeIncome",
    ),

    /* CPF calculation details */

    cpfNotApplicableMessage: document.getElementById("cpfNotApplicableMessage"),

    employeeCpfRateElement: document.getElementById("employeeCpfRate"),

    ordinaryWageCeilingElement: document.getElementById("ordinaryWageCeiling"),

    monthlyWageSubjectToCpfElement: document.getElementById(
      "monthlyWageSubjectToCpf",
    ),

    monthlyIncomeNotSubjectToCpfElement: document.getElementById(
      "monthlyIncomeNotSubjectToCpf",
    ),

    additionalWageCeilingElement: document.getElementById(
      "additionalWageCeiling",
    ),

    bonusSubjectToCpfElement: document.getElementById("bonusSubjectToCpf"),

    bonusNotSubjectToCpfElement: document.getElementById(
      "bonusNotSubjectToCpf",
    ),

    cpfOnAdditionalWagesElement: document.getElementById(
      "cpfOnAdditionalWages",
    ),

    /* CPF account balances */

    cpfOaInput: document.getElementById("cpfOa"),

    cpfSaInput: document.getElementById("cpfSa"),

    cpfMaInput: document.getElementById("cpfMa"),

    cpfRaInput: document.getElementById("cpfRa"),

    cpfSaGroup: document.getElementById("cpfSaGroup"),

    cpfRaGroup: document.getElementById("cpfRaGroup"),

    totalCpfElement: document.getElementById("totalCpf"),
  };
}

/* ========================================
   FINANCIAL INPUT COLLECTION
======================================== */

export function getFinancialInputs(elements) {
  return [
    elements.cashInBankInput,
    elements.fixedDepositsInput,
    elements.tBillsInput,
    elements.investmentsInput,
    elements.otherLiquidAssetsInput,

    elements.monthlyEmploymentIncomeInput,
    elements.annualBonusInput,
    elements.otherMonthlyIncomeInput,

    elements.cpfOaInput,
    elements.cpfSaInput,
    elements.cpfMaInput,
    elements.cpfRaInput,
  ].filter(Boolean);
}