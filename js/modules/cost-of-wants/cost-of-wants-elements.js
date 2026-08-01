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

  cpf: Object.freeze({
    optionButtons: Array.from(
      document.querySelectorAll("[data-cpf-retirement-option]"),
    ),

    projectionCaption: document.getElementById(
      "costOfWantsCpfProjectionCaption",
    ),

    projectedBrs: document.getElementById("costOfWantsProjectedBrs"),

    projectedFrs: document.getElementById("costOfWantsProjectedFrs"),

    projectedErs: document.getElementById("costOfWantsProjectedErs"),

    projectedBrsPayout: document.getElementById(
      "costOfWantsProjectedBrsPayout",
    ),

    projectedFrsPayout: document.getElementById(
      "costOfWantsProjectedFrsPayout",
    ),

    projectedErsPayout: document.getElementById(
      "costOfWantsProjectedErsPayout",
    ),

    projectedBrsBasis: document.getElementById("costOfWantsProjectedBrsBasis"),

    projectedFrsBasis: document.getElementById("costOfWantsProjectedFrsBasis"),

    projectedErsBasis: document.getElementById("costOfWantsProjectedErsBasis"),

    calculationToggleButton: document.getElementById(
      "costOfWantsCpfCalculationToggle",
    ),

    calculationToggleIcon: document.getElementById(
      "costOfWantsCpfCalculationToggleIcon",
    ),

    calculationDetails: document.getElementById(
      "costOfWantsCpfCalculationDetails",
    ),

    payoutHelper: document.getElementById("costOfWantsCpfPayoutHelper"),

    calculationSummary: document.getElementById(
      "costOfWantsCpfCalculationSummary",
    ),

    calculationData: document.getElementById("costOfWantsCpfCalculationData"),
  }),

  fybc: Object.freeze({
    yearsRemaining: document.getElementById("costOfWantsFybcYearsRemaining"),

    inflationNote: document.getElementById("costOfWantsFybcInflationNote"),

    income: document.getElementById("costOfWantsFybcIncome"),

    incomeAt65: document.getElementById("costOfWantsIncomeAt65"),

    cpfLifeIncome: document.getElementById("costOfWantsCpfLifeIncome"),

    requiredCapital: document.getElementById("costOfWantsFybcRequired"),
  }),

  timeline: Object.freeze({
    container: document.getElementById("costOfWantsIncomeTimeline"),

    content: document.getElementById("costOfWantsTimelineContent"),

    progress: document.getElementById("costOfWantsTimelineProgress"),

    brsMarker: document.getElementById("costOfWantsTimelineBrsMarker"),

    brsAmount: document.getElementById("costOfWantsTimelineBrsAmount"),

    frsMarker: document.getElementById("costOfWantsTimelineFrsMarker"),

    frsAmount: document.getElementById("costOfWantsTimelineFrsAmount"),

    ersMarker: document.getElementById("costOfWantsTimelineErsMarker"),

    ersAmount: document.getElementById("costOfWantsTimelineErsAmount"),

    goalMarker: document.getElementById("costOfWantsTimelineGoalMarker"),

    goalAmount: document.getElementById("costOfWantsTimelineGoalAmount"),

    incomeNeeded: document.getElementById("costOfWantsTimelineIncomeNeeded"),

    totalPayouts: document.getElementById("costOfWantsTimelineTotalPayouts"),
  }),

  projection: Object.freeze({
    calculationToggleButton: document.getElementById(
      "costOfWantsProjectionCalculationToggle",
    ),

    calculationToggleIcon: document.getElementById(
      "costOfWantsProjectionCalculationToggleIcon",
    ),

    calculationDetails: document.getElementById(
      "costOfWantsProjectionCalculationDetails",
    ),

    calculationSummary: document.getElementById(
      "costOfWantsProjectionCalculationSummary",
    ),

    calculationData: document.getElementById(
      "costOfWantsProjectionCalculationData",
    ),
  }),

  outcome: Object.freeze({
    incomeGap: document.getElementById("costOfWantsIncomeGap"),

    remainingCapital: document.getElementById("costOfWantsRemainingCapital"),

    capitalNeededHelper: document.getElementById(
      "costOfWantsCapitalNeededHelper",
    ),

    analyseButton: document.getElementById("costOfWantsAnalyseButton"),

    reportButton: document.getElementById("costOfWantsReportButton"),
  }),

  validation: Object.freeze({
    message: document.getElementById("costOfWantsValidationMessage"),
  }),
});
