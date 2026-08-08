"use strict";

import {
  getAssets,
  getClientProfile,
  getGoals,
  getLiabilities,
} from "../../state/client-plan.js";

import { getCpfAllocationRates } from "../../services/cpf-service.js";

import { calculateIncomeSummary } from "../../services/income-calculator.js";

import {
  getEffectiveMonthlyInsurancePremium,
  getMonthlyInsuranceMedisaveOutflow,
} from "../../services/commitment-service.js";

import { getApplicableBasicHealthcareSum } from "../../services/cpf-healthcare-service.js";

import { calculateMonthlyCpfInterest } from "../../services/cpf-interest-calculator.js";

import { getPolicyCashInflow } from "../../services/policy-cashflow-service.js";

import { calculateLiquidAssetTotal } from "../assets-income/assets-income-calculator.js";

import {
  CPF_RA_INTEREST_RATE,
  calculateProjectedCpfLifePayout,
} from "../cost-of-wants/cost-of-wants-calculator.js";

import {
  getDesiredFybcAge,
  getPlannedMortalityAge,
} from "../cost-of-wants/cost-of-wants-service.js";

import {
  DEFAULT_PROJECTION_PERIOD,
  DEFAULT_PROJECTION_YEARS,
  MINIMUM_AUTOMATIC_CPF_LIFE_PREMIUM,
  MONTHS_PER_YEAR,
} from "./cost-analysis-config.js";

import {
  addMonths,
  calculateAgeAtEndOfMonth,
  calculateAgeOnDate,
  isBirthdayAgeMonth,
  hasReachedTargetAgeMonth,
  isTargetAgeMonth,
} from "./cost-analysis-date-utils.js";

import { getFiniteNumber, getNonNegativeNumber } from "./cost-analysis-format-utils.js";

import {
  calculateActiveMonthlyCashCommitments,
  calculateActiveMonthlyCpfCommitments,
} from "./commitments-calculator.js";

import { getGoalsDueInMonth } from "./goal-date-utils.js";

import { getAgeMonthDate } from "./your-path-calculator.js";

import {
  getRetirementStrategyLabel,
  getRetirementStrategyTarget,
  normaliseRetirementStrategy,
  strategyUsesCashTopUp,
} from "./retirement-strategy.js";

/* ========================================
   PROJECTION ENGINE
======================================== */

