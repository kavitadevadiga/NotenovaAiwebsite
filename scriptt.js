// =====================================================
// NOTENOVA AI - JAVASCRIPT
// =====================================================

const API_URL = "http://127.0.0.1:5000";

// =====================================================
// PAGE ELEMENTS
// =====================================================

const loginPage = document.getElementById("loginPage");
const signupPage = document.getElementById("signupPage");
const dashboardPage = document.getElementById("dashboardPage");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const showSignupBtn = document.getElementById("showSignup");
const showLoginBtn = document.getElementById("showLogin");

const userName = document.getElementById("userName");
const avatar = document.getElementById("avatar");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const logoutBtn = document.getElementById("logoutBtn");

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const navLinks = document.querySelectorAll(".nav-link");

const sections = {
    dashboard: document.getElementById("dashboardSection"),
    notes: document.getElementById("notesSection"),
    favorites: document.getElementById("favoritesSection"),
    settings: document.getElementById("settingsSection")
};

const notesInput = document.getElementById("notesInput");
const summarizeBtn = document.getElementById("summarizeBtn");
const summaryBox = document.getElementById("summaryBox");

const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const uploadSummaryBtn = document.getElementById("uploadSummaryBtn");


// =====================================================
// SHOW LOGIN
// =====================================================

function showLogin() {
    loginPage.classList.remove("hidden");
    signupPage.classList.add("hidden");
    dashboardPage.classList.add("hidden");

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    dashboardPage.classList.remove("sidebar-open");
}


// =====================================================
// SHOW SIGNUP
// =====================================================

function showSignup() {
    loginPage.classList.add("hidden");
    signupPage.classList.remove("hidden");
    dashboardPage.classList.add("hidden");
}


// =====================================================
// SHOW DASHBOARD
// =====================================================

function showDashboard(name) {
    loginPage.classList.add("hidden");
    signupPage.classList.add("hidden");
    dashboardPage.classList.remove("hidden");

    const displayName = name || "User";

    if (userName) {
        userName.textContent = displayName;
    }

    if (avatar) {
        avatar.textContent =
            displayName.charAt(0).toUpperCase();
    }

    // IMPORTANT: Display the Dashboard section after login.
    showSection("dashboard");
}


// =====================================================
// LOGIN / SIGNUP LINKS
// =====================================================

if (showSignupBtn) {
    showSignupBtn.addEventListener("click", function(event) {
        event.preventDefault();
        showSignup();
    });
}

if (showLoginBtn) {
    showLoginBtn.addEventListener("click", function(event) {
        event.preventDefault();
        showLogin();
    });
}


// =====================================================
// REGISTER ACCOUNT
// =====================================================

if (signupForm) {
    signupForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const name =
            document.getElementById("signupName").value.trim();

        const email =
            document.getElementById("signupEmail").value.trim();

        const password =
            document.getElementById("signupPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (!name || !email || !password || !confirmPassword) {
            alert("Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        const submitButton =
            signupForm.querySelector('button[type="submit"]');

        submitButton.disabled = true;

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                alert(data.message || "Account creation failed.");
                return;
            }

            alert("Account created successfully!");

            showDashboard(name);

        } catch (error) {
            console.error("Register Error:", error);
            alert("Cannot connect to Flask backend.");
        } finally {
            submitButton.disabled = false;
        }
    });
}


// =====================================================
// LOGIN
// =====================================================

if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        if (!email || !password) {
            alert("Please enter email and password.");
            return;
        }

        const submitButton =
            loginForm.querySelector('button[type="submit"]');

        submitButton.disabled = true;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                alert(data.message || "Invalid email or password.");
                return;
            }

            const name =
                (data.user && data.user.name) ||
                data.name ||
                "User";

            showDashboard(name);

        } catch (error) {
            console.error("Login Error:", error);
            alert("Cannot connect to Flask backend.");
        } finally {
            submitButton.disabled = false;
        }
    });
}


// =====================================================
// SIDEBAR MENU
// FIXED: Uses .open, matching your existing CSS
// =====================================================

if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", function() {
        sidebar.classList.toggle("open");

        dashboardPage.classList.toggle(
            "sidebar-open",
            sidebar.classList.contains("open")
        );
    });
}


// =====================================================
// DASHBOARD NAVIGATION
// =====================================================

const sectionInfo = {
    dashboard: {
        title: "Dashboard",
        subtitle: "Welcome back to NoteNova AI 👋"
    },
    notes: {
        title: "My Notes",
        subtitle: "View and manage your notes."
    },
    favorites: {
        title: "Favorites",
        subtitle: "Your favorite notes and summaries."
    },
    settings: {
        title: "Settings",
        subtitle: "Manage your NoteNova AI preferences."
    }
};

