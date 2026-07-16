"use strict";

const dashboardContent = document.getElementById("dashboardContent");
const userName = document.getElementById("userName");
const logoutButton = document.getElementById("logoutButton");

protectDashboard();

async function protectDashboard() {
    try {
        /*
        getUser() validates the current access token
        with the Supabase Auth server.
        */
        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            redirectToLogin();
            return;
        }

        /*
        Retrieve the logged-in user's profile.

        Your RLS policy should only allow the user
        to retrieve their own profile row.
        */
        const { data: profile, error: profileError } =
            await supabaseClient
                .from("profiles")
                .select("full_name, role, is_active")
                .eq("id", user.id)
                .single();

        if (profileError) {
            console.error("Profile error:", profileError);
            await supabaseClient.auth.signOut();
            redirectToLogin();
            return;
        }

        /*
        Prevent inactive accounts from entering.
        */
        if (!profile.is_active) {
            await supabaseClient.auth.signOut();
            redirectToLogin();
            return;
        }

        userName.textContent = profile.full_name;
        dashboardContent.hidden = false;

    } catch (error) {
        console.error("Authentication check failed:", error);
        redirectToLogin();
    }
}

logoutButton.addEventListener("click", async function () {
    logoutButton.disabled = true;
    logoutButton.textContent = "Logging out...";

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error("Logout error:", error);
        logoutButton.disabled = false;
        logoutButton.textContent = "Logout";
        return;
    }

    redirectToLogin();
});

function redirectToLogin() {
    window.location.replace("index.html");
}