export function calculateProjection({
  currentCashflow,
  annualEmploymentIncrement,
  annualExpenseInflation,
  projectionMonths,
  startingDate,
  cohortFrsAmount,
  retirementStrategy,
  retirementStrategyApplicationYear,
  cpfLifeStartAge,
}) {
  const assets = getAssets();

  const profile = getClientProfile();

  const desiredFybcAge = getDesiredFybcAge();

  const normalisedRetirementStrategy = normaliseRetirementStrategy(
    retirementStrategy,
    profile.employmentStatus,
  );

  const retirementStrategyTarget = getRetirementStrategyTarget({
    strategy: normalisedRetirementStrategy,

    cohortFrsAmount,

    strategyApplicationYear: retirementStrategyApplicationYear,
  });

  const shouldUseStrategyCashTopUp = strategyUsesCashTopUp(
    normalisedRetirementStrategy,
  );

  const goals = getGoals();

  const liabilities = getLiabilities();

  let withdrawableBalance = calculateLiquidAssetTotal(assets.liquidAssets);

  let oaBalance = getNonNegativeNumber(assets.cpf?.oa);

  let saBalance = getNonNegativeNumber(assets.cpf?.sa);

  let raBalance = getNonNegativeNumber(assets.cpf?.ra);

  let maBalance = getNonNegativeNumber(assets.cpf?.ma);

  const startingAge = calculateAgeOnDate(profile.dateOfBirth, startingDate);

  /*
   * If the client is already 55, preserve the
   * entered balances because they should already
   * represent their actual post-55 CPF position.
   */
  let raHasBeenFormed = startingAge !== null && startingAge >= 55;

  /*
   * Keep the amount already set aside for retirement
   * separate from the visible RA balance.
   *
   * When the CPF LIFE premium leaves RA, it must not
   * reopen FRS room and redirect later employment
   * contributions back into RA.
   */
  let retirementSumSetAside = raHasBeenFormed
    ? Math.min(raBalance, Math.max(cohortFrsAmount, retirementStrategyTarget))
    : 0;

  const pendingCpfInterest = {
    oa: 0,
    sa: 0,
    ra: 0,
    ma: 0,
  };

  const rows = [];

  let cpfLifeHasStarted = false;

  let activeCpfLifeMonthlyPayout = 0;

  for (let monthIndex = 0; monthIndex < projectionMonths; monthIndex += 1) {
    const projectionDate = addMonths(startingDate, monthIndex);

    const startingCpfBalances = {
      oa: oaBalance,
      sa: saBalance,
      ra: raBalance,
      ma: maBalance,
    };

    const completedYears = Math.max(
      projectionDate.getFullYear() - startingDate.getFullYear(),
      0,
    );

    const salaryGrowthFactor = Math.pow(
      1 + annualEmploymentIncrement,
      completedYears,
    );

    const hasReachedFybc = hasReachedTargetAgeMonth({
      dateOfBirth: profile.dateOfBirth,

      projectionDate,

      targetAge: desiredFybcAge,
    });

    const projectedEmploymentIncome = hasReachedFybc
      ? 0
      : currentCashflow.employmentIncome * salaryGrowthFactor;

    const projectedAnnualBonus = hasReachedFybc
      ? 0
      : currentCashflow.annualBonus * salaryGrowthFactor;

    const projectedAnnualNetTradeIncome = hasReachedFybc
      ? 0
      : currentCashflow.annualNetTradeIncome * salaryGrowthFactor;

    const age = calculateAgeOnDate(profile.dateOfBirth, projectionDate);

    const displayedAge = calculateAgeAtEndOfMonth(
      profile.dateOfBirth,
      projectionDate,
    );

    const isAge55TransitionMonth = isBirthdayAgeMonth({
      dateOfBirth: profile.dateOfBirth,

      projectionDate,

      targetAge: 55,
    });

    const fybcReachedThisMonth = isTargetAgeMonth({
      dateOfBirth: profile.dateOfBirth,

      projectionDate,

      targetAge: desiredFybcAge,
    });

    const projectedIncome = calculateProjectedIncome({
      monthlyEmploymentIncome: projectedEmploymentIncome,

      annualBonus: projectedAnnualBonus,

      annualNetTradeIncome: projectedAnnualNetTradeIncome,

      netPlatformEarnings: hasReachedFybc
        ? 0
        : getNonNegativeNumber(assets.income?.netPlatformEarnings) *
          salaryGrowthFactor,

      sepMedisaveOverrideEnabled: assets.income?.sepMedisaveOverrideEnabled,

      sepMedisaveOverrideAmount: assets.income?.sepMedisaveOverrideAmount,

      otherMonthlyIncome:
        !hasReachedFybc ||
        assets.income?.otherMonthlyContinuesAfterFybc !== false
          ? currentCashflow.otherMonthlyIncome
          : 0,

      employmentStatus: profile.employmentStatus,

      age,

      ageAtStartOfWorkYear: calculateAgeOnDate(
        profile.dateOfBirth,

        new Date(projectionDate.getFullYear(), 0, 1),
      ),
    });

    const expenseGrowthFactor = Math.pow(
      1 + annualExpenseInflation,
      completedYears,
    );

    const monthlyExpenses =
      currentCashflow.monthlyExpenses * expenseGrowthFactor;

    const activeCashCommitments = calculateActiveMonthlyCashCommitments(
      liabilities,
      projectionDate,
    );

    const insurancePremiums =
      getEffectiveMonthlyInsurancePremium(projectionDate);

    const monthlyCommitments = activeCashCommitments + insurancePremiums;

    const policyCashInflow = getPolicyCashInflow({
      projectionDate,

      dateOfBirth: profile.dateOfBirth,
    });

    const operatingCashflowBeforeCpfLife =
      projectedIncome.monthlyTakeHomeIncome +
      projectedIncome.monthlyBonusAfterCpf +
      projectedIncome.monthlyOtherIncome -
      monthlyExpenses -
      monthlyCommitments +
      policyCashInflow.total;

    const goalsDue = getGoalsDueInMonth(goals, projectionDate);

    const bigTicketOutflow = goalsDue.reduce(function (total, goal) {
      return total + getNonNegativeNumber(goal.targetAmount);
    }, 0);

    const startWithdrawableBalance = withdrawableBalance;

    const employeeCpfInflow =
      projectedIncome.monthlyTotalCpfContribution +
      projectedIncome.monthlyBonusTotalCpf;

    const totalCpfInflow =
      employeeCpfInflow + projectedIncome.monthlySepMedisaveContribution;

    const allocationRates = getCpfAllocationRates(age);

    let oaInflow = employeeCpfInflow * allocationRates.oaRate;

    const retirementInflow = employeeCpfInflow * allocationRates.retirementRate;

    const originalMaInflow =
      employeeCpfInflow * allocationRates.maRate +
      projectedIncome.monthlySepMedisaveContribution;

    /*
     * Monthly projections treat the client's birthday month
     * as the age-transition month. This ensures RA is formed
     * in June 2044 for a client born on 15 June 1989, rather
     * than one month late in July.
     */
    const hasReachedAge55 = hasReachedTargetAgeMonth({
      dateOfBirth: profile.dateOfBirth,

      projectionDate,

      targetAge: 55,
    });

    let frsMetAt55 = false;

    /*
     * Form RA once in the month the client
     * reaches age 55.
     *
     * SA is transferred first, followed by OA.
     * Any remaining SA after meeting FRS moves
     * into OA because SA no longer remains the
     * displayed retirement account.
     */
    let retirementStrategyCashTopUp = 0;

    let retirementStrategyAppliedThisMonth = false;

    /*
     * If the client is already 55 or older, their entered RA
     * represents the current post-55 position.
     *
     * Apply an explicitly selected BRS, FRS or ERS cash
     * top-up in the first projection month. Do not transfer
     * OA automatically because RA has already been formed.
     */
    if (raHasBeenFormed && monthIndex === 0 && shouldUseStrategyCashTopUp) {
      retirementStrategyAppliedThisMonth = true;

      const remainingTarget = Math.max(retirementStrategyTarget - raBalance, 0);

      const availableWithdrawableCash = Math.max(withdrawableBalance, 0);

      retirementStrategyCashTopUp = Math.min(
        remainingTarget,
        availableWithdrawableCash,
      );

      raBalance += retirementStrategyCashTopUp;

      retirementSumSetAside = Math.max(
        retirementSumSetAside,
        Math.min(raBalance, cohortFrsAmount),
      );
    }

    if (hasReachedAge55 && !raHasBeenFormed) {
      retirementStrategyAppliedThisMonth = true;

      /*
       * Fund the selected retirement target using:
       *
       * 1. SA
       * 2. OA
       * 3. Available withdrawable cash, but only for the
       *    explicit BRS, FRS and ERS scenarios.
       */
      const remainingTargetBeforeSa = Math.max(
        retirementStrategyTarget - raBalance,
        0,
      );

      const saTransferredToRa = Math.min(saBalance, remainingTargetBeforeSa);

      raBalance += saTransferredToRa;
      saBalance -= saTransferredToRa;

      const remainingTargetBeforeOa = Math.max(
        retirementStrategyTarget - raBalance,
        0,
      );

      const oaTransferredToRa = Math.min(oaBalance, remainingTargetBeforeOa);

      raBalance += oaTransferredToRa;
      oaBalance -= oaTransferredToRa;

      /*
       * SA closes when RA is formed. Any SA remaining after
       * the selected retirement target is met moves to OA.
       */
      oaBalance += saBalance;
      saBalance = 0;

      if (shouldUseStrategyCashTopUp) {
        const remainingTargetBeforeCash = Math.max(
          retirementStrategyTarget - raBalance,
          0,
        );

        const availableWithdrawableCash = Math.max(withdrawableBalance, 0);

        retirementStrategyCashTopUp = Math.min(
          remainingTargetBeforeCash,
          availableWithdrawableCash,
        );

        raBalance += retirementStrategyCashTopUp;
      }

      pendingCpfInterest.ra += pendingCpfInterest.sa;

      pendingCpfInterest.sa = 0;

      raHasBeenFormed = true;

      retirementSumSetAside = Math.max(
        retirementSumSetAside,
        Math.min(raBalance, cohortFrsAmount),
      );

      /*
       * This indicator continues to use the actual cohort
       * FRS—not the selected BRS or ERS strategy.
       */
      frsMetAt55 =
        cohortFrsAmount > 0 && retirementSumSetAside >= cohortFrsAmount - 0.5;
    }

    let cpfLifePremiumOutflow = 0;

    let targetCpfLifePremium = 0;

    let affordableCpfLifePremium = 0;

    /*
     * Preserve the RA balance immediately before
     * the CPF LIFE premium is deducted.
     */
    let raBalanceBeforeCpfLife = 0;

    let cpfLifeProjectionStatus = cpfLifeHasStarted ? "started" : "not_started";

    let cpfLifeStartedThisMonth = false;

    if (
      !cpfLifeHasStarted &&
      isCpfLifeStartMonth({
        dateOfBirth: profile.dateOfBirth,
        projectionDate,
        cpfLifeStartAge,
      })
    ) {
      /*
       * Capture the balance before CPF LIFE removes
       * the affordable premium from RA.
       */
      raBalanceBeforeCpfLife = raBalance;

      targetCpfLifePremium = calculateTargetCpfLifePremium({
        cohortFrsAmount: retirementStrategyTarget,

        cpfLifeStartAge,
      });

      affordableCpfLifePremium = Math.min(raBalance, targetCpfLifePremium);

      if (affordableCpfLifePremium >= MINIMUM_AUTOMATIC_CPF_LIFE_PREMIUM) {
        cpfLifePremiumOutflow = affordableCpfLifePremium;

        raBalance -= cpfLifePremiumOutflow;

        activeCpfLifeMonthlyPayout = calculateProjectedCpfLifePayout({
          cpfLifePremium: cpfLifePremiumOutflow,

          gender: profile.gender,
        });

        cpfLifeHasStarted = true;

        cpfLifeStartedThisMonth = true;

        cpfLifeProjectionStatus = "started";
      } else {
        cpfLifeProjectionStatus = "insufficient";
      }
    }

    /*
     * Apply the BHS applicable for this month.
     * Opening MA is preserved. Only new MA
     * allocation is restricted by the limit.
     */
    const applicableBhs = getApplicableBasicHealthcareSum({
      dateOfBirth: profile.dateOfBirth,
      projectionDate,
    });

    const bhsAmount = applicableBhs.isValid
      ? applicableBhs.amount
      : Number.POSITIVE_INFINITY;

    const availableMaCapacity = Math.max(bhsAmount - maBalance, 0);

    const maInflow = Math.min(originalMaInflow, availableMaCapacity);

    const maOverflow = Math.max(originalMaInflow - maInflow, 0);

    /*
     * Before 55:
     * - normal retirement allocation goes to SA
     * - MA overflow also goes to SA
     *
     * From 55:
     * - retirement allocation and MA overflow
     *   fill RA up to cohort FRS
     * - remaining excess goes to OA
     */
    if (!hasReachedAge55) {
      saBalance += retirementInflow + maOverflow;
    } else {
      const amountAvailableForRa = retirementInflow + maOverflow;

      /*
       * Normal CPF contributions continue filling RA only
       * until the client's cohort FRS has been set aside.
       *
       * The selected retirement strategy (BRS / FRS / ERS)
       * is a planning choice and must not change the normal
       * CPF contribution-routing rule.
       */
      const remainingRaCapacity = Math.max(
        cohortFrsAmount - retirementSumSetAside,
        0,
      );

      const amountDirectedToRa = Math.min(
        amountAvailableForRa,
        remainingRaCapacity,
      );

      const amountRedirectedToOa = amountAvailableForRa - amountDirectedToRa;

      raBalance += amountDirectedToRa;
      retirementSumSetAside += amountDirectedToRa;
      oaInflow += amountRedirectedToOa;
    }

    const oaOutflow = calculateActiveMonthlyCpfCommitments(
      liabilities,
      projectionDate,
    );

    oaBalance = Math.max(0, oaBalance + oaInflow - oaOutflow);

    const availableMaBalance = maBalance + maInflow;

    const monthlyInsuranceMedisaveOutflow =
      getMonthlyInsuranceMedisaveOutflow(projectionDate);

    const maInsuranceOutflow = Math.min(
      monthlyInsuranceMedisaveOutflow,
      availableMaBalance,
    );

    maBalance = Math.max(0, availableMaBalance - maInsuranceOutflow);

    const monthlyCpfInterest = calculateMonthlyCpfInterest({
      age,

      oaBalance,
      saBalance,
      raBalance,
      maBalance,
    });

    pendingCpfInterest.oa += monthlyCpfInterest.creditedInterest.oa;

    pendingCpfInterest.sa += monthlyCpfInterest.creditedInterest.sa;

    pendingCpfInterest.ra += monthlyCpfInterest.creditedInterest.ra;

    pendingCpfInterest.ma += monthlyCpfInterest.creditedInterest.ma;

    let cpfInterestCredited = 0;

    /*
     * CPF interest is accumulated monthly and
     * credited in December.
     */
    if (projectionDate.getMonth() === 11) {
      oaBalance += pendingCpfInterest.oa;

      saBalance += pendingCpfInterest.sa;

      raBalance += pendingCpfInterest.ra;

      retirementSumSetAside = Math.max(
        retirementSumSetAside,
        Math.min(raBalance, cohortFrsAmount),
      );

      /*
       * MA interest is credited only up to the
       * applicable BHS. Excess follows the same
       * BHS overflow routing used by contributions.
       */
      const maInterestCapacity = Math.max(bhsAmount - maBalance, 0);

      const maInterestCredited = Math.min(
        pendingCpfInterest.ma,
        maInterestCapacity,
      );

      const maInterestOverflow = Math.max(
        pendingCpfInterest.ma - maInterestCredited,
        0,
      );

      maBalance += maInterestCredited;

      if (maInterestOverflow > 0) {
        if (!hasReachedAge55) {
          /*
           * Before age 55, MA interest above the
           * applicable BHS flows into SA.
           *
           * Do not cap this using the client's future
           * cohort FRS. FRS only becomes relevant when
           * RA is formed at age 55.
           */
          saBalance += maInterestOverflow;
        } else {
          /*
           * From age 55, excess MA interest flows into
           * RA until the client's cohort FRS has been
           * fully set aside.
           *
           * Any remaining excess flows into OA.
           */
          const remainingRaCapacity = Math.max(
            cohortFrsAmount - retirementSumSetAside,
            0,
          );

          const overflowToRa = Math.min(
            maInterestOverflow,
            remainingRaCapacity,
          );

          const overflowToOa = maInterestOverflow - overflowToRa;

          raBalance += overflowToRa;
          retirementSumSetAside += overflowToRa;
          oaBalance += overflowToOa;
        }
      }

      cpfInterestCredited =
        pendingCpfInterest.oa +
        pendingCpfInterest.sa +
        pendingCpfInterest.ra +
        pendingCpfInterest.ma;

      pendingCpfInterest.oa = 0;
      pendingCpfInterest.sa = 0;
      pendingCpfInterest.ra = 0;
      pendingCpfInterest.ma = 0;
    }

    const retirementAccount = hasReachedAge55 ? "ra" : "sa";

    const cpfLifeCashInflow = cpfLifeHasStarted
      ? activeCpfLifeMonthlyPayout
      : 0;

    const operatingCashflow =
      operatingCashflowBeforeCpfLife + cpfLifeCashInflow;

    const netMovement =
      operatingCashflow - bigTicketOutflow - retirementStrategyCashTopUp;

    const goalOutflowItems = goalsDue.map(function (goal) {
      return {
        goalId: goal.id || "",

        goalName: goal.name || "Goal",

        amount: getNonNegativeNumber(goal.targetAmount),
      };
    });

    const cashflowBreakdown = {
      takeHomeIncome: projectedIncome.monthlyTakeHomeIncome,

      bonusIncome: projectedIncome.monthlyBonusAfterCpf,

      otherIncome: projectedIncome.monthlyOtherIncome,

      cpfLifeIncome: cpfLifeCashInflow,

      expenses: monthlyExpenses,

      liabilities: activeCashCommitments,

      insurancePremiums,

      retirementStrategyCashTopUp,
    };

    const cashflowEvents = createCashflowEvents({
      policyItems: policyCashInflow.items,

      goalItems: goalOutflowItems,

      cpfLifeStartedThisMonth,

      cpfLifeCashInflow,

      retirementStrategyCashTopUp,

      retirementStrategy: normalisedRetirementStrategy,
    });

    withdrawableBalance = startWithdrawableBalance + netMovement;

    const accountNetFlows = {
      oa: oaBalance - startingCpfBalances.oa,

      sa: saBalance - startingCpfBalances.sa,

      ra: raBalance - startingCpfBalances.ra,

      ma: maBalance - startingCpfBalances.ma,
    };

    const netCpf =
      accountNetFlows.oa +
      accountNetFlows.sa +
      accountNetFlows.ra +
      accountNetFlows.ma;

    const displayedRetirementBalance =
      retirementAccount === "ra" ? raBalance : saBalance;

    /*
     * This remains true after the age-55 transition when the
     * client's cohort FRS has been fully set aside.
     *
     * It is deliberately separate from frsMetAt55, which only
     * identifies the month in which FRS was first met.
     */
    const hasMetCohortFrs =
      cohortFrsAmount > 0 && retirementSumSetAside >= cohortFrsAmount - 0.5;

    rows.push({
      date: projectionDate,

      age: displayedAge,

      fybcReachedThisMonth,

      frsMetAt55,

      hasMetCohortFrs,

      retirementStrategy: normalisedRetirementStrategy,

      retirementStrategyTarget,

      retirementStrategyCashTopUp,

      retirementStrategyAppliedThisMonth,

      retirementSumSetAside,

      startWithdrawableBalance,

      operatingCashflow,

      netMovement,

      cashflowBreakdown,

      cashflowEvents,

      policyCashInflow: policyCashInflow.total,

      policyCashInflowItems: policyCashInflow.items,

      bigTicketOutflow,

      goalOutflowItems,

      endWithdrawableBalance: withdrawableBalance,

      cpfInflow: totalCpfInflow,

      cpfInterestCredited,

      oaOutflow,

      /*
       * There are currently no routine withdrawals
       * from SA or RA. These fields are retained so
       * the combined outflow column can support them
       * later without another table redesign.
       */
      saOutflow: 0,

      raOutflow: cpfLifePremiumOutflow,

      maInsuranceOutflow,

      accountNetFlows,

      netCpf,

      cpfLifeCashInflow,

      cpfLifePremiumOutflow,

      raBalanceBeforeCpfLife,

      targetCpfLifePremium,

      affordableCpfLifePremium,

      cpfLifeMonthlyPayout: activeCpfLifeMonthlyPayout,

      cpfLifeProjectionStatus,

      oaBalance,

      retirementAccount,

      retirementBalance: displayedRetirementBalance,

      maBalance,

      applicableBhs: applicableBhs.isValid ? applicableBhs.amount : 0,

      bhsBasis: applicableBhs.basis,

      bhsIsLocked: applicableBhs.isLocked,

      goalNames: goalsDue.map(function (goal) {
        return goal.name || "Goal";
      }),
    });
  }

  return rows;
}

