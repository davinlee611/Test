"use strict";

import { getAssets, getClientProfile } from "../../state/client-plan.js";

import { formatCurrency } from "../../utils/client-utils.js";

import { openModal } from "../../utils/modal.js";

import {
  calculateCpfBalanceTotal,
  calculateLiquidAssetTotal,
} from "../assets-income/assets-income-calculator.js";

import { getGrossRetirementGoalSummary } from "../cost-of-wants/cost-of-wants-service.js";

import {
  DEFAULT_INVESTMENT_POLICY_GROWTH_RATE,
  DEFAULT_PRE_FYBC_GROWTH_RATE,
} from "./cost-analysis-config.js";

import { calculateAgeOnDate } from "./cost-analysis-date-utils.js";

import {
  formatRate,
  getFiniteNumber,
  getNonNegativeNumber,
  setCurrency,
  setHidden,
  setSignedCurrency,
  setText,
} from "./cost-analysis-format-utils.js";

import {
  getYourPathProjectedPositionState,
  setIncludeProjectedOa,
  setYourNextStepsResultState,
  setYourPathProjectedPositionState,
} from "./cost-analysis-state.js";

import {
  calculateEndowmentValueAtFybc,
  calculateInvestmentPolicyValueAtFybc,
  calculateLumpSumFutureValue,
  calculateLumpSumPresentValue,
  calculateMonthlyContributionFutureValue,
  calculateRequiredMonthlyContribution,
  calculateYourPathProjectedPosition,
} from "./your-path-calculator.js";

/* ========================================
   YOUR PATH OVERVIEW
======================================== */

export function renderYourPathPreview(elements, currentCashflow) {
  const { pathPreviewElements } = elements;

  const summary = getGrossRetirementGoalSummary();

  const assets = getAssets();

  const currentWithdrawableAssets = calculateLiquidAssetTotal(
    assets?.liquidAssets,
  );

  const profile = getClientProfile();

  const currentAge = calculateAgeOnDate(profile.dateOfBirth, new Date());

  const currentCpfSavings = calculateCpfBalanceTotal(assets?.cpf, currentAge);

  /*
   * The starting-position card shows the actual signed
   * monthly surplus. The suggested-plan calculation must
   * not treat a negative surplus as investable.
   */
  const currentMonthlySurplus = getFiniteNumber(
    currentCashflow?.remainingSurplus,
  );

  setText(
    pathPreviewElements.fybcAge,
    summary.desiredFybcAge > 0 ? String(summary.desiredFybcAge) : "—",
  );

  setText(
    pathPreviewElements.yearsRemaining,
    summary.isValid
      ? `${summary.yearsRemaining} ${
          summary.yearsRemaining === 1 ? "year" : "years"
        }`
      : "—",
  );

  setCurrency(pathPreviewElements.monthlyLifestyle, summary.monthlyIncomeToday);

  setCurrency(
    pathPreviewElements.monthlyLifestyleAtFybc,
    summary.monthlyIncomeAtFybc,
  );

  setText(
    pathPreviewElements.lifestyleAtFybcLabel,
    summary.desiredFybcAge > 0
      ? `Estimated Monthly Lifestyle at Age ${summary.desiredFybcAge}`
      : "Estimated Monthly Lifestyle at FYBC",
  );

  setText(
    pathPreviewElements.inflationAssumption,
    summary.isValid
      ? `Assuming ${getNonNegativeNumber(
          summary.inflationRate,
        )}% annual inflation`
      : "Adjusted for annual inflation",
  );

  renderYourPathLifestyleMethodology(elements, summary);

  setCurrency(pathPreviewElements.currentAssets, currentWithdrawableAssets);

  setCurrency(pathPreviewElements.currentCpfSavings, currentCpfSavings);

  setText(
    pathPreviewElements.currentCpfBreakdown,
    formatCurrentCpfBreakdown(assets?.cpf),
  );

  /*
   * Show the signed amount in the starting-position card.
   * This may display a positive or negative value.
   */
  setSignedCurrency(
    pathPreviewElements.affordableAmount,
    currentMonthlySurplus,
  );

  renderYourPathCurrentStatus(elements, {
    summary,

    remainingSurplus: currentMonthlySurplus,
  });
}

