"use strict";

import { clearGoalForm, writeGoalFormData } from "./goal-form-data.js";

import {
  getGoalMinimumMonthForEdit,
  getMinimumGoalMonth,
} from "./goal-date.js";

/* ========================================
   GOAL MODAL
======================================== */

export function createGoalModal({ elements }) {
  /* ========================================
     OPEN ADD
  ======================================== */

  function openAdd() {
    if (!elements.goalModal || !elements.goalForm) {
      return;
    }

    clearGoalForm(elements);

    clearMessage();

    setTitle("Add Goal");

    setMinimumMonth(getMinimumGoalMonth());

    show();
  }

  /* ========================================
     OPEN EDIT
  ======================================== */

  function openEdit(goal) {
    if (!goal || !elements.goalModal) {
      return;
    }

    writeGoalFormData(elements, goal);

    clearMessage();

    setTitle("Edit Goal");

    setMinimumMonth(getGoalMinimumMonthForEdit(goal));

    show();
  }

  /* ========================================
     CLOSE
  ======================================== */

  function close() {
    if (!elements.goalModal) {
      return;
    }

    elements.goalModal.hidden = true;

    document.body.classList.remove("goal-modal-open");

    clearMessage();
  }

  function isOpen() {
    return Boolean(elements.goalModal && !elements.goalModal.hidden);
  }

  /* ========================================
     MESSAGE
  ======================================== */

  function showMessage(message) {
    if (elements.goalFormMessage) {
      elements.goalFormMessage.textContent = message;
    }
  }

  function clearMessage() {
    showMessage("");
  }

  /* ========================================
     FOCUS
  ======================================== */

  function focusField(field) {
    const fieldMap = {
      goalType: elements.goalTypeInput,

      goalName: elements.goalNameInput,

      targetAmount: elements.goalTargetAmountInput,

      targetDate: elements.goalTargetDateInput,
    };

    fieldMap[field]?.focus();
  }

  /* ========================================
     INTERNAL DISPLAY
  ======================================== */

  function show() {
    elements.goalModal.hidden = false;

    document.body.classList.add("goal-modal-open");

    elements.goalTypeInput?.focus();
  }

  function setTitle(title) {
    if (elements.goalModalTitle) {
      elements.goalModalTitle.textContent = title;
    }
  }

  function setMinimumMonth(value) {
    if (elements.goalTargetDateInput) {
      elements.goalTargetDateInput.min = value;
    }
  }

  return {
    openAdd,

    openEdit,

    close,

    isOpen,

    showMessage,

    clearMessage,

    focusField,
  };
}