"use strict";

import { clientPlan } from "../state/client-plan.js";

import {
  getInputWholeNumber,
  formatCurrency,
  formatDeduction,
  formatPercentage,
} from "../utils/client-utils.js";

import { getClientAge } from "./client-profile.js";

import { CPF_ORDINARY_WAGE_CEILING } from "../services/cpf-service.js";

import { calculateIncomeSummary } from "../services/income-calculator.js";

import { on, emit } from "../events/event-bus.js";

import { EVENTS } from "../events/events.js";

/* ========================================
   LIQUID ASSET ELEMENTS
======================================== */

const cashInBankInput = document.getElementById("cashInBank");

const fixedDepositsInput = document.getElementById("fixedDeposits");

const tBillsInput = document.getElementById("tBills");

const investmentsInput = document.getElementById("investments");

const otherLiquidAssetsInput = document.getElementById("otherLiquidAssets");

const totalLiquidAssetsElement = document.getElementById("totalLiquidAssets");

/* ========================================
   INCOME ELEMENTS
======================================== */

const monthlyEmploymentIncomeInput = document.getElementById(
  "monthlyEmploymentIncome",
);

const annualBonusInput = document.getElementById("annualBonus");

const otherMonthlyIncomeInput = document.getElementById("otherMonthlyIncome");

/* ========================================
   INCOME SUMMARY ELEMENTS
======================================== */

const employeeCpfContributionElement = document.getElementById(
  "employeeCpfContribution",
);

const employeeCpfContributionNote = document.getElementById(
  "employeeCpfContributionNote",
);

const monthlyTakeHomeIncomeElement = document.getElementById(
  "monthlyTakeHomeIncome",
);

const annualEmployeeCpfElement = document.getElementById("annualEmployeeCpf");

const annualEmployeeCpfNote = document.getElementById("annualEmployeeCpfNote");

const annualEmploymentIncomeElement =
  document.getElementById("annualGrossIncome");

const annualTakeHomeIncomeElement = document.getElementById(
  "annualTakeHomeIncome",
);

/* ========================================
   CPF DETAILS ELEMENTS
======================================== */

const cpfNotApplicableMessage = document.getElementById(
  "cpfNotApplicableMessage",
);

const cpfDetailsRows = document.getElementById("cpfDetailsRows");

const employeeCpfRateElement = document.getElementById("employeeCpfRate");

const ordinaryWageCeilingElement = document.getElementById(
  "ordinaryWageCeiling",
);

const monthlyWageSubjectToCpfElement = document.getElementById(
  "monthlyWageSubjectToCpf",
);

const annualOrdinaryWagesSubjectToCpfElement = document.getElementById(
  "annualOrdinaryWagesSubjectToCpf",
);

const additionalWageCeilingElement = document.getElementById(
  "additionalWageCeiling",
);

const bonusSubjectToCpfElement = document.getElementById("bonusSubjectToCpf");

const bonusNotSubjectToCpfElement = document.getElementById(
  "bonusNotSubjectToCpf",
);

const cpfOnOrdinaryWagesElement = document.getElementById("cpfOnOrdinaryWages");

const cpfOnAdditionalWagesElement = document.getElementById(
  "cpfOnAdditionalWages",
);

/* ========================================
   CPF BALANCE ELEMENTS
======================================== */

const cpfOaInput = document.getElementById("cpfOa");

const cpfSaInput = document.getElementById("cpfSa");

const cpfMaInput = document.getElementById("cpfMa");

const cpfRaInput = document.getElementById("cpfRa");

const cpfSaGroup = document.getElementById("cpfSaGroup");

const cpfRaGroup = document.getElementById("cpfRaGroup");

const totalCpfElement = document.getElementById("totalCpf");

/* ========================================
   FINANCIAL INPUTS
======================================== */

const financialInputs = [
  cashInBankInput,
  fixedDepositsInput,
  tBillsInput,
  investmentsInput,
  otherLiquidAssetsInput,
  monthlyEmploymentIncomeInput,
  annualBonusInput,
  otherMonthlyIncomeInput,
  cpfOaInput,
  cpfSaInput,
  cpfMaInput,
  cpfRaInput,
];

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

/* ========================================
   INITIALIZATION
======================================== */

export function initializeAssetsIncome() {
  if (moduleInitialized) {
    return;
  }

  attachAssetsIncomeListeners();
  attachApplicationEventListeners();

  syncAssetsIncomeInputs();
  updateCpfFields();
  updateAssetsAndIncomeTotals();

  moduleInitialized = true;
}

/* ========================================
   PUBLIC FUNCTIONS
======================================== */

export function resetAssetsIncome() {
  const assets = clientPlan.priorities.assets;

  assets.liquidAssets = {
    cashInBank: 0,
    fixedDeposits: 0,
    tBills: 0,
    investments: 0,
    others: 0,
  };

  assets.income = {
    monthlyEmployment: 0,
    annualBonus: 0,
    otherMonthly: 0,
  };

  assets.cpf = {
    oa: 0,
    sa: 0,
    ma: 0,
    ra: 0,
  };

  syncAssetsIncomeInputs();
  updateCpfFields();
  updateAssetsAndIncomeTotals();

  emitAssetsChanged();
  emitIncomeChanged();
  emitCpfChanged();
}

