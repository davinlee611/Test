"use strict";

import { emit } from "../events/event-bus.js";
import { EVENTS } from "../events/events.js";

import { getGoalElements } from "./goals/goal-elements.js";
import { readGoalFormData } from "./goals/goal-form-data.js";
import { bindGoalEvents } from "./goals/goal-event-binder.js";
import { createGoalModal } from "./goals/goal-modal.js";
import { renderGoalList } from "./goals/goal-renderer.js";
import { createGoalWorkflow } from "./goals/goal-workflow.js";

/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;

let elements = {};

let goalModal = null;

let goalWorkflow = null;

/* ========================================
   INITIALIZATION
======================================== */

export function initializeGoals() {
  elements = getGoalElements();

  createGoalComponents();

  if (!moduleInitialized) {
    bindModuleEvents();

    moduleInitialized = true;
  }

  renderGoals();
}

/* ========================================
   RESET
======================================== */

export function resetGoals() {
  goalWorkflow?.resetGoals();

  goalModal?.close();

  renderGoals();

  emitGoalsChanged();
}

/* ========================================
   RENDERING
======================================== */

export function renderGoals() {
  if (!goalWorkflow) {
    return;
  }

  renderGoalList({
    list: elements.goalsList,

    emptyMessage: elements.emptyGoalMessage,

    goals: goalWorkflow.getGoals(),

    onEditGoal: openEditGoal,

    onDeleteGoal: confirmDeleteGoal,
  });
}

/* ========================================
   COMPONENT CREATION
======================================== */

function createGoalComponents() {
  goalWorkflow = createGoalWorkflow();

  goalModal = createGoalModal({
    elements,
  });
}

/* ========================================
   EVENT BINDING
======================================== */

function bindModuleEvents() {
  bindGoalEvents({
    elements,

    onAddGoal() {
      goalModal.openAdd();
    },

    onSubmitGoal: handleGoalSubmit,

    onCloseGoal() {
      if (goalModal.isOpen()) {
        goalModal.close();
      }
    },
  });
}

/* ========================================
   FORM SUBMISSION
======================================== */

function handleGoalSubmit(event) {
  event.preventDefault();

  goalModal.clearMessage();

  const editingGoalId = elements.editingGoalIdInput?.value || "";

  const formData = readGoalFormData(elements);

  const result = goalWorkflow.save({
    formData,

    editingGoalId,
  });

  if (!result.success) {
    goalModal.showMessage(result.validation.message);

    goalModal.focusField(result.validation.field);

    return;
  }

  renderGoals();

  goalModal.close();

  emitGoalsChanged();
}

/* ========================================
   EDITING
======================================== */

function openEditGoal(goalId) {
  const goal = goalWorkflow.getGoal(goalId);

  if (!goal) {
    return;
  }

  goalModal.openEdit(goal);
}

/* ========================================
   DELETION
======================================== */

function confirmDeleteGoal(goalId) {
  const shouldDelete = window.confirm("Delete this goal?");

  if (!shouldDelete) {
    return;
  }

  const wasRemoved = goalWorkflow.deleteGoal(goalId);

  if (!wasRemoved) {
    return;
  }

  renderGoals();

  emitGoalsChanged();
}

/* ========================================
   EVENTS
======================================== */

function emitGoalsChanged() {
  emit(EVENTS.GOALS_CHANGED, {
    goals: [...goalWorkflow.getGoals()],
  });
}