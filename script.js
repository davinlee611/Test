document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const userid = document.getElementById("userid").value;
    const password = document.getElementById("password").value;

    console.log("User:", userid);
    console.log("Password:", password);

    // Later we'll connect this to Supabase
});
