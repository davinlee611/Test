"use strict";

import {
  CPF_LIFE_PAYOUT_MODEL,
  CPF_RA_COMPOUNDING_YEARS,
  CPF_RA_INTEREST_RATE,
  getCpfCohortAgeText,
} from "./cost-of-wants-calculator.js";

import { costOfWantsElements } from "./cost-of-wants-elements.js";

const elements = costOfWantsElements;

/* ========================================
   CLIENT DETAILS
======================================== */

export function renderClientDetails(currentAge) {
  if (!elements.inputs.currentAge) {
    return;
  }

  elements.inputs.currentAge.value =
    currentAge === null ? "" : String(currentAge);
}

/* ========================================
   SAVED INPUTS
======================================== */

export function syncCostOfWantsInputs(costOfWants) {
  setOptionalNumberInput(
    elements.inputs.desiredFybcAge,
    costOfWants.desiredFybcAge,
  );

  setNumberInput(
    elements.inputs.plannedMortalityAge,
    costOfWants.plannedMortalityAge,
  );

  setNumberInput(elements.inputs.inflationRate, costOfWants.inflationRate);
}

/* ========================================
   LIFESTYLE SELECTION
======================================== */

export function renderLifestyleSelection(costOfWants) {
  const { lifestyleOption, customMonthlyIncome } = costOfWants;

  elements.lifestyle.optionButtons.forEach(function (button) {
    const isSelected = button.dataset.lifestyleOption === lifestyleOption;

    button.classList.toggle("is-selected", isSelected);

    button.setAttribute("aria-checked", String(isSelected));
  });

  if (elements.lifestyle.customIncomeGroup) {
    elements.lifestyle.customIncomeGroup.hidden = lifestyleOption !== "custom";
  }

  if (elements.inputs.customIncome) {
    elements.inputs.customIncome.value =
      customMonthlyIncome > 0 ? String(customMonthlyIncome) : "";
  }
}

/* ========================================
   SELECTED INCOME
======================================== */

export function renderSelectedIncome(monthlyIncome) {
  if (
    !elements.lifestyle.selectedIncomeSummary ||
    !elements.lifestyle.selectedIncomeAmount
  ) {
    return;
  }

  elements.lifestyle.selectedIncomeSummary.hidden = false;

  elements.lifestyle.selectedIncomeAmount.textContent =
    monthlyIncome > 0 ? formatCurrency(monthlyIncome) : "Not selected";
}

/* ========================================
   MONTHLY SPENDING BREAKDOWN
======================================== */

export function renderMonthlySpendingBreakdown(breakdown) {
  if (!breakdown) {
    return;
  }

  setCurrencyText(
    elements.spending.householdAmount,
    breakdown.expenses.household,
  );

  setCurrencyText(
    elements.spending.transportAmount,
    breakdown.expenses.transport,
  );

  setCurrencyText(
    elements.spending.subscriptionsAmount,
    breakdown.expenses.subscriptionsLifestyle,
  );

  setCurrencyText(
    elements.spending.dependantsAmount,
    breakdown.expenses.parentsDependantsSupport,
  );

  setCurrencyText(
    elements.spending.otherExpensesAmount,
    breakdown.expenses.otherRecurringExpenses,
  );

  setCurrencyText(
    elements.spending.liabilityRepayments,
    breakdown.commitments.liabilityRepayments,
  );

  setCurrencyText(
    elements.spending.insuranceAmount,
    breakdown.commitments.insurancePremiums,
  );

  setCurrencyText(
    elements.spending.totalExpenses,
    breakdown.totalMonthlyExpenses,
  );

  setCurrencyText(
    elements.spending.totalCommitments,
    breakdown.totalMonthlyCommitments,
  );

  setCurrencyText(
    elements.spending.totalSpending,
    breakdown.totalMonthlyOutflow,
  );
}

/* ========================================
   FLOATING SUMMARY
======================================== */

