"use strict";
console.log("Updated client.js loaded");

/* ========================================
   PAGE ELEMENTS
======================================== */

const clientWorkspace = document.getElementById("clientWorkspace");
const loadingMessage = document.getElementById("loadingMessage");
const logoutButton = document.getElementById("logoutButton");

const clientName = document.getElementById("clientName");

/* Profile display elements */
const detailsGrid = document.querySelector(".details-grid");

const detailFullName = document.getElementById("detailFullName");
const detailDateOfBirth = document.getElementById("detailDateOfBirth");
const detailGender = document.getElementById("detailGender");
const detailMaritalStatus =
    document.getElementById("detailMaritalStatus");
const detailPhone = document.getElementById("detailPhone");
const detailEmail = document.getElementById("detailEmail");
const detailOccupation = document.getElementById("detailOccupation");
const detailCreatedAt = document.getElementById("detailCreatedAt");

/* Profile editing elements */
const editProfileButton =
    document.getElementById("editProfileButton");

const profileEditForm =
    document.getElementById("profileEditForm");

const cancelProfileButton =
    document.getElementById("cancelProfileButton");

const saveProfileButton =
    document.getElementById("saveProfileButton");

const profileFormMessage =
    document.getElementById("profileFormMessage");

const editFullName =
    document.getElementById("editFullName");

const editDateOfBirth =
    document.getElementById("editDateOfBirth");

const editGender =
    document.getElementById("editGender");

const editMaritalStatus =
    document.getElementById("editMaritalStatus");

const editPhone =
    document.getElementById("editPhone");

const editEmail =
    document.getElementById("editEmail");

const editOccupation =
    document.getElementById("editOccupation");

/* Sidebar elements */
const sidebarItems =
    document.querySelectorAll(".sidebar-item");

const workspaceSections =
    document.querySelectorAll(".workspace-section");

/* ========================================
   PAGE STATE
======================================== */

let currentClient = null;

/* ========================================
   INITIALIZATION
======================================== */

initializeClientPage();

async function initializeClientPage() {
    try {
        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            redirectToLogin();
            return;
        }

        const clientId = getClientId();

        if (!clientId) {
            window.location.replace("clients.html");
            return;
        }

        const { data: client, error: clientError } =
            await supabaseClient
                .from("clients")
                .select(`
                    id,
                    full_name,
                    date_of_birth,
                    gender,
                    marital_status,
                    phone,
                    email,
                    occupation,
                    created_at
                `)
                .eq("id", clientId)
                .single();

        if (clientError || !client) {
            console.error("Client load error:", clientError);

            loadingMessage.textContent =
                "Client could not be loaded.";

            return;
        }

        currentClient = client;
        displayClient(currentClient);

        loadingMessage.hidden = true;
        clientWorkspace.hidden = false;

    } catch (error) {
        console.error("Client page error:", error);

        loadingMessage.textContent =
            "Something went wrong while loading the client.";
    }
}

/* ========================================
   DISPLAY CLIENT
======================================== */

function displayClient(client) {
    clientName.textContent = client.full_name;

    document.title =
        `${client.full_name} | Client Workspace`;

    detailFullName.textContent =
        client.full_name;

    detailDateOfBirth.textContent =
        formatDate(client.date_of_birth);

    detailGender.textContent =
        formatTextValue(client.gender);

    detailMaritalStatus.textContent =
        formatTextValue(client.marital_status);

    detailPhone.textContent =
        client.phone || "Not provided";

    detailEmail.textContent =
        client.email || "Not provided";

    detailOccupation.textContent =
        client.occupation || "Not provided";

    detailCreatedAt.textContent =
        formatDate(client.created_at);
}

/* ========================================
   PROFILE EDITING
======================================== */

if (editProfileButton) {
    editProfileButton.addEventListener(
        "click",
        openProfileEditor
    );
}

if (cancelProfileButton) {
    cancelProfileButton.addEventListener(
        "click",
        closeProfileEditor
    );
}

