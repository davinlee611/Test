"use strict";

const dashboardContent = document.getElementById("dashboardContent");
const loadingMessage = document.getElementById("loadingMessage");
const userName = document.getElementById("userName");
const logoutButton = document.getElementById("logoutButton");

protectDashboard();

async function protectDashboard() {
    try {
        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser();

        console.log("Authenticated user:", user);

        if (userError || !user) {
            window.location.replace("index.html");
            return;
        }

        const { data: profile, error: profileError } =
            await supabaseClient
                .from("profiles")
                .select("full_name, role, is_active")
                .eq("id", user.id)
                .single();

        console.log("Profile result:", profile);
        console.log("Profile error:", profileError);

        if (profileError) {
            loadingMessage.textContent =
                "Your account is logged in, but the profile could not be loaded.";

            console.error(profileError);
            return;
        }

        if (!profile.is_active) {
            await supabaseClient.auth.signOut();
            window.location.replace("index.html");
            return;
        }

        userName.textContent = profile.full_name;

        loadingMessage.hidden = true;
        dashboardContent.hidden = false;

    } catch (error) {
        console.error("Dashboard error:", error);

        loadingMessage.textContent =
            "Something went wrong while loading the dashboard.";
    }
}

logoutButton.addEventListener("click", async function () {
    await supabaseClient.auth.signOut();
    window.location.replace("index.html");
});