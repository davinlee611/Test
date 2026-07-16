"use strict";

/* ========================================
   PAGE ELEMENTS
======================================== */

const clientWorkspace = document.getElementById("clientWorkspace");
const loadingMessage = document.getElementById("loadingMessage");
const logoutButton = document.getElementById("logoutButton");

const clientName = document.getElementById("clientName");

const detailFullName = document.getElementById("detailFullName");
const detailDateOfBirth = document.getElementById("detailDateOfBirth");
const detailGender = document.getElementById("detailGender");
const detailMaritalStatus =
    document.getElementById("detailMaritalStatus");

const detailPhone = document.getElementById("detailPhone");
const detailEmail = document.getElementById("detailEmail");
const detailOccupation = document.getElementById("detailOccupation");
const detailCreatedAt = document.getElementById("detailCreatedAt");

const sidebarItems = document.querySelectorAll(".sidebar-item");
const workspaceSections =
    document.querySelectorAll(".workspace-section");

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
            loadingMessage.textContent =
                "No client was selected.";

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
            console.error(
                "Client load error:",
                clientError
            );

            loadingMessage.textContent =
                "The client could not be loaded.";

            return;
        }

        displayClient(client);

        loadingMessage.hidden = true;
        clientWorkspace.hidden = false;

    } catch (error) {
        console.error(
            "Unexpected client page error:",
            error
        );

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

logoutButton.addEventListener("click", async function () {
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
});

/* ========================================
   HELPER FUNCTIONS
======================================== */

function getClientId() {
    const queryParameters =
        new URLSearchParams(window.location.search);

    return queryParameters.get("id");
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