function renderYourPathLifestyleMethodology(elements, summary) {
  const { pathPreviewElements } = elements;

  setText(
    pathPreviewElements.methodologyLifestyleToday,
    summary.isValid
      ? `${formatCurrency(summary.monthlyIncomeToday)}/mth`
      : "$0/mth",
  );

  setText(
    pathPreviewElements.methodologyInflation,
    summary.isValid
      ? `${getNonNegativeNumber(summary.inflationRate)}% p.a.`
      : "—",
  );

  setText(
    pathPreviewElements.methodologyFybcLabel,
    summary.desiredFybcAge > 0
      ? `Estimated Lifestyle at Age ${summary.desiredFybcAge}`
      : "Estimated Lifestyle at FYBC",
  );

  setText(
    pathPreviewElements.methodologyLifestyleAtFybc,
    summary.isValid
      ? `${formatCurrency(summary.monthlyIncomeAtFybc)}/mth`
      : "$0/mth",
  );

  setText(
    pathPreviewElements.methodologyPeriod,
    summary.isValid
      ? `From age ${summary.desiredFybcAge} through age ${
          summary.plannedMortalityAge - 1
        }`
      : "From FYBC until the planned mortality age",
  );

  setCurrency(
    pathPreviewElements.lifetimeSpending,
    summary.grossCapitalRequired,
  );
}

function formatCurrentCpfBreakdown(cpf) {
  const oa = getNonNegativeNumber(cpf?.oa);

  const sa = getNonNegativeNumber(cpf?.sa);

  const ra = getNonNegativeNumber(cpf?.ra);

  const ma = getNonNegativeNumber(cpf?.ma);

  const accountParts = [`OA ${formatCurrency(oa)}`];

  /*
   * Ordinarily the client will have either SA or RA.
   * If both contain a balance, show both so the displayed
   * account breakdown still matches the total.
   */
  if (sa > 0 || ra <= 0) {
    accountParts.push(`SA ${formatCurrency(sa)}`);
  }

  if (ra > 0) {
    accountParts.push(`RA ${formatCurrency(ra)}`);
  }

  accountParts.push(`MA ${formatCurrency(ma)}`);

  return accountParts.join(" · ");
}

function renderYourPathCurrentStatus(elements, { summary, remainingSurplus }) {
  const statusElement = elements.pathPreviewElements.currentStatus;

  if (!statusElement) {
    return;
  }

  statusElement.classList.remove(
    "is-positive",
    "is-warning",
    "is-neutral",
    "is-incomplete",
  );

  if (!summary.isValid) {
    statusElement.classList.add("is-incomplete");

    setText(
      statusElement,
      "Complete the Cost of Wants inputs to create your retirement goal.",
    );

    return;
  }

  if (remainingSurplus > 0) {
    statusElement.classList.add("is-positive");

    setText(
      statusElement,
      [
        `${formatCurrency(remainingSurplus)} currently remains each month.`,
        `This surplus may be used for goals, emergency savings`,
        `and long-term investing.`,
      ].join(" "),
    );

    return;
  }

  if (remainingSurplus < 0) {
    statusElement.classList.add("is-warning");

    setText(
      statusElement,
      [
        `Current monthly outflows exceed inflow by`,
        `${formatCurrency(Math.abs(remainingSurplus))}.`,
        `Review the current expenses and commitments before`,
        `setting a long-term investment amount.`,
      ].join(" "),
    );

    return;
  }

  statusElement.classList.add("is-neutral");

  setText(
    statusElement,
    [
      `Current monthly inflow and outflows are equal.`,
      `There is no monthly surplus available yet for`,
      `additional goals or long-term investing.`,
    ].join(" "),
  );
}

/* ========================================
   YOUR PATH — PROJECTED POSITION
======================================== */

