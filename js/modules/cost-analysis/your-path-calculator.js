"use strict";

import { getClientProfile, getPolicies } from "../../state/client-plan.js";

import {
  getGrossRetirementGoalSummary,
  getPostFybcReturnRate,
} from "../cost-of-wants/cost-of-wants-service.js";

import { MONTHS_PER_YEAR } from "./cost-analysis-config.js";

import { getProjectionStartDate } from "./cost-analysis-date-utils.js";

import { getFiniteNumber, getNonNegativeNumber } from "./cost-analysis-format-utils.js";

import {
  getIncludeProjectedOa,
  setIncludeProjectedOa,
} from "./cost-analysis-state.js";

/* ========================================
   YOUR PATH — PROJECTED POSITION
======================================== */

export function calculateYourPathProjectedPosition({ rows, cpfLifeStartAge }) {
  const summary = getGrossRetirementGoalSummary();

  if (!summary.isValid || !Array.isArray(rows)) {
    return createInvalidProjectedPosition();
  }

  const fybcRowIndex = rows.findIndex(function (row) {
    return row.fybcReachedThisMonth;
  });

  if (fybcRowIndex < 0) {
    return createInvalidProjectedPosition();
  }

  const fybcRow = rows[fybcRowIndex];

  const recordedIncomeAtFybc = {
    otherIncome: getNonNegativeNumber(fybcRow.cashflowBreakdown?.otherIncome),

    retirementPolicyIncome: getRetirementPolicyIncomeForRow(fybcRow),

    cpfLifeIncome: getNonNegativeNumber(fybcRow.cpfLifeCashInflow),
  };

  recordedIncomeAtFybc.total =
    recordedIncomeAtFybc.otherIncome +
    recordedIncomeAtFybc.retirementPolicyIncome +
    recordedIncomeAtFybc.cpfLifeIncome;

  const retirementRows = rows.slice(fybcRowIndex).filter(function (row) {
    return getFiniteNumber(row.age) < summary.plannedMortalityAge;
  });

  if (retirementRows.length === 0) {
    return createInvalidProjectedPosition();
  }

  const postFybcReturnRate = getNonNegativeNumber(getPostFybcReturnRate());

  const monthlyReturnRate = convertAnnualRateToMonthly(postFybcReturnRate);

  const monthlyInflationRate = convertAnnualRateToMonthly(
    summary.inflationRate,
  );

  let grossLifestyleCapitalAtFybc = 0;

  let capitalNeededAtFybc = 0;

  let otherIncomeCapitalOffset = 0;

  let retirementPolicyCapitalOffset = 0;

  let cpfLifeCapitalOffset = 0;

  retirementRows.forEach(function (row, monthIndex) {
    const discountFactor = Math.pow(1 + monthlyReturnRate, monthIndex);

    const lifestyleNeeded =
      summary.monthlyIncomeAtFybc *
      Math.pow(1 + monthlyInflationRate, monthIndex);

    const continuingOtherIncome = getNonNegativeNumber(
      row.cashflowBreakdown?.otherIncome,
    );

    const retirementPolicyIncome = getRetirementPolicyIncomeForRow(row);

    const cpfLifeIncome = getNonNegativeNumber(row.cpfLifeCashInflow);

    const recordedRecurringIncome =
      continuingOtherIncome + retirementPolicyIncome + cpfLifeIncome;

    /*
     * If total recorded income exceeds the lifestyle
     * required that month, only the amount actually
     * offsetting the lifestyle should be counted.
     *
     * Allocate that usable amount proportionally across
     * the active income sources.
     */
    const usableIncomeRatio =
      recordedRecurringIncome > 0
        ? Math.min(lifestyleNeeded / recordedRecurringIncome, 1)
        : 0;

    const usableOtherIncome = continuingOtherIncome * usableIncomeRatio;

    const usableRetirementPolicyIncome =
      retirementPolicyIncome * usableIncomeRatio;

    const usableCpfLifeIncome = cpfLifeIncome * usableIncomeRatio;

    const usableRecordedIncome =
      usableOtherIncome + usableRetirementPolicyIncome + usableCpfLifeIncome;

    const amountFundedFromCapital = Math.max(
      lifestyleNeeded - usableRecordedIncome,
      0,
    );

    grossLifestyleCapitalAtFybc += lifestyleNeeded / discountFactor;

    otherIncomeCapitalOffset += usableOtherIncome / discountFactor;

    retirementPolicyCapitalOffset +=
      usableRetirementPolicyIncome / discountFactor;

    cpfLifeCapitalOffset += usableCpfLifeIncome / discountFactor;

    capitalNeededAtFybc += amountFundedFromCapital / discountFactor;
  });

  const recordedIncomeCapitalOffset =
    otherIncomeCapitalOffset +
    retirementPolicyCapitalOffset +
    cpfLifeCapitalOffset;

  const projectedWithdrawableAssets = getFiniteNumber(
    fybcRow.endWithdrawableBalance,
  );

  /*
   * A BRS, FRS or ERS strategy draws its cash top-up from the same
   * withdrawable balance Next Steps lets the client opt into as a
   * resource. There is at most one such event in the whole projection
   * (either immediately, for a client already 55+, or at the month
   * age 55 is reached). Record its amount AND month index rather than
   * just a dollar total, because a top-up years away should be
   * discounted back to today before being netted out of today's
   * withdrawable assets — subtracting a future nominal amount from a
   * today balance would mix time frames.
   */
  const retirementStrategyTopUpRowIndex = rows
    .slice(0, fybcRowIndex + 1)
    .findIndex(function (row) {
      return getNonNegativeNumber(row.retirementStrategyCashTopUp) > 0;
    });

  const retirementStrategyTopUp =
    retirementStrategyTopUpRowIndex >= 0
      ? {
          amount: getNonNegativeNumber(
            rows[retirementStrategyTopUpRowIndex].retirementStrategyCashTopUp,
          ),

          monthIndex: retirementStrategyTopUpRowIndex,
        }
      : null;

  const maturityResult = calculateFutureMaturityPresentValue({
    rows,

    fybcRowIndex,

    monthlyReturnRate,

    plannedMortalityAge: summary.plannedMortalityAge,
  });

  const eligibleOaResult = calculateEligibleOaForRetirement({
    rows,

    fybcRowIndex,

    monthlyReturnRate,
  });

  if (!eligibleOaResult.canInclude) {
    setIncludeProjectedOa(false);
  }

  const includedOaPresentValue =
    eligibleOaResult.canInclude && getIncludeProjectedOa()
      ? eligibleOaResult.presentValueAtFybc
      : 0;

  const projectedResourcesAtFybc =
    projectedWithdrawableAssets +
    maturityResult.presentValueAtFybc +
    includedOaPresentValue;

  const remainingFundingGap = Math.max(
    capitalNeededAtFybc - projectedResourcesAtFybc,
    0,
  );

  const projectedFundingSurplus = Math.max(
    projectedResourcesAtFybc - capitalNeededAtFybc,
    0,
  );

  const fundingProgressPercent =
    capitalNeededAtFybc > 0
      ? (Math.max(projectedResourcesAtFybc, 0) / capitalNeededAtFybc) * 100
      : 0;

  const cpfLifeStartRow = rows.find(function (row) {
    return (
      row.cpfLifeProjectionStatus === "started" &&
      getNonNegativeNumber(row.cpfLifeMonthlyPayout) > 0
    );
  });

  return {
    isValid: true,

    desiredFybcAge: summary.desiredFybcAge,

    monthsToFybc: fybcRowIndex,

    plannedMortalityAge: summary.plannedMortalityAge,

    monthlyIncomeAtFybc: summary.monthlyIncomeAtFybc,

    retirementFundingMonths: retirementRows.length,

    postFybcReturnRate,

    recordedIncomeAtFybc,

    /*
     * The undiscounted "Estimated lifetime retirement spending"
     * total from Cost of Wants (Step 1). Already computed above
     * via getGrossRetirementGoalSummary() — reused here, not
     * recalculated, so the capital-reduction note stays consistent
     * with the Step 1 figure.
     */
    undiscountedLifetimeSpending: summary.grossCapitalRequired,

    grossLifestyleCapitalAtFybc,

    recordedIncomeCapitalOffset,

    otherIncomeCapitalOffset,

    retirementPolicyCapitalOffset,

    cpfLifeCapitalOffset,

    capitalNeededAtFybc,

    projectedWithdrawableAssets,

    futureMaturityPresentValue: maturityResult.presentValueAtFybc,

    futureMaturityCount: maturityResult.count,

    eligibleOaAmount: eligibleOaResult.amountAtAvailability,

    eligibleOaPresentValue: eligibleOaResult.presentValueAtFybc,

    eligibleOaAvailabilityAge: eligibleOaResult.availabilityAge,

    eligibleOaHousingReserve: eligibleOaResult.housingReserve,

    canIncludeEligibleOa: eligibleOaResult.canInclude,

    includedOaPresentValue,

    projectedResourcesAtFybc,

    remainingFundingGap,

    projectedFundingSurplus,

    fundingProgressPercent,

    cpfLifeStartAge,

    projectedCpfLifeIncome: getNonNegativeNumber(
      cpfLifeStartRow?.cpfLifeMonthlyPayout,
    ),

    retirementStrategyTopUp,
  };
}