/* ========================================
   EVENT LISTENERS
======================================== */

function attachAssetsIncomeListeners() {
  financialInputs.forEach(function (input) {
    if (!input) {
      return;
    }

    input.addEventListener("input", handleFinancialInput);
  });
}

function attachApplicationEventListeners() {
  on(EVENTS.PROFILE_CHANGED, handleProfileChanged);

  on(EVENTS.PROPERTY_CHANGED, updateAssetsAndIncomeTotals);
}

function handleFinancialInput() {
  updateAssetsAndIncomeData();
  updateAssetsAndIncomeTotals();

  emitAssetsChanged();
  emitIncomeChanged();
  emitCpfChanged();
}

function handleProfileChanged() {
  updateCpfFields();
  updateAssetsAndIncomeTotals();
}

/* ========================================
   STATE UPDATES
======================================== */

function updateAssetsAndIncomeData() {
  const assets = clientPlan.priorities.assets;

  assets.liquidAssets.cashInBank = getInputWholeNumber(cashInBankInput);

  assets.liquidAssets.fixedDeposits = getInputWholeNumber(fixedDepositsInput);

  assets.liquidAssets.tBills = getInputWholeNumber(tBillsInput);

  assets.liquidAssets.investments = getInputWholeNumber(investmentsInput);

  assets.liquidAssets.others = getInputWholeNumber(otherLiquidAssetsInput);

  assets.income.monthlyEmployment = getInputWholeNumber(
    monthlyEmploymentIncomeInput,
  );

  assets.income.annualBonus = getInputWholeNumber(annualBonusInput);

  assets.income.otherMonthly = getInputWholeNumber(otherMonthlyIncomeInput);

  assets.cpf.oa = getInputWholeNumber(cpfOaInput);

  assets.cpf.sa = getInputWholeNumber(cpfSaInput);

  assets.cpf.ma = getInputWholeNumber(cpfMaInput);

  assets.cpf.ra = getInputWholeNumber(cpfRaInput);
}

/* ========================================
   RENDERING
======================================== */

function syncAssetsIncomeInputs() {
  const assets = clientPlan.priorities.assets;

  setInputValue(cashInBankInput, assets.liquidAssets.cashInBank);

  setInputValue(fixedDepositsInput, assets.liquidAssets.fixedDeposits);

  setInputValue(tBillsInput, assets.liquidAssets.tBills);

  setInputValue(investmentsInput, assets.liquidAssets.investments);

  setInputValue(otherLiquidAssetsInput, assets.liquidAssets.others);

  setInputValue(monthlyEmploymentIncomeInput, assets.income.monthlyEmployment);

  setInputValue(annualBonusInput, assets.income.annualBonus);

  setInputValue(otherMonthlyIncomeInput, assets.income.otherMonthly);

  setInputValue(cpfOaInput, assets.cpf.oa);

  setInputValue(cpfSaInput, assets.cpf.sa);

  setInputValue(cpfMaInput, assets.cpf.ma);

  setInputValue(cpfRaInput, assets.cpf.ra);
}

function updateAssetsAndIncomeTotals() {
  const assets = clientPlan.priorities.assets;

  const totalLiquidAssets =
    assets.liquidAssets.cashInBank +
    assets.liquidAssets.fixedDeposits +
    assets.liquidAssets.tBills +
    assets.liquidAssets.investments +
    assets.liquidAssets.others;

  const income = assets.income;

  const incomeSummary = calculateIncomeSummary({
    monthlyEmploymentIncome: income.monthlyEmployment,

    annualBonus: income.annualBonus,

    monthlyOtherIncome: income.otherMonthly,

    employmentStatus: clientPlan.profile.employmentStatus,

    age: getClientAge(),
  });

  const totalCpf =
    assets.cpf.oa + assets.cpf.sa + assets.cpf.ma + assets.cpf.ra;

  if (totalLiquidAssetsElement) {
    totalLiquidAssetsElement.textContent = formatCurrency(totalLiquidAssets);
  }

  updateIncomeSummaryDisplay(incomeSummary);

  if (totalCpfElement) {
    totalCpfElement.textContent = formatCurrency(totalCpf);
  }
}

/* ========================================
   INCOME SUMMARY DISPLAY
======================================== */

