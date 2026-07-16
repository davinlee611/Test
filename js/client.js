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
        goals: [],
        assets: [],
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

        loadingMessage.hidden = true;
        clientWorkspace.hidden = false;

        updateClientHeading();

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
   SIDEBAR NAVIGATION
======================================== */

sidebarItems.forEach(function (item) {
    item.addEventListener("click", function () {
        openSection(item.dataset.section);
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

    clientPlan.priorities.goals = [];
    clientPlan.priorities.assets = [];
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