export function renderYourPathProjectedPosition(elements, { rows, cpfLifeStartAge }) {
  const { pathPreviewElements } = elements;

  const result = calculateYourPathProjectedPosition({
    rows,

    cpfLifeStartAge,
  });

  setYourPathProjectedPositionState(result.isValid ? result : null);

  if (!result.isValid) {
    renderIncompleteYourPathProjectedPosition(elements);

    return;
  }

  setHidden(pathPreviewElements.projectionIncomplete, true);

  setHidden(pathPreviewElements.projectionResults, false);

  setText(
    pathPreviewElements.projectedPositionTitle,
    `What You’ll Need at FYBC Age ${result.desiredFybcAge}`,
  );

  setText(
    pathPreviewElements.capitalNeededLabel,
    `Capital Needed at FYBC Age ${result.desiredFybcAge}`,
  );

  setCurrency(
    pathPreviewElements.capitalNeededAtFybc,
    result.capitalNeededAtFybc,
  );

  setText(
    pathPreviewElements.capitalNeedBasis,
    [
      `Using ${formatRate(result.postFybcReturnRate)}`,
      `post-FYBC return and recorded retirement income`,
    ].join(" "),
  );

  renderCapitalReductionNote(elements, result);

  renderRecordedIncomeAtFybc(elements, result.recordedIncomeAtFybc);

  setText(
    pathPreviewElements.projectedCpfLifeIncome,
    result.projectedCpfLifeIncome > 0
      ? `${formatCurrency(result.projectedCpfLifeIncome)}/mth`
      : "$0/mth",
  );

  setText(
    pathPreviewElements.projectedCpfLifeBasis,
    result.projectedCpfLifeIncome > 0
      ? `Projected from age ${result.cpfLifeStartAge}`
      : `No CPF LIFE payout currently projected at age ${result.cpfLifeStartAge}`,
  );

  setCurrency(
    pathPreviewElements.grossCapitalAtFybc,
    result.grossLifestyleCapitalAtFybc,
  );

  setCurrency(
    pathPreviewElements.incomeCapitalOffset,
    result.recordedIncomeCapitalOffset,
  );

  setCurrency(pathPreviewElements.netCapitalAtFybc, result.capitalNeededAtFybc);

  setText(
    pathPreviewElements.postFybcReturn,
    formatRate(result.postFybcReturnRate),
  );
}

/*
 * States, in plain terms, why Capital Needed at FYBC is smaller than
 * the undiscounted "Estimated lifetime retirement spending" total from
 * Step 1 — split between post-FYBC investment returns and recorded
 * recurring income already offsetting the target. Uses only figures
 * already computed by calculateYourPathProjectedPosition.
 */
function renderCapitalReductionNote(elements, result) {
  const element = elements.pathPreviewElements.capitalNeedReductionNote;

  if (!element) {
    return;
  }

  const lifetimeSpending = getNonNegativeNumber(
    result.undiscountedLifetimeSpending,
  );

  const capitalNeededAtFybc = getNonNegativeNumber(result.capitalNeededAtFybc);

  const totalReduction = Math.max(lifetimeSpending - capitalNeededAtFybc, 0);

  if (lifetimeSpending <= 0 || totalReduction <= 0) {
    setText(
      element,
      "Reflects post-FYBC investment returns and recorded retirement income.",
    );

    return;
  }

  const grossLifestyleCapitalAtFybc = getNonNegativeNumber(
    result.grossLifestyleCapitalAtFybc,
  );

  const recordedIncomeCapitalOffset = getNonNegativeNumber(
    result.recordedIncomeCapitalOffset,
  );

  const returnsReduction = Math.max(
    lifetimeSpending - grossLifestyleCapitalAtFybc,
    0,
  );

  const recordedMonthlyIncome = getNonNegativeNumber(
    result.recordedIncomeAtFybc?.total,
  );

  const attributionParts = [];

  if (returnsReduction > 0) {
    attributionParts.push(
      `${formatCurrency(returnsReduction)} from post-FYBC investment returns`,
    );
  }

  if (recordedIncomeCapitalOffset > 0) {
    attributionParts.push(
      `${formatCurrency(
        recordedIncomeCapitalOffset,
      )} from ${formatCurrency(
        recordedMonthlyIncome,
      )}/month of recorded income already offsetting the target`,
    );
  }

  const attribution =
    attributionParts.length > 0
      ? attributionParts.join(" and ")
      : "planning assumptions";

  setText(
    element,
    `${formatCurrency(
      totalReduction,
    )} lower than the ${formatCurrency(
      lifetimeSpending,
    )} lifetime spending estimate — ${attribution}.`,
  );
}

function renderRecordedIncomeAtFybc(elements, recordedIncome = {}) {
  const { pathPreviewElements } = elements;

  const otherIncome = getNonNegativeNumber(recordedIncome.otherIncome);

  const retirementPolicyIncome = getNonNegativeNumber(
    recordedIncome.retirementPolicyIncome,
  );

  const cpfLifeIncome = getNonNegativeNumber(recordedIncome.cpfLifeIncome);

  const total = getNonNegativeNumber(recordedIncome.total);

  setText(
    pathPreviewElements.recordedIncomeAtFybc,
    `${formatCurrency(total)}/mth`,
  );

  const sources = [];

  if (otherIncome > 0) {
    sources.push(`Other income ${formatCurrency(otherIncome)}`);
  }

  if (retirementPolicyIncome > 0) {
    sources.push(`Policy income ${formatCurrency(retirementPolicyIncome)}`);
  }

  if (cpfLifeIncome > 0) {
    sources.push(`CPF LIFE ${formatCurrency(cpfLifeIncome)}`);
  }

  setText(
    pathPreviewElements.recordedIncomeAtFybcBasis,
    sources.length > 0
      ? sources.join(" · ")
      : "No recorded monthly income active at FYBC",
  );
}