export function calculateTargetCpfLifePremium({ cohortFrsAmount, cpfLifeStartAge }) {
  const safeFrs = getNonNegativeNumber(cohortFrsAmount);

  const compoundingYears = Math.max(getFiniteNumber(cpfLifeStartAge) - 55, 0);

  return safeFrs * Math.pow(1 + CPF_RA_INTEREST_RATE / 100, compoundingYears);
}

export function isCpfLifeStartMonth({ dateOfBirth, projectionDate, cpfLifeStartAge }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth || "")) {
    return false;
  }

  const birthYear = Number(dateOfBirth.slice(0, 4));

  const birthMonth = Number(dateOfBirth.slice(5, 7)) - 1;

  return (
    projectionDate.getFullYear() === birthYear + cpfLifeStartAge &&
    projectionDate.getMonth() === birthMonth
  );
}

/* ========================================
   PROJECTION PERIOD
======================================== */

export function getSelectedProjectionPeriod(elements) {
  const selectedInput = elements.projectionPeriodInputs.find(function (input) {
    return input.checked;
  });

  return selectedInput?.value || DEFAULT_PROJECTION_PERIOD;
}

export function getProjectionMonthCount(selectedPeriod, startingDate) {
  if (selectedPeriod === "10") {
    return DEFAULT_PROJECTION_YEARS * MONTHS_PER_YEAR;
  }

  if (selectedPeriod !== "mortality") {
    const selectedYears = Number(selectedPeriod);

    if (Number.isFinite(selectedYears) && selectedYears > 0) {
      const projectionEndDate = new Date(
        startingDate.getFullYear() + selectedYears,
        11,
        1,
      );

      return getInclusiveMonthDifference(startingDate, projectionEndDate);
    }

    return DEFAULT_PROJECTION_YEARS * MONTHS_PER_YEAR;
  }

  const profile = getClientProfile();

  const plannedMortalityAge = getPlannedMortalityAge();

  const mortalityMonth = getAgeMonthDate(
    profile.dateOfBirth,
    plannedMortalityAge,
  );

  if (!mortalityMonth || mortalityMonth < startingDate) {
    return DEFAULT_PROJECTION_YEARS * MONTHS_PER_YEAR;
  }

  return getInclusiveMonthDifference(startingDate, mortalityMonth);
}