export function calculateFutureMaturityPresentValue({
  rows,
  fybcRowIndex,
  monthlyReturnRate,
  plannedMortalityAge,
}) {
  let presentValueAtFybc = 0;

  let count = 0;

  rows.slice(fybcRowIndex + 1).forEach(function (row, index) {
    if (getFiniteNumber(row.age) >= plannedMortalityAge) {
      return;
    }

    const maturityAmount = getEndowmentMaturityForRow(row);

    if (maturityAmount <= 0) {
      return;
    }

    const monthsAfterFybc = index + 1;

    presentValueAtFybc +=
      maturityAmount / Math.pow(1 + monthlyReturnRate, monthsAfterFybc);

    count += 1;
  });

  return {
    presentValueAtFybc,

    count,
  };
}

export function calculateEligibleOaForRetirement({
  rows,
  fybcRowIndex,
  monthlyReturnRate,
}) {
  const fybcRow = rows[fybcRowIndex];

  const fybcIsAtLeast55 = getFiniteNumber(fybcRow?.age) >= 55;

  const availabilityRowIndex = fybcIsAtLeast55
    ? fybcRowIndex
    : rows.findIndex(function (row, index) {
        return index >= fybcRowIndex && row.retirementAccount === "ra";
      });

  if (availabilityRowIndex < 0) {
    return createUnavailableOaResult();
  }

  const availabilityRow = rows[availabilityRowIndex];

  if (!availabilityRow.hasMetCohortFrs) {
    return {
      ...createUnavailableOaResult(),

      availabilityAge: getFiniteNumber(availabilityRow.age),
    };
  }

  /*
   * The OA balance on the availability row already
   * reflects housing repayments up to that month.
   *
   * Reserve every recorded OA housing repayment
   * after that month so the same OA is not used for
   * both housing and retirement.
   */
  const housingReserve = rows.slice(availabilityRowIndex + 1).reduce(function (
    total,
    row,
  ) {
    return total + getNonNegativeNumber(row.oaOutflow);
  }, 0);

  const amountAtAvailability = Math.max(
    getNonNegativeNumber(availabilityRow.oaBalance) - housingReserve,
    0,
  );

  const monthsAfterFybc = Math.max(availabilityRowIndex - fybcRowIndex, 0);

  const presentValueAtFybc =
    amountAtAvailability / Math.pow(1 + monthlyReturnRate, monthsAfterFybc);

  return {
    canInclude: amountAtAvailability > 0,

    amountAtAvailability,

    presentValueAtFybc,

    availabilityAge: getFiniteNumber(availabilityRow.age),

    housingReserve,
  };
}

