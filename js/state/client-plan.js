"use strict";

export function createEmptyClientPlan() {
    return {
        profile: {
            fullName: "",
            dateOfBirth: "",
            gender: "",
            maritalStatus: "",
            occupation: "",
            employmentStatus: "",
            phone: "",
            email: "",
            dependants: 0,
        },

        priorities: {
            wealthTypes: [],

            liquidAssets: {},

            income: {},

            cpf: {},

            properties: [],

            goals: [],

            liabilities: [],

            policies: [],
        },

        costOfWants: {},
    };
}

export const clientPlan = createEmptyClientPlan();

export function resetClientPlan() {
    Object.assign(clientPlan, createEmptyClientPlan());
}