function getInclusiveMonthDifference(startDate, endDate) {
  const yearDifference = endDate.getFullYear() - startDate.getFullYear();

  const monthDifference = endDate.getMonth() - startDate.getMonth();

  return Math.max(yearDifference * MONTHS_PER_YEAR + monthDifference + 1, 0);
}

/* ========================================
   ANNUAL PROJECTION ROWS
======================================== */

export function aggregateProjectionIntoAnnualRows(monthlyRows) {
  const rowsByCalendarYear = new Map();

  monthlyRows.forEach(function (row) {
    const calendarYear = row.date.getFullYear();

    if (!rowsByCalendarYear.has(calendarYear)) {
      rowsByCalendarYear.set(calendarYear, []);
    }

    rowsByCalendarYear.get(calendarYear).push(row);
  });

  const currentYear = new Date().getFullYear();

  return Array.from(rowsByCalendarYear.entries()).map(function ([
    calendarYear,
    periodRows,
  ]) {
    const firstRow = periodRows[0];

    const lastRow = periodRows[periodRows.length - 1];

    return {
      date: new Date(calendarYear, 11, 1),

      age: lastRow.age,

      frsMetAt55: periodRows.some(function (row) {
        return row.frsMetAt55;
      }),

      hasMetCohortFrs: Boolean(lastRow.hasMetCohortFrs),

      retirementStrategy: lastRow.retirementStrategy,

      retirementStrategyTarget: lastRow.retirementStrategyTarget,

      retirementStrategyCashTopUp: sumProjectionValues(
        periodRows,
        "retirementStrategyCashTopUp",
      ),

      retirementStrategyAppliedThisMonth: periodRows.some(function (row) {
        return row.retirementStrategyAppliedThisMonth;
      }),

      retirementSumSetAside: lastRow.retirementSumSetAside,

      calendarYear,

      projectionYear: calendarYear - currentYear,

      isCurrentPartialYear: calendarYear === currentYear,

      fybcReachedThisMonth: periodRows.some(function (row) {
        return row.fybcReachedThisMonth;
      }),

      startWithdrawableBalance: firstRow.startWithdrawableBalance,

      operatingCashflow: sumProjectionValues(periodRows, "operatingCashflow"),

      netMovement: sumProjectionValues(periodRows, "netMovement"),

      cashflowBreakdown: aggregateCashflowBreakdown(periodRows),

      cashflowEvents: periodRows.flatMap(function (row) {
        return row.cashflowEvents || [];
      }),

      policyCashInflow: sumProjectionValues(periodRows, "policyCashInflow"),

      policyCashInflowItems: aggregatePolicyCashInflowItems(periodRows),

      bigTicketOutflow: sumProjectionValues(periodRows, "bigTicketOutflow"),

      goalOutflowItems: periodRows.flatMap(function (row) {
        return row.goalOutflowItems || [];
      }),

      endWithdrawableBalance: lastRow.endWithdrawableBalance,

      cpfInflow: sumProjectionValues(periodRows, "cpfInflow"),

      cpfInterestCredited: sumProjectionValues(
        periodRows,
        "cpfInterestCredited",
      ),

      oaOutflow: sumProjectionValues(periodRows, "oaOutflow"),

      saOutflow: sumProjectionValues(periodRows, "saOutflow"),

      raOutflow: sumProjectionValues(periodRows, "raOutflow"),

      maInsuranceOutflow: sumProjectionValues(periodRows, "maInsuranceOutflow"),

      accountNetFlows: {
        oa: sumNestedProjectionValues(periodRows, "accountNetFlows", "oa"),

        sa: sumNestedProjectionValues(periodRows, "accountNetFlows", "sa"),

        ra: sumNestedProjectionValues(periodRows, "accountNetFlows", "ra"),

        ma: sumNestedProjectionValues(periodRows, "accountNetFlows", "ma"),
      },

      netCpf: sumProjectionValues(periodRows, "netCpf"),

      oaBalance: lastRow.oaBalance,

      retirementAccount: lastRow.retirementAccount,

      retirementBalance: lastRow.retirementBalance,

      maBalance: lastRow.maBalance,

      applicableBhs: lastRow.applicableBhs,

      bhsBasis: lastRow.bhsBasis,

      bhsIsLocked: lastRow.bhsIsLocked,

      goalNames: periodRows.flatMap(function (row) {
        return row.goalNames;
      }),
    };
  });
}

