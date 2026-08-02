"use strict";

import {
  formatCurrency,
  formatDeduction,
  formatPercentage,
} from "../../utils/client-utils.js";

import { CPF_ORDINARY_WAGE_CEILING } from "../../services/cpf-service.js";

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

function renderIncomeSummary({ elements, summary, employmentStatus, age }) {
  const isSelfEmployed = employmentStatus === "self_employed";

  setText(
    elements.incomeDescriptionElement,

    isSelfEmployed
      ? "Enter the client's annual net trade income and other income."
      : "Enter the client's monthly gross salary, annual bonus and other monthly income.",
  );

  setText(
    elements.annualIncomeSummaryLabel,

    isSelfEmployed
      ? "Annual Net Trade Income"
      : "Annual Gross Employment Income",
  );

  setText(
    elements.annualIncomeSummaryNote,

    isSelfEmployed
      ? "Amount assessed by IRAS before mandatory MediSave"
      : "Including annual bonus",
  );

  setText(
    elements.contributionSummaryLabel,

    isSelfEmployed
      ? "Monthly Planning MediSave Contribution"
      : "Monthly Employee CPF Contribution",
  );

  setText(
    elements.annualTakeHomeSummaryNote,

    isSelfEmployed
      ? "After mandatory MediSave and including other income"
      : "Including annual bonus and other income",
  );

  setText(
    elements.contributionDetailsLabel,

    isSelfEmployed ? "MediSave Contribution Details" : "CPF Details",
  );

  if (elements.annualSepMedisaveSummaryRow) {
    elements.annualSepMedisaveSummaryRow.hidden = !isSelfEmployed;
  }

  setAmountDisplay({
    element: elements.annualSepMedisaveContributionElement,

    value: summary.annualSepMedisaveContribution,

    deduction: true,
  });

  setAmountDisplay({
    element: elements.employeeCpfContributionElement,

    value: isSelfEmployed
      ? summary.monthlySepMedisaveContribution
      : summary.monthlyEmployeeCpf,

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

    value: isSelfEmployed
      ? summary.annualNetTradeIncome
      : summary.annualEmploymentIncome,
  });

  setAmountDisplay({
    element: elements.annualTakeHomeIncomeElement,

    value: summary.annualTakeHomeIncome,
  });

  renderContributionSummaryNote({
    elements,
    summary,
    employmentStatus,
    age,
  });

  renderContributionDetails({
    elements,
    summary,
    isSelfEmployed,
  });
}

function renderContributionSummaryNote({
  elements,
  summary,
  employmentStatus,
  age,
}) {
  if (elements.employeeCpfContributionNote) {
    if (summary.isSelfEmployed) {
      elements.employeeCpfContributionNote.textContent = summary.sepMedisave
        .usesOverride
        ? "Using the CPF Board assessed annual amount entered below"
        : `Estimated using ${summary.sepMedisave.rateYear} non-pensioner SEP rates`;
    } else if (summary.cpfApplies) {
      elements.employeeCpfContributionNote.textContent = [
        "Employee contribution: ",

        formatPercentage(summary.employeeCpfRate),

        " (Ordinary Wage Ceiling: ",

        formatCurrency(CPF_ORDINARY_WAGE_CEILING),

        "/month)",
      ].join("");
    } else {
      elements.employeeCpfContributionNote.textContent = getCpfSummaryNote(
        employmentStatus,
        age,
        summary,
      );
    }
  }

  if (elements.cpfNotApplicableMessage) {
    elements.cpfNotApplicableMessage.hidden =
      summary.cpfApplies || summary.isSelfEmployed;

    if (!summary.cpfApplies && !summary.isSelfEmployed) {
      elements.cpfNotApplicableMessage.textContent = getCpfNotApplicableMessage(
        employmentStatus,
        age,
      );
    }
  }
}

function renderContributionDetails({ elements, summary, isSelfEmployed }) {
  if (elements.employeeCpfDetailsRows) {
    elements.employeeCpfDetailsRows.hidden = isSelfEmployed;
  }

  if (elements.selfEmployedMedisaveDetailsRows) {
    elements.selfEmployedMedisaveDetailsRows.hidden = !isSelfEmployed;
  }

  if (isSelfEmployed) {
    renderSelfEmployedDetails({
      elements,
      summary,
    });

    return;
  }

  renderEmployeeCpfDetails({
    elements,
    summary,
  });
}

function renderSelfEmployedDetails({ elements, summary }) {
  const sep = summary.sepMedisave;

  setText(elements.sepRateYearElement, String(sep.rateYear));

  setText(
    elements.sepAgeAtStartOfYearElement,

    sep.isAgeAvailable
      ? String(sep.ageAtStartOfWorkYear)
      : "Enter date of birth",
  );

  setCurrency(elements.sepApplicableNtiElement, sep.applicableNti);

  setCurrency(
    elements.sepPlatformEarningsExcludedElement,

    sep.excludedPlatformEarnings,
  );

  setText(
    elements.sepEffectiveRateElement,

    formatPercentage(sep.effectiveRate),
  );

  setCurrency(
    elements.sepCalculatedAnnualMedisaveElement,

    sep.calculatedAnnualContribution,
  );
}

function renderEmployeeCpfDetails({ elements, summary }) {
  setText(
    elements.employeeCpfRateElement,

    formatPercentage(summary.employeeCpfRate),
  );

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

  setCurrency(
    elements.additionalWageCeilingElement,

    summary.additionalWageCeiling,
  );

  setCurrency(
    elements.bonusSubjectToCpfElement,

    summary.cpfAdditionalWage,
  );

  setCurrency(
    elements.bonusNotSubjectToCpfElement,

    summary.bonusNotSubjectToCpf,
  );
}

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

  if (employmentStatus === "full_time_employed" && age === null) {
    return (
      "Enter the client's date of birth " +
      "to determine the applicable " +
      "CPF rate."
    );
  }

  return "Employee CPF is not applied to " + "this employment status.";
}

function setAmountDisplay({ element, value, deduction = false, period = "" }) {
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

function setCpfDetailValue({ element, value, period = "" }) {
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

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function setCurrency(element, value) {
  setText(element, formatCurrency(value));
}