export function renderFloatingSummary(position) {
  if (!position) {
    return;
  }

  setSignedCurrencyText(
    elements.floatingSummary.monthlySurplus,
    position.monthlySurplus,
  );

  setCurrencyText(
    elements.floatingSummary.goalSavings,
    position.minimumGoalSavings,
  );

  setSignedCurrencyText(
    elements.floatingSummary.netSurplus,
    position.netSurplus,
  );

  setCurrencyText(
    elements.floatingSummary.breakdown.income,
    position.monthlyTakeHomeIncome,
  );

  setDeductionCurrencyText(
    elements.floatingSummary.breakdown.expenses,
    position.monthlyExpenses,
  );

  setDeductionCurrencyText(
    elements.floatingSummary.breakdown.commitments,
    position.monthlyCommitments,
  );

  setSignedCurrencyText(
    elements.floatingSummary.breakdown.surplus,
    position.monthlySurplus,
  );

  setDeductionCurrencyText(
    elements.floatingSummary.breakdown.goalSavings,
    position.minimumGoalSavings,
  );

  setSignedCurrencyText(
    elements.floatingSummary.breakdown.netSurplus,
    position.netSurplus,
  );

  renderGoalSavingsBreakdown(position.goalSavingsSummary);

  renderGoalSavingsStatus(position.goalSavingsSummary);

  setSignedCurrencyText(
    elements.floatingSummary.availableSurplus,
    position.netSurplus,
  );

  applyFinancialPositionClass(
    elements.floatingSummary.container,
    position.netSurplus,
  );
}

function renderGoalSavingsBreakdown(goalSavingsSummary) {
  if (!elements.floatingSummary.goalSavingsList) {
    return;
  }

  elements.floatingSummary.goalSavingsList.replaceChildren();

  const validGoals = goalSavingsSummary?.validGoals || [];

  if (validGoals.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.className = "cost-of-wants-goal-savings-empty";

    emptyMessage.textContent = "No active goal savings required.";

    elements.floatingSummary.goalSavingsList.append(emptyMessage);

    return;
  }

  const fragment = document.createDocumentFragment();

  validGoals.forEach(function (goal) {
    fragment.append(createGoalSavingsRow(goal));
  });

  elements.floatingSummary.goalSavingsList.append(fragment);
}

function createGoalSavingsRow(goal) {
  const row = document.createElement("div");

  row.className = "cost-of-wants-goal-savings-row";

  const nameElement = document.createElement("span");

  nameElement.className = "cost-of-wants-goal-savings-name";

  const goalName = goal.name || "Unnamed Goal";

  nameElement.textContent = goalName;
  nameElement.title = goalName;

  const amountElement = document.createElement("strong");

  amountElement.className = "cost-of-wants-goal-savings-amount";

  amountElement.textContent = `-${formatCurrency(
    Math.abs(goal.monthlySavings),
  )}`;

  row.append(nameElement, amountElement);

  return row;
}

function renderGoalSavingsStatus(goalSavingsSummary) {
  if (!elements.floatingSummary.goalSavingsStatus) {
    return;
  }

  const reviewCount = goalSavingsSummary?.reviewGoalCount || 0;

  const incompleteCount = goalSavingsSummary?.incompleteGoalCount || 0;

  const messages = [];

  if (reviewCount > 0) {
    messages.push(
      `${reviewCount} overdue ${
        reviewCount === 1 ? "goal requires" : "goals require"
      } review`,
    );
  }

  if (incompleteCount > 0) {
    messages.push(
      `${incompleteCount} incomplete ${
        incompleteCount === 1 ? "goal is" : "goals are"
      } excluded`,
    );
  }

  elements.floatingSummary.goalSavingsStatus.hidden = messages.length === 0;

  elements.floatingSummary.goalSavingsStatus.textContent = messages.join(" · ");

  elements.floatingSummary.goalSavingsStatus.classList.toggle(
    "is-review",
    messages.length > 0,
  );
}

/* ========================================
   CPF RETIREMENT OPTION
======================================== */

export function renderCpfRetirementOptionSelection(selectedOption) {
  elements.cpf.optionButtons.forEach(function (button) {
    const isSelected = button.dataset.cpfRetirementOption === selectedOption;

    button.classList.toggle("selected", isSelected);

    button.setAttribute("aria-checked", String(isSelected));
  });
}

/* ========================================
   PROJECTED CPF RETIREMENT SUMS
======================================== */

