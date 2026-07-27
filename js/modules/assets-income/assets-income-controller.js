"use strict";

import { emit } from "../../events/event-bus.js";

import { EVENTS } from "../../events/events.js";

import { getClientProfile } from "../../state/client-plan.js";

import {
  readAssetsIncomeFormData,
  writeAssetsIncomeFormData,
} from "./assets-income-form-data.js";

import { calculateAssetsIncomeSummary } from "./assets-income-calculator.js";

import { renderAssetsIncomeDisplay } from "./assets-income-display.js";

/* ========================================
   ASSETS AND INCOME CONTROLLER
======================================== */

export function createAssetsIncomeController({
  elements,

  workflow,

  getClientAge,
}) {
  /* ========================================
     INITIAL RENDER
  ======================================== */

  function initializeDisplay() {
    syncInputs();

    applyCpfAccountRules();

    render();
  }

  /* ========================================
     INPUT HANDLING
  ======================================== */

  function handleFinancialInput() {
    const formData = readAssetsIncomeFormData(elements);

    workflow.save(formData);

    render();

    emitFinancialEvents();
  }

  /* ========================================
     PROFILE CHANGES
  ======================================== */

  function handleProfileChanged() {
    applyCpfAccountRules();

    syncInputs();

    render();
  }

  /* ========================================
     PROPERTY CHANGES
  ======================================== */

  function handlePropertyChanged() {
    render();
  }

  /* ========================================
     CPF ACCOUNT RULES
  ======================================== */

  function applyCpfAccountRules() {
    const age = getClientAge();

    workflow.applyCpfAccountRules(age);

    updateCpfAccountVisibility(age);
  }

  function updateCpfAccountVisibility(age) {
    const usesSpecialAccount = age === null || age < 55;

    if (elements.cpfSaGroup) {
      elements.cpfSaGroup.hidden = !usesSpecialAccount;
    }

    if (elements.cpfRaGroup) {
      elements.cpfRaGroup.hidden = usesSpecialAccount;
    }

    if (usesSpecialAccount && elements.cpfRaInput) {
      elements.cpfRaInput.value = "";
    }

    if (!usesSpecialAccount && elements.cpfSaInput) {
      elements.cpfSaInput.value = "";
    }
  }

  /* ========================================
     INPUT SYNCHRONISATION
  ======================================== */

  function syncInputs() {
    writeAssetsIncomeFormData(
      elements,

      workflow.getAssetsIncomeData(),
    );
  }

  /* ========================================
     RENDERING
  ======================================== */

  function render() {
    const assets = workflow.getAssetsIncomeData();

    const profile = getClientProfile();

    const age = getClientAge();

    const summary = calculateAssetsIncomeSummary({
      assets,

      employmentStatus: profile.employmentStatus,

      age,
    });

    renderAssetsIncomeDisplay({
      elements,

      summary,

      employmentStatus: profile.employmentStatus,

      age,
    });
  }

  /* ========================================
     RESET
  ======================================== */

  function reset() {
    workflow.reset();

    syncInputs();

    applyCpfAccountRules();

    render();

    emitFinancialEvents();
  }

  /* ========================================
     EVENTS
  ======================================== */

  function emitFinancialEvents() {
    const assets = workflow.getAssetsIncomeData();

    emit(EVENTS.ASSETS_CHANGED, {
      assets: {
        ...assets,

        liquidAssets: {
          ...assets.liquidAssets,
        },

        income: {
          ...assets.income,
        },

        cpf: {
          ...assets.cpf,
        },

        properties: Array.isArray(assets.properties)
          ? [...assets.properties]
          : [],
      },
    });

    emit(EVENTS.INCOME_CHANGED, {
      income: {
        ...assets.income,
      },
    });

    emit(EVENTS.CPF_CHANGED, {
      cpf: {
        ...assets.cpf,
      },
    });
  }

  return {
    initializeDisplay,

    handleFinancialInput,

    handleProfileChanged,

    handlePropertyChanged,

    render,

    reset,
  };
}