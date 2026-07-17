"use strict";

/* ========================================
   PAGE ELEMENTS
======================================== */

const clientWorkspace =
    document.getElementById("clientWorkspace");

const loadingMessage =
    document.getElementById("loadingMessage");

const logoutButton =
    document.getElementById("logoutButton");

const clearPlanButton =
    document.getElementById("clearPlanButton");

const clientHeading =
    document.getElementById("clientName");

const profileForm =
    document.getElementById("profileForm");

const clientNameInput =
    document.getElementById("clientNameInput");

const dateOfBirthInput =
    document.getElementById("dateOfBirth");

const genderInput =
    document.getElementById("gender");

const maritalStatusInput =
    document.getElementById("maritalStatus");

const occupationInput =
    document.getElementById("occupation");

const employmentStatusInput =
    document.getElementById("employmentStatus");

const dependantsInput =
    document.getElementById("dependants");

const phoneInput =
    document.getElementById("phone");

const emailInput =
    document.getElementById("email");

const sidebarItems =
    document.querySelectorAll(".sidebar-item");

const workspaceSections =
    document.querySelectorAll(".workspace-section");

const profileFormMessage =
    document.getElementById("profileFormMessage");

const profileNextButton =
    document.getElementById("profileNextButton");

const prioritiesBackButton =
    document.getElementById("prioritiesBackButton");

const prioritiesNextButton =
    document.getElementById("prioritiesNextButton");

const wealthPreferenceCards =
    document.querySelectorAll(".wealth-preference-card");

/* ========================================
   IN-MEMORY PLAN DATA
======================================== */

const clientPlan = {
    profile: {
        fullName: "",
        dateOfBirth: "",
        gender: "",
        maritalStatus: "",
        occupation: "",
        employmentStatus: "",
        dependants: 0,
        phone: "",
        email: ""
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
        others: 0
    },

    income: {
        monthlyEmployment: 0,
        annualBonus: 0,
        otherMonthly: 0
    },

    cpf: {
        oa: 0,
        sa: 0,
        ma: 0,
        ra: 0
    },

    properties: []
},

    liabilities: []
},

    costOfWants: {},
    protection: {},
    summary: {}
};

/* ========================================
   INITIALIZATION
======================================== */

initializePage();

async function initializePage() {
    try {
        const {
            data: { user },
            error
        } = await supabaseClient.auth.getUser();

        if (error || !user) {
            redirectToLogin();
            return;
        }

        // Prevent future birth dates
        dateOfBirthInput.max = getTodayDate();

        loadingMessage.hidden = true;
clientWorkspace.hidden = false;

updateClientHeading();
updateCpfFields();
updateAssetsAndIncomeTotals();

    } catch (error) {
        console.error(
            "Financial planner error:",
            error
        );

        loadingMessage.textContent =
            "Something went wrong while opening the planner.";
    }
}

/* ========================================
   PROFILE FORM
======================================== */

if (profileForm) {
    profileForm.addEventListener(
        "input",
        handleProfileInput
    );

    profileForm.addEventListener(
        "change",
        handleProfileInput
    );

    profileForm.addEventListener(
        "submit",
        handleProfileSubmit
    );
}

function handleProfileInput() {

    clearProfileMessage();

    clientPlan.profile.fullName =
        clientNameInput.value.trim();

    clientPlan.profile.dateOfBirth =
        dateOfBirthInput.value;

    clientPlan.profile.gender =
        genderInput.value;

    clientPlan.profile.maritalStatus =
        maritalStatusInput.value;

    clientPlan.profile.occupation =
        occupationInput.value.trim();

    clientPlan.profile.employmentStatus =
        employmentStatusInput.value;

    clientPlan.profile.dependants =
        dependantsInput.value
            ? Number(dependantsInput.value)
            : 0;

    clientPlan.profile.phone =
        phoneInput.value.trim();

    clientPlan.profile.email =
        emailInput.value.trim();

    updateClientHeading();
    updateProfileDependentSections();
}

