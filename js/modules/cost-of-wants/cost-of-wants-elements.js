"use strict";

/* ========================================
   COST OF WANTS ELEMENTS
======================================== */

export const costOfWantsElements = Object.freeze({
  /* Inputs */

  currentAgeInput: document.getElementById("costOfWantsCurrentAge"),

  desiredFybcAgeInput: document.getElementById("desiredFybcAge"),

  plannedMortalityAgeInput: document.getElementById("plannedMortalityAge"),

  inflationRateInput: document.getElementById("costOfWantsInflationRate"),

  customIncomeInput: document.getElementById("costOfWantsCustomIncome"),

  cpfGrowthRateInput: document.getElementById("costOfWantsCpfGrowthRate"),

  /* Lifestyle */

  lifestyleOptionButtons: Array.from(
    document.querySelectorAll("[data-lifestyle-option]"),
  ),

  customIncomeGroup: document.getElementById("costOfWantsCustomIncomeGroup"),

  selectedIncomeSummary: document.getElementById("costOfWantsSelectedIncome"),

  selectedIncomeAmount: document.getElementById(
    "costOfWantsSelectedIncomeAmount",
  ),

  validationMessage: document.getElementById("costOfWantsValidationMessage"),

  /* Spending Summary */

  householdAmount: document.getElementById("costOfWantsHouseholdAmount"),

  transportAmount: document.getElementById("costOfWantsTransportAmount"),

  subscriptionsAmount: document.getElementById(
    "costOfWantsSubscriptionsAmount",
  ),

  dependantsAmount: document.getElementById("costOfWantsDependantsAmount"),

  otherExpensesAmount: document.getElementById(
    "costOfWantsOtherExpensesAmount",
  ),

  liabilityRepaymentsAmount: document.getElementById(
    "costOfWantsLiabilityRepaymentsAmount",
  ),

  insuranceAmount: document.getElementById("costOfWantsInsuranceAmount"),

  totalExpensesAmount: document.getElementById("costOfWantsTotalExpenses"),

  totalCommitmentsAmount: document.getElementById(
    "costOfWantsTotalCommitments",
  ),

  totalSpendingAmount: document.getElementById("costOfWantsTotalSpending"),

  /* Floating Summary */

  floatingSummary: document.getElementById("costOfWantsFloatingSummary"),

  floatingSummaryContent: document.getElementById(
    "costOfWantsFloatingSummaryContent",
  ),

  /* CPF */

  cpfRetirementCards: document.getElementById("cpfRetirementCards"),

  cpfRetirementTimeline: document.getElementById("cpfRetirementTimeline"),

  cpfSchemeDescription: document.getElementById(
    "cpfRetirementSchemeDescription",
  ),

  cpfRetirementOptionButtons: Array.from(
    document.querySelectorAll("[data-cpf-retirement-option]"),
  ),

  /* Projection */

  projectionSummary: document.getElementById("costOfWantsProjectionSummary"),

  incomeGapCard: document.getElementById("costOfWantsIncomeGapCard"),

  capitalRequiredCard: document.getElementById(
    "costOfWantsCapitalRequiredCard",
  ),

  timelineContainer: document.getElementById("costOfWantsIncomeTimeline"),

  calculationFlow: document.getElementById("costOfWantsCalculationFlow"),
});