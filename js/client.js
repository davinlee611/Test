"use strict";

import { resetClientPlan } from "./state/client-plan.js";

import { initializeProfile, resetProfile } from "./modules/client-profile.js";

import { initializeSidebar, openSection } from "./modules/sidebar.js";

import {
  initializeWealthType,
  resetWealthType,
} from "./modules/wealth-type.js";

import { initializeGoals, resetGoals } from "./modules/goals.js";

import {
  initializeAssetsIncome,
  resetAssetsIncome,
} from "./modules/assets-income.js";

import { initializeExpenses, resetExpenses } from "./modules/expenses.js";

import { initializeProperties, resetProperties } from "./modules/properties.js";

import {
  initializeLiabilities,
  resetLiabilities,
} from "./modules/liabilities.js";

import {
  initializeInsurancePortfolio,
  resetInsurancePortfolio,
} from "./modules/insurance-portfolio.js";

import { on } from "./events/event-bus.js";
import { EVENTS } from "./events/events.js";

const supabaseClient = window.supabaseClient;

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
initializeLiabilities();
initializeWealthType();
initializeGoals();
initializeAssetsIncome();
initializeExpenses();
initializeInsurancePortfolio();
initializePage();

on(EVENTS.SECTION_CHANGED, function ({ section }) {
  if (section === "insurance") {
    initializeInsurancePortfolio();
  }
});

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
   * Reset financial goals.
   */
  resetGoals();

  /*
   * Reset Withdrawable Assets, Income and CPF.
   */
  resetAssetsIncome();

  /*
   * Reset monthly expenses.
   */
  resetExpenses();

  /*
   * Reset the property interface.
   */
  resetProperties();

  /*
   * Reset liabilities.
   */
  resetLiabilities();

  /*
   * Reset insurance portfolio.
   */
  resetInsurancePortfolio();

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
