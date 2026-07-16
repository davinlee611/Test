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

const smokingStatusInput =
    document.getElementById("smokingStatus");

const dependantsInput =
    document.getElementById("dependants");

const phoneInput =
    document.getElementById("phone");

const emailInput =
    document.getElementById("email");

/* Profile summary */
const profilePreviewName =
    document.getElementById("profilePreviewName");

const profilePreviewAge =
    document.getElementById("profilePreviewAge");

const profilePreviewOccupation =
    document.getElementById("profilePreviewOccupation");

const profilePreviewMaritalStatus =
    document.getElementById("profilePreviewMaritalStatus");

const profilePreviewDependants =
    document.getElementById("profilePreviewDependants");

/* Sidebar */
const sidebarItems =
    document.querySelectorAll(".sidebar-item");

const workspaceSections =
    document.querySelectorAll(".workspace-section");

/* ========================================
   PLAN DATA
======================================== */

const clientPlan = {
    profile: {
        fullName: "",
        dateOfBirth: "",
        gender: "",
        maritalStatus: "",
        occupation: "",
        employmentStatus: "",
        smokingStatus: "",
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

        updateProfilePreview();

    } catch (error) {
        console.error("Planner page error:", error);

        loadingMessage.textContent =
            "Something went wrong while opening the planner.";
    }
}

/* ========================================
   PROFILE FORM
======================================== */

if (profileForm) {
    profileForm.addEventListener("input", handleProfileInput);
    profileForm.addEventListener("change", handleProfileInput);
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

    clientPlan.profile.smokingStatus =
        smokingStatusInput.value;

    clientPlan.profile.dependants =
        dependantsInput.value
            ? Number(dependantsInput.value)
            : 0;

    clientPlan.profile.phone =
        phoneInput.value.trim();

    clientPlan.profile.email =
        emailInput.value.trim();

    updateProfilePreview();
}

function updateProfilePreview() {
    const profile = clientPlan.profile;

    const displayedName =
        profile.fullName || "New Client";

    profilePreviewName.textContent = displayedName;

    clientHeading.textContent =
        profile.fullName
            ? `${profile.fullName}'s Financial Plan`
            : "New Financial Plan";

    profilePreviewAge.textContent =
        calculateAge(profile.dateOfBirth);

    profilePreviewOccupation.textContent =
        profile.occupation || "Not provided";

    profilePreviewMaritalStatus.textContent =
        formatTextValue(profile.maritalStatus);

    profilePreviewDependants.textContent =
        String(profile.dependants);
}

/* ========================================
   AGE CALCULATION
======================================== */

function calculateAge(dateOfBirth) {
    if (!dateOfBirth) {
        return "Not available";
    }

    const birthDate =
        new Date(`${dateOfBirth}T00:00:00`);

    if (Number.isNaN(birthDate.getTime())) {
        return "Invalid date";
    }

    const today = new Date();

    let age =
        today.getFullYear() -
        birthDate.getFullYear();

    const birthdayHasNotPassed =
        today.getMonth() < birthDate.getMonth() ||
        (
            today.getMonth() === birthDate.getMonth() &&
            today.getDate() < birthDate.getDate()
        );

    if (birthdayHasNotPassed) {
        age -= 1;
    }

    if (age < 0) {
        return "Invalid date";
    }

    return `${age} years old`;
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
    clientPlan.profile.smokingStatus = "";
    clientPlan.profile.dependants = 0;
    clientPlan.profile.phone = "";
    clientPlan.profile.email = "";

    clientPlan.priorities.goals = [];
    clientPlan.priorities.assets = [];
    clientPlan.priorities.liabilities = [];

    clientPlan.costOfWants = {};
    clientPlan.protection = {};
    clientPlan.summary = {};

    updateProfilePreview();
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

function formatTextValue(value) {
    if (!value) {
        return "Not provided";
    }

    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, function (character) {
            return character.toUpperCase();
        });
}

function redirectToLogin() {
    window.location.replace("index.html");
}