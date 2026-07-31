"use strict";

export const costOfWantsElements = Object.freeze({
  inputs: Object.freeze({
    currentAge: document.getElementById("costOfWantsCurrentAge"),

    desiredFybcAge: document.getElementById("desiredFybcAge"),

    plannedMortalityAge: document.getElementById("plannedMortalityAge"),

    inflationRate: document.getElementById("costOfWantsInflationRate"),

    customIncome: document.getElementById("costOfWantsCustomIncome"),

    cpfGrowthRate: document.getElementById("costOfWantsCpfGrowthRate"),
  }),

  lifestyle: Object.freeze({
    optionButtons: Array.from(
      document.querySelectorAll("[data-lifestyle-option]"),
    ),

    customIncomeGroup: document.getElementById("costOfWantsCustomIncomeGroup"),

    selectedIncomeSummary: document.getElementById("costOfWantsSelectedIncome"),

    selectedIncomeAmount: document.getElementById(
      "costOfWantsSelectedIncomeAmount",
    ),
  }),

  spending: Object.freeze({
    householdAmount: document.getElementById("costOfWantsHouseholdAmount"),

    transportAmount: document.getElementById("costOfWantsTransportAmount"),

    subscriptionsAmount: document.getElementById(
      "costOfWantsSubscriptionsAmount",
    ),

    dependantsAmount: document.getElementById("costOfWantsDependantsAmount"),

    otherExpensesAmount: document.getElementById(
      "costOfWantsOtherExpensesAmount",
    ),

    liabilityRepayments: document.getElementById(
      "costOfWantsLiabilityRepaymentsAmount",
    ),

    insuranceAmount: document.getElementById("costOfWantsInsuranceAmount"),

    totalExpenses: document.getElementById("costOfWantsTotalExpenses"),

    totalCommitments: document.getElementById("costOfWantsTotalCommitments"),

    totalSpending: document.getElementById("costOfWantsTotalSpending"),
  }),

  floatingSummary: Object.freeze({
    container: document.getElementById("costOfWantsFloatingSummary"),

    toggleButton: document.getElementById("costOfWantsSummaryToggle"),

    toggleIcon: document.getElementById("costOfWantsSummaryToggleIcon"),

    calculatedBreakdown: document.getElementById(
      "costOfWantsCalculatedBreakdown",
    ),

    monthlySurplus: document.getElementById("costOfWantsMonthlySurplus"),

    goalSavings: document.getElementById("costOfWantsGoalSavings"),

    netSurplus: document.getElementById("costOfWantsNetSurplus"),

    availableSurplus: document.getElementById("costOfWantsAvailableSurplus"),

    goalSavingsList: document.getElementById("costOfWantsGoalSavingsList"),

    goalSavingsStatus: document.getElementById("costOfWantsGoalSavingsStatus"),
  }),

  cpf: Object.freeze({}),

  fybc: Object.freeze({}),

  timeline: Object.freeze({}),

  projection: Object.freeze({}),

  validation: Object.freeze({}),
});
