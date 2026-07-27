"use strict";

import { emit } from "../../events/event-bus.js";

import { EVENTS } from "../../events/events.js";

import { readLiabilityFormData } from "./liability-form-data.js";

import { renderLiabilityList } from "./liability-renderer.js";

/* ========================================
   LIABILITY CONTROLLER
======================================== */

export function createLiabilityController({
  elements,

  modal,

  workflow,
}) {
  /* ========================================
     RENDER
  ======================================== */

  function render() {
    renderLiabilityList({
      list: elements.liabilitiesList,

      emptyMessage: elements.emptyLiabilityMessage,

      totalElement: elements.totalLiabilitiesValue,

      liabilities: workflow.getLiabilities(),

      onEditLiability: openEditLiability,

      onDeleteLiability: confirmDeleteLiability,
    });
  }

  /* ========================================
     ADD
  ======================================== */

  function openAddLiability() {
    modal.openAdd();
  }

  /* ========================================
     EDIT
  ======================================== */

  function openEditLiability(liabilityId) {
    const liability = workflow.getLiability(liabilityId);

    if (!liability) {
      return;
    }

    modal.openEdit(liability);
  }

  /* ========================================
     SAVE
  ======================================== */

  function submitLiability(event) {
    event.preventDefault();

    modal.clearMessage();

    const editingLiabilityId = elements.editingLiabilityIdInput?.value || "";

    const formData = readLiabilityFormData(elements);

    const result = workflow.save({
      formData,

      editingLiabilityId,
    });

    if (!result.success) {
      modal.showMessage(result.validation.message);

      modal.focusField(result.validation.field);

      return;
    }

    render();

    modal.close();

    emitLiabilitiesChanged();
  }

  /* ========================================
     DELETE
  ======================================== */

  function confirmDeleteLiability(liabilityId) {
    const shouldDelete = window.confirm("Delete this liability?");

    if (!shouldDelete) {
      return;
    }

    const wasRemoved = workflow.deleteLiability(liabilityId);

    if (!wasRemoved) {
      return;
    }

    render();

    emitLiabilitiesChanged();
  }

  /* ========================================
     CLOSE
  ======================================== */

  function closeLiability() {
    if (modal.isOpen()) {
      modal.close();
    }
  }

  /* ========================================
     RESET
  ======================================== */

  function reset() {
    workflow.resetLiabilities();

    modal.close();

    render();

    emitLiabilitiesChanged();
  }

  /* ========================================
     EVENTS
  ======================================== */

  function emitLiabilitiesChanged() {
    emit(EVENTS.LIABILITIES_CHANGED, {
      liabilities: [...workflow.getLiabilities()],
    });
  }

  return {
    render,

    reset,

    openAddLiability,

    submitLiability,

    closeLiability,
  };
}