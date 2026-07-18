"use strict";

import {
    clientPlan,
    resetClientPlan,
} from "./state/client-state.js";

import {
    formatCurrency,
    formatDeduction,
    formatPercentage,
    getInputWholeNumber,
} from "./utils/client-utils.js";

import {
    getClientAge,
    initializeProfile,
    resetProfile,
} from "./modules/client-profile.js";

import {
    initializeSidebar,
    openSection,
} from "./modules/sidebar.js";

import {
    initializeWealthType,
    resetWealthType,
} from "./modules/wealth-type.js";

import {
    initializeIncome,
} from "./modules/income.js";

import {
    initializeProperties,
    resetProperties,
} from "./modules/properties.js";

import {
    on,
} from "./events/event-bus.js";

import {
    EVENTS,
} from "./events/events.js";

const supabaseClient =
    window.supabaseClient;

/* ========================================
   PAGE ELEMENTS
======================================== */

const clientWorkspace = document.getElementById("clientWorkspace");

const loadingMessage = document.getElementById("loadingMessage");

const logoutButton = document.getElementById("logoutButton");

const clearPlanButton = document.getElementById("clearPlanButton");

/* ========================================
   CPF CONFIGURATION
======================================== */

const CPF_ORDINARY_WAGE_CEILING = 8000;
const CPF_ANNUAL_WAGE_CEILING = 102000;

/* ========================================
   INITIALIZATION
======================================== */

on(
    EVENTS.PROFILE_CHANGED,
    updateProfileDependentSections,
);

on(
    EVENTS.PROPERTY_CHANGED,
    updateAssetsAndIncomeTotals,
);

initializeProfile();
initializeSidebar();
initializeProperties();
initializeWealthType();
initializeIncome();
initializePage();

async function initializePage() {
  try {
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
      redirectToLogin();
      return;
    }

    loadingMessage.hidden = true;
    clientWorkspace.hidden = false;

    updateCpfFields();
    updateAssetsAndIncomeTotals();

  } catch (error) {
    console.error("Financial planner error:", error);

    loadingMessage.textContent =
      "Something went wrong while opening the planner.";
  }
}

/* ========================================
   ASSETS AND INCOME ELEMENTS
======================================== */

const cashInBankInput = document.getElementById("cashInBank");

const fixedDepositsInput = document.getElementById("fixedDeposits");

const tBillsInput = document.getElementById("tBills");

const investmentsInput = document.getElementById("investments");

const otherLiquidAssetsInput = document.getElementById("otherLiquidAssets");

const totalLiquidAssetsElement = document.getElementById("totalLiquidAssets");

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

const annualEmployeeCpfElement = document.getElementById(
    "annualEmployeeCpf",
);

const annualEmployeeCpfNote = document.getElementById(
    "annualEmployeeCpfNote",
);

const annualGrossIncomeElement = document.getElementById(
    "annualGrossIncome",
);

const annualTakeHomeIncomeElement = document.getElementById(
    "annualTakeHomeIncome",
);


/* ========================================
   CPF DETAILS ELEMENTS
======================================== */

const cpfNotApplicableMessage = document.getElementById(
    "cpfNotApplicableMessage",
);

const cpfDetailsRows = document.getElementById(
    "cpfDetailsRows",
);

const employeeCpfRateElement = document.getElementById(
    "employeeCpfRate",
);

const ordinaryWageCeilingElement = document.getElementById(
    "ordinaryWageCeiling",
);

const monthlyWageSubjectToCpfElement = document.getElementById(
    "monthlyWageSubjectToCpf",
);

const annualOrdinaryWagesSubjectToCpfElement =
    document.getElementById(
        "annualOrdinaryWagesSubjectToCpf",
    );

const additionalWageCeilingElement = document.getElementById(
    "additionalWageCeiling",
);

const bonusSubjectToCpfElement = document.getElementById(
    "bonusSubjectToCpf",
);

const bonusNotSubjectToCpfElement = document.getElementById(
    "bonusNotSubjectToCpf",
);

const cpfOnOrdinaryWagesElement = document.getElementById(
    "cpfOnOrdinaryWages",
);

const cpfOnAdditionalWagesElement = document.getElementById(
    "cpfOnAdditionalWages",
);

const cpfOaInput = document.getElementById("cpfOa");

const cpfSaInput = document.getElementById("cpfSa");

