"use strict";

import {
  closeModal,
  closeModalOnEscape,
  closeModalOnOverlayClick,
} from "../../utils/modal.js";

/* ========================================
   COST ANALYSIS EVENT BINDING
======================================== */

export function bindCostAnalysisEvents({
  elements,

  onRender,

  onExpenseInflationInput,

  onCpfLifeStartAgeChange,

  onRetirementStrategyChange,

  onStrategyDetailLinkClick,

  onAnalysisSectionCollapse,

  onGoalFilterChange,

  onSelectAllGoals,

  onMonthlyAmountInput,

  onIncludeAssetsChange,

  onCapitalMethodologyClick,
}) {
  const { pathPreviewElements, nextStepsElements } = elements;

  if (elements.employmentIncrementInput) {
    elements.employmentIncrementInput.addEventListener("input", onRender);
  }

  if (elements.expenseInflationInput) {
    elements.expenseInflationInput.addEventListener(
      "input",
      onExpenseInflationInput,
    );
  }

  elements.projectionPeriodInputs.forEach(function (input) {
    input.addEventListener("change", onRender);
  });

  elements.cpfLifeStartAgeInput?.addEventListener(
    "change",
    onCpfLifeStartAgeChange,
  );

  elements.retirementStrategyOptionsElement?.addEventListener(
    "change",
    function (event) {
      const input = event.target.closest(
        'input[name="analysisRetirementStrategy"]',
      );

      if (!input) {
        return;
      }

      onRetirementStrategyChange(input.value);
    },
  );

  pathPreviewElements.strategySelect?.addEventListener(
    "change",
    function (event) {
      onRetirementStrategyChange(event.currentTarget.value);
    },
  );

  pathPreviewElements.strategyDetailLink?.addEventListener(
    "click",
    onStrategyDetailLinkClick,
  );

  elements.analysisSectionCollapseButtons.forEach(function (button) {
    button.addEventListener("click", onAnalysisSectionCollapse);
  });

  elements.goalFilterOptions?.addEventListener("change", onGoalFilterChange);

  elements.selectAllGoalsButton?.addEventListener("click", onSelectAllGoals);

  elements.monthlyCommitmentInputs.forEach(function (input) {
    input.addEventListener("change", onRender);
  });

  nextStepsElements.assetsAmountInput?.addEventListener("input", onRender);

  nextStepsElements.monthlyAmountInput?.addEventListener(
    "input",
    onMonthlyAmountInput,
  );

  nextStepsElements.growthRateInput?.addEventListener("input", onRender);

  nextStepsElements.investmentGrowthRateInput?.addEventListener(
    "input",
    onRender,
  );

  nextStepsElements.includeAssetsInput?.addEventListener(
    "change",
    onIncludeAssetsChange,
  );

  [
    nextStepsElements.includeInvestmentPoliciesInput,

    nextStepsElements.includeEndowmentInput,

    nextStepsElements.includeOaInput,
  ].forEach(function (input) {
    input?.addEventListener("change", onRender);
  });

  elements.capitalMethodologyButtons.forEach(function (button) {
    button.addEventListener("click", onCapitalMethodologyClick);
  });

  elements.closeProjectionBreakdownButton?.addEventListener(
    "click",
    function () {
      closeModal(elements.projectionBreakdownModal);
    },
  );

  closeModalOnOverlayClick(elements.projectionBreakdownModal);

  closeModalOnEscape(elements.projectionBreakdownModal);
}
