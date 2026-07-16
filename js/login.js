"use strict";

/*
========================================
SUPABASE CONFIGURATION
========================================
Replace these two values with the details
from your Supabase project.
*/

const SUPABASE_URL = "https://aciuxuvdasrhfrcauoxt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_MQDB7tXXNjz0QfNdYy3Xbg_pcGohXlW";

/*
Create the Supabase browser client.

The first "supabase" refers to the global library
loaded from the CDN in index.html.
*/

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

/*
========================================
PAGE ELEMENTS
========================================
*/

const loginForm = document.getElementById("loginForm");
const userIdInput = document.getElementById("userid");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginError = document.getElementById("loginError");

/*
========================================
LOGIN FORM
========================================
*/

loginForm.addEventListener("submit", handleLogin);

async function handleLogin(event) {
    // Stop the browser from reloading the page.
    event.preventDefault();

    // Remove spaces before and after the entered email.
    const email = userIdInput.value.trim();

    // Do not trim passwords because spaces may be intentional.
    const password = passwordInput.value;

    clearError();

    if (!email || !password) {
        showError("Please enter your ID and password.");
        return;
    }

    setLoadingState(true);

    try {
        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            showError("The ID or password entered is incorrect.");
            return;
        }

        if (!data.session) {
            showError("Login was unsuccessful. Please try again.");
            return;
        }

        // Login succeeded.
        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Login error:", error);

        showError(
            "Unable to connect right now. Please try again."
        );

    } finally {
        setLoadingState(false);
    }
}

/*
========================================
HELPER FUNCTIONS
========================================
*/

function setLoadingState(isLoading) {
    loginButton.disabled = isLoading;

    if (isLoading) {
        loginButton.innerHTML = `
            Signing in...
            <i class="fa-solid fa-spinner fa-spin"></i>
        `;
    } else {
        loginButton.innerHTML = `
            Login
            <i class="fa-solid fa-arrow-right"></i>
        `;
    }
}

function showError(message) {
    loginError.textContent = message;
}

function clearError() {
    loginError.textContent = "";
}