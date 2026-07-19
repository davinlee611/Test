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

            // User Inputs

            monthlyEmployment: 0,
            annualBonus: 0,
            otherMonthly: 0,



            // Calculated

            monthlyEmploymentIncome: 0,
            annualEmploymentIncome: 0,

            monthlyOtherIncome: 0,
            annualOtherIncome: 0,

            monthlyTakeHomeIncome: 0,
            annualTakeHomeIncome: 0,



            // Employer CPF

            employeeCpf: 0,
            employerCpf: 0
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

            policies: {

                id: "",

                type: "",

                policyName: "",

                insurer: "",

                policyOwner: "",

                lifeAssured: "",

                coverageAmount: 0,

                premium: 0,

                premiumFrequency: "",

                status: "",

            },

},

        costOfWants: {

            education: [],

            retirement: {},

            legacy: {},

            emergencyFund: {},

            debtClearance: {},

            customGoals: []

        },

        summary: {},
    };
}

export const clientPlan = createEmptyClientPlan();

export function resetClientPlan() {
    Object.assign(
        clientPlan,
        createEmptyClientPlan(),
    );
}