export function getEndowmentMaturityForRow(row) {
  return (row?.policyCashInflowItems || []).reduce(function (total, item) {
    if (item.policyType !== "endowment" || !item.maturedThisMonth) {
      return total;
    }

    return total + getNonNegativeNumber(item.amount);
  }, 0);
}

export function createInvalidProjectedPosition() {
  return {
    isValid: false,
  };
}

export function createUnavailableOaResult() {
  return {
    canInclude: false,

    amountAtAvailability: 0,

    presentValueAtFybc: 0,

    availabilityAge: 0,

    housingReserve: 0,
  };
}

export function convertAnnualRateToMonthly(annualRatePercent) {
  const annualRate = getNonNegativeNumber(annualRatePercent) / 100;

  return Math.pow(1 + annualRate, 1 / MONTHS_PER_YEAR) - 1;
}

export function getRetirementPolicyIncomeForRow(row) {
  return (row?.policyCashInflowItems || []).reduce(function (total, item) {
    if (item.policyType !== "retirement") {
      return total;
    }

    return total + getNonNegativeNumber(item.amount);
  }, 0);
}

/* ========================================
   INVESTMENT POLICY VALUE AT FYBC
======================================== */

export function calculateInvestmentPolicyValueAtFybc({
  desiredFybcAge,
  annualGrowthRatePercent,
}) {
  const policies = getPolicies();

  const profile = getClientProfile();

  const fybcDate = getAgeMonthDate(profile.dateOfBirth, desiredFybcAge);

  if (!Array.isArray(policies) || !fybcDate) {
    return 0;
  }

  return policies.reduce(function (total, policy) {
    if (policy?.policyType !== "ilp_accumulation") {
      return total;
    }

    const accumulation = policy.accumulation || {};

    const projectedValue = getNonNegativeNumber(
      accumulation.projectedPolicyValue,
    );

    const projectedAtAge = getNonNegativeNumber(accumulation.projectedAtAge);

    /*
     * Priority 1:
     * If the insurer already provides a projection
     * specifically for the client's FYBC age,
     * use that value directly.
     */
    if (
      projectedValue > 0 &&
      projectedAtAge === getNonNegativeNumber(desiredFybcAge)
    ) {
      return total + projectedValue;
    }

    /*
     * Priority 2:
     * Otherwise project the recorded current
     * policy value from its actual valuation date
     * until the client's FYBC date.
     */
    const currentPolicyValue = getNonNegativeNumber(
      accumulation.currentPolicyValue,
    );

    if (currentPolicyValue <= 0) {
      return total;
    }

    const valueAsOfDate = parsePlanningYearMonth(accumulation.valueAsOf);

    if (!valueAsOfDate || valueAsOfDate > fybcDate) {
      return total;
    }

    const monthsFromValuationToFybc = getWholeMonthsBetween(
      valueAsOfDate,
      fybcDate,
    );

    const estimatedValue = calculateLumpSumFutureValue({
      amount: currentPolicyValue,

      months: monthsFromValuationToFybc,

      annualRatePercent: annualGrowthRatePercent,
    });

    return total + estimatedValue;
  }, 0);
}

