"use strict";

import {
  formatCurrency,
  formatDeduction,
  formatPercentage,
} from "../../utils/client-utils.js";

import { CPF_ORDINARY_WAGE_CEILING } from "../../services/cpf-service.js";

/* ========================================
   FULL DISPLAY UPDATE
======================================== */

export function renderAssetsIncomeDisplay({
  elements,

  summary,

  employmentStatus,

  age,
}) {
  if (elements.totalLiquidAssetsElement) {
    elements.totalLiquidAssetsElement.textContent = formatCurrency(
      summary.totalLiquidAssets,
    );
  }

  if (elements.totalCpfElement) {
    elements.totalCpfElement.textContent = formatCurrency(summary.totalCpf);
  }

  renderIncomeSummary({
    elements,

    summary: summary.incomeSummary,

    employmentStatus,

    age,
  });
}

/* ========================================
   INCOME SUMMARY
======================================== */

function renderIncomeSummary({
  elements,

  summary,

  employmentStatus,

  age,
}) {
  setAmountDisplay({
    element: elements.employeeCpfContributionElement,

    value: summary.monthlyEmployeeCpf,

    deduction: true,

    period: "per month",
  });

  setAmountDisplay({
    element: elements.monthlyTakeHomeIncomeElement,

    value: summary.monthlyTakeHomeIncome,

    period: "per month",
  });

  setAmountDisplay({
    element: elements.annualEmploymentIncomeElement,

    value: summary.annualEmploymentIncome,
  });

  setAmountDisplay({
    element: elements.annualTakeHomeIncomeElement,

    value: summary.annualTakeHomeIncome,
  });

  renderCpfSummaryNote({
    elements,

    summary,

    employmentStatus,

    age,
  });

  renderCpfDetails({
    elements,

    summary,
  });
}

/* ========================================
   CPF SUMMARY NOTE
======================================== */

function renderCpfSummaryNote({
  elements,

  summary,

  employmentStatus,

  age,
}) {
  if (elements.employeeCpfContributionNote) {
    elements.employeeCpfContributionNote.textContent = summary.cpfApplies
      ? [
          "Employee contribution: ",

          formatPercentage(summary.employeeCpfRate),

          " (Ordinary Wage Ceiling: ",

          formatCurrency(CPF_ORDINARY_WAGE_CEILING),

          "/month)",
        ].join("")
      : getCpfSummaryNote(employmentStatus, age, summary);
  }

  if (elements.cpfNotApplicableMessage) {
    elements.cpfNotApplicableMessage.hidden = summary.cpfApplies;

    if (!summary.cpfApplies) {
      elements.cpfNotApplicableMessage.textContent = getCpfNotApplicableMessage(
        employmentStatus,
        age,
      );
    }
  }
}

/* ========================================
   CPF DETAILS
======================================== */

function renderCpfDetails({
  elements,

  summary,
}) {
  if (elements.employeeCpfRateElement) {
    elements.employeeCpfRateElement.textContent = formatPercentage(
      summary.employeeCpfRate,
    );
  }

  setCpfDetailValue({
    element: elements.ordinaryWageCeilingElement,

    value: CPF_ORDINARY_WAGE_CEILING,

    period: "per month",
  });

  setCpfDetailValue({
    element: elements.monthlyWageSubjectToCpfElement,

    value: summary.monthlyCpfOrdinaryWage,

    period: "per month",
  });

  setCpfDetailValue({
    element: elements.monthlyIncomeNotSubjectToCpfElement,

    value: summary.monthlyIncomeNotSubjectToCpf,

    period: "per month",
  });

  if (elements.additionalWageCeilingElement) {
    elements.additionalWageCeilingElement.textContent = formatCurrency(
      summary.additionalWageCeiling,
    );
  }

  if (elements.bonusSubjectToCpfElement) {
    elements.bonusSubjectToCpfElement.textContent = formatCurrency(
      summary.cpfAdditionalWage,
    );
  }

  if (elements.bonusNotSubjectToCpfElement) {
    elements.bonusNotSubjectToCpfElement.textContent = formatCurrency(
      summary.bonusNotSubjectToCpf,
    );
  }

  if (elements.cpfOnAdditionalWagesElement) {
    elements.cpfOnAdditionalWagesElement.textContent = formatCurrency(
      summary.annualAdditionalWageEmployeeCpf,
    );
  }
}

/* ========================================
   CPF MESSAGES
======================================== */

function getCpfSummaryNote(employmentStatus, age, summary) {
  if (!employmentStatus) {
    return "Select an employment status";
  }

  if (employmentStatus !== "full_time_employed") {
    return "CPF not applied for this " + "employment status";
  }

  if (age === null) {
    return "Enter the client's date of birth";
  }

  return (
    formatPercentage(summary.employeeCpfRate) +
    " of CPF-applicable monthly wages"
  );
}

function getCpfNotApplicableMessage(employmentStatus, age) {
  if (!employmentStatus) {
    return (
      "Select the client's employment " +
      "status to determine whether " +
      "CPF applies."
    );
  }

  if (employmentStatus === "self_employed") {
    return (
      "Employee CPF is not applied to " +
      "self-employed income. " +
      "Self-employed MediSave " +
      "obligations are not included " +
      "in this calculation."
    );
  }

  if (employmentStatus === "full_time_employed" && age === null) {
    return (
      "Enter the client's date of birth " +
      "to determine the applicable " +
      "CPF rate."
    );
  }

  return "Employee CPF is not applied to " + "this employment status.";
}

/* ========================================
   AMOUNT DISPLAY
======================================== */

function setAmountDisplay({
  element,

  value,

  deduction = false,

  period = "",
}) {
  if (!element) {
    return;
  }

  element.replaceChildren();

  element.appendChild(
    document.createTextNode(
      deduction ? formatDeduction(value) : formatCurrency(value),
    ),
  );

  appendPeriod(element, period);
}

function setCpfDetailValue({
  element,

  value,

  period = "",
}) {
  if (!element) {
    return;
  }

  element.replaceChildren();

  element.appendChild(document.createTextNode(formatCurrency(value)));

  appendPeriod(element, period);
}

function appendPeriod(element, period) {
  if (!period) {
    return;
  }

  const periodElement = document.createElement("span");

  periodElement.className = "income-summary-period";

  periodElement.textContent = period;

  element.appendChild(periodElement);
}