export function renderIncompleteYourPathProjectedPosition(elements) {
  const { pathPreviewElements } = elements;

  setYourPathProjectedPositionState(null);

  setHidden(pathPreviewElements.projectionIncomplete, false);

  setHidden(pathPreviewElements.projectionResults, true);

  setIncludeProjectedOa(false);

  if (pathPreviewElements.includeOaInput) {
    pathPreviewElements.includeOaInput.checked = false;

    pathPreviewElements.includeOaInput.disabled = true;
  }
}

export function handleCapitalMethodologyClick(elements, event) {
  const breakdownType = event.currentTarget.dataset.capitalBreakdown;

  const position = getYourPathProjectedPositionState();

  if (!position) {
    return;
  }

  renderCapitalMethodologyBreakdown(elements, breakdownType, position);
}

function renderCapitalMethodologyBreakdown(elements, breakdownType, result) {
  const { projectionBreakdownModal, projectionBreakdownContent } = elements;

  if (!projectionBreakdownModal || !projectionBreakdownContent) {
    return;
  }

  projectionBreakdownContent.replaceChildren();

  if (breakdownType === "lifestyle") {
    renderLifestyleCapitalBreakdown(elements, result);
  } else if (breakdownType === "income") {
    renderIncomeCapitalBreakdown(elements, result);
  } else if (breakdownType === "capital") {
    renderNetCapitalBreakdown(elements, result);
  } else {
    return;
  }

  openModal(projectionBreakdownModal);
}

function renderLifestyleCapitalBreakdown(elements, result) {
  setText(elements.projectionBreakdownTitle, "Lifestyle Capital");

  setText(
    elements.projectionBreakdownSubtitle,
    "The estimated value at FYBC of the client's desired monthly lifestyle.",
  );

  appendCapitalBreakdownSection(elements, {
    heading: "Lifestyle assumptions",

    rows: [
      {
        label: "Monthly income needed at FYBC",
        value: `${formatCurrency(result.monthlyIncomeAtFybc)}/mth`,
      },
      {
        label: "Planned funding period",
        value: `${result.retirementFundingMonths} months`,
      },
      {
        label: "Planned mortality age",
        value: `Age ${result.plannedMortalityAge}`,
      },
      {
        label: "Post-FYBC return",
        value: formatRate(result.postFybcReturnRate),
      },
    ],

    totalLabel: "Lifestyle capital before recorded income",

    totalValue: result.grossLifestyleCapitalAtFybc,
  });
}

function renderIncomeCapitalBreakdown(elements, result) {
  const income = result.recordedIncomeAtFybc || {};

  setText(elements.projectionBreakdownTitle, "Recorded Retirement Income");

  setText(
    elements.projectionBreakdownSubtitle,
    "Income may start at different ages. The monthly figures show what is active at FYBC, while the capital values include income received later in retirement.",
  );

  appendMonthlyIncomeAtFybcSection(elements, income);

  appendCapitalIncomeOffsetSection(elements, result);
}

function appendMonthlyIncomeAtFybcSection(elements, income) {
  const section = document.createElement("section");

  section.className = "projection-breakdown-section";

  const heading = document.createElement("h3");

  heading.textContent = "Monthly income active at FYBC";

  section.append(heading);

  appendCapitalDisplayRow({
    section,

    label: "Other monthly income",

    value: `${formatCurrency(income.otherIncome)}/mth`,
  });

  appendCapitalDisplayRow({
    section,

    label: "Retirement-policy income",

    value: `${formatCurrency(income.retirementPolicyIncome)}/mth`,
  });

  appendCapitalDisplayRow({
    section,

    label: "CPF LIFE income",

    value: `${formatCurrency(income.cpfLifeIncome)}/mth`,
  });

  appendCapitalDisplayRow({
    section,

    label: "Total income active at FYBC",

    value: `${formatCurrency(income.total)}/mth`,
  });

  elements.projectionBreakdownContent.append(section);
}

