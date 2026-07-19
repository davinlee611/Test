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

    selectedWealthTypes: [],

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

            monthlyEmploymentIncome: 0,
            annualEmploymentIncome: 0,

            monthlyOtherIncome: 0,
            annualOtherIncome: 0,

            monthlyTakeHomeIncome: 0,
            annualTakeHomeIncome: 0,

        },

        cpf: {

            oa: 0,
            sa: 0,
            ma: 0,
            ra: 0,

        },

        properties: [],

    },

    goals: [],

    liabilities: [],

    policies: [],

},

        costOfWants: {},
    };
}

export const clientPlan = createEmptyClientPlan();

export function resetClientPlan() {
    Object.assign(
        clientPlan,
        createEmptyClientPlan(),
    );
}