"use strict";

import {
    clientPlan,
    resetClientPlan,
} from "./state/client-state.js";

import {
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
    initializeAssetsIncome,
    resetAssetsIncome,
} from "./modules/assets-income.js";

import {
    initializeProperties,
    resetProperties,
} from "./modules/properties.js";

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
   INITIALIZATION
======================================== */

initializeProfile();
initializeSidebar();
initializeProperties();
initializeWealthType();
initializeAssetsIncome();
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
    * Reset Liquid Assets, Income and CPF.
    */
    resetAssetsIncome();

    /*
     * Reset the property interface.
     */
    resetProperties();

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
   NAVIGATION
======================================== */

function redirectToLogin() {
  window.location.replace("index.html");
}