const cpfMaInput = document.getElementById("cpfMa");

const cpfRaInput = document.getElementById("cpfRa");

const cpfSaGroup = document.getElementById("cpfSaGroup");

const cpfRaGroup = document.getElementById("cpfRaGroup");

const totalCpfElement = document.getElementById("totalCpf");

/* ========================================
   ASSETS AND INCOME INPUTS
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

financialInputs.forEach(function (input) {
  if (!input) {
    return;
  }

  input.addEventListener("input", handleFinancialInput);
});

function handleFinancialInput() {
  updateAssetsAndIncomeData();
  updateAssetsAndIncomeTotals();
}

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
   ASSETS AND INCOME TOTALS
======================================== */

function updateAssetsAndIncomeTotals() {
    const assets = clientPlan.priorities.assets;

    const totalLiquidAssets =
        assets.liquidAssets.cashInBank +
        assets.liquidAssets.fixedDeposits +
        assets.liquidAssets.tBills +
        assets.liquidAssets.investments +
        assets.liquidAssets.others;

    const incomeSummary = calculateIncomeSummary();

    const totalCpf =
        assets.cpf.oa +
        assets.cpf.sa +
        assets.cpf.ma +
        assets.cpf.ra;

    if (totalLiquidAssetsElement) {
        totalLiquidAssetsElement.textContent =
            formatCurrency(totalLiquidAssets);
    }

    updateIncomeSummaryDisplay(incomeSummary);

    if (totalCpfElement) {
        totalCpfElement.textContent =
            formatCurrency(totalCpf);
    }

}


/* ========================================
   INCOME CALCULATION
======================================== */

function calculateIncomeSummary() {
    const income = clientPlan.priorities.assets.income;

    const monthlyGrossSalary =
        income.monthlyEmployment;

    const annualBonus =
        income.annualBonus;

    const otherMonthlyIncome =
        income.otherMonthly;

    const age = getClientAge();

    const cpfApplies =
        clientPlan.profile.employmentStatus ===
            "full_time_employed" &&
        age !== null;

    const cpfRates =
        getCpfContributionRates(age);

    const employeeCpfRate =
        cpfApplies
            ? cpfRates.employeeRate
            : 0;

    /* ========================================
       ORDINARY WAGES
    ======================================== */

    const monthlyCpfOrdinaryWage =
        cpfApplies
            ? Math.min(
                monthlyGrossSalary,
                CPF_ORDINARY_WAGE_CEILING,
            )
            : 0;

    const annualCpfOrdinaryWage =
        monthlyCpfOrdinaryWage * 12;

    /* ========================================
       ADDITIONAL WAGES
    ======================================== */

    const additionalWageCeiling =
        cpfApplies
            ? Math.max(
                0,
                CPF_ANNUAL_WAGE_CEILING -
                    annualCpfOrdinaryWage,
            )
            : 0;

    const cpfAdditionalWage =
        cpfApplies
            ? Math.min(
                annualBonus,
                additionalWageCeiling,
            )
            : 0;

    const bonusNotSubjectToCpf =
        cpfApplies
            ? Math.max(
                0,
                annualBonus -
                    cpfAdditionalWage,
            )
            : annualBonus;

    /* ========================================
       EMPLOYEE CPF
    ======================================== */

    const monthlyEmployeeCpf =
        cpfApplies
            ? Math.round(
                monthlyCpfOrdinaryWage *
                    employeeCpfRate,
            )
            : 0;

    const annualOrdinaryWageEmployeeCpf =
        monthlyEmployeeCpf * 12;

    const annualAdditionalWageEmployeeCpf =
        cpfApplies
            ? Math.round(
                cpfAdditionalWage *
                    employeeCpfRate,
            )
            : 0;

    const annualEmployeeCpf =
        annualOrdinaryWageEmployeeCpf +
        annualAdditionalWageEmployeeCpf;

    /* ========================================
       INCOME SUMMARY
    ======================================== */

    const monthlyTakeHome =
        monthlyGrossSalary -
        monthlyEmployeeCpf +
        otherMonthlyIncome;

    const annualGross =
        monthlyGrossSalary * 12 +
        annualBonus;

    const annualTakeHome =
        annualGross -
        annualEmployeeCpf +
        otherMonthlyIncome * 12;

    return {
        cpfApplies: cpfApplies,
        employeeCpfRate: employeeCpfRate,

        monthlyCpfOrdinaryWage:
            monthlyCpfOrdinaryWage,

        annualCpfOrdinaryWage:
            annualCpfOrdinaryWage,

        additionalWageCeiling:
            additionalWageCeiling,

        cpfAdditionalWage:
            cpfAdditionalWage,

        bonusNotSubjectToCpf:
            bonusNotSubjectToCpf,

        monthlyEmployeeCpf:
            monthlyEmployeeCpf,

        annualOrdinaryWageEmployeeCpf:
            annualOrdinaryWageEmployeeCpf,

        annualAdditionalWageEmployeeCpf:
            annualAdditionalWageEmployeeCpf,

        annualEmployeeCpf:
            annualEmployeeCpf,

        monthlyTakeHome:
            monthlyTakeHome,

        annualGross:
            annualGross,

        annualTakeHome:
            annualTakeHome,
    };
}


