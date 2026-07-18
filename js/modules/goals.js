"use strict";

import {
    clientPlan,
} from "../state/client-state.js";

import {
    eventBus,
} from "../events/event-bus.js";

import {
    EVENTS,
} from "../events/events.js";


/* ========================================
   MODULE STATE
======================================== */

let goalsContainer = null;
let addGoalButton = null;


/* ========================================
   INITIALIZATION
======================================== */

export function initializeGoals() {
    goalsContainer =
        document.getElementById(
            "goalsContainer",
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

    renderGoals();
}


/* ========================================
   GOAL ACTIONS
======================================== */

function addGoal() {
    const goal = {
        id: crypto.randomUUID(),
        type: "",
        name: "",
        targetAmount: 0,
        targetYear: null,
    };

    clientPlan.priorities.goals.push(
        goal,
    );

    renderGoals();

    eventBus.emit(
        EVENTS.GOALS_CHANGED,
        clientPlan.priorities.goals,
    );
}


function deleteGoal(goalId) {
    clientPlan.priorities.goals =
        clientPlan.priorities.goals.filter(
            (goal) =>
                goal.id !== goalId,
        );

    renderGoals();

    eventBus.emit(
        EVENTS.GOALS_CHANGED,
        clientPlan.priorities.goals,
    );
}


/* ========================================
   RENDERING
======================================== */

function renderGoals() {
    goalsContainer.innerHTML = "";

    if (
        clientPlan.priorities.goals
            .length === 0
    ) {
        goalsContainer.innerHTML = `
            <p class="empty-state">
                No goals added yet.
            </p>
        `;

        return;
    }

    clientPlan.priorities.goals.forEach(
        (goal) => {
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

    card.innerHTML = `
        <div class="goal-card-header">
            <h4>
                ${
                    goal.name ||
                    "New Goal"
                }
            </h4>

            <button
                type="button"
                class="goal-delete-button"
            >
                Delete
            </button>
        </div>

        <div class="goal-fields">
            <div class="form-field">
                <label>
                    Goal Type
                </label>

                <select
                    class="goal-type-input"
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
                <label>
                    Goal Name
                </label>

                <input
                    type="text"
                    class="goal-name-input"
                    value="${escapeHtml(
                        goal.name,
                    )}"
                >
            </div>

            <div class="form-field">
                <label>
                    Target Amount
                </label>

                <input
                    type="number"
                    min="0"
                    step="1"
                    class="goal-amount-input"
                    value="${
                        goal.targetAmount ||
                        ""
                    }"
                >
            </div>

            <div class="form-field">
                <label>
                    Target Year
                </label>

                <input
                    type="number"
                    min="${new Date().getFullYear()}"
                    step="1"
                    class="goal-year-input"
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

    typeInput.value = goal.type;

    typeInput.addEventListener(
        "change",
        () => {
            goal.type =
                typeInput.value;

            emitGoalsChanged();
        },
    );

    nameInput.addEventListener(
        "input",
        () => {
            goal.name =
                nameInput.value.trim();

            card.querySelector("h4")
                .textContent =
                goal.name ||
                "New Goal";

            emitGoalsChanged();
        },
    );

    amountInput.addEventListener(
        "input",
        () => {
            goal.targetAmount =
                toWholeNumber(
                    amountInput.value,
                );

            emitGoalsChanged();
        },
    );

    yearInput.addEventListener(
        "input",
        () => {
            goal.targetYear =
                toWholeNumber(
                    yearInput.value,
                ) || null;

            emitGoalsChanged();
        },
    );

    deleteButton.addEventListener(
        "click",
        () => {
            deleteGoal(goal.id);
        },
    );

    return card;
}


/* ========================================
   EVENTS
======================================== */

function emitGoalsChanged() {
    eventBus.emit(
        EVENTS.GOALS_CHANGED,
        clientPlan.priorities.goals,
    );
}


/* ========================================
   HELPERS
======================================== */

function toWholeNumber(value) {
    const number =
        Number.parseInt(value, 10);

    if (
        !Number.isFinite(number) ||
        number < 0
    ) {
        return 0;
    }

    return number;
}


function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}