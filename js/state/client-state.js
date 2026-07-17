"use strict";

/* ========================================
   CLIENT PLAN FACTORY
======================================== */

export function createEmptyClientPlan() {
    return {
        profile: {
            fullName: "",
            dateOfBirth: "",
            gender: "",
            maritalStatus: "",
            occupation: "",
            employmentStatus: "",
            dependants: 0,
            phone: "",
            email: "",
        },

        priorities: {
            selectedWealthTypes: [],

            goals: [],

            assets: {
                liquidAssets: {
                    cashInBank: 0,
                    fixedDeposits: 0,
                    tBills: 0,
                    investments: 0,
                    others: 0,
                },

                income: {
                    monthlyEmployment: 0,
                    annualBonus: 0,
                    otherMonthly: 0,
                },

                cpf: {
                    oa: 0,
                    sa: 0,
                    ma: 0,
                    ra: 0,
                },

                properties: [],
            },

            liabilities: [],
        },

        costOfWants: {},
        protection: {},
        summary: {},
    };
}


/* ========================================
   ACTIVE CLIENT PLAN
======================================== */

export const clientPlan = createEmptyClientPlan();


/* ========================================
   RESET CLIENT PLAN
======================================== */

export function resetClientPlan() {
    replaceObjectContents(
        clientPlan,
        createEmptyClientPlan(),
    );
}


/* ========================================
   LOAD SAVED CLIENT PLAN
======================================== */

export function loadClientPlan(savedPlan = {}) {
    const emptyPlan = createEmptyClientPlan();

    const mergedPlan = {
        ...emptyPlan,
        ...savedPlan,

        profile: {
            ...emptyPlan.profile,
            ...(savedPlan.profile || {}),
        },

        priorities: {
            ...emptyPlan.priorities,
            ...(savedPlan.priorities || {}),

            selectedWealthTypes: Array.isArray(
                savedPlan.priorities?.selectedWealthTypes,
            )
                ? savedPlan.priorities.selectedWealthTypes
                : [],

            goals: Array.isArray(
                savedPlan.priorities?.goals,
            )
                ? savedPlan.priorities.goals
                : [],

            assets: {
                ...emptyPlan.priorities.assets,
                ...(savedPlan.priorities?.assets || {}),

                liquidAssets: {
                    ...emptyPlan.priorities.assets.liquidAssets,
                    ...(savedPlan.priorities?.assets
                        ?.liquidAssets || {}),
                },

                income: {
                    ...emptyPlan.priorities.assets.income,
                    ...(savedPlan.priorities?.assets
                        ?.income || {}),
                },

                cpf: {
                    ...emptyPlan.priorities.assets.cpf,
                    ...(savedPlan.priorities?.assets
                        ?.cpf || {}),
                },

                properties: Array.isArray(
                    savedPlan.priorities?.assets?.properties,
                )
                    ? savedPlan.priorities.assets.properties
                    : [],
            },

            liabilities: Array.isArray(
                savedPlan.priorities?.liabilities,
            )
                ? savedPlan.priorities.liabilities
                : [],
        },

        costOfWants: {
            ...emptyPlan.costOfWants,
            ...(savedPlan.costOfWants || {}),
        },

        protection: {
            ...emptyPlan.protection,
            ...(savedPlan.protection || {}),
        },

        summary: {
            ...emptyPlan.summary,
            ...(savedPlan.summary || {}),
        },
    };

    replaceObjectContents(clientPlan, mergedPlan);
}


/* ========================================
   INTERNAL STATE HELPER
======================================== */

function replaceObjectContents(target, source) {
    Object.keys(target).forEach(function (key) {
        delete target[key];
    });

    Object.assign(target, source);
}