/* ========================================
   CPF CONTRIBUTION RATES
======================================== */

function getCpfContributionRates(age) {
    if (age === null || age < 0) {
        return {
            employeeRate: 0,
            employerRate: 0,
        };
    }

    if (age <= 55) {
        return {
            employeeRate: 0.20,
            employerRate: 0.17,
        };
    }

    if (age <= 60) {
        return {
            employeeRate: 0.18,
            employerRate: 0.16,
        };
    }

    if (age <= 65) {
        return {
            employeeRate: 0.125,
            employerRate: 0.125,
        };
    }

    if (age <= 70) {
        return {
            employeeRate: 0.075,
            employerRate: 0.09,
        };
    }

    return {
        employeeRate: 0.05,
        employerRate: 0.075,
    };
}


/* ========================================
   INCOME SUMMARY DISPLAY
======================================== */

function updateIncomeSummaryDisplay(summary) {
    const employmentStatus =
        clientPlan.profile.employmentStatus;

    const age = getClientAge();

    if (employeeCpfContributionElement) {
        employeeCpfContributionElement.textContent =
            formatDeduction(
                summary.monthlyEmployeeCpf,
            );
    }

    if (monthlyTakeHomeIncomeElement) {
        monthlyTakeHomeIncomeElement.textContent =
            formatCurrency(
                summary.monthlyTakeHome,
            );
    }

    if (annualEmployeeCpfElement) {
        annualEmployeeCpfElement.textContent =
            formatDeduction(
                summary.annualEmployeeCpf,
            );
    }

    if (annualGrossIncomeElement) {
        annualGrossIncomeElement.textContent =
            formatCurrency(
                summary.annualGross,
            );
    }

    if (annualTakeHomeIncomeElement) {
        annualTakeHomeIncomeElement.textContent =
            formatCurrency(
                summary.annualTakeHome,
            );
    }

    if (employeeCpfContributionNote) {
        employeeCpfContributionNote.textContent =
            getCpfSummaryNote(
                employmentStatus,
                age,
                summary,
            );
    }

    if (annualEmployeeCpfNote) {
        annualEmployeeCpfNote.textContent =
            summary.cpfApplies
                ? "Includes CPF on ordinary and additional wages"
                : "No employee CPF deduction applied";
    }

    if (cpfNotApplicableMessage) {
        cpfNotApplicableMessage.hidden =
            summary.cpfApplies;

        if (!summary.cpfApplies) {
            cpfNotApplicableMessage.textContent =
                getCpfNotApplicableMessage(
                    employmentStatus,
                    age,
                );
        }
    }

    if (cpfDetailsRows) {
        cpfDetailsRows.hidden =
            !summary.cpfApplies;
    }

    if (employeeCpfRateElement) {
        employeeCpfRateElement.textContent =
            formatPercentage(
                summary.employeeCpfRate,
            );
    }

    if (ordinaryWageCeilingElement) {
        ordinaryWageCeilingElement.textContent =
            formatCurrency(
                CPF_ORDINARY_WAGE_CEILING,
            );
    }

    if (monthlyWageSubjectToCpfElement) {
        monthlyWageSubjectToCpfElement.textContent =
            formatCurrency(
                summary.monthlyCpfOrdinaryWage,
            );
    }

    if (
        annualOrdinaryWagesSubjectToCpfElement
    ) {
        annualOrdinaryWagesSubjectToCpfElement.textContent =
            formatCurrency(
                summary.annualCpfOrdinaryWage,
            );
    }

    if (additionalWageCeilingElement) {
        additionalWageCeilingElement.textContent =
            formatCurrency(
                summary.additionalWageCeiling,
            );
    }

    if (bonusSubjectToCpfElement) {
        bonusSubjectToCpfElement.textContent =
            formatCurrency(
                summary.cpfAdditionalWage,
            );
    }

    if (bonusNotSubjectToCpfElement) {
        bonusNotSubjectToCpfElement.textContent =
            formatCurrency(
                summary.bonusNotSubjectToCpf,
            );
    }

    if (cpfOnOrdinaryWagesElement) {
        cpfOnOrdinaryWagesElement.textContent =
            formatCurrency(
                summary
                    .annualOrdinaryWageEmployeeCpf,
            );
    }

    if (cpfOnAdditionalWagesElement) {
        cpfOnAdditionalWagesElement.textContent =
            formatCurrency(
                summary
                    .annualAdditionalWageEmployeeCpf,
            );
    }
}