function appendCapitalIncomeOffsetSection(elements, result) {
  const section = document.createElement("section");

  section.className = "projection-breakdown-section";

  const heading = document.createElement("h3");

  heading.textContent = "Capital value across retirement";

  section.append(heading);

  appendCapitalDisplayRow({
    section,

    label: "Other monthly income",

    value: formatCurrency(result.otherIncomeCapitalOffset),
  });

  appendCapitalDisplayRow({
    section,

    label: "Retirement-policy income",

    value: formatCurrency(result.retirementPolicyCapitalOffset),
  });

  appendCapitalDisplayRow({
    section,

    label: "CPF LIFE after it starts",

    value: formatCurrency(result.cpfLifeCapitalOffset),
  });

  elements.projectionBreakdownContent.append(section);

  const total = document.createElement("div");

  total.className = "projection-breakdown-total";

  const totalLabel = document.createElement("strong");

  totalLabel.textContent = "Capital value of all recorded retirement income";

  const totalValue = document.createElement("strong");

  totalValue.textContent = formatCurrency(result.recordedIncomeCapitalOffset);

  total.append(totalLabel, totalValue);

  elements.projectionBreakdownContent.append(total);
}

function appendCapitalDisplayRow({ section, label, value }) {
  const row = document.createElement("div");

  row.className = "projection-breakdown-row";

  const labelElement = document.createElement("span");

  labelElement.textContent = label;

  const valueElement = document.createElement("strong");

  valueElement.textContent = value;

  row.append(labelElement, valueElement);

  section.append(row);
}

function renderNetCapitalBreakdown(elements, result) {
  setText(elements.projectionBreakdownTitle, "Capital Needed at FYBC");

  setText(
    elements.projectionBreakdownSubtitle,
    "Lifestyle capital less the value of recurring income received during retirement.",
  );

  appendCapitalBreakdownSection(elements, {
    heading: "Capital calculation",

    rows: [
      {
        label: "Lifestyle capital before recorded income",

        value: formatCurrency(result.grossLifestyleCapitalAtFybc),
      },
      {
        label: "Less: value of recorded retirement income",

        value: `-${formatCurrency(result.recordedIncomeCapitalOffset)}`,
      },
    ],

    totalLabel: "Capital needed at FYBC",

    totalValue: result.capitalNeededAtFybc,
  });
}

function appendCapitalBreakdownSection(
  elements,
  { heading, rows, totalLabel, totalValue },
) {
  const section = document.createElement("section");

  section.className = "projection-breakdown-section";

  const title = document.createElement("h3");

  title.textContent = heading;

  section.append(title);

  rows.forEach(function (row) {
    const detailRow = document.createElement("div");

    detailRow.className = "projection-breakdown-row";

    const label = document.createElement("span");

    label.textContent = row.label;

    const value = document.createElement("strong");

    value.textContent = row.value;

    detailRow.append(label, value);

    section.append(detailRow);
  });

  elements.projectionBreakdownContent.append(section);

  const total = document.createElement("div");

  total.className = "projection-breakdown-total";

  const totalLabelElement = document.createElement("strong");

  totalLabelElement.textContent = totalLabel;

  const totalValueElement = document.createElement("strong");

  totalValueElement.textContent = formatCurrency(totalValue);

  total.append(totalLabelElement, totalValueElement);

  elements.projectionBreakdownContent.append(total);
}

/* ========================================
   YOUR NEXT STEPS
======================================== */