/* ========================================
   ENDOWMENT VALUE AT FYBC
======================================== */

export function calculateEndowmentValueAtFybc({
  desiredFybcAge,
  plannedMortalityAge,
  preFybcGrowthRate,
  postFybcReturnRate,
}) {
  const policies = getPolicies();

  const profile = getClientProfile();

  const fybcDate = getAgeMonthDate(profile.dateOfBirth, desiredFybcAge);

  const mortalityDate = getAgeMonthDate(
    profile.dateOfBirth,
    plannedMortalityAge,
  );

  if (!fybcDate || !mortalityDate || !Array.isArray(policies)) {
    return 0;
  }

  const currentDate = getProjectionStartDate();

  return policies.reduce(function (total, policy) {
    if (policy?.policyType !== "endowment") {
      return total;
    }

    const maturityDate = parsePlanningYearMonth(policy.endowment?.maturityDate);

    if (
      !maturityDate ||
      maturityDate < currentDate ||
      maturityDate >= mortalityDate
    ) {
      return total;
    }

    const maturityAmount =
      getNonNegativeNumber(policy.endowment?.guaranteedMaturityAmount) +
      getNonNegativeNumber(policy.endowment?.projectedNonGuaranteedAmount);

    if (maturityAmount <= 0) {
      return total;
    }

    /*
     * Matures before FYBC:
     * assume the selected proceeds remain invested
     * until FYBC.
     */
    if (maturityDate <= fybcDate) {
      const monthsToFybc = getWholeMonthsBetween(maturityDate, fybcDate);

      return (
        total +
        calculateLumpSumFutureValue({
          amount: maturityAmount,

          months: monthsToFybc,

          annualRatePercent: preFybcGrowthRate,
        })
      );
    }

    /*
     * Matures after FYBC:
     * convert the future maturity into its
     * FYBC-equivalent present value.
     */
    const monthsAfterFybc = getWholeMonthsBetween(fybcDate, maturityDate);

    const monthlyReturnRate = convertAnnualRateToMonthly(postFybcReturnRate);

    return (
      total + maturityAmount / Math.pow(1 + monthlyReturnRate, monthsAfterFybc)
    );
  }, 0);
}

