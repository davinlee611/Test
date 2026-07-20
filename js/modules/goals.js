"use strict";

import {
    getAllGoals,
    getGoalById,
    createGoal,
    updateGoal,
    removeGoal,
    clearGoals,
} from "../services/goal-service.js";

import {
    emit,
} from "../events/event-bus.js";

import {
    EVENTS,
} from "../events/events.js";

import {
    formatCurrency,
    getWholeNumber,
} from "../utils/client-utils.js";

import {
    createPlanningCard,
    createPlanningCardIcon,
    createPlanningCardDetails,
    createPlanningCardActions,
    renderPlanningEmptyState,
} from "../components/planning-card.js";


/* ========================================
   DOM REFERENCES
======================================== */

const addGoalButton =
    document.getElementById(
        "addGoalButton",
    );

const emptyGoalMessage =
    document.getElementById(
        "emptyGoalMessage",
    );

const goalsList =
    document.getElementById(
        "goalsList",
    );

const goalModal =
    document.getElementById(
        "goalModal",
    );

const goalForm =
    document.getElementById(
        "goalForm",
    );

const goalModalTitle =
    document.getElementById(
        "goalModalTitle",
    );

const editingGoalIdInput =
    document.getElementById(
        "editingGoalId",
    );

const goalTypeInput =
    document.getElementById(
        "goalType",
    );

const goalNameInput =
    document.getElementById(
        "goalName",
    );

const goalTargetAmountInput =
    document.getElementById(
        "goalTargetAmount",
    );

const goalTargetDateInput =
    document.getElementById(
        "goalTargetDate",
    );

const goalFormMessage =
    document.getElementById(
        "goalFormMessage",
    );

const closeGoalModalButton =
    document.getElementById(
        "closeGoalModalButton",
    );

const cancelGoalButton =
    document.getElementById(
        "cancelGoalButton",
    );

const goalModalBackdrop =
    document.querySelector(
        "[data-close-goal-modal]",
    );


/* ========================================
   MODULE STATE
======================================== */

let moduleInitialized = false;


/* ========================================
   INITIALIZATION
======================================== */

export function initializeGoals() {
    if (moduleInitialized) {
        renderGoals();
        return;
    }

    attachGoalListeners();
    renderGoals();

    moduleInitialized = true;
}


/* ========================================
   RESET
======================================== */

export function resetGoals() {
    clearGoals();

    closeGoalModal();
    renderGoals();
    emitGoalsChanged();
}


/* ========================================
   EVENT LISTENERS
======================================== */

function attachGoalListeners() {
    if (addGoalButton) {
        addGoalButton.addEventListener(
            "click",
            openAddGoalModal,
        );
    }

    if (goalForm) {
        goalForm.addEventListener(
            "submit",
            handleGoalSubmit,
        );
    }

    if (closeGoalModalButton) {
        closeGoalModalButton
            .addEventListener(
                "click",
                closeGoalModal,
            );
    }

    if (cancelGoalButton) {
        cancelGoalButton.addEventListener(
            "click",
            closeGoalModal,
        );
    }

    if (goalModalBackdrop) {
        goalModalBackdrop.addEventListener(
            "click",
            closeGoalModal,
        );
    }

    document.addEventListener(
        "keydown",
        handleDocumentKeydown,
    );
}


function handleDocumentKeydown(event) {
    if (
        event.key === "Escape" &&
        goalModal &&
        !goalModal.hidden
    ) {
        closeGoalModal();
    }
}


/* ========================================
   MODAL
======================================== */

function openAddGoalModal() {
    if (!goalModal || !goalForm) {
        return;
    }

    goalForm.reset();
    setMinimumGoalMonth();

    if (editingGoalIdInput) {
        editingGoalIdInput.value = "";
    }

    clearGoalFormMessage();

    if (goalModalTitle) {
        goalModalTitle.textContent =
            "Add Goal";
    }

    goalModal.hidden = false;

    document.body.classList.add(
        "goal-modal-open",
    );

    goalTypeInput?.focus();
}


function openEditGoalModal(goalId) {
    const goal =
        getGoalById(goalId);

    if (!goal || !goalModal) {
        return;
    }

    if (editingGoalIdInput) {
        editingGoalIdInput.value =
            goal.id;
    }

    if (goalTypeInput) {
        goalTypeInput.value =
            goal.type || "";
    }

    if (goalNameInput) {
        goalNameInput.value =
            goal.name || "";
    }

    if (goalTargetAmountInput) {
        goalTargetAmountInput.value =
            goal.targetAmount || "";
    }

    if (goalTargetDateInput) {
        goalTargetDateInput.value =
            getSavedGoalDate(goal);
    }

    clearGoalFormMessage();

    if (goalModalTitle) {
        goalModalTitle.textContent =
            "Edit Goal";
    }

    setMinimumGoalMonthForEdit(goal);
    goalModal.hidden = false;

    document.body.classList.add(
        "goal-modal-open",
    );

    goalTypeInput?.focus();
}


