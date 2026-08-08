"use strict";

import { getClientProfile, getGoals } from "../../state/client-plan.js";

import {
  getCpfLifePayoutStartAge,
  getInflationRate,
  getProjectedCohortFrs,
  setCpfLifePayoutStartAge,
} from "../cost-of-wants/cost-of-wants-service.js";

import { getProjectedCohortBasicHealthcareSum } from "../../services/cpf-healthcare-service.js";

import {
  DEFAULT_EMPLOYMENT_INCREMENT,
  DEFAULT_PROJECTION_PERIOD,
} from "./cost-analysis-config.js";

import { getProjectionStartDate } from "./cost-analysis-date-utils.js";

import {
  formatRate,
  getNonNegativeNumber,
  setText,
} from "./cost-analysis-format-utils.js";

import {
  handleAnalysisSectionCollapse,
  setAnalysisSectionExpanded,
} from "./cost-analysis-collapse.js";

import {
  excludedProjectionGoalIds,
  getExpenseInflationOverridden,
  getSelectedRetirementStrategy,
  setCurrentCashflowState,
  setExpenseInflationOverridden,
  setIncludeProjectedOa,
  setSelectedRetirementStrategy,
} from "./cost-analysis-state.js";

import {
  applySelectedRetirementStrategy,
  getDefaultRetirementStrategy,
  getRetirementStrategyApplicationYear,
  handleStrategyDetailLinkClick,
  renderRetirementStrategyResult,
  renderRetirementStrategySelection,
} from "./retirement-strategy.js";

import { calculateCurrentMonthlyCashflow } from "./current-cashflow-calculator.js";

import { renderCurrentMonthlyCashflow } from "./current-cashflow-renderer.js";

import {
  handleGoalFilterChange as goalFilterHandleChange,
  handleSelectAllGoals as goalFilterHandleSelectAll,
  renderGoalFilter,
} from "./goal-filter.js";

import {
  renderCpfLifeProjectionStatus,
  renderCpfPlanningAssumptions,
} from "./cpf-flow-renderer.js";

import {
  aggregateProjectionIntoAnnualRows,
  calculateProjection,
  getProjectionMonthCount,
  getSelectedProjectionPeriod,
} from "./projection-calculator.js";

import {
  renderCashflowProjectionTable,
  renderCpfProjectionTable,
  renderProjectionPeriodLabels,
} from "./projection-renderer.js";

import {
  handleCapitalMethodologyClick,
  renderYourNextSteps,
  renderYourPathPreview,
  renderYourPathProjectedPosition,
} from "./your-path-renderer.js";

/* ========================================
   COST ANALYSIS CONTROLLER
======================================== */