export function renderYourNextSteps(elements, currentCashflow) {
  const { nextStepsElements } = elements;

  const position = getYourPathProjectedPositionState();

  if (!position?.isValid) {
    renderIncompleteNextSteps(elements);
    return;
  }

  const availableMonthly = Math.max(
    getFiniteNumber(currentCashflow?.remainingSurplus),
    0,
  );

  const monthsToFybc = Math.max(getNonNegativeNumber(position.monthsToFybc), 0);

  const growthRate = getNextStepsGrowthRate(elements);

  const currentAssets = calculateLiquidAssetTotal(getAssets()?.liquidAssets);

  /*
   * A BRS, FRS or ERS strategy draws its cash top-up from this same
   * withdrawable balance before FYBC, but not necessarily today — for
   * a client below 55 it happens at the future month RA forms. Until
   * then the balance keeps growing under the same Pre-FYBC Growth
   * Assumption used elsewhere on this card, so the top-up must be
   * discounted back to today's dollars (at that same rate) before
   * being netted out of today's balance. Subtracting the future
   * nominal top-up directly would understate what is genuinely still
   * available today.
   */
  const topUpReservedFromAssets = Math.min(
    currentAssets,
    calculateLumpSumPresentValue({
      amount: position.retirementStrategyTopUp?.amount,

      months: position.retirementStrategyTopUp?.monthIndex,

      annualRatePercent: growthRate,
    }),
  );

  const availableCurrentAssets = Math.max(
    currentAssets - topUpReservedFromAssets,
    0,
  );

  const includeCurrentAssets = Boolean(
    nextStepsElements.includeAssetsInput?.checked,
  );

  if (nextStepsElements.assetsAmountInput) {
    nextStepsElements.assetsAmountInput.disabled = !includeCurrentAssets;

    nextStepsElements.assetsAmountInput.max = String(
      Math.round(availableCurrentAssets),
    );
  }

  let selectedCurrentAssets = includeCurrentAssets
    ? getNonNegativeNumber(nextStepsElements.assetsAmountInput?.value)
    : 0;

  /*
   * Never allow the client to allocate more than their withdrawable
   * assets actually still available after the CPF top-up reservation.
   */
  selectedCurrentAssets = Math.min(selectedCurrentAssets, availableCurrentAssets);

  if (includeCurrentAssets && nextStepsElements.assetsAmountInput) {
    nextStepsElements.assetsAmountInput.value = String(
      Math.round(selectedCurrentAssets),
    );
  }

  const projectedCurrentAssets = calculateLumpSumFutureValue({
    amount: selectedCurrentAssets,

    months: monthsToFybc,

    annualRatePercent: growthRate,
  });

  setText(
    nextStepsElements.assetsReservedNote,
    topUpReservedFromAssets > 0
      ? `${formatCurrency(
          topUpReservedFromAssets,
        )} reserved for the selected CPF retirement strategy's cash top-up`
      : "",
  );

  setHidden(nextStepsElements.assetsReservedNote, topUpReservedFromAssets <= 0);

  setHidden(
    nextStepsElements.assetsProjectedRow,
    !(includeCurrentAssets && selectedCurrentAssets > 0),
  );

  setCurrency(nextStepsElements.assetsProjectedAtFybc, projectedCurrentAssets);

  const investmentPolicyGrowthRate = getInvestmentPolicyGrowthRate(elements);

  const investmentPoliciesAtFybc = calculateInvestmentPolicyValueAtFybc({
    desiredFybcAge: position.desiredFybcAge,

    annualGrowthRatePercent: investmentPolicyGrowthRate,
  });

  const endowmentValueAtFybc = calculateEndowmentValueAtFybc({
    desiredFybcAge: position.desiredFybcAge,

    plannedMortalityAge: position.plannedMortalityAge,

    preFybcGrowthRate: growthRate,

    postFybcReturnRate: position.postFybcReturnRate,
  });

  const eligibleOaAtFybc = position.canIncludeEligibleOa
    ? getNonNegativeNumber(position.eligibleOaPresentValue)
    : 0;

  /*
   * These four numbers show what is AVAILABLE.
   * They are not automatically counted.
   */
  setCurrency(nextStepsElements.availableAssets, availableCurrentAssets);

  setCurrency(nextStepsElements.investmentPolicies, investmentPoliciesAtFybc);

  setCurrency(nextStepsElements.endowmentValue, endowmentValueAtFybc);

  setCurrency(nextStepsElements.eligibleOa, eligibleOaAtFybc);

  if (nextStepsElements.includeOaInput) {
    nextStepsElements.includeOaInput.disabled = !position.canIncludeEligibleOa;

    if (!position.canIncludeEligibleOa) {
      nextStepsElements.includeOaInput.checked = false;
    }
  }

  const selectedResources = getSelectedNextStepResources(elements, {
    projectedCurrentAssets,

    investmentPoliciesAtFybc,

    endowmentValueAtFybc,

    eligibleOaAtFybc,
  });

  const capitalNeeded = getNonNegativeNumber(position.capitalNeededAtFybc);

  /*
   * This is the amount the monthly savings plan
   * still needs to build after resources explicitly
   * selected by the client.
   */
  const capitalStillToBuild = Math.max(capitalNeeded - selectedResources, 0);

  const suggestedMonthly = calculateRequiredMonthlyContribution({
    targetFutureValue: capitalStillToBuild,

    months: monthsToFybc,

    annualRatePercent: growthRate,
  });

  const chosenMonthly = getChosenMonthlyCommitment(elements, availableMonthly);

  const projectedMonthlyCommitment = calculateMonthlyContributionFutureValue({
    monthlyAmount: chosenMonthly,

    months: monthsToFybc,

    annualRatePercent: growthRate,
  });

  const projectedFunding = selectedResources + projectedMonthlyCommitment;

  const remainingGap = Math.max(capitalNeeded - projectedFunding, 0);

  const fundingSurplus = Math.max(projectedFunding - capitalNeeded, 0);

  const fundingProgress =
    capitalNeeded > 0 ? (projectedFunding / capitalNeeded) * 100 : 0;

  const remainingFlexibility = availableMonthly - chosenMonthly;

  setYourNextStepsResultState({
    isValid: true,

    availableMonthly,
    chosenMonthly,
    suggestedMonthly,
    remainingFlexibility,

    capitalNeeded,
    selectedResources,
    projectedMonthlyCommitment,
    projectedFunding,
    remainingGap,
    fundingSurplus,
    fundingProgress,

    includeCurrentAssets,
    selectedCurrentAssets,
    availableCurrentAssets,

    investmentPoliciesAtFybc,
    endowmentValueAtFybc,
    eligibleOaAtFybc,

    includeInvestmentPolicies: Boolean(
      nextStepsElements.includeInvestmentPoliciesInput?.checked,
    ),

    includeEndowment: Boolean(
      nextStepsElements.includeEndowmentInput?.checked,
    ),

    includeOa: Boolean(
      nextStepsElements.includeOaInput?.checked &&
        !nextStepsElements.includeOaInput?.disabled,
    ),
  });

  setCurrency(nextStepsElements.suggestedMonthly, suggestedMonthly);

  setCurrency(nextStepsElements.availableMonthly, availableMonthly);

  setCurrency(nextStepsElements.chosenMonthly, chosenMonthly);

  setSignedCurrency(
    nextStepsElements.flexibilityRemaining,
    remainingFlexibility,
  );

  setCurrency(nextStepsElements.capitalNeeded, capitalNeeded);

  setCurrency(nextStepsElements.selectedResources, selectedResources);

  setCurrency(
    nextStepsElements.monthlyCommitmentValue,
    projectedMonthlyCommitment,
  );

  setCurrency(nextStepsElements.projectedFunding, projectedFunding);

  setCurrency(nextStepsElements.remainingGap, remainingGap);

  renderNextStepsMonthlyInput(elements, {
    chosenMonthly,

    availableMonthly,
  });

  renderNextStepsFundingProgress(elements, {
    remainingGap,

    fundingSurplus,

    fundingProgress,
  });

  renderNextStepsCommitmentMessage(elements, {
    chosenMonthly,

    availableMonthly,

    suggestedMonthly,

    remainingGap,
  });
}

