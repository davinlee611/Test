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

const clientName =
    document.getElementById("clientName");

const profileForm =
    document.getElementById("profileForm");

const clientInitials =
    document.getElementById("clientInitials");

const birthYear =
    document.getElementById("birthYear");

const birthdayPassed =
    document.getElementById("birthdayPassed");

const gender =
    document.getElementById("gender");

const maritalStatus =
    document.getElementById("maritalStatus");

const displayedInitials =
    document.getElementById("displayedInitials");

const calculatedAge =
    document.getElementById("calculatedAge");

const sidebarItems =
    document.querySelectorAll(".sidebar-item");

const workspaceSections =
    document.querySelectorAll(".workspace-section");

/* ========================================
   PLAN DATA
======================================== */

const clientPlan = {
    profile: {
        initials: "",
        birthYear: null,
        birthdayPassed: false,
        gender: "",
        maritalStatus: ""
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
        console.error(
            "Financial plan page error:",
            error
        );

        loadingMessage.textContent =
            "Something went wrong while opening the planner.";
    }
}

/* ========================================
   PROFILE INPUT
======================================== */

profileForm.addEventListener("input", handleProfileInput);
profileForm.addEventListener("change", handleProfileInput);

function handleProfileInput() {
    clientPlan.profile.initials =
        clientInitials.value.trim().toUpperCase();

    clientPlan.profile.birthYear =
        birthYear.value
            ? Number(birthYear.value)
            : null;

    clientPlan.profile.birthdayPassed =
        birthdayPassed.checked;

    clientPlan.profile.gender =
        gender.value;

    clientPlan.profile.maritalStatus =
        maritalStatus.value;

    updateProfilePreview();
}

function updateProfilePreview() {
    const initials =
        clientPlan.profile.initials || "New Client";

    displayedInitials.textContent = initials;

    clientName.textContent =
        clientPlan.profile.initials
            ? `${clientPlan.profile.initials} Financial Plan`
            : "New Financial Plan";

    calculatedAge.textContent =
        calculateAge(
            clientPlan.profile.birthYear,
            clientPlan.profile.birthdayPassed
        );
}

/* ========================================
   AGE CALCULATION
======================================== */

function calculateAge(year, hasBirthdayPassed) {
    if (!year) {
        return "Not available";
    }

    const currentYear =
        new Date().getFullYear();

    if (year > currentYear || year < 1900) {
        return "Invalid birth year";
    }

    const age =
        currentYear -
        year -
        (hasBirthdayPassed ? 0 : 1);

    return `${age} years old`;
}

/* ========================================
   SIDEBAR NAVIGATION
======================================== */

sidebarItems.forEach(function (item) {
    item.addEventListener("click", function () {
        const selectedSection =
            item.dataset.section;

        sidebarItems.forEach(function (sidebarItem) {
            sidebarItem.classList.remove("active");
        });

        workspaceSections.forEach(function (section) {
            section.classList.remove("active");
        });

        item.classList.add("active");

        const targetSection =
            document.querySelector(
                `[data-content="${selectedSection}"]`
            );

        if (targetSection) {
            targetSection.classList.add("active");
        }
    });
});

/* ========================================
   CLEAR PLAN
======================================== */

clearPlanButton.addEventListener(
    "click",
    clearFinancialPlan
);

function clearFinancialPlan() {
    const shouldClear = window.confirm(
        "Clear all information entered in this financial plan?"
    );

    if (!shouldClear) {
        return;
    }

    profileForm.reset();

    clientPlan.profile.initials = "";
    clientPlan.profile.birthYear = null;
    clientPlan.profile.birthdayPassed = false;
    clientPlan.profile.gender = "";
    clientPlan.profile.maritalStatus = "";

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

logoutButton.addEventListener(
    "click",
    handleLogout
);

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

function redirectToLogin() {
    window.location.replace("index.html");
}