function closeGoalModal() {
    if (!goalModal) {
        return;
    }

    goalModal.hidden = true;

    document.body.classList.remove(
        "goal-modal-open",
    );

    clearGoalFormMessage();
}


function clearGoalFormMessage() {
    if (goalFormMessage) {
        goalFormMessage.textContent = "";
    }
}


/* ========================================
   FORM SUBMISSION
======================================== */

function handleGoalSubmit(event) {
    event.preventDefault();

    const goalType =
        goalTypeInput?.value || "";

    const goalName =
        goalNameInput?.value.trim() || "";

    const targetAmount =
        getWholeNumber(
            goalTargetAmountInput?.value,
        );

    const targetDate =
        goalTargetDateInput?.value || "";

    const editingGoalId =
        editingGoalIdInput?.value || "";

    clearGoalFormMessage();

    const validationResult =
    validateGoal({
        goalType,
        goalName,
        targetAmount,
        targetDate,
        editingGoalId,
    });

    if (!validationResult.isValid) {
        showGoalFormMessage(
            validationResult.message,
        );

        validationResult.element?.focus();

        return;
    }

    if (editingGoalId) {
        updateGoal(
            editingGoalId,
            {
                goalType,
                goalName,
                targetAmount,
                targetDate,
            },
        );
    } else {
        createGoal({
            goalType,
            goalName,
            targetAmount,
            targetDate,
        });
    }

    renderGoals();
    closeGoalModal();
    emitGoalsChanged();
}


function validateGoal({
    goalType,
    goalName,
    targetAmount,
    targetDate,
    editingGoalId,
}) {
    if (!goalType) {
        return {
            isValid: false,
            message:
                "Please select a goal type.",
            element: goalTypeInput,
        };
    }

    if (!goalName) {
        return {
            isValid: false,
            message:
                "Please enter a goal name.",
            element: goalNameInput,
        };
    }

    if (targetAmount <= 0) {
        return {
            isValid: false,
            message:
                "Please enter the target amount.",
            element:
                goalTargetAmountInput,
        };
    }

    if (!targetDate) {
        return {
            isValid: false,
            message:
                "Please select the target month and year.",
            element:
                goalTargetDateInput,
        };
    }

    const minimumTargetDate =
        getMinimumGoalMonth();

    if (!editingGoalId) {
        if (
            targetDate <
            minimumTargetDate
        ) {
            return {
                isValid: false,
                message:
                    "The target month must be in the future.",
                element:
                    goalTargetDateInput,
            };
        }

        return {
            isValid: true,
        };
    }

    const existingGoal =
        getGoalById(editingGoalId);

    const existingTargetDate =
        existingGoal
            ? getSavedGoalDate(
                  existingGoal,
              )
            : "";

    const dateWasChanged =
        targetDate !==
        existingTargetDate;

    /*
     * An existing past date may remain unchanged.
     * If the user changes the date, the new date
     * must be in the future.
     */
    if (
        dateWasChanged &&
        targetDate <
            minimumTargetDate
    ) {
        return {
            isValid: false,
            message:
                "The new target month must be in the future.",
            element:
                goalTargetDateInput,
        };
    }

    return {
        isValid: true,
    };
}


function showGoalFormMessage(message) {
    if (goalFormMessage) {
        goalFormMessage.textContent =
            message;
    }
}


/* ========================================
   GOAL DELETION
======================================== */

function handleDeleteGoal(goalId) {
    const shouldDelete =
        window.confirm(
            "Delete this goal?",
        );

    if (!shouldDelete) {
        return;
    }

    const wasRemoved =
        removeGoal(goalId);

    if (!wasRemoved) {
        return;
    }

    renderGoals();
    emitGoalsChanged();
}


/* ========================================
   RENDERING
======================================== */

export function renderGoals() {
    if (!goalsList) {
        return;
    }

    const goals =
        getAllGoals();

    goalsList.innerHTML = "";

    if (goals.length === 0) {
        renderPlanningEmptyState(
            goalsList,
            "No goals added yet.",
            emptyGoalMessage,
        );

        return;
    }

    goals.forEach(function (goal) {
        goalsList.appendChild(
            createGoalItem(goal),
        );
    });
}


function createGoalItem(goal) {
    const goalIcon =
        createPlanningCardIcon(
            getGoalIconClass(
                goal.type,
            ),
        );

    const goalDetails =
        createGoalDetails(goal);

    const goalActions =
        createGoalActions(goal);

    return createPlanningCard({
        itemClass:
            "goal-item",

        icon:
            goalIcon,

        details:
            goalDetails,

        actions:
            goalActions,
    });
}


function createGoalDetails(goal) {
    const details =
        createPlanningCardDetails();

    const title =
        document.createElement("h4");

    title.textContent =
        goal.name ||
        "Unnamed Goal";

    const description =
        document.createElement("p");

    description.textContent = [
        getGoalTypeLabel(
            goal.type,
        ),

        `${formatCurrency(
            goal.targetAmount,
        )} target amount`,

        `${formatGoalDate(
            getSavedGoalDate(goal),
        )} target date`,
    ].join(" · ");

    details.append(
        title,
        description,
    );

    return details;
}


function createGoalActions(goal) {
    const actions =
        createPlanningCardActions();

    actions.append(
        createEditButton(goal),
        createDeleteButton(goal),
    );

    return actions;
}


function createEditButton(goal) {
    const editButton =
        document.createElement("button");

    editButton.type = "button";

    editButton.className =
        "planning-card-action";

    editButton.setAttribute(
        "aria-label",
        `Edit ${goal.name}`,
    );

    editButton.innerHTML =
        '<i class="fa-solid fa-pen"></i>';

    editButton.addEventListener(
        "click",
        function () {
            openEditGoalModal(goal.id);
        },
    );

    return editButton;
}


function createDeleteButton(goal) {
    const deleteButton =
        document.createElement("button");

    deleteButton.type = "button";

    deleteButton.className =
        "planning-card-action delete";

    deleteButton.setAttribute(
        "aria-label",
        `Delete ${goal.name}`,
    );

    deleteButton.innerHTML =
        '<i class="fa-solid fa-trash"></i>';

    deleteButton.addEventListener(
        "click",
        function () {
            handleDeleteGoal(goal.id);
        },
    );

    return deleteButton;
}


/* ========================================
   DATE HELPERS
======================================== */

function getSavedGoalDate(goal) {
    if (goal.targetDate) {
        return goal.targetDate;
    }

    /*
     * Compatibility with goals created before
     * targetDate was introduced.
     */
    if (goal.targetYear) {
        return `${goal.targetYear}-01`;
    }

    return "";
}


function formatGoalDate(targetDate) {
    if (!targetDate) {
        return "No target date";
    }

    const [
        year,
        month,
    ] = targetDate.split("-");

    const date =
        new Date(
            Number(year),
            Number(month) - 1,
            1,
        );

    if (
        Number.isNaN(date.getTime())
    ) {
        return targetDate;
    }

    return new Intl.DateTimeFormat(
        "en-SG",
        {
            month: "long",
            year: "numeric",
        },
    ).format(date);
}

function getMinimumGoalMonth() {
    const today = new Date();

    today.setDate(1);

    today.setMonth(
        today.getMonth() + 1,
    );

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1,
        ).padStart(2, "0");

    return `${year}-${month}`;
}

function setMinimumGoalMonth() {
    if (!goalTargetDateInput) {
        return;
    }

    goalTargetDateInput.min =
        getMinimumGoalMonth();
}

function setMinimumGoalMonthForEdit(
    goal,
) {
    if (!goalTargetDateInput) {
        return;
    }

    const savedTargetDate =
        getSavedGoalDate(goal);

    const minimumFutureMonth =
        getMinimumGoalMonth();

    /*
     * Preserve an existing past month as a
     * valid selectable value while editing.
     */
    if (
        savedTargetDate &&
        savedTargetDate <
            minimumFutureMonth
    ) {
        goalTargetDateInput.min =
            savedTargetDate;

        return;
    }

    goalTargetDateInput.min =
        minimumFutureMonth;
}

/* ========================================
   DISPLAY HELPERS
======================================== */

function getGoalTypeLabel(goalType) {
    const labels = {
        retirement: "Retirement",
        education:
            "Children’s Education",
        property:
            "Property Purchase",
        emergency_fund:
            "Emergency Fund",
        wedding: "Wedding",
        travel: "Travel",
        legacy: "Legacy",
        other: "Others",
    };

    return labels[goalType] || "Goal";
}


function getGoalIconClass(
    goalType,
) {
    const icons = {
        retirement:
            "fa-solid fa-umbrella-beach",

        education:
            "fa-solid fa-graduation-cap",

        property:
            "fa-solid fa-house",

        emergency_fund:
            "fa-solid fa-shield-halved",

        wedding:
            "fa-solid fa-ring",

        travel:
            "fa-solid fa-plane",

        legacy:
            "fa-solid fa-hand-holding-heart",

        other:
            "fa-solid fa-bullseye",
    };

    return (
        icons[goalType] ||
        icons.other
    );
}


/* ========================================
   EVENTS
======================================== */

function emitGoalsChanged() {
    emit(
        EVENTS.GOALS_CHANGED,
        {
            goals: [
                ...getAllGoals(),
            ],
        },
    );
}