function getSelectedNextStepResources(
  elements,
  {
    projectedCurrentAssets,
    investmentPoliciesAtFybc,
    endowmentValueAtFybc,
    eligibleOaAtFybc,
  },
) {
  const { nextStepsElements } = elements;

  let total = 0;

  if (nextStepsElements.includeAssetsInput?.checked) {
    total += projectedCurrentAssets;
  }

  if (nextStepsElements.includeInvestmentPoliciesInput?.checked) {
    total += investmentPoliciesAtFybc;
  }

  if (nextStepsElements.includeEndowmentInput?.checked) {
    total += endowmentValueAtFybc;
  }

  if (
    nextStepsElements.includeOaInput?.checked &&
    !nextStepsElements.includeOaInput?.disabled
  ) {
    total += eligibleOaAtFybc;
  }

  return total;
}

/* ========================================
   MONTHLY COMMITMENT
======================================== */

function getChosenMonthlyCommitment(elements, availableMonthly) {
  const { nextStepsElements, monthlyCommitmentInputs } = elements;

  const selectedInput = monthlyCommitmentInputs.find(function (input) {
    return input.checked;
  });

  if (!selectedInput) {
    return 0;
  }

  if (selectedInput.value === "custom") {
    return getNonNegativeNumber(nextStepsElements.monthlyAmountInput?.value);
  }

  const percentage = getNonNegativeNumber(selectedInput.value) / 100;

  return availableMonthly * percentage;
}

function renderNextStepsMonthlyInput(elements, { chosenMonthly, availableMonthly }) {
  const { nextStepsElements, monthlyCommitmentInputs } = elements;

  const selectedInput = monthlyCommitmentInputs.find(function (input) {
    return input.checked;
  });

  const isCustom = selectedInput?.value === "custom";

  if (!nextStepsElements.monthlyAmountInput) {
    return;
  }

  nextStepsElements.monthlyAmountInput.readOnly = !isCustom;

  if (!isCustom) {
    nextStepsElements.monthlyAmountInput.value = String(
      Math.round(chosenMonthly),
    );
  }

  nextStepsElements.monthlyAmountInput.max = String(
    Math.max(Math.round(availableMonthly), 0),
  );
}

