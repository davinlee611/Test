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

  function handleProfileChanged({
    previousEmploymentStatus = "",
    profile = {},
  } = {}) {
    const employmentStatusChanged =
      previousEmploymentStatus &&
      previousEmploymentStatus !== profile.employmentStatus;

    if (employmentStatusChanged) {
      workflow.clearEmploymentSpecificIncome();
    }

    applyCpfAccountRules();

    syncInputs();

    render();

    if (employmentStatusChanged) {
      emitFinancialEvents();
    }
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

      ageAtStartOfWorkYear: getAgeAtStartOfYear(
        profile.dateOfBirth,
        new Date().getFullYear(),
      ),
    });

    renderAssetsIncomeDisplay({
      elements,

      summary,

      employmentStatus: profile.employmentStatus,

      age,
    });

    updateIncomeFieldVisibility({
      employmentStatus: profile.employmentStatus,

      income: assets.income,
    });
  }

  function updateIncomeFieldVisibility({
    employmentStatus,

    income = {},
  }) {
    const isSelfEmployed = employmentStatus === "self_employed";

    if (elements.employeeIncomeFields) {
      elements.employeeIncomeFields.hidden = isSelfEmployed;
    }

    if (elements.selfEmployedIncomeFields) {
      elements.selfEmployedIncomeFields.hidden = !isSelfEmployed;
    }

    const usesOverride = Boolean(income.sepMedisaveOverrideEnabled);

    if (elements.sepMedisaveOverrideAmountGroup) {
      elements.sepMedisaveOverrideAmountGroup.hidden = !usesOverride;
    }

    if (elements.sepMedisaveOverrideAmountInput) {
      elements.sepMedisaveOverrideAmountInput.disabled = !usesOverride;
    }
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

function getAgeAtStartOfYear(dateOfBirth, year) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth || "");

  if (!match || !Number.isInteger(year)) {
    return null;
  }

  const birthDate = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  const startOfYear = new Date(year, 0, 1);

  let age = startOfYear.getFullYear() - birthDate.getFullYear();

  const birthdayHasPassed =
    startOfYear.getMonth() > birthDate.getMonth() ||
    (startOfYear.getMonth() === birthDate.getMonth() &&
      startOfYear.getDate() >= birthDate.getDate());

  if (!birthdayHasPassed) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}