function handleProfileSubmit(event) {
    event.preventDefault();

    clearProfileMessage();

    handleProfileInput();

    const emailValue =
        clientPlan.profile.email;

    if (
        emailValue &&
        !isValidEmail(emailValue)
    ) {
        showProfileMessage(
            "Please enter a valid email address."
        );

        emailInput.focus();
        return;
    }

    if (!clientPlan.profile.fullName) {
        showProfileMessage(
            "Please enter the client's full name."
        );

        clientNameInput.focus();
        return;
    }

    if (!clientPlan.profile.dateOfBirth) {
        showProfileMessage(
            "Please enter the client's date of birth."
        );

        dateOfBirthInput.focus();
        return;
    }

    const selectedDate =
    new Date(clientPlan.profile.dateOfBirth);

const today = new Date();

selectedDate.setHours(0, 0, 0, 0);
today.setHours(0, 0, 0, 0);

if (selectedDate > today) {
    showProfileMessage(
        "Date of birth cannot be in the future."
    );

    dateOfBirthInput.focus();
    return;
}

    if (!clientPlan.profile.gender) {
    showProfileMessage(
        "Please select the client's gender."
    );

    genderInput.focus();
    return;
}

if (!clientPlan.profile.maritalStatus) {
    showProfileMessage(
        "Please select the client's marital status."
    );

    maritalStatusInput.focus();
    return;
}

if (!clientPlan.profile.occupation) {
    showProfileMessage(
        "Please enter the client's occupation."
    );

    occupationInput.focus();
    return;
}

if (!clientPlan.profile.employmentStatus) {
    showProfileMessage(
        "Please select the client's employment status."
    );

    employmentStatusInput.focus();
    return;
}

    openSection("priorities");
}

function updateClientHeading() {
    clientHeading.textContent =
        clientPlan.profile.fullName
            ? `${clientPlan.profile.fullName}'s Financial Plan`
            : "New Financial Plan";

    document.title =
        clientPlan.profile.fullName
            ? `${clientPlan.profile.fullName} | Financial Plan`
            : "New Financial Plan";
}

/* ========================================
   FOUR TYPES OF WEALTH
======================================== */

wealthPreferenceCards.forEach(function (card) {
    card.addEventListener("click", function () {
        const wealthType = card.dataset.wealthType;

        if (!wealthType) {
            return;
        }

        const isSelected =
            card.classList.toggle("selected");

        card.setAttribute(
            "aria-pressed",
            String(isSelected)
        );

        if (isSelected) {
            const isAlreadySelected =
                clientPlan.priorities.selectedWealthTypes.includes(
                    wealthType
                );

            if (!isAlreadySelected) {
                clientPlan.priorities.selectedWealthTypes.push(
                    wealthType
                );
            }
        } else {
            clientPlan.priorities.selectedWealthTypes =
                clientPlan.priorities.selectedWealthTypes.filter(
                    function (selectedType) {
                        return selectedType !== wealthType;
                    }
                );
        }

        console.log(
            "Selected wealth types:",
            clientPlan.priorities.selectedWealthTypes
        );
    });
});

/* ========================================
   ASSETS AND INCOME ELEMENTS
======================================== */

const cashInBankInput =
    document.getElementById("cashInBank");

const fixedDepositsInput =
    document.getElementById("fixedDeposits");

const tBillsInput =
    document.getElementById("tBills");

const investmentsInput =
    document.getElementById("investments");

const otherLiquidAssetsInput =
    document.getElementById("otherLiquidAssets");

const totalLiquidAssetsElement =
    document.getElementById("totalLiquidAssets");

const monthlyEmploymentIncomeInput =
    document.getElementById("monthlyEmploymentIncome");

const annualBonusInput =
    document.getElementById("annualBonus");

const otherMonthlyIncomeInput =
    document.getElementById("otherMonthlyIncome");

const totalMonthlyIncomeElement =
    document.getElementById("totalMonthlyIncome");

const cpfOaInput =
    document.getElementById("cpfOa");

const cpfSaInput =
    document.getElementById("cpfSa");

const cpfMaInput =
    document.getElementById("cpfMa");

const cpfRaInput =
    document.getElementById("cpfRa");

const cpfSaGroup =
    document.getElementById("cpfSaGroup");

const cpfRaGroup =
    document.getElementById("cpfRaGroup");

const totalCpfElement =
    document.getElementById("totalCpf");

const addPropertyButton =
    document.getElementById("addPropertyButton");

const propertyList =
    document.getElementById("propertyList");

const emptyPropertyMessage =
    document.getElementById("emptyPropertyMessage");

const totalPropertyValueElement =
    document.getElementById("totalPropertyValue");

/* ========================================
   ASSETS AND INCOME INPUTS
======================================== */

const financialInputs = [
    cashInBankInput,
    fixedDepositsInput,
    tBillsInput,
    investmentsInput,
    otherLiquidAssetsInput,
    monthlyEmploymentIncomeInput,
    annualBonusInput,
    otherMonthlyIncomeInput,
    cpfOaInput,
    cpfSaInput,
    cpfMaInput,
    cpfRaInput
];

financialInputs.forEach(function (input) {
    if (!input) {
        return;
    }

    input.addEventListener("input", handleFinancialInput);
});