function renderNextStepsCommitmentMessage(
  elements,
  { chosenMonthly, availableMonthly, suggestedMonthly, remainingGap },
) {
  const { nextStepsElements } = elements;

  if (!nextStepsElements.commitmentMessage) {
    return;
  }

  if (availableMonthly <= 0) {
    setText(
      nextStepsElements.commitmentMessage,
      "There is currently no positive monthly surplus to allocate. Review the current cashflow before setting a long-term monthly amount.",
    );

    return;
  }

  if (chosenMonthly > availableMonthly) {
    setText(
      nextStepsElements.commitmentMessage,
      [
        `This plan uses ${formatCurrency(chosenMonthly)} per month,`,
        `which is ${formatCurrency(
          chosenMonthly - availableMonthly,
        )} above the current monthly surplus.`,
      ].join(" "),
    );

    return;
  }

  if (remainingGap <= 0) {
    setText(
      nextStepsElements.commitmentMessage,
      "Based on the selected resources and monthly amount, the current plan reaches the estimated capital target.",
    );

    return;
  }

  if (chosenMonthly < suggestedMonthly) {
    setText(
      nextStepsElements.commitmentMessage,
      [
        `You have chosen ${formatCurrency(chosenMonthly)} per month.`,
        `The current estimate suggests about`,
        `${formatCurrency(suggestedMonthly)} per month`,
        `would be needed to fully close the remaining target by FYBC.`,
      ].join(" "),
    );

    return;
  }

  setText(
    nextStepsElements.commitmentMessage,
    "This monthly amount is within the client's current surplus and is being included in the FYBC projection.",
  );
}

function getNextStepsGrowthRate(elements) {
  if (!elements.nextStepsElements.growthRateInput) {
    return DEFAULT_PRE_FYBC_GROWTH_RATE;
  }

  return getNonNegativeNumber(elements.nextStepsElements.growthRateInput.value);
}

function getInvestmentPolicyGrowthRate(elements) {
  const enteredRate = Number(
    elements.nextStepsElements.investmentGrowthRateInput?.value,
  );

  if (Number.isFinite(enteredRate) && enteredRate >= 0) {
    return enteredRate;
  }

  return DEFAULT_INVESTMENT_POLICY_GROWTH_RATE;
}

/* ========================================
   FUNDING PROGRESS
======================================== */

function renderNextStepsFundingProgress(
  elements,
  { remainingGap, fundingSurplus, fundingProgress },
) {
  const { nextStepsElements } = elements;

  const displayedProgress = Math.max(0, Math.min(fundingProgress, 100));

  setText(
    nextStepsElements.fundingProgressLabel,
    `${Math.round(displayedProgress)}%`,
  );

  if (nextStepsElements.fundingProgressBar) {
    nextStepsElements.fundingProgressBar.style.width = `${displayedProgress}%`;
  }

  if (remainingGap > 0) {
    setText(
      nextStepsElements.fundingStatus,
      [
        `This plan is estimated to cover`,
        `${Math.round(
          Math.max(0, Math.min(fundingProgress, 100)),
        )}% of your goal.`,
        `${formatCurrency(remainingGap)}`,
        `remains to be planned for.`,
      ].join(" "),
    );

    return;
  }

  setText(
    nextStepsElements.fundingStatus,
    fundingSurplus > 0
      ? [
          `The selected plan currently exceeds`,
          `the estimated target by`,
          `${formatCurrency(fundingSurplus)}.`,
        ].join(" ")
      : "The selected plan currently reaches the estimated FYBC capital target.",
  );
}

export function renderIncompleteNextSteps(elements) {
  const { nextStepsElements } = elements;

  setYourNextStepsResultState(null);

  [
    nextStepsElements.suggestedMonthly,
    nextStepsElements.availableMonthly,
    nextStepsElements.chosenMonthly,
    nextStepsElements.availableAssets,
    nextStepsElements.investmentPolicies,
    nextStepsElements.endowmentValue,
    nextStepsElements.eligibleOa,
    nextStepsElements.capitalNeeded,
    nextStepsElements.selectedResources,
    nextStepsElements.monthlyCommitmentValue,
    nextStepsElements.projectedFunding,
    nextStepsElements.remainingGap,
  ].forEach(function (element) {
    setText(element, "—");
  });

  setText(nextStepsElements.fundingProgressLabel, "0%");

  if (nextStepsElements.fundingProgressBar) {
    nextStepsElements.fundingProgressBar.style.width = "0%";
  }

  setText(
    nextStepsElements.fundingStatus,
    "Complete the retirement target first to build a suggested plan.",
  );

  setHidden(nextStepsElements.assetsReservedNote, true);

  setHidden(nextStepsElements.assetsProjectedRow, true);
}
