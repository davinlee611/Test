"use strict";

import { formatCurrency } from "../../utils/client-utils.js";

import {
  setCurrency,
  setSignedCurrency,
  setText,
} from "./cost-analysis-format-utils.js";

/* ========================================
   CURRENT MONTHLY CASHFLOW
======================================== */

export function renderCurrentMonthlyCashflow(elements, cashflow) {
  const {
    cashflowDescriptionElement,
    incomeIncrementLabel,
    primaryIncomeLabel,
    contributionIncomeLabel,
    employmentIncomeElement,
    bonusIncomeElement,
    otherIncomeElement,
    retirementPolicyIncomeElement,
    totalMonthlyIncomeElement,
    monthlyExpensesElement,
    monthlyCommitmentsElement,
    remainingSurplusElement,
  } = elements;

  setText(
    cashflowDescriptionElement,

    cashflow.isSelfEmployed
      ? "A snapshot of the client's current monthly income and outflows in today's value. Mandatory MediSave contributions are deducted from self-employed income. Trade-income increments and expense inflation are applied only in the projections below."
      : "A snapshot of the client's current monthly income and outflows in today's value. Employment and bonus income are shown after employee CPF contributions. Employment increments and expense inflation are applied only in the projections below.",
  );

  setText(
    incomeIncrementLabel,

    cashflow.isSelfEmployed
      ? "Annual Net Trade Income Increment"
      : "Annual Employment & Bonus Increment",
  );

  setText(
    primaryIncomeLabel,

    cashflow.isSelfEmployed
      ? "Monthly Net Trade Income"
      : "Employment Income After CPF",
  );

  setText(
    contributionIncomeLabel,

    cashflow.isSelfEmployed
      ? "Mandatory MediSave Contribution"
      : "Annual Bonus After CPF",
  );

  setCurrency(
    employmentIncomeElement,

    cashflow.isSelfEmployed
      ? cashflow.monthlyNetTradeIncome
      : cashflow.employmentIncomeAfterCpf,
  );

  setText(
    bonusIncomeElement,

    cashflow.isSelfEmployed
      ? `-${formatCurrency(
          cashflow.annualSepMedisaveContribution,
        )}/year · -${formatCurrency(
          cashflow.monthlySepMedisaveContribution,
        )}/month`
      : `${formatCurrency(
          cashflow.annualBonusAfterCpf,
        )}/year · ${formatCurrency(cashflow.monthlyBonusAfterCpf)}/month`,
  );

  setCurrency(otherIncomeElement, cashflow.otherMonthlyIncome);

  setCurrency(retirementPolicyIncomeElement, cashflow.retirementPolicyIncome);

  setCurrency(totalMonthlyIncomeElement, cashflow.totalMonthlyIncome);

  setText(
    monthlyExpensesElement,

    `-${formatCurrency(cashflow.monthlyExpenses)}`,
  );

  setText(
    monthlyCommitmentsElement,

    `-${formatCurrency(cashflow.monthlyCommitments)}`,
  );

  setSignedCurrency(remainingSurplusElement, cashflow.remainingSurplus);
}