export function getAgeMonthDate(dateOfBirth, targetAge) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth || "");

  const age = getNonNegativeNumber(targetAge);

  if (!match || age <= 0) {
    return null;
  }

  return new Date(Number(match[1]) + age, Number(match[2]) - 1, 1);
}

export function parsePlanningYearMonth(value) {
  const match = /^(\d{4})-(\d{2})/.exec(value || "");

  if (!match) {
    return null;
  }

  const year = Number(match[1]);

  const month = Number(match[2]) - 1;

  if (!Number.isFinite(year) || month < 0 || month > 11) {
    return null;
  }

  return new Date(year, month, 1);
}

export function getWholeMonthsBetween(fromDate, toDate) {
  return Math.max(
    0,
    (toDate.getFullYear() - fromDate.getFullYear()) * MONTHS_PER_YEAR +
      toDate.getMonth() -
      fromDate.getMonth(),
  );
}

/* ========================================
   ACCUMULATION MATH
======================================== */

export function calculateRequiredMonthlyContribution({
  targetFutureValue,
  months,
  annualRatePercent,
}) {
  const target = getNonNegativeNumber(targetFutureValue);

  const safeMonths = Math.floor(getNonNegativeNumber(months));

  if (target <= 0 || safeMonths <= 0) {
    return 0;
  }

  const monthlyRate = convertAnnualRateToMonthly(annualRatePercent);

  if (monthlyRate <= 0) {
    return target / safeMonths;
  }

  const accumulationFactor =
    (Math.pow(1 + monthlyRate, safeMonths) - 1) / monthlyRate;

  if (accumulationFactor <= 0) {
    return 0;
  }

  return target / accumulationFactor;
}

export function calculateMonthlyContributionFutureValue({
  monthlyAmount,
  months,
  annualRatePercent,
}) {
  const amount = getNonNegativeNumber(monthlyAmount);

  const safeMonths = Math.floor(getNonNegativeNumber(months));

  if (amount <= 0 || safeMonths <= 0) {
    return 0;
  }

  const monthlyRate = convertAnnualRateToMonthly(annualRatePercent);

  if (monthlyRate <= 0) {
    return amount * safeMonths;
  }

  return (amount * (Math.pow(1 + monthlyRate, safeMonths) - 1)) / monthlyRate;
}

export function calculateLumpSumFutureValue({
  amount,
  months,
  annualRatePercent,
}) {
  const safeAmount = getNonNegativeNumber(amount);

  const safeMonths = getNonNegativeNumber(months);

  if (safeAmount <= 0) {
    return 0;
  }

  const monthlyRate = convertAnnualRateToMonthly(annualRatePercent);

  return safeAmount * Math.pow(1 + monthlyRate, safeMonths);
}

export function calculateLumpSumPresentValue({
  amount,
  months,
  annualRatePercent,
}) {
  const safeAmount = getNonNegativeNumber(amount);

  const safeMonths = getNonNegativeNumber(months);

  if (safeAmount <= 0) {
    return 0;
  }

  const monthlyRate = convertAnnualRateToMonthly(annualRatePercent);

  return safeAmount / Math.pow(1 + monthlyRate, safeMonths);
}