function sumProjectionValues(rows, propertyName) {
  return rows.reduce(function (total, row) {
    return total + getFiniteNumber(row[propertyName]);
  }, 0);
}

function sumNestedProjectionValues(rows, objectName, propertyName) {
  return rows.reduce(function (total, row) {
    return total + getFiniteNumber(row[objectName]?.[propertyName]);
  }, 0);
}

function aggregatePolicyCashInflowItems(rows) {
  const itemsByPolicy = new Map();

  rows
    .flatMap(function (row) {
      return row.policyCashInflowItems || [];
    })
    .forEach(function (item) {
      const key = item.policyId || `${item.policyType}:${item.policyName}`;

      const existing = itemsByPolicy.get(key);

      if (existing) {
        existing.amount += getFiniteNumber(item.amount);

        existing.maturedThisMonth =
          existing.maturedThisMonth || item.maturedThisMonth;

        existing.startedThisMonth =
          existing.startedThisMonth || item.startedThisMonth;

        existing.endedThisMonth =
          existing.endedThisMonth || item.endedThisMonth;

        return;
      }

      itemsByPolicy.set(key, {
        ...item,

        amount: getFiniteNumber(item.amount),
      });
    });

  return Array.from(itemsByPolicy.values());
}

function aggregateCashflowBreakdown(rows) {
  const properties = [
    "takeHomeIncome",
    "bonusIncome",
    "otherIncome",
    "cpfLifeIncome",
    "expenses",
    "liabilities",
    "insurancePremiums",
    "retirementStrategyCashTopUp",
  ];

  return properties.reduce(function (breakdown, propertyName) {
    breakdown[propertyName] = rows.reduce(function (total, row) {
      return total + getFiniteNumber(row.cashflowBreakdown?.[propertyName]);
    }, 0);

    return breakdown;
  }, {});
}

