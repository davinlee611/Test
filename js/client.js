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

const assetCategoryCards =
    document.querySelectorAll(".asset-category-card");

const liquidAssetsModal =
    document.getElementById("liquidAssetsModal");

const liquidAssetsForm =
    document.getElementById("liquidAssetsForm");

const liquidAssetsBalance =
    document.getElementById("liquidAssetsBalance");

const liquidAssetsFormMessage =
    document.getElementById("liquidAssetsFormMessage");

const closeLiquidAssetsModalButton =
    document.getElementById("closeLiquidAssetsModalButton");

const cancelLiquidAssetsButton =
    document.getElementById("cancelLiquidAssetsButton");

const liquidAssetsSummary =
    document.getElementById(
        "liquidAssetsSummary"
    );

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
        balance: 0
    },

    investments: {
        value: 0
    },

    income: {
        monthly: 0
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
   ASSET CATEGORY SELECTION
======================================== */

assetCategoryCards.forEach(function (card) {
    card.addEventListener("click", function () {
        const assetType = card.dataset.assetType;

        if (assetType === "liquidAssets") {
            openLiquidAssetsModal();
        }
    });
});

/* ========================================
   LIQUID ASSETS
======================================== */

function openLiquidAssetsModal() {
    liquidAssetsBalance.value =
        clientPlan.priorities.assets.liquidAssets.balance || "";

    liquidAssetsFormMessage.textContent = "";
    liquidAssetsModal.hidden = false;

    setTimeout(function () {
        liquidAssetsBalance.focus();
    }, 0);
}

function closeLiquidAssetsModal() {
    liquidAssetsModal.hidden = true;
    liquidAssetsFormMessage.textContent = "";
}

if (closeLiquidAssetsModalButton) {
    closeLiquidAssetsModalButton.addEventListener(
        "click",
        closeLiquidAssetsModal
    );
}

if (cancelLiquidAssetsButton) {
    cancelLiquidAssetsButton.addEventListener(
        "click",
        closeLiquidAssetsModal
    );
}

if (liquidAssetsModal) {
    liquidAssetsModal.addEventListener("click", function (event) {
        if (event.target === liquidAssetsModal) {
            closeLiquidAssetsModal();
        }
    });
}

if (liquidAssetsForm) {
    liquidAssetsForm.addEventListener(
        "submit",
        handleLiquidAssetsSubmit
    );
}

function handleLiquidAssetsSubmit(event) {
    event.preventDefault();

    const balance = Math.round(
    Number(liquidAssetsBalance.value)
);

    if (
        !Number.isFinite(balance) ||
        balance < 0
    ) {
        liquidAssetsFormMessage.textContent =
            "Please enter a valid amount.";

        liquidAssetsBalance.focus();
        return;
    }

    clientPlan.priorities.assets.liquidAssets.balance =
        balance;
        updateLiquidAssetsSummary();

    console.log(
        "Liquid assets saved:",
        clientPlan.priorities.assets.liquidAssets
    );

    closeLiquidAssetsModal();
}

function updateLiquidAssetsSummary() {

    const balance =
        clientPlan.priorities.assets
            .liquidAssets.balance;

    if (balance <= 0) {

        liquidAssetsSummary.textContent =
            "No balance entered.";

        liquidAssetsSummary.classList.remove(
            "has-value"
        );

        return;
    }

    liquidAssetsSummary.textContent =
        formatCurrency(balance);

    liquidAssetsSummary.classList.add(
        "has-value"
    );
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
    clientPlan.priorities.assets.liquidAssets.balance = 0;
    updateLiquidAssetsSummary();
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

function getTodayDate() {
    const today = new Date();

    return today.toISOString().split("T")[0];
}

function formatCurrency(value) {

    return "$" +
        Number(value).toLocaleString(
            "en-SG",
            {
                maximumFractionDigits: 0
            }
        );

}