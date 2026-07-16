"use strict";

/* ========================================
   PAGE ELEMENTS
======================================== */

const pageContent = document.getElementById("pageContent");
const loadingMessage = document.getElementById("loadingMessage");

const addClientForm = document.getElementById("addClientForm");
const saveClientButton = document.getElementById("saveClientButton");
const formMessage = document.getElementById("formMessage");

/* ========================================
   PAGE STATE
======================================== */

let currentUser = null;

/* ========================================
   INITIALIZATION
======================================== */

initializePage();

async function initializePage() {
    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
        window.location.replace("index.html");
        return;
    }

    currentUser = user;

    loadingMessage.hidden = true;
    pageContent.hidden = false;
}

/* ========================================
   EVENT LISTENERS
======================================== */

addClientForm.addEventListener("submit", handleAddClient);

/* ========================================
   ADD CLIENT
======================================== */

async function handleAddClient(event) {
    event.preventDefault();

    clearMessage();
    setLoadingState(true);

    const clientRecord = {
        created_by: currentUser.id,
        full_name: document.getElementById("fullName").value.trim(),

        date_of_birth:
            document.getElementById("dateOfBirth").value || null,

        gender:
            document.getElementById("gender").value || null,

        marital_status:
            document.getElementById("maritalStatus").value || null,

        phone:
            document.getElementById("phone").value.trim() || null,

        email:
            document.getElementById("email").value.trim() || null,

        occupation:
            document.getElementById("occupation").value.trim() || null,

        notes:
            document.getElementById("notes").value.trim() || null
    };

    try {
        const { data, error } = await supabaseClient
            .from("clients")
            .insert(clientRecord)
            .select("id")
            .single();

        if (error) {
            console.error("Client insert error:", error);

            showMessage(
                "The client could not be saved. Please try again.",
                "error"
            );

            return;
        }

        window.location.replace(`client.html?id=${data.id}`);

    } catch (error) {
        console.error("Unexpected client error:", error);

        showMessage(
            "Something went wrong while saving the client.",
            "error"
        );

    } finally {
        setLoadingState(false);
    }
}

/* ========================================
   HELPER FUNCTIONS
======================================== */

function setLoadingState(isLoading) {
    saveClientButton.disabled = isLoading;

    if (isLoading) {
        saveClientButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Saving...
        `;
    } else {
        saveClientButton.innerHTML = `
            <i class="fa-solid fa-floppy-disk"></i>
            Save Client
        `;
    }
}

function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
}

function clearMessage() {
    formMessage.textContent = "";
    formMessage.className = "form-message";
}