export function renderProjectedCpfRetirementSums(projection) {
  if (!projection?.isValid) {
    renderEmptyCpfRetirementSums(
      projection?.message || "CPF retirement projection is unavailable.",
    );

    return;
  }

  const cohortAgeText = getCpfCohortAgeText(projection.yearTurning55);

  setCurrencyText(elements.cpf.projectedBrs, projection.retirementSums.brs);

  setCurrencyText(elements.cpf.projectedFrs, projection.retirementSums.frs);

  setCurrencyText(elements.cpf.projectedErs, projection.retirementSums.ers);

  setCurrencyText(
    elements.cpf.projectedBrsPayout,
    projection.monthlyPayouts.brs,
  );

  setCurrencyText(
    elements.cpf.projectedFrsPayout,
    projection.monthlyPayouts.frs,
  );

  setCurrencyText(
    elements.cpf.projectedErsPayout,
    projection.monthlyPayouts.ers,
  );

  renderCpfProjectionBasis({
    retirementSumBasis: projection.retirementSumBasis,

    payoutBasis: projection.payoutBasis,
  });

  renderCpfPayoutMethodology(projection);

  if (!elements.cpf.projectionCaption) {
    return;
  }

  const genderLabel = projection.gender === "male" ? "male" : "female";

  if (
    projection.retirementSumBasis === "official" &&
    projection.payoutBasis === "official"
  ) {
    elements.cpf.projectionCaption.textContent = [
      cohortAgeText,

      `Published Retirement Sums and available ${genderLabel}`,

      `CPF LIFE payout figures are used.`,
    ].join(" ");

    return;
  }

  if (
    projection.retirementSumBasis === "official" &&
    projection.payoutBasis === "projected"
  ) {
    elements.cpf.projectionCaption.textContent = [
      cohortAgeText,

      `Published CPF Retirement Sums are used.`,

      `CPF LIFE payouts are estimated using the locked`,

      `${CPF_LIFE_PAYOUT_MODEL.basisYear} ${genderLabel}`,

      `payout relationship and a projected RA balance at age 65.`,
    ].join(" ");

    return;
  }

  elements.cpf.projectionCaption.textContent = [
    cohortAgeText,

    `Retirement Sums assume an annual increase of`,

    `${formatPercentage(projection.annualGrowthRate)}.`,

    `CPF LIFE payouts are estimated using the locked`,

    `${CPF_LIFE_PAYOUT_MODEL.basisYear} ${genderLabel}`,

    `payout relationship and a projected RA balance at age 65.`,
  ].join(" ");
}

/* ========================================
   CPF PAYOUT METHODOLOGY
======================================== */

function renderCpfPayoutMethodology(projection) {
  if (
    !elements.cpf.payoutHelper ||
    !elements.cpf.calculationSummary ||
    !elements.cpf.calculationData
  ) {
    return;
  }

  if (projection.payoutBasis === "official") {
    renderOfficialCpfPayoutMethodology(projection);

    return;
  }

  renderProjectedCpfPayoutMethodology(projection);
}

function renderProjectedCpfPayoutMethodology(projection) {
  const model = CPF_LIFE_PAYOUT_MODEL[projection.gender];

  if (!model) {
    renderEmptyCpfPayoutMethodology();
    return;
  }

  const genderLabel = projection.gender === "male" ? "Male" : "Female";

  const conversionFactor = model.raFactor * 100;

  elements.cpf.payoutHelper.textContent =
    `RA payout projection using a conversion factor of ` +
    `${formatCpfPayoutFactor(conversionFactor)}.`;

  elements.cpf.calculationSummary.textContent = [
    `The projected ${genderLabel.toLowerCase()} CPF LIFE payout`,

    `uses the relationship observed from the 2026 BRS, FRS`,

    `and ERS payout figures.`,

    `A fixed monthly amount of ${formatCurrency(model.fixedAmount)}`,

    `is added to ${formatCpfPayoutFactor(conversionFactor)}`,

    `of the projected RA balance at age 65.`,
  ].join(" ");

  elements.cpf.calculationData.replaceChildren(
    createCpfMethodologyRow(
      "Model basis",

      `${CPF_LIFE_PAYOUT_MODEL.basisYear} ${genderLabel} CPF LIFE figures`,
    ),

    createCpfMethodologyRow(
      "Monthly payout formula",

      `${formatCurrency(model.fixedAmount)} + RA at age 65 × ` +
        `${formatCpfPayoutFactor(conversionFactor)}`,
    ),

    createCpfMethodologyRow(
      "RA projection",

      `Retirement Sum at age 55 compounded at ` +
        `${formatPercentage(CPF_RA_INTEREST_RATE)} annually for ` +
        `${CPF_RA_COMPOUNDING_YEARS} years`,
    ),

    createCpfMethodologyRow(
      "RA compounding multiplier",

      formatCpfMultiplier(
        Math.pow(
          1 + CPF_RA_INTEREST_RATE / 100,

          CPF_RA_COMPOUNDING_YEARS,
        ),
      ),
    ),
  );
}