function createCashflowEvents({
  policyItems,
  goalItems,
  cpfLifeStartedThisMonth,
  cpfLifeCashInflow,
  retirementStrategyCashTopUp = 0,
  retirementStrategy = "",
}) {
  const events = [];

  policyItems.forEach(function (item) {
    if (item.maturedThisMonth) {
      events.push({
        label: `${item.policyName} matured`,

        amount: item.amount,

        direction: "inflow",
      });
    }

    if (item.startedThisMonth) {
      events.push({
        label: `${item.policyName} payout started`,

        amount: item.amount,

        direction: "inflow",
      });
    }

    if (item.endedThisMonth) {
      events.push({
        label: `${item.policyName} payout ended`,

        amount: item.amount,

        direction: "inflow",
      });
    }
  });

  if (cpfLifeStartedThisMonth && cpfLifeCashInflow > 0) {
    events.push({
      label: "CPF LIFE payout started",

      amount: cpfLifeCashInflow,

      direction: "inflow",
    });
  }

  if (retirementStrategyCashTopUp > 0) {
    events.push({
      label: `${getRetirementStrategyLabel(retirementStrategy)} cash top-up to RA`,

      amount: retirementStrategyCashTopUp,

      direction: "outflow",
    });
  }

  goalItems.forEach(function (item) {
    if (item.amount <= 0) {
      return;
    }

    events.push({
      label: `${item.goalName} paid`,

      amount: item.amount,

      direction: "outflow",
    });
  });

  return events;
}