export function createCostAnalysisController({ elements }) {
  const { pathPreviewElements, nextStepsElements } = elements;

  /* ========================================
     MAIN RENDER
  ======================================== */

  function render() {
    const cpfLifeStartAge = getCpfLifePayoutStartAge();

    if (elements.cpfLifeStartAgeInput) {
      elements.cpfLifeStartAgeInput.value = String(cpfLifeStartAge);
    }

    if (!getExpenseInflationOverridden()) {
      syncExpenseInflationDefault();
    }

    const currentCashflow = calculateCurrentMonthlyCashflow();

    setCurrentCashflowState(currentCashflow);

    renderCurrentMonthlyCashflow(elements, currentCashflow);

    renderYourPathPreview(elements, currentCashflow);

    renderGoalFilter(elements, getGoals());

    const selectedPeriod = getSelectedProjectionPeriod(elements);

    const usesAnnualRows = selectedPeriod !== DEFAULT_PROJECTION_PERIOD;

    const startingDate = getProjectionStartDate();

    const projectionMonths = getProjectionMonthCount(
      selectedPeriod,
      startingDate,
    );

    const cohortFrs = getProjectedCohortFrs();

    const cohortFrsAmount = cohortFrs.isValid ? cohortFrs.amount : 0;

    const retirementStrategyApplicationYear =
      getRetirementStrategyApplicationYear({
        dateOfBirth: getClientProfile().dateOfBirth,

        startingDate,
      });

    renderRetirementStrategySelection({
      elements,

      cohortFrsAmount,

      strategyApplicationYear: retirementStrategyApplicationYear,
    });

    const projectedCohortBhs = getProjectedCohortBasicHealthcareSum({
      dateOfBirth: getClientProfile().dateOfBirth,
    });

    renderCpfPlanningAssumptions(elements, {
      cohortFrs,
      projectedCohortBhs,
    });

    const projectionSettings = {
      currentCashflow,

      annualEmploymentIncrement:
        getNonNegativeNumber(elements.employmentIncrementInput?.value) / 100,

      annualExpenseInflation:
        getNonNegativeNumber(elements.expenseInflationInput?.value) / 100,

      startingDate,

      cohortFrsAmount,

      retirementStrategy: getSelectedRetirementStrategy(),

      retirementStrategyApplicationYear,

      cpfLifeStartAge,
    };

    /*
     * The increment/inflation inputs live on the Detailed Cashflow &
     * CPF Flow page, but their current values still affect the
     * projection behind Part 3 (CPF growth, ending withdrawable
     * balance). Surface them read-only here so the numbers stay
     * explainable without needing to leave Analysis.
     */
    setText(
      pathPreviewElements.incomeIncrementAssumption,
      formatRate(getNonNegativeNumber(elements.employmentIncrementInput?.value)),
    );

    setText(
      pathPreviewElements.expenseInflationAssumption,
      formatRate(getNonNegativeNumber(elements.expenseInflationInput?.value)),
    );

    const monthlyProjection = calculateProjection({
      ...projectionSettings,

      projectionMonths,
    });

    renderCpfLifeProjectionStatus(elements, {
      rows: monthlyProjection,
      cpfLifeStartAge,
    });

    const displayRows = usesAnnualRows
      ? aggregateProjectionIntoAnnualRows(monthlyProjection)
      : monthlyProjection;

    renderProjectionPeriodLabels(elements, {
      selectedPeriod,
      usesAnnualRows,
    });

    renderCashflowProjectionTable(elements, {
      rows: displayRows,
      usesAnnualRows,
    });

    renderCpfProjectionTable(elements, {
      rows: displayRows,
      usesAnnualRows,
    });

    const analysisProjectionMonths = getProjectionMonthCount(
      "mortality",
      startingDate,
    );

    const analysisProjection =
      projectionMonths === analysisProjectionMonths
        ? monthlyProjection
        : calculateProjection({
            ...projectionSettings,

            projectionMonths: analysisProjectionMonths,
          });

    /*
     * Use the full mortality-age projection for the strategy
     * result. Otherwise a client who reaches age 55 outside
     * the selected 10-year table would show no top-up result.
     */
    renderRetirementStrategyResult(elements, analysisProjection);

    renderYourPathProjectedPosition(elements, {
      rows: analysisProjection,

      cpfLifeStartAge,
    });

    renderYourNextSteps(elements, currentCashflow);
  }

  function syncExpenseInflationDefault() {
    if (!elements.expenseInflationInput) {
      return;
    }

    elements.expenseInflationInput.value = String(
      getNonNegativeNumber(getInflationRate()),
    );
  }

  /* ========================================
     EVENT HANDLERS
  ======================================== */

  function handleExpenseInflationInput() {
    setExpenseInflationOverridden(true);

    render();
  }

  function handleCpfLifeStartAgeChange(event) {
    const wasSaved = setCpfLifePayoutStartAge(event.currentTarget.value);

    if (!wasSaved) {
      event.currentTarget.value = String(getCpfLifePayoutStartAge());
    }

    render();
  }

  function handleRetirementStrategyChange(strategy) {
    applySelectedRetirementStrategy(strategy);

    render();
  }

  function handleGoalFilterChange(event) {
    goalFilterHandleChange(event);

    render();
  }

  function handleSelectAllGoals() {
    goalFilterHandleSelectAll();

    render();
  }

  function handleMonthlyAmountInput() {
    const selectedInput = elements.monthlyCommitmentInputs.find(function (
      input,
    ) {
      return input.checked;
    });

    if (selectedInput?.value === "custom") {
      render();
    }
  }

  function handleIncludeAssetsChange() {
    /*
     * We deliberately do not automatically put the
     * full available balance into the plan.
     */
    render();

    if (nextStepsElements.includeAssetsInput.checked) {
      nextStepsElements.assetsAmountInput?.focus();
    }
  }

  function handleCapitalMethodologyClickEvent(event) {
    handleCapitalMethodologyClick(elements, event);
  }

  /* ========================================
     RESET
  ======================================== */

  function reset() {
    if (elements.employmentIncrementInput) {
      elements.employmentIncrementInput.value = DEFAULT_EMPLOYMENT_INCREMENT;
    }

    setExpenseInflationOverridden(false);

    syncExpenseInflationDefault();

    elements.projectionPeriodInputs.forEach(function (input) {
      input.checked = input.value === DEFAULT_PROJECTION_PERIOD;
    });

    excludedProjectionGoalIds.clear();

    setIncludeProjectedOa(false);

    setSelectedRetirementStrategy(
      getDefaultRetirementStrategy(getClientProfile().employmentStatus),
    );

    elements.analysisSectionCollapseButtons.forEach(function (button) {
      const targetId = button.dataset.analysisCollapseTarget;

      const content = document.getElementById(targetId);

      if (!content) {
        return;
      }

      setAnalysisSectionExpanded({
        button,

        content,

        expanded: false,
      });
    });

    render();
  }

  return {
    render,

    reset,

    handleExpenseInflationInput,

    handleCpfLifeStartAgeChange,

    handleRetirementStrategyChange,

    handleStrategyDetailLinkClick,

    handleAnalysisSectionCollapse,

    handleGoalFilterChange,

    handleSelectAllGoals,

    handleMonthlyAmountInput,

    handleIncludeAssetsChange,

    handleCapitalMethodologyClick: handleCapitalMethodologyClickEvent,
  };
}