function renderOfficialCpfPayoutMethodology(projection) {
  elements.cpf.payoutHelper.textContent =
    "Published CPF LIFE payout figures are used for this cohort.";

  elements.cpf.calculationSummary.textContent = [
    `The client belongs to the ${projection.yearTurning55}`,

    `CPF Retirement Sum cohort.`,

    `The displayed monthly payouts are taken directly from`,

    `the stored CPF LIFE figures for that cohort and gender.`,
  ].join(" ");

  elements.cpf.calculationData.replaceChildren(
    createCpfMethodologyRow(
      "Cohort year",

      String(projection.yearTurning55),
    ),

    createCpfMethodologyRow(
      "Gender",

      projection.gender === "male" ? "Male" : "Female",
    ),

    createCpfMethodologyRow(
      "Retirement Sum basis",

      "Published cohort values",
    ),

    createCpfMethodologyRow(
      "CPF LIFE payout basis",

      "Published cohort payout figures",
    ),
  );
}

function createCpfMethodologyRow(label, value) {
  const row = document.createElement("div");

  row.className = "cost-of-wants-cpf-calculation-row";

  const labelElement = document.createElement("span");

  labelElement.textContent = label;

  const valueElement = document.createElement("strong");

  valueElement.textContent = value;

  row.append(labelElement, valueElement);

  return row;
}

/* ========================================
   EMPTY CPF PROJECTION
======================================== */

function renderEmptyCpfRetirementSums(message) {
  renderEmptyCpfPayoutMethodology();

  const retirementSumElements = [
    elements.cpf.projectedBrs,
    elements.cpf.projectedFrs,
    elements.cpf.projectedErs,
  ];

  const payoutElements = [
    elements.cpf.projectedBrsPayout,
    elements.cpf.projectedFrsPayout,
    elements.cpf.projectedErsPayout,
  ];

  const basisElements = [
    elements.cpf.projectedBrsBasis,
    elements.cpf.projectedFrsBasis,
    elements.cpf.projectedErsBasis,
  ];

  retirementSumElements.forEach(function (element) {
    if (element) {
      element.textContent = "--";
    }
  });

  payoutElements.forEach(function (element) {
    if (element) {
      element.textContent = "--";
    }
  });

  basisElements.forEach(function (element) {
    if (!element) {
      return;
    }

    element.textContent = "--";

    element.classList.remove("is-official", "is-projected", "is-mixed");
  });

  if (elements.cpf.projectionCaption) {
    elements.cpf.projectionCaption.textContent = message;
  }
}

function renderEmptyCpfPayoutMethodology() {
  if (elements.cpf.payoutHelper) {
    elements.cpf.payoutHelper.textContent = "--";
  }

  if (elements.cpf.calculationSummary) {
    elements.cpf.calculationSummary.textContent = "--";
  }

  elements.cpf.calculationData?.replaceChildren();

  if (elements.cpf.calculationDetails) {
    elements.cpf.calculationDetails.hidden = true;
  }

  elements.cpf.calculationToggleButton?.setAttribute("aria-expanded", "false");

  elements.cpf.calculationToggleIcon?.classList.remove("is-expanded");
}

/* ========================================
   CPF PROJECTION BASIS
======================================== */

function renderCpfProjectionBasis({ retirementSumBasis, payoutBasis }) {
  let label = "Projected";
  let stateClass = "is-projected";

  if (retirementSumBasis === "official" && payoutBasis === "official") {
    label = "Official";
    stateClass = "is-official";
  } else if (retirementSumBasis === "official" && payoutBasis === "projected") {
    label = "Official sum / Projected payout";

    stateClass = "is-mixed";
  }

  const basisElements = [
    elements.cpf.projectedBrsBasis,
    elements.cpf.projectedFrsBasis,
    elements.cpf.projectedErsBasis,
  ];

  basisElements.forEach(function (element) {
    if (!element) {
      return;
    }

    element.textContent = label;

    element.classList.remove("is-official", "is-projected", "is-mixed");

    element.classList.add(stateClass);
  });
}