function updateIncomeSummaryDisplay(summary) {
  const employmentStatus = clientPlan.profile.employmentStatus;

  const age = getClientAge();

  if (employeeCpfContributionElement) {
    employeeCpfContributionElement.textContent = formatDeduction(
      summary.monthlyEmployeeCpf,
    );
  }

  if (monthlyTakeHomeIncomeElement) {
    monthlyTakeHomeIncomeElement.textContent = formatCurrency(
      summary.monthlyTakeHomeIncome,
    );
  }

  if (annualEmployeeCpfElement) {
    annualEmployeeCpfElement.textContent = formatDeduction(
      summary.annualEmployeeCpf,
    );
  }

  if (annualEmploymentIncomeElement) {
    annualEmploymentIncomeElement.textContent = formatCurrency(
      summary.annualEmploymentIncome,
    );
  }

  if (annualTakeHomeIncomeElement) {
    annualTakeHomeIncomeElement.textContent = formatCurrency(
      summary.annualTakeHomeIncome,
    );
  }

  if (employeeCpfContributionNote) {
    employeeCpfContributionNote.textContent = summary.cpfApplies
      ? `Employee contribution: ${formatPercentage(summary.employeeCpfRate)} (Ordinary Wage Ceiling: ${formatCurrency(CPF_ORDINARY_WAGE_CEILING)}/month)`
      : getCpfSummaryNote(employmentStatus, age, summary);
  }

  if (annualEmployeeCpfNote) {
    annualEmployeeCpfNote.textContent = summary.cpfApplies
      ? "Includes CPF on ordinary and additional wages"
      : "No employee CPF deduction applied";
  }

  if (cpfNotApplicableMessage) {
    cpfNotApplicableMessage.hidden = summary.cpfApplies;

    if (!summary.cpfApplies) {
      cpfNotApplicableMessage.textContent = getCpfNotApplicableMessage(
        employmentStatus,
        age,
      );
    }
  }

  if (cpfDetailsRows) {
    cpfDetailsRows.hidden = !summary.cpfApplies;
  }

  if (employeeCpfRateElement) {
    employeeCpfRateElement.textContent = formatPercentage(
      summary.employeeCpfRate,
    );
  }

  if (ordinaryWageCeilingElement) {
    ordinaryWageCeilingElement.textContent = formatCurrency(
      CPF_ORDINARY_WAGE_CEILING,
    );
  }

  if (monthlyWageSubjectToCpfElement) {
    monthlyWageSubjectToCpfElement.textContent = formatCurrency(
      summary.monthlyCpfOrdinaryWage,
    );
  }

  if (annualOrdinaryWagesSubjectToCpfElement) {
    annualOrdinaryWagesSubjectToCpfElement.textContent = formatCurrency(
      summary.annualCpfOrdinaryWage,
    );
  }

  if (additionalWageCeilingElement) {
    additionalWageCeilingElement.textContent = formatCurrency(
      summary.additionalWageCeiling,
    );
  }

  if (bonusSubjectToCpfElement) {
    bonusSubjectToCpfElement.textContent = formatCurrency(
      summary.cpfAdditionalWage,
    );
  }

  if (bonusNotSubjectToCpfElement) {
    bonusNotSubjectToCpfElement.textContent = formatCurrency(
      summary.bonusNotSubjectToCpf,
    );
  }

  if (cpfOnOrdinaryWagesElement) {
    cpfOnOrdinaryWagesElement.textContent = formatCurrency(
      summary.annualOrdinaryWageEmployeeCpf,
    );
  }

  if (cpfOnAdditionalWagesElement) {
    cpfOnAdditionalWagesElement.textContent = formatCurrency(
      summary.annualAdditionalWageEmployeeCpf,
    );
  }
}

/* ========================================
   CPF DISPLAY MESSAGES
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

  return "Employee CPF is not applied to this " + "employment status.";
}

/* ========================================
   AGE-DEPENDENT CPF FIELDS
======================================== */

function updateCpfFields() {
  if (!cpfSaGroup || !cpfRaGroup || !cpfSaInput || !cpfRaInput) {
    return;
  }

  const age = getClientAge();

  const cpf = clientPlan.priorities.assets.cpf;

  if (age === null || age < 55) {
    cpfSaGroup.hidden = false;
    cpfRaGroup.hidden = true;

    cpfRaInput.value = "";
    cpf.ra = 0;
  } else {
    cpfSaGroup.hidden = true;
    cpfRaGroup.hidden = false;

    cpfSaInput.value = "";
    cpf.sa = 0;
  }
}

/* ========================================
   INTERNAL HELPERS
======================================== */

function setInputValue(inputElement, value) {
  if (!inputElement) {
    return;
  }

  inputElement.value = Number(value) > 0 ? String(value) : "";
}

/* ========================================
   EVENTS
======================================== */

function emitAssetsChanged() {
  emit(EVENTS.ASSETS_CHANGED, {
    assets: {
      ...clientPlan.priorities.assets,

      liquidAssets: {
        ...clientPlan.priorities.assets.liquidAssets,
      },

      income: {
        ...clientPlan.priorities.assets.income,
      },

      cpf: {
        ...clientPlan.priorities.assets.cpf,
      },

      properties: [...clientPlan.priorities.assets.properties],
    },
  });
}

function emitIncomeChanged() {
  emit(EVENTS.INCOME_CHANGED, {
    income: {
      ...clientPlan.priorities.assets.income,
    },
  });
}

function emitCpfChanged() {
  emit(EVENTS.CPF_CHANGED, {
    cpf: {
      ...clientPlan.priorities.assets.cpf,
    },
  });
}