if (addPropertyButton) {
    addPropertyButton.addEventListener(
        "click",
        function () {
            console.log("Add Property clicked");
        }
    );
}

function handleFinancialInput() {
    updateAssetsAndIncomeData();
    updateAssetsAndIncomeTotals();
}

function updateAssetsAndIncomeData() {
    const assets =
        clientPlan.priorities.assets;

    assets.liquidAssets.cashInBank =
        getInputWholeNumber(cashInBankInput);

    assets.liquidAssets.fixedDeposits =
        getInputWholeNumber(fixedDepositsInput);

    assets.liquidAssets.tBills =
        getInputWholeNumber(tBillsInput);

    assets.liquidAssets.investments =
        getInputWholeNumber(investmentsInput);

    assets.liquidAssets.others =
        getInputWholeNumber(otherLiquidAssetsInput);

    assets.income.monthlyEmployment =
        getInputWholeNumber(
            monthlyEmploymentIncomeInput
        );

    assets.income.annualBonus =
        getInputWholeNumber(annualBonusInput);

    assets.income.otherMonthly =
        getInputWholeNumber(otherMonthlyIncomeInput);

    assets.cpf.oa =
        getInputWholeNumber(cpfOaInput);

    assets.cpf.sa =
        getInputWholeNumber(cpfSaInput);

    assets.cpf.ma =
        getInputWholeNumber(cpfMaInput);

    assets.cpf.ra =
        getInputWholeNumber(cpfRaInput);
}

function updateAssetsAndIncomeTotals() {
    const assets =
        clientPlan.priorities.assets;

    const totalLiquidAssets =
        assets.liquidAssets.cashInBank +
        assets.liquidAssets.fixedDeposits +
        assets.liquidAssets.tBills +
        assets.liquidAssets.investments +
        assets.liquidAssets.others;

    const equivalentMonthlyIncome =
        assets.income.monthlyEmployment +
        assets.income.otherMonthly +
        Math.round(
            assets.income.annualBonus / 12
        );

    const totalCpf =
        assets.cpf.oa +
        assets.cpf.sa +
        assets.cpf.ma +
        assets.cpf.ra;

    const totalPropertyValue =
        assets.properties.reduce(
            function (total, property) {
                return total +
                    getWholeNumber(property.value);
            },
            0
        );

    if (totalLiquidAssetsElement) {
    totalLiquidAssetsElement.textContent =
        formatCurrency(totalLiquidAssets);
}

if (totalMonthlyIncomeElement) {
    totalMonthlyIncomeElement.textContent =
        formatCurrency(equivalentMonthlyIncome);
}

if (totalCpfElement) {
    totalCpfElement.textContent =
        formatCurrency(totalCpf);
}

if (totalPropertyValueElement) {
    totalPropertyValueElement.textContent =
        formatCurrency(totalPropertyValue);
}
}

/* ========================================
   SIDEBAR NAVIGATION
======================================== */

sidebarItems.forEach(function (item) {
    item.addEventListener("click", function () {

        const section =
            item.dataset.section;

        // Client Profile is always accessible
        if (section === "profile") {
            openSection(section);
            return;
        }

        // Other sections require a completed profile
        if (!isProfileComplete()) {

            showProfileMessage(
                "Complete the Client Profile before continuing."
            );

            openSection("profile");

            return;
        }

        openSection(section);

    });
});

function openSection(sectionName) {
    sidebarItems.forEach(function (item) {
        item.classList.toggle(
            "active",
            item.dataset.section === sectionName
        );
    });

    workspaceSections.forEach(function (section) {
        section.classList.toggle(
            "active",
            section.dataset.content === sectionName
        );
    });
}

/* ========================================
   PRIORITIES NAVIGATION
======================================== */

if (prioritiesBackButton) {
    prioritiesBackButton.addEventListener(
        "click",
        function () {
            openSection("profile");
        }
    );
}

if (prioritiesNextButton) {
    prioritiesNextButton.addEventListener(
        "click",
        function () {
            openSection("cost");
        }
    );
}

/* ========================================
   CLEAR PLAN
======================================== */

if (clearPlanButton) {
    clearPlanButton.addEventListener(
        "click",
        clearFinancialPlan
    );
}

