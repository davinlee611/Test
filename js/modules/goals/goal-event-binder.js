"use strict";

/* ========================================
   GOAL EVENT BINDER
======================================== */

export function bindGoalEvents({
  elements,

  onAddGoal,

  onSubmitGoal,

  onCloseGoal,
}) {
  elements.addGoalButton?.addEventListener(
    "click",

    onAddGoal,
  );

  elements.goalForm?.addEventListener(
    "submit",

    onSubmitGoal,
  );

  elements.closeGoalModalButton?.addEventListener(
    "click",

    onCloseGoal,
  );

  elements.cancelGoalButton?.addEventListener(
    "click",

    onCloseGoal,
  );

  elements.goalModalBackdrop?.addEventListener(
    "click",

    onCloseGoal,
  );

  document.addEventListener(
    "keydown",

    function (event) {
      if (event.key === "Escape") {
        onCloseGoal();
      }
    },
  );
}