function calculateProjectedIncome({
  monthlyEmploymentIncome,

  annualBonus,

  annualNetTradeIncome,

  netPlatformEarnings,

  sepMedisaveOverrideEnabled,

  sepMedisaveOverrideAmount,

  otherMonthlyIncome,

  employmentStatus,

  age,

  ageAtStartOfWorkYear,
}) {
  const summary = calculateIncomeSummary({
    monthlyEmploymentIncome,

    annualBonus,

    annualNetTradeIncome,

    netPlatformEarnings,

    sepMedisaveOverrideEnabled,

    sepMedisaveOverrideAmount,

    monthlyOtherIncome: otherMonthlyIncome,

    employmentStatus,

    age,

    ageAtStartOfWorkYear,
  });

  const monthlyBonusAfterCpf =
    (getNonNegativeNumber(annualBonus) -
      summary.annualAdditionalWageEmployeeCpf) /
    12;

  const monthlyBonusTotalCpf =
    (summary.annualAdditionalWageEmployeeCpf +
      summary.annualAdditionalWageEmployerCpf) /
    12;

  return {
    monthlyTakeHomeIncome: summary.isSelfEmployed
      ? summary.monthlyNetTradeIncome - summary.monthlySepMedisaveContribution
      : getNonNegativeNumber(monthlyEmploymentIncome) -
        summary.monthlyEmployeeCpf,

    monthlyOtherIncome: getNonNegativeNumber(otherMonthlyIncome),

    monthlyBonusAfterCpf: summary.isSelfEmployed ? 0 : monthlyBonusAfterCpf,

    monthlyTotalCpfContribution:
      summary.monthlyEmployeeCpf + summary.monthlyEmployerCpf,

    monthlyBonusTotalCpf: summary.isSelfEmployed ? 0 : monthlyBonusTotalCpf,

    monthlySepMedisaveContribution: summary.monthlySepMedisaveContribution,
  };
}