if (profileEditForm) {
    profileEditForm.addEventListener(
        "submit",
        handleProfileUpdate
    );
}

function openProfileEditor() {
    console.log("Edit Profile clicked");

    if (!currentClient || !profileEditForm || !detailsGrid) {
        return;
    }

    editFullName.value =
        currentClient.full_name || "";

    editDateOfBirth.value =
        currentClient.date_of_birth || "";

    editGender.value =
        currentClient.gender || "";

    editMaritalStatus.value =
        currentClient.marital_status || "";

    editPhone.value =
        currentClient.phone || "";

    editEmail.value =
        currentClient.email || "";

    editOccupation.value =
        currentClient.occupation || "";

    clearProfileMessage();

    detailsGrid.hidden = true;
    profileEditForm.hidden = false;
    editProfileButton.hidden = true;
}

function closeProfileEditor() {
    if (!profileEditForm || !detailsGrid) {
        return;
    }

    profileEditForm.hidden = true;
    detailsGrid.hidden = false;

    if (editProfileButton) {
        editProfileButton.hidden = false;
    }

    clearProfileMessage();
}

async function handleProfileUpdate(event) {
    event.preventDefault();

    if (!currentClient) {
        return;
    }

    const updatedProfile = {
        full_name: editFullName.value.trim(),

        date_of_birth:
            editDateOfBirth.value || null,

        gender:
            editGender.value || null,

        marital_status:
            editMaritalStatus.value || null,

        phone:
            editPhone.value.trim() || null,

        email:
            editEmail.value.trim() || null,

        occupation:
            editOccupation.value.trim() || null,

        updated_at:
            new Date().toISOString()
    };

    if (!updatedProfile.full_name) {
        showProfileMessage(
            "Please enter the client's full name.",
            "error"
        );

        return;
    }

    clearProfileMessage();
    setProfileSavingState(true);

    try {
        const { data, error } = await supabaseClient
            .from("clients")
            .update(updatedProfile)
            .eq("id", currentClient.id)
            .select(`
                id,
                full_name,
                date_of_birth,
                gender,
                marital_status,
                phone,
                email,
                occupation,
                created_at
            `)
            .single();

        if (error) {
            console.error("Profile update error:", error);

            showProfileMessage(
                "The client profile could not be updated.",
                "error"
            );

            return;
        }

        currentClient = data;

        displayClient(currentClient);

        showProfileMessage(
            "Client profile updated successfully.",
            "success"
        );

        setTimeout(function () {
            closeProfileEditor();
        }, 700);

    } catch (error) {
        console.error(
            "Unexpected profile update error:",
            error
        );

        showProfileMessage(
            "Something went wrong while updating the profile.",
            "error"
        );

    } finally {
        setProfileSavingState(false);
    }
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

        const targetSection = document.querySelector(
            `[data-content="${selectedSection}"]`
        );

        if (targetSection) {
            targetSection.classList.add("active");
        }
    });
});

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
   PROFILE HELPERS
======================================== */

function setProfileSavingState(isSaving) {
    if (!saveProfileButton) {
        return;
    }

    saveProfileButton.disabled = isSaving;

    if (isSaving) {
        saveProfileButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Saving...
        `;
    } else {
        saveProfileButton.innerHTML = `
            <i class="fa-solid fa-floppy-disk"></i>
            Save Changes
        `;
    }
}

function showProfileMessage(message, type) {
    if (!profileFormMessage) {
        return;
    }

    profileFormMessage.textContent = message;

    profileFormMessage.className =
        `profile-form-message ${type}`;
}

function clearProfileMessage() {
    if (!profileFormMessage) {
        return;
    }

    profileFormMessage.textContent = "";

    profileFormMessage.className =
        "profile-form-message";
}

/* ========================================
   GENERAL HELPERS
======================================== */

function getClientId() {
    const params =
        new URLSearchParams(window.location.search);

    return params.get("id");
}

function formatDate(value) {
    if (!value) {
        return "Not provided";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not provided";
    }

    return new Intl.DateTimeFormat("en-SG", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}

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