function clearFinancialPlan() {
    const shouldClear = window.confirm(
        "Clear all information entered in this financial plan?"
    );

    if (!shouldClear) {
        return;
    }

    profileForm.reset();

    clientPlan.profile.fullName = "";
    clientPlan.profile.dateOfBirth = "";
    clientPlan.profile.gender = "";
    clientPlan.profile.maritalStatus = "";
    clientPlan.profile.occupation = "";
    clientPlan.profile.employmentStatus = "";
    clientPlan.profile.dependants = 0;
    clientPlan.profile.phone = "";
    clientPlan.profile.email = "";

    clientPlan.priorities.selectedWealthTypes = [];

    wealthPreferenceCards.forEach(function (card) {
        card.classList.remove("selected");
        card.setAttribute("aria-pressed", "false");
    });

    clientPlan.priorities.goals = [];

    clientPlan.priorities.assets.liquidAssets = {
    cashInBank: 0,
    fixedDeposits: 0,
    tBills: 0,
    investments: 0,
    others: 0
};

clientPlan.priorities.assets.income = {
    monthlyEmployment: 0,
    annualBonus: 0,
    otherMonthly: 0
};

clientPlan.priorities.assets.cpf = {
    oa: 0,
    sa: 0,
    ma: 0,
    ra: 0
};

clientPlan.priorities.assets.properties = [];
financialInputs.forEach(function (input) {
    if (input) {
        input.value = "";
    }
});

updateAssetsAndIncomeTotals();

    clientPlan.priorities.liabilities = [];
    clientPlan.costOfWants = {};
    clientPlan.protection = {};
    clientPlan.summary = {};

    updateClientHeading();
    openSection("profile");
}

/* ========================================
   LOGOUT
======================================== */

if (logoutButton) {
    logoutButton.addEventListener(
        "click",
        handleLogout
    );
}

async function handleLogout() {
    logoutButton.disabled = true;

    logoutButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Logging out...
    `;

    const { error } =
        await supabaseClient.auth.signOut();

    if (error) {
        console.error("Logout error:", error);

        logoutButton.disabled = false;

        logoutButton.innerHTML = `
            <i class="fa-solid fa-right-from-bracket"></i>
            Logout
        `;

        return;
    }

    redirectToLogin();
}



/* ========================================
   HELPERS
======================================== */

function isProfileComplete() {
    const profile = clientPlan.profile;

    return Boolean(
        profile.fullName &&
        profile.dateOfBirth &&
        profile.gender &&
        profile.maritalStatus &&
        profile.occupation &&
        profile.employmentStatus
    );
}

function updateProfileDependentSections() {
    updateCpfFields();

    /*
        Later, add other profile-dependent updates here:

        updateProtectionAnalysis();
        updateCostOfWants();
        updateSummaryReport();
    */
}

function getClientAge() {
    const dateOfBirth =
        clientPlan.profile.dateOfBirth;

    if (!dateOfBirth) {
        return null;
    }

    const today = new Date();

    const [
        birthYear,
        birthMonth,
        birthDay
    ] = dateOfBirth
        .split("-")
        .map(Number);

    let age =
        today.getFullYear() - birthYear;

    const hasHadBirthdayThisYear =
        today.getMonth() + 1 > birthMonth ||
        (
            today.getMonth() + 1 === birthMonth &&
            today.getDate() >= birthDay
        );

    if (!hasHadBirthdayThisYear) {
        age--;
    }

    return age;
}

function updateCpfFields() {
    if (
        !cpfSaGroup ||
        !cpfRaGroup ||
        !cpfSaInput ||
        !cpfRaInput
    ) {
        return;
    }

    const age = getClientAge();
    const cpf = clientPlan.priorities.assets.cpf;

    if (age === null || age < 55) {
        cpfSaGroup.hidden = false;
        cpfRaGroup.hidden = true;

        cpfRaInput.value = "";
        cpf.ra = 0;
    } else {
        cpfSaGroup.hidden = true;
        cpfRaGroup.hidden = false;

        cpfSaInput.value = "";
        cpf.sa = 0;
    }

    updateAssetsAndIncomeTotals();
}

function redirectToLogin() {
    window.location.replace("index.html");
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showProfileMessage(message) {
    profileFormMessage.textContent = message;
}

function clearProfileMessage() {
    profileFormMessage.textContent = "";
}

function getTodayDate() {
    const today = new Date();

    return today.toISOString().split("T")[0];
}

function getWholeNumber(value) {
    const number = Number(value);

    if (
        !Number.isFinite(number) ||
        number < 0
    ) {
        return 0;
    }

    return Math.trunc(number);
}

function getInputWholeNumber(inputElement) {
    if (!inputElement) {
        return 0;
    }

    return getWholeNumber(inputElement.value);
}

function formatCurrency(value) {
    return "$" +
        getWholeNumber(value).toLocaleString(
            "en-SG",
            {
                maximumFractionDigits: 0
            }
        );
}