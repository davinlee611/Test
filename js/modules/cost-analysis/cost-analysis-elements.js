"use strict";

/* ========================================
   COST ANALYSIS ELEMENTS
======================================== */

export function getCostAnalysisElements() {
  return {
    employmentIncrementInput: document.getElementById(
      "analysisEmploymentIncrementInput",
    ),

    expenseInflationInput: document.getElementById(
      "analysisExpenseInflationInput",
    ),

    cashflowDescriptionElement: document.getElementById(
      "analysisCashflowDescription",
    ),

    incomeIncrementLabel: document.getElementById(
      "analysisIncomeIncrementLabel",
    ),

    primaryIncomeLabel: document.getElementById("analysisPrimaryIncomeLabel"),

    contributionIncomeLabel: document.getElementById(
      "analysisContributionIncomeLabel",
    ),

    projectionPeriodInputs: Array.from(
      document.querySelectorAll('input[name="analysisProjectionPeriod"]'),
    ),

    projectionPeriodLabel: document.getElementById(
      "analysisProjectionPeriodLabel",
    ),

    cashflowPeriodHeading: document.getElementById(
      "analysisCashflowPeriodHeading",
    ),

    cpfPeriodHeading: document.getElementById("analysisCpfPeriodHeading"),

    cashflowProjectionTableBody: document.getElementById(
      "analysisCashflowProjectionTableBody",
    ),

    cpfProjectionTableBody: document.getElementById(
      "analysisCpfProjectionTableBody",
    ),

    analysisSectionCollapseButtons: Array.from(
      document.querySelectorAll("[data-analysis-collapse-target]"),
    ),

    projectedFrsElement: document.getElementById("analysisProjectedFrs"),

    projectedFrsBasisElement: document.getElementById(
      "analysisProjectedFrsBasis",
    ),

    projectedCohortBhsElement: document.getElementById(
      "analysisProjectedCohortBhs",
    ),

    projectedCohortBhsBasisElement: document.getElementById(
      "analysisProjectedCohortBhsBasis",
    ),

    cpfLifeStartAgeInput: document.getElementById(
      "analysisCpfLifeStartAgeInput",
    ),

    cpfLifePremiumElement: document.getElementById("analysisCpfLifePremium"),

    cpfLifePayoutElement: document.getElementById("analysisCpfLifePayout"),

    cpfLifeProjectionStatusElement: document.getElementById(
      "analysisCpfLifeProjectionStatus",
    ),

    retirementStrategyOptionsElement: document.getElementById(
      "analysisRetirementStrategyOptions",
    ),

    retirementStrategyStatusElement: document.getElementById(
      "analysisRetirementStrategyStatus",
    ),

    retirementStrategyTargetElement: document.getElementById(
      "analysisRetirementStrategyTarget",
    ),

    retirementStrategyCashTopUpElement: document.getElementById(
      "analysisRetirementStrategyCashTopUp",
    ),

    retirementStrategyFundingResultElement: document.getElementById(
      "analysisRetirementStrategyFundingResult",
    ),

    retirementStrategyNoteElement: document.getElementById(
      "analysisRetirementStrategyNote",
    ),

    goalFilterOptions: document.getElementById("analysisGoalFilterOptions"),

    selectAllGoalsButton: document.getElementById(
      "analysisSelectAllGoalsButton",
    ),

    employmentIncomeElement: document.getElementById(
      "analysisEmploymentIncomeAfterCpf",
    ),

    bonusIncomeElement: document.getElementById("analysisBonusIncomeAfterCpf"),

    otherIncomeElement: document.getElementById("analysisOtherMonthlyIncome"),

    retirementPolicyIncomeElement: document.getElementById(
      "analysisRetirementPolicyIncome",
    ),

    totalMonthlyIncomeElement: document.getElementById(
      "analysisTotalMonthlyIncome",
    ),

    monthlyExpensesElement: document.getElementById(
      "analysisMonthlyExpenses",
    ),

    monthlyCommitmentsElement: document.getElementById(
      "analysisMonthlyCommitments",
    ),

    remainingSurplusElement: document.getElementById(
      "analysisRemainingSurplus",
    ),

    pathPreviewElements: {
      fybcAge: document.getElementById("analysisPathFybcAge"),

      yearsRemaining: document.getElementById("analysisPathYearsRemaining"),

      monthlyLifestyle: document.getElementById(
        "analysisPathMonthlyLifestyle",
      ),

      monthlyLifestyleAtFybc: document.getElementById(
        "analysisPathMonthlyLifestyleAtFybc",
      ),

      lifestyleAtFybcLabel: document.getElementById(
        "analysisPathLifestyleAtFybcLabel",
      ),

      inflationAssumption: document.getElementById(
        "analysisPathInflationAssumption",
      ),

      methodologyLifestyleToday: document.getElementById(
        "analysisPathMethodologyLifestyleToday",
      ),

      methodologyInflation: document.getElementById(
        "analysisPathMethodologyInflation",
      ),

      methodologyFybcLabel: document.getElementById(
        "analysisPathMethodologyFybcLabel",
      ),

      methodologyLifestyleAtFybc: document.getElementById(
        "analysisPathMethodologyLifestyleAtFybc",
      ),

      methodologyPeriod: document.getElementById(
        "analysisPathMethodologyPeriod",
      ),

      lifetimeSpending: document.getElementById(
        "analysisPathLifetimeSpending",
      ),

      currentAssets: document.getElementById("analysisPathCurrentAssets"),

      currentCpfSavings: document.getElementById(
        "analysisPathCurrentCpfSavings",
      ),

      currentCpfBreakdown: document.getElementById(
        "analysisPathCurrentCpfBreakdown",
      ),

      affordableAmount: document.getElementById(
        "analysisPathAffordableAmount",
      ),

      currentStatus: document.getElementById("analysisPathCurrentStatus"),

      projectedPositionTitle: document.getElementById(
        "analysisPathProjectedPositionTitle",
      ),

      projectionIncomplete: document.getElementById(
        "analysisPathProjectionIncomplete",
      ),

      projectionResults: document.getElementById(
        "analysisPathProjectionResults",
      ),

      strategySelect: document.getElementById("analysisPathStrategySelect"),

      strategyNote: document.getElementById("analysisPathStrategyNote"),

      strategyDetailLink: document.getElementById(
        "analysisPathStrategyDetailLink",
      ),

      capitalNeededLabel: document.getElementById(
        "analysisPathCapitalNeededLabel",
      ),

      capitalNeededAtFybc: document.getElementById(
        "analysisPathCapitalNeededAtFybc",
      ),

      capitalNeedBasis: document.getElementById(
        "analysisPathCapitalNeedBasis",
      ),

      capitalNeedReductionNote: document.getElementById(
        "analysisPathCapitalReductionNote",
      ),

      recordedIncomeAtFybc: document.getElementById(
        "analysisPathRecordedIncomeAtFybc",
      ),

      recordedIncomeAtFybcBasis: document.getElementById(
        "analysisPathRecordedIncomeAtFybcBasis",
      ),

      projectedCpfLifeIncome: document.getElementById(
        "analysisPathProjectedCpfLifeIncome",
      ),

      projectedCpfLifeBasis: document.getElementById(
        "analysisPathProjectedCpfLifeBasis",
      ),

      grossCapitalAtFybc: document.getElementById(
        "analysisPathGrossCapitalAtFybc",
      ),

      incomeCapitalOffset: document.getElementById(
        "analysisPathIncomeCapitalOffset",
      ),

      netCapitalAtFybc: document.getElementById(
        "analysisPathNetCapitalAtFybc",
      ),

      postFybcReturn: document.getElementById("analysisPathPostFybcReturn"),

      incomeIncrementAssumption: document.getElementById(
        "analysisPathIncomeIncrementAssumption",
      ),

      expenseInflationAssumption: document.getElementById(
        "analysisPathExpenseInflationAssumption",
      ),
    },

    capitalMethodologyButtons: Array.from(
      document.querySelectorAll("[data-capital-breakdown]"),
    ),

    projectionBreakdownModal: document.getElementById(
      "projectionBreakdownModal",
    ),

    projectionBreakdownTitle: document.getElementById(
      "projectionBreakdownTitle",
    ),

    projectionBreakdownSubtitle: document.getElementById(
      "projectionBreakdownSubtitle",
    ),

    projectionBreakdownContent: document.getElementById(
      "projectionBreakdownContent",
    ),

    closeProjectionBreakdownButton: document.getElementById(
      "closeProjectionBreakdownButton",
    ),

    nextStepsElements: {
      suggestedMonthly: document.getElementById(
        "analysisNextSuggestedMonthly",
      ),

      availableMonthly: document.getElementById(
        "analysisNextAvailableMonthly",
      ),

      chosenMonthly: document.getElementById("analysisNextChosenMonthly"),

      monthlyAmountInput: document.getElementById(
        "analysisNextMonthlyAmountInput",
      ),

      growthRateInput: document.getElementById(
        "analysisNextGrowthRateInput",
      ),

      flexibilityRemaining: document.getElementById(
        "analysisNextFlexibilityRemaining",
      ),

      commitmentMessage: document.getElementById(
        "analysisNextCommitmentMessage",
      ),

      availableAssets: document.getElementById(
        "analysisNextAvailableAssets",
      ),

      assetsReservedNote: document.getElementById(
        "analysisNextAssetsReservedNote",
      ),

      assetsAmountInput: document.getElementById(
        "analysisNextAssetsAmountInput",
      ),

      assetsAmountHelp: document.getElementById(
        "analysisNextAssetsAmountHelp",
      ),

      assetsProjectedRow: document.getElementById(
        "analysisNextAssetsProjectedRow",
      ),

      assetsProjectedAtFybc: document.getElementById(
        "analysisNextAssetsProjectedAtFybc",
      ),

      investmentPolicies: document.getElementById(
        "analysisNextInvestmentPolicies",
      ),

      investmentGrowthRateInput: document.getElementById(
        "analysisNextInvestmentGrowthRateInput",
      ),

      endowmentValue: document.getElementById("analysisNextEndowmentValue"),

      eligibleOa: document.getElementById("analysisNextEligibleOa"),

      includeAssetsInput: document.getElementById(
        "analysisNextIncludeAssetsInput",
      ),

      includeInvestmentPoliciesInput: document.getElementById(
        "analysisNextIncludeInvestmentPoliciesInput",
      ),

      includeEndowmentInput: document.getElementById(
        "analysisNextIncludeEndowmentInput",
      ),

      includeOaInput: document.getElementById("analysisNextIncludeOaInput"),

      capitalNeeded: document.getElementById("analysisNextCapitalNeeded"),

      selectedResources: document.getElementById(
        "analysisNextSelectedResources",
      ),

      monthlyCommitmentValue: document.getElementById(
        "analysisNextMonthlyCommitmentValue",
      ),

      projectedFunding: document.getElementById(
        "analysisNextProjectedFunding",
      ),

      remainingGap: document.getElementById("analysisNextRemainingGap"),

      fundingProgressLabel: document.getElementById(
        "analysisNextFundingProgressLabel",
      ),

      fundingProgressBar: document.getElementById(
        "analysisNextFundingProgressBar",
      ),

      fundingStatus: document.getElementById("analysisNextFundingStatus"),
    },

    monthlyCommitmentInputs: Array.from(
      document.querySelectorAll('input[name="analysisMonthlyCommitment"]'),
    ),
  };
}