/* ========================================
   CPF DISPLAY MESSAGES
======================================== */

function getCpfSummaryNote(
    employmentStatus,
    age,
    summary,
) {
    if (!employmentStatus) {
        return "Select an employment status";
    }

    if (
        employmentStatus !==
        "full_time_employed"
    ) {
        return "CPF not applied for this employment status";
    }

    if (age === null) {
        return "Enter the client's date of birth";
    }

    return (
        formatPercentage(
            summary.employeeCpfRate,
        ) +
        " of CPF-applicable monthly wages"
    );
}


function getCpfNotApplicableMessage(
    employmentStatus,
    age,
) {
    if (!employmentStatus) {
        return (
            "Select the client's employment status " +
            "to determine whether CPF applies."
        );
    }

    if (
        employmentStatus ===
        "self_employed"
    ) {
        return (
            "Employee CPF is not applied to " +
            "self-employed income. Self-employed " +
            "MediSave obligations are not included " +
            "in this calculation."
        );
    }

    if (
        employmentStatus ===
            "full_time_employed" &&
        age === null
    ) {
        return (
            "Enter the client's date of birth " +
            "to determine the applicable CPF rate."
        );
    }

    return (
        "Employee CPF is not applied to this " +
        "employment status."
    );
}

/* ========================================
   CLEAR PLAN
======================================== */

if (clearPlanButton) {
  clearPlanButton.addEventListener("click", clearFinancialPlan);
}

function clearFinancialPlan() {
    const shouldClear = window.confirm(
        "Clear all information entered in this financial plan?",
    );

    if (!shouldClear) {
        return;
    }

    /*
     * Reset the shared JavaScript state.
     */
    resetClientPlan();

    /*
     * Reset the profile form fields.
     */
    resetProfile();

    /*
     * Reset the Wealth Type selections.
    */
    resetWealthType();

    /*
     * Reset all financial input fields.
     */
    financialInputs.forEach(function (input) {
        if (!input) {
            return;
        }

        input.value = "";
    });

    /*
     * Reset the property interface.
     */
    resetProperties();

    /*
     * Reapply age-dependent CPF field visibility.
     *
     * With no DOB entered, SA should be shown
     * and RA should be hidden.
     */
    updateCpfFields();

    /*
     * Recalculate all displayed totals.
     */
    updateAssetsAndIncomeTotals();

    /*
     * Return to the Client Profile section.
     */
    openSection("profile");
}

/* ========================================
   LOGOUT
======================================== */

if (logoutButton) {
  logoutButton.addEventListener("click", handleLogout);
}

async function handleLogout() {
  logoutButton.disabled = true;

  logoutButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Logging out...
    `;

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error("Logout error:", error);

    logoutButton.disabled = false;

    logoutButton.innerHTML = `
            <i class="fa-solid fa-right-from-bracket"></i>
            Logout
        `;

    return;
  }

  redirectToLogin();
}

/* ========================================
   HELPERS
======================================== */

function updateProfileDependentSections() {
    updateCpfFields();
    updateAssetsAndIncomeTotals();

    /*
    Later, add other profile-dependent updates here:
    updateProtectionAnalysis();
    updateCostOfWants();
    updateSummaryReport();
    */
}

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

  updateAssetsAndIncomeTotals();
}

function redirectToLogin() {
  window.location.replace("index.html");
}