"use strict";

const clientWorkspace = document.getElementById("clientWorkspace");
const loadingMessage = document.getElementById("loadingMessage");

const clientName = document.getElementById("clientName");
const detailFullName = document.getElementById("detailFullName");
const detailDateOfBirth = document.getElementById("detailDateOfBirth");
const detailPhone = document.getElementById("detailPhone");
const detailEmail = document.getElementById("detailEmail");
const detailOccupation = document.getElementById("detailOccupation");

initializeClientPage();

async function initializeClientPage() {
    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        window.location.replace("index.html");
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
                phone,
                email,
                occupation
            `)
            .eq("id", clientId)
            .single();

    if (clientError || !client) {
        console.error("Client load error:", clientError);
        loadingMessage.textContent = "Client could not be loaded.";
        return;
    }

    clientName.textContent = client.full_name;
    detailFullName.textContent = client.full_name;
    detailDateOfBirth.textContent = client.date_of_birth || "Not provided";
    detailPhone.textContent = client.phone || "Not provided";
    detailEmail.textContent = client.email || "Not provided";
    detailOccupation.textContent = client.occupation || "Not provided";

    loadingMessage.hidden = true;
    clientWorkspace.hidden = false;
}

function getClientId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}