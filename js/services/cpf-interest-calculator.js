"use strict";

/* ========================================
   CPF INTEREST ASSUMPTIONS
======================================== */

export const CPF_OA_BASE_INTEREST_RATE = 0.025;

export const CPF_SMRA_BASE_INTEREST_RATE = 0.04;

export const CPF_OA_EXTRA_INTEREST_CAP = 20000;

/* ========================================
   MONTHLY CPF INTEREST
======================================== */

export function calculateMonthlyCpfInterest({
  age,
  oaBalance,
  saBalance,
  raBalance,
  maBalance,
}) {
  const balances = {
    oa: getNonNegativeNumber(oaBalance),
    sa: getNonNegativeNumber(saBalance),
    ra: getNonNegativeNumber(raBalance),
    ma: getNonNegativeNumber(maBalance),
  };

  const baseInterest = {
    oa: (balances.oa * CPF_OA_BASE_INTEREST_RATE) / 12,

    sa: (balances.sa * CPF_SMRA_BASE_INTEREST_RATE) / 12,

    ra: (balances.ra * CPF_SMRA_BASE_INTEREST_RATE) / 12,

    ma: (balances.ma * CPF_SMRA_BASE_INTEREST_RATE) / 12,
  };

  const extraInterestBySource = calculateMonthlyExtraInterest({
    age,
    balances,
  });

  const creditedInterest = {
    oa: baseInterest.oa,

    sa: baseInterest.sa,

    ra: baseInterest.ra,

    ma: baseInterest.ma + extraInterestBySource.ma,
  };

  if (age < 55) {
    creditedInterest.sa += extraInterestBySource.oa + extraInterestBySource.sa;
  } else {
    creditedInterest.ra += extraInterestBySource.oa + extraInterestBySource.ra;

    /*
     * SA should normally be closed from age 55,
     * but preserve any interest if an unusual
     * opening SA balance was entered.
     */
    creditedInterest.sa += extraInterestBySource.sa;
  }

  return {
    creditedInterest,

    baseInterest,

    extraInterestBySource,

    totalBaseInterest: sumObjectValues(baseInterest),

    totalExtraInterest: sumObjectValues(extraInterestBySource),

    totalInterest: sumObjectValues(creditedInterest),
  };
}

/* ========================================
   EXTRA INTEREST
======================================== */

function calculateMonthlyExtraInterest({ age, balances }) {
  const tiers =
    age < 55
      ? [
          {
            remaining: 60000,
            annualRate: 0.01,
          },
        ]
      : [
          {
            remaining: 30000,
            annualRate: 0.02,
          },
          {
            remaining: 30000,
            annualRate: 0.01,
          },
        ];

  const eligibleBalances = {
    oa: Math.min(balances.oa, CPF_OA_EXTRA_INTEREST_CAP),

    sa: balances.sa,
    ra: balances.ra,
    ma: balances.ma,
  };

  /*
   * Before 55 there is no active RA.
   * From 55, RA receives priority.
   */
  const accountOrder = age < 55 ? ["oa", "sa", "ma"] : ["ra", "oa", "sa", "ma"];

  const monthlyInterestBySource = {
    oa: 0,
    sa: 0,
    ra: 0,
    ma: 0,
  };

  tiers.forEach(function (tier) {
    accountOrder.forEach(function (account) {
      if (tier.remaining <= 0) {
        return;
      }

      const availableBalance = eligibleBalances[account];

      const qualifyingBalance = Math.min(availableBalance, tier.remaining);

      if (qualifyingBalance <= 0) {
        return;
      }

      monthlyInterestBySource[account] +=
        (qualifyingBalance * tier.annualRate) / 12;

      eligibleBalances[account] -= qualifyingBalance;

      tier.remaining -= qualifyingBalance;
    });
  });

  return monthlyInterestBySource;
}

/* ========================================
   HELPERS
======================================== */

function getNonNegativeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return number;
}

function sumObjectValues(values) {
  return Object.values(values).reduce(function (total, value) {
    return total + getNonNegativeNumber(value);
  }, 0);
}