/* ========================================
   CPF FORMATTERS
======================================== */

function formatCpfPayoutFactor(value) {
  return (
    new Intl.NumberFormat("en-SG", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value) + "%"
  );
}

function formatCpfMultiplier(value) {
  return new Intl.NumberFormat("en-SG", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
}

function formatPercentage(value) {
  return (
    new Intl.NumberFormat("en-SG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value) + "%"
  );
}

/* ========================================
   FYBC PROJECTION
======================================== */

export function renderFybcProjection({
  projection,
  cpfProjection,
  selectedCpfRetirementOption,
}) {
  if (!projection?.isValid) {
    renderEmptyFybcProjection();
    return;
  }

  renderFybcProjectionResults(projection);

  renderFybcProjectionMethodology(projection);

  renderCostOfWantsTimeline({
    projection,
    cpfProjection,
    selectedCpfRetirementOption,
  });
}

/* ========================================
   FYBC RESULTS
======================================== */

function renderFybcProjectionResults(projection) {
  if (elements.fybc.yearsRemaining) {
    const yearLabel = projection.yearsRemaining === 1 ? "Year" : "Years";

    elements.fybc.yearsRemaining.textContent = `${projection.yearsRemaining} ${yearLabel}`;
  }

  if (elements.fybc.income) {
    elements.fybc.income.textContent = formatCurrency(
      projection.monthlyIncomeAtFybc,
    );
  }

  if (elements.fybc.incomeAt65) {
    elements.fybc.incomeAt65.textContent = formatCurrency(
      projection.monthlyIncomeAt65,
    );
  }

  if (elements.fybc.inflationNote) {
    elements.fybc.inflationNote.textContent = `Assuming ${formatPercentage(
      projection.inflationRate * 100,
    )} annual inflation`;
  }

  if (elements.fybc.cpfLifeIncome) {
    elements.fybc.cpfLifeIncome.textContent = formatCurrency(
      projection.cpfLifePayout,
    );
  }

  if (elements.fybc.requiredCapital) {
    elements.fybc.requiredCapital.textContent = formatCurrency(
      projection.totalCapitalRequired,
    );
  }

  if (elements.outcome.capitalNeededHelper) {
    elements.outcome.capitalNeededHelper.textContent =
      `After accounting monthly income needed until ` +
      `planned mortality age of ${projection.mortalityAge}`;
  }
}

/* ========================================
   COST OF WANTS TIMELINE
======================================== */

function renderCostOfWantsTimeline({
  projection,
  cpfProjection,
  selectedCpfRetirementOption,
}) {
  if (!cpfProjection?.isValid) {
    renderEmptyCostOfWantsTimeline();
    return;
  }

  const brsPayout = getValidNumber(cpfProjection.monthlyPayouts?.brs);

  const frsPayout = getValidNumber(cpfProjection.monthlyPayouts?.frs);

  const ersPayout = getValidNumber(cpfProjection.monthlyPayouts?.ers);

  const incomeNeeded = getValidNumber(projection.monthlyIncomeAt65);

  const selectedCpfPayout =
    selectedCpfRetirementOption === "self_employed"
      ? 0
      : getValidNumber(
          cpfProjection.monthlyPayouts?.[selectedCpfRetirementOption],
        );

  const incomeGap = Math.max(0, incomeNeeded - selectedCpfPayout);

  if (elements.outcome.incomeGap) {
    elements.outcome.incomeGap.textContent = `${formatCurrency(incomeGap)}/mth`;
  }

  if (elements.outcome.remainingCapital) {
    elements.outcome.remainingCapital.textContent = formatCurrency(
      projection.totalCapitalRequired,
    );
  }

  const payoutProgressPercentage =
    incomeNeeded > 0
      ? Math.min(100, Math.max(0, (selectedCpfPayout / incomeNeeded) * 100))
      : 0;

  if (elements.timeline.progress) {
    elements.timeline.progress.style.width = `${payoutProgressPercentage}%`;
  }

  elements.timeline.content?.classList.add("is-ready");

  if (elements.timeline.brsAmount) {
    elements.timeline.brsAmount.textContent = `${formatCurrency(brsPayout)}/mth`;
  }

  if (elements.timeline.frsAmount) {
    elements.timeline.frsAmount.textContent = `${formatCurrency(frsPayout)}/mth`;
  }

  if (elements.timeline.ersAmount) {
    elements.timeline.ersAmount.textContent = `${formatCurrency(ersPayout)}/mth`;
  }

  if (elements.timeline.goalAmount) {
    elements.timeline.goalAmount.textContent = `${formatCurrency(incomeNeeded)}/mth`;
  }

  if (elements.timeline.incomeNeeded) {
    elements.timeline.incomeNeeded.textContent = `${formatCurrency(incomeNeeded)}/mth`;
  }

  if (elements.timeline.totalPayouts) {
    elements.timeline.totalPayouts.textContent = `${formatCurrency(
      selectedCpfPayout,
    )}/mth`;
  }

  positionCostOfWantsTimelineMarkers({
    brsPayout,
    frsPayout,
    ersPayout,
    incomeNeeded,
  });
}

function positionCostOfWantsTimelineMarkers({
  brsPayout,
  frsPayout,
  ersPayout,
  incomeNeeded,
}) {
  if (!Number.isFinite(incomeNeeded) || incomeNeeded <= 0) {
    return;
  }

  const getPayoutPosition = function (payout) {
    if (!Number.isFinite(payout) || payout <= 0) {
      return 0;
    }

    const percentage = (payout / incomeNeeded) * 100;

    /*
     * Keep payout indicators within the visible
     * timeline. The goal flag remains fixed at 100%.
     */
    return Math.min(94, Math.max(4, percentage));
  };

  if (elements.timeline.brsMarker) {
    elements.timeline.brsMarker.style.left = `${getPayoutPosition(brsPayout)}%`;
  }

  if (elements.timeline.frsMarker) {
    elements.timeline.frsMarker.style.left = `${getPayoutPosition(frsPayout)}%`;
  }

  if (elements.timeline.ersMarker) {
    elements.timeline.ersMarker.style.left = `${getPayoutPosition(ersPayout)}%`;
  }

  if (elements.timeline.goalMarker) {
    elements.timeline.goalMarker.style.left = "100%";
  }
}

/* ========================================
   FYBC PROJECTION METHODOLOGY
======================================== */

function renderFybcProjectionMethodology(projection) {
  if (
    !elements.projection.calculationSummary ||
    !elements.projection.calculationData
  ) {
    return;
  }

  const cpfLifeStartAge = 65;

  const monthlyIncomeAtCpfLifeStart = projection.monthlyIncomeAt65;

  const passiveIncomeNeededAfterCpf = Math.max(
    0,
    monthlyIncomeAtCpfLifeStart - projection.cpfLifePayout,
  );

  elements.projection.calculationSummary.textContent =
    "Your desired passive income is adjusted for inflation. " +
    "Before age 65, the full amount must be funded privately. " +
    "From age 65, estimated CPF LIFE income reduces the " +
    "amount required.";

  elements.projection.calculationData.innerHTML = `
    <div class="cost-of-wants-projection-flow">
      <div class="cost-of-wants-projection-flow-step">
        <span class="cost-of-wants-projection-flow-label">
          Today's Desired Passive Income
        </span>

        <strong class="cost-of-wants-projection-flow-value">
          ${formatCurrency(projection.monthlyPassiveIncome)}/mth
        </strong>
      </div>

      ${createProjectionFlowChevron()}

      <div class="cost-of-wants-projection-flow-step">
        <span class="cost-of-wants-projection-flow-label">
          Inflation
        </span>

        <strong class="cost-of-wants-projection-flow-value">
          ${formatPercentage(projection.inflationRate * 100)}
          p.a. for ${projection.yearsRemaining}
          ${projection.yearsRemaining === 1 ? "year" : "years"}
        </strong>
      </div>

      ${createProjectionFlowChevron()}

      <div class="cost-of-wants-projection-flow-step">
        <span class="cost-of-wants-projection-flow-label">
          Projected Passive Income Needed at Age
          ${projection.desiredFybcAge}
        </span>

        <strong class="cost-of-wants-projection-flow-value">
          ${formatCurrency(projection.monthlyIncomeAtFybc)}/mth
        </strong>
      </div>

      ${
        projection.desiredFybcAge < cpfLifeStartAge
          ? createPreAndPostCpfProjectionFlow({
              projection,
              monthlyIncomeAtCpfLifeStart,
              passiveIncomeNeededAfterCpf,
            })
          : createPostCpfOnlyProjectionFlow({
              projection,
              passiveIncomeNeededAfterCpf,
            })
      }

      ${createProjectionFlowChevron()}

      <div
        class="
          cost-of-wants-projection-flow-step
          cost-of-wants-projection-flow-step--total
        "
      >
        <span class="cost-of-wants-projection-flow-label">
          Total Capital Required
        </span>

        <strong class="cost-of-wants-projection-flow-total">
          ${formatCurrency(projection.totalCapitalRequired)}
        </strong>

        <small class="cost-of-wants-projection-flow-note">
          Annual income requirements are increased by inflation
          until age ${projection.mortalityAge}.
        </small>
      </div>
    </div>
  `;
}

function createProjectionFlowChevron() {
  return `
    <div
      class="cost-of-wants-projection-flow-chevron"
      aria-hidden="true"
    >
      <i class="fa-solid fa-chevron-down"></i>
    </div>
  `;
}

function createPreAndPostCpfProjectionFlow({
  projection,
  monthlyIncomeAtCpfLifeStart,
  passiveIncomeNeededAfterCpf,
}) {
  return `
    <div
      class="cost-of-wants-projection-flow-branch"
      aria-hidden="true"
    >
      <span></span>
      <i class="fa-solid fa-chevron-down"></i>
      <i class="fa-solid fa-chevron-down"></i>
    </div>

    <div class="cost-of-wants-projection-flow-split">
      <div class="cost-of-wants-projection-flow-period">
        <span class="cost-of-wants-projection-flow-period-age">
          Age ${projection.desiredFybcAge}–64
        </span>

        <span
          class="
            cost-of-wants-projection-flow-period-description
          "
        >
          CPF LIFE Not Yet Paid
        </span>

        <span class="cost-of-wants-projection-flow-label">
          Passive Income Needed
        </span>

        <strong class="cost-of-wants-projection-flow-value">
          ${formatCurrency(projection.monthlyIncomeAtFybc)}/mth
        </strong>

        <small class="cost-of-wants-projection-flow-note">
          Starting at age
          ${projection.desiredFybcAge}
        </small>
      </div>

      <div class="cost-of-wants-projection-flow-period">
        <span class="cost-of-wants-projection-flow-period-age">
          Age 65–${projection.mortalityAge}
        </span>

        <span
          class="
            cost-of-wants-projection-flow-period-description
          "
        >
          CPF LIFE Starts
        </span>

        <span class="cost-of-wants-projection-flow-label">
          Passive Income Needed
        </span>

        <strong class="cost-of-wants-projection-flow-value">
          ${formatCurrency(passiveIncomeNeededAfterCpf)}/mth
        </strong>

        <small class="cost-of-wants-projection-flow-note">
          ${formatCurrency(monthlyIncomeAtCpfLifeStart)}
          less ${formatCurrency(projection.cpfLifePayout)}
          CPF LIFE
        </small>
      </div>
    </div>
  `;
}

function createPostCpfOnlyProjectionFlow({
  projection,
  passiveIncomeNeededAfterCpf,
}) {
  return `
    ${createProjectionFlowChevron()}

    <div class="cost-of-wants-projection-flow-period">
      <span class="cost-of-wants-projection-flow-period-age">
        Age ${projection.desiredFybcAge}–${projection.mortalityAge}
      </span>

      <span
        class="
          cost-of-wants-projection-flow-period-description
        "
      >
        CPF LIFE Included
      </span>

      <span class="cost-of-wants-projection-flow-label">
        Passive Income Needed
      </span>

      <strong class="cost-of-wants-projection-flow-value">
        ${formatCurrency(passiveIncomeNeededAfterCpf)}/mth
      </strong>

      <small class="cost-of-wants-projection-flow-note">
        ${formatCurrency(projection.monthlyIncomeAtFybc)}
        less ${formatCurrency(projection.cpfLifePayout)}
        CPF LIFE
      </small>
    </div>
  `;
}

/* ========================================
   EMPTY FYBC PROJECTION
======================================== */

function renderEmptyFybcProjection() {
  if (elements.fybc.yearsRemaining) {
    elements.fybc.yearsRemaining.textContent = "--";
  }

  if (elements.fybc.income) {
    elements.fybc.income.textContent = "--";
  }

  if (elements.fybc.inflationNote) {
    elements.fybc.inflationNote.textContent =
      "Enter the projection assumptions above";
  }

  if (elements.fybc.cpfLifeIncome) {
    elements.fybc.cpfLifeIncome.textContent = "--";
  }

  if (elements.fybc.requiredCapital) {
    elements.fybc.requiredCapital.textContent = "--";
  }

  if (elements.fybc.incomeAt65) {
    elements.fybc.incomeAt65.textContent = "--";
  }

  renderEmptyCostOfWantsTimeline();

  renderEmptyFybcProjectionMethodology();
}

function renderEmptyCostOfWantsTimeline() {
  elements.timeline.content?.classList.remove("is-ready");

  if (elements.timeline.brsAmount) {
    elements.timeline.brsAmount.textContent = "--";
  }

  if (elements.timeline.frsAmount) {
    elements.timeline.frsAmount.textContent = "--";
  }

  if (elements.timeline.ersAmount) {
    elements.timeline.ersAmount.textContent = "--";
  }

  if (elements.timeline.goalAmount) {
    elements.timeline.goalAmount.textContent = "--";
  }

  if (elements.timeline.incomeNeeded) {
    elements.timeline.incomeNeeded.textContent = "--";
  }

  if (elements.timeline.totalPayouts) {
    elements.timeline.totalPayouts.textContent = "--";
  }

  if (elements.outcome.incomeGap) {
    elements.outcome.incomeGap.textContent = "--";
  }

  if (elements.outcome.remainingCapital) {
    elements.outcome.remainingCapital.textContent = "--";
  }

  if (elements.timeline.progress) {
    elements.timeline.progress.style.width = "0%";
  }

  [
    elements.timeline.brsMarker,
    elements.timeline.frsMarker,
    elements.timeline.ersMarker,
    elements.timeline.goalMarker,
  ].forEach(function (marker) {
    marker?.style.removeProperty("left");
  });
}

function renderEmptyFybcProjectionMethodology() {
  if (elements.projection.calculationSummary) {
    elements.projection.calculationSummary.textContent =
      "Complete the FYBC assumptions to view the " + "calculation details.";
  }

  elements.projection.calculationData?.replaceChildren();

  if (elements.projection.calculationDetails) {
    elements.projection.calculationDetails.hidden = true;
  }

  if (elements.outcome.capitalNeededHelper) {
    elements.outcome.capitalNeededHelper.textContent =
      "After accounting monthly income needed until " +
      "planned mortality age of --";
  }

  elements.projection.calculationToggleButton?.setAttribute(
    "aria-expanded",
    "false",
  );

  elements.projection.calculationToggleIcon?.classList.remove("is-expanded");
}

/* ========================================
   PRIVATE HELPERS
======================================== */

function setOptionalNumberInput(input, value) {
  if (!input) {
    return;
  }

  const number = Number(value);

  input.value = Number.isFinite(number) && number > 0 ? String(number) : "";
}

function setNumberInput(input, value) {
  if (!input) {
    return;
  }

  const number = Number(value);

  input.value = Number.isFinite(number) ? String(number) : "";
}

function setCurrencyText(element, value) {
  if (!element) {
    return;
  }

  element.textContent = formatCurrency(value);
}

function setDeductionCurrencyText(element, value) {
  if (!element) {
    return;
  }

  const amount = getValidAmount(value);

  element.textContent =
    amount > 0 ? `-${formatCurrency(amount)}` : formatCurrency(0);
}

function setSignedCurrencyText(element, value) {
  if (!element) {
    return;
  }

  const amount = Number(value);

  const safeAmount = Number.isFinite(amount) ? amount : 0;

  element.textContent = formatCurrency(safeAmount);

  applyFinancialPositionClass(element, safeAmount);
}

function applyFinancialPositionClass(element, value) {
  if (!element) {
    return;
  }

  element.classList.remove("is-positive", "is-negative", "is-neutral");

  if (value > 0) {
    element.classList.add("is-positive");
    return;
  }

  if (value < 0) {
    element.classList.add("is-negative");
    return;
  }

  element.classList.add("is-neutral");
}

function getValidAmount(value) {
  const amount = Number(value);

  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function getValidNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}