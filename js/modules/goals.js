"use strict";

import {
    clientPlan,
} from "../state/client-state.js";

import {
    emit,
} from "../events/event-bus.js";

import {
    EVENTS,
} from "../events/events.js";

import {
    createUniqueId,
    getWholeNumber,
} from "../utils/client-utils.js";


/* ========================================
   MODULE STATE
======================================== */

let goalsContainer = null;
let addGoalButton = null;
let moduleInitialized = false;


/* ========================================
   INITIALIZATION
======================================== */

export function initializeGoals() {
    if (moduleInitialized) {
        renderGoals();
        return;
    }

    goalsContainer =
        document.getElementById(
            "goalsList",
        );

    addGoalButton =
        document.getElementById(
            "addGoalButton",
        );

    if (
        !goalsContainer ||
        !addGoalButton
    ) {
        return;
    }

    addGoalButton.addEventListener(
        "click",
        addGoal,
    );

    moduleInitialized = true;

    renderGoals();
}


/* ========================================
   PUBLIC RESET
======================================== */

export function resetGoals() {
    clientPlan.priorities.goals = [];

    renderGoals();
    emitGoalsChanged();
}


/* ========================================
   GOAL ACTIONS
======================================== */

function addGoal() {
    const goal = {
        id: createUniqueId(),
        type: "",
        name: "",
        targetAmount: 0,
        targetYear: null,
    };

    clientPlan.priorities.goals.push(
        goal,
    );

    renderGoals();
    emitGoalsChanged();
}


function deleteGoal(goalId) {
    clientPlan.priorities.goals =
        clientPlan.priorities.goals.filter(
            function (goal) {
                return goal.id !== goalId;
            },
        );

    renderGoals();
    emitGoalsChanged();
}


/* ========================================
   RENDERING
======================================== */

function renderGoals() {
    if (!goalsContainer) {
        return;
    }

    goalsContainer.innerHTML = "";

    if (
        clientPlan.priorities.goals
            .length === 0
    ) {
        goalsContainer.innerHTML = `
            <p class="empty-list-message">
                No goals added yet.
            </p>
        `;

        return;
    }

    clientPlan.priorities.goals.forEach(
        function (goal) {
            goalsContainer.appendChild(
                createGoalCard(goal),
            );
        },
    );
}


function createGoalCard(goal) {
    const card =
        document.createElement("div");

    card.className = "goal-card";
    card.dataset.goalId = goal.id;

    const typeInputId =
        `goalType-${goal.id}`;

    const nameInputId =
        `goalName-${goal.id}`;

    const amountInputId =
        `goalAmount-${goal.id}`;

    const yearInputId =
        `goalYear-${goal.id}`;

    card.innerHTML = `
        <div class="goal-card-header">
            <h4>
                ${escapeHtml(
                    goal.name ||
                    "New Goal",
                )}
            </h4>

            <button
                type="button"
                class="goal-delete-button"
                aria-label="Delete goal"
            >
                <i
                    class="fa-solid fa-trash"
                    aria-hidden="true"
                ></i>

                Delete
            </button>
        </div>

        <div class="goal-fields">
            <div class="form-field">
                <label for="${typeInputId}">
                    Goal Type
                </label>

                <select
                    id="${typeInputId}"
                    class="form-control goal-type-input"
                >
                    <option value="">
                        Select goal
                    </option>

                    <option value="retirement">
                        Retirement
                    </option>

                    <option value="education">
                        Children’s Education
                    </option>

                    <option value="property">
                        Property Purchase
                    </option>

                    <option value="emergency_fund">
                        Emergency Fund
                    </option>

                    <option value="travel">
                        Travel
                    </option>

                    <option value="legacy">
                        Legacy
                    </option>

                    <option value="other">
                        Others
                    </option>
                </select>
            </div>

            <div class="form-field">
                <label for="${nameInputId}">
                    Goal Name
                </label>

                <input
                    id="${nameInputId}"
                    type="text"
                    class="form-control goal-name-input"
                    value="${escapeHtml(
                        goal.name,
                    )}"
                >
            </div>

            <div class="form-field">
                <label for="${amountInputId}">
                    Target Amount
                </label>

                <input
                    id="${amountInputId}"
                    type="number"
                    min="0"
                    step="1"
                    inputmode="numeric"
                    class="form-control goal-amount-input"
                    value="${
                        goal.targetAmount ||
                        ""
                    }"
                >
            </div>

            <div class="form-field">
                <label for="${yearInputId}">
                    Target Year
                </label>

                <input
                    id="${yearInputId}"
                    type="number"
                    min="${new Date().getFullYear()}"
                    step="1"
                    inputmode="numeric"
                    class="form-control goal-year-input"
                    value="${
                        goal.targetYear ||
                        ""
                    }"
                >
            </div>
        </div>
    `;

    const typeInput =
        card.querySelector(
            ".goal-type-input",
        );

    const nameInput =
        card.querySelector(
            ".goal-name-input",
        );

    const amountInput =
        card.querySelector(
            ".goal-amount-input",
        );

    const yearInput =
        card.querySelector(
            ".goal-year-input",
        );

    const deleteButton =
        card.querySelector(
            ".goal-delete-button",
        );

    const heading =
        card.querySelector("h4");

    typeInput.value = goal.type;

    typeInput.addEventListener(
        "change",
        function () {
            goal.type =
                typeInput.value;

            emitGoalsChanged();
        },
    );

    nameInput.addEventListener(
        "input",
        function () {
            goal.name =
                nameInput.value.trim();

            heading.textContent =
                goal.name ||
                "New Goal";

            emitGoalsChanged();
        },
    );

    amountInput.addEventListener(
        "input",
        function () {
            goal.targetAmount =
                getWholeNumber(
                    amountInput.value,
                );

            emitGoalsChanged();
        },
    );

    yearInput.addEventListener(
        "input",
        function () {
            goal.targetYear =
                getWholeNumber(
                    yearInput.value,
                ) || null;

            emitGoalsChanged();
        },
    );

    deleteButton.addEventListener(
        "click",
        function () {
            deleteGoal(goal.id);
        },
    );

    return card;
}


/* ========================================
   EVENTS
======================================== */

function emitGoalsChanged() {
    emit(
        EVENTS.GOALS_CHANGED,
        {
            goals: [
                ...clientPlan.priorities
                    .goals,
            ],
        },
    );
}


/* ========================================
   HELPERS
======================================== */

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}