function showSection(sectionName) {
    if (!sections[sectionName]) {
        console.error("Section not found:", sectionName);
        return;
    }

    // Hide all sections.
    Object.values(sections).forEach(function(section) {
        if (section) {
            section.style.display = "none";
        }
    });

    // Show the selected section.
    sections[sectionName].style.display = "block";

    // Highlight the selected navigation link.
    navLinks.forEach(function(link) {
        link.classList.toggle(
            "active",
            link.dataset.section === sectionName
        );
    });

    // Update page heading and subtitle.
    if (pageTitle && pageSubtitle) {
        pageTitle.textContent = sectionInfo[sectionName].title;
        pageSubtitle.textContent = sectionInfo[sectionName].subtitle;
    }

    // Close sidebar on smaller screens after selecting a section.
    if (window.innerWidth <= 768 && sidebar) {
        sidebar.classList.remove("open");
        dashboardPage.classList.remove("sidebar-open");
    }
}

navLinks.forEach(function(link) {
    link.addEventListener("click", function(event) {
        event.preventDefault();
        showSection(link.dataset.section);
    });
});


// =====================================================
// SHOW GENERATED SUMMARY SAFELY
// =====================================================

function displaySummary(summary, title) {
    if (!summaryBox || summary == null || summary === "") {
        alert("No summary was returned.");
        return;
    }

    summaryBox.replaceChildren();

    const card = document.createElement("div");
    card.className = "generated-summary";

    const heading = document.createElement("h3");
    heading.textContent = title;

    const paragraph = document.createElement("p");
    paragraph.style.whiteSpace = "pre-wrap";
    paragraph.textContent = String(summary);

    card.appendChild(heading);
    card.appendChild(paragraph);
    summaryBox.appendChild(card);
}


// =====================================================
// SUMMARIZE PASTED NOTES
// =====================================================

if (summarizeBtn) {
    summarizeBtn.addEventListener("click", async function(event) {
        event.preventDefault();

        const notes = notesInput.value.trim();

        if (!notes) {
            alert("Please enter your notes first.");
            return;
        }

        summarizeBtn.disabled = true;
        summarizeBtn.textContent = "Generating Summary...";

        summaryBox.textContent = "Please wait while your notes are summarized...";

        try {
            const response = await fetch(`${API_URL}/summarize`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    notes: notes
                })
            });

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(
                    data.message || "Summary generation failed."
                );
            }

            const summary =
                data.summary ||
                data.short_summary ||
                data.detailed_summary ||
                data.result;

            if (!summary) {
                throw new Error("The server did not return a summary.");
            }

            displaySummary(summary, "✨ Your Summary");

        } catch (error) {
            console.error("Summary Error:", error);
            summaryBox.textContent = error.message;
        } finally {
            summarizeBtn.disabled = false;
            summarizeBtn.textContent = "✨ Generate Summary";
        }
    });
}


// =====================================================
// FILE SELECTION
// =====================================================

if (fileInput) {
    fileInput.addEventListener("change", function() {
        if (fileInput.files.length > 0) {
            fileName.textContent = fileInput.files[0].name;
        } else {
            fileName.textContent = "No file selected";
        }
    });
}


// =====================================================
// SUMMARIZE UPLOADED DOCUMENT
// =====================================================

async function summarizeUploadedFile() {
    if (!fileInput || !fileInput.files.length) {
        alert("Please choose a document first!");
        return;
    }

    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append("file", file);

    uploadSummaryBtn.disabled = true;
    uploadSummaryBtn.textContent = "Generating Summary...";

    summaryBox.textContent = "Reading your document...";

    try {
        const response = await fetch(`${API_URL}/summarize-file`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
            throw new Error(
                data.message || "Unable to summarize this document."
            );
        }

        const summary =
            data.summary ||
            data.short_summary ||
            data.detailed_summary ||
            data.result;

        if (!summary) {
            throw new Error("The server did not return a summary.");
        }

        displaySummary(summary, "📄 " + file.name);

    } catch (error) {
        console.error("Document Upload Error:", error);
        summaryBox.textContent = error.message;
    } finally {
        uploadSummaryBtn.disabled = false;
        uploadSummaryBtn.textContent = "✨ Generate Summary";
    }
}


// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {
    logoutBtn.addEventListener("click", function() {
        if (confirm("Are you sure you want to logout?")) {
            loginForm.reset();
            signupForm.reset();

            notesInput.value = "";
            fileInput.value = "";
            fileName.textContent = "No file selected";

            showLogin();
        }
    });
}


// =====================================================
// INITIAL PAGE
// =====================================================

showLogin();