document.addEventListener("DOMContentLoaded", () => {
    
    // Elements
    const loginPanel = document.getElementById("login-panel");
    const dashboardPanel = document.getElementById("dashboard-panel");
    const loginForm = document.getElementById("login-form");
    const loginStatusBox = document.getElementById("login-status-box");
    const adminUserDisplay = document.getElementById("admin-user-display");
    const btnLogout = document.getElementById("btn-logout");

    // Stats elements
    const statProjectsCount = document.getElementById("stat-projects-count");
    const statMessagesCount = document.getElementById("stat-messages-count");
    const statSkillsCount = document.getElementById("stat-skills-count");

    // Lists elements
    const adminProjectsList = document.getElementById("admin-projects-list");
    const adminMessagesList = document.getElementById("admin-messages-list");

    // Modal elements
    const projectModal = document.getElementById("project-form-modal");
    const projectModalTitle = document.getElementById("project-modal-title");
    const btnOpenAddModal = document.getElementById("btn-open-add-modal");
    const btnCloseProjectModal = document.getElementById("btn-close-project-modal");
    const btnCancelProjectForm = document.getElementById("btn-cancel-project-form");
    const projectAdminForm = document.getElementById("project-admin-form");

    // Form inputs
    const formProjectId = document.getElementById("form-project-id");
    const formTitle = document.getElementById("form-title");
    const formCategory = document.getElementById("form-category");
    const formTech = document.getElementById("form-tech");
    const formImageUrl = document.getElementById("form-image-url");
    const formLiveUrl = document.getElementById("form-live-url");
    const formGithubUrl = document.getElementById("form-github-url");
    const formDesc = document.getElementById("form-desc");

    // --- CHECK LOGIN STATUS ---
    async function checkAuthStatus() {
        try {
            const response = await fetch("/api/admin/status");
            const data = await response.json();
            
            if (response.ok && data.authenticated) {
                // Logged in
                loginPanel.style.display = "none";
                dashboardPanel.style.display = "block";
                adminUserDisplay.textContent = data.username;
                
                // Load dashboard content
                loadDashboardData();
            } else {
                // Not logged in
                loginPanel.style.display = "flex";
                dashboardPanel.style.display = "none";
            }
        } catch (error) {
            console.error("Auth status error:", error);
            loginPanel.style.display = "flex";
            dashboardPanel.style.display = "none";
        }
    }

    // --- LOGIN ACTION ---
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            loginStatusBox.className = "form-status";
            loginStatusBox.style.display = "none";

            const username = document.getElementById("admin-username").value.trim();
            const password = document.getElementById("admin-password").value.trim();

            try {
                const response = await fetch("/api/admin/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });
                
                const result = await response.json();

                if (response.ok) {
                    // Success login
                    loginForm.reset();
                    checkAuthStatus();
                } else {
                    // Fail login
                    loginStatusBox.textContent = result.error || "Authentication failed.";
                    loginStatusBox.classList.add("error");
                }
            } catch (error) {
                loginStatusBox.textContent = "Server connection error.";
                loginStatusBox.classList.add("error");
                console.error("Login submission error:", error);
            }
        });
    }

    // --- LOGOUT ACTION ---
    if (btnLogout) {
        btnLogout.addEventListener("click", async () => {
            try {
                const response = await fetch("/api/admin/logout", { method: "POST" });
                if (response.ok) {
                    checkAuthStatus();
                }
            } catch (error) {
                console.error("Logout error:", error);
            }
        });
    }

    // --- LOAD DASHBOARD CONTENT ---
    async function loadDashboardData() {
        // Load statistics
        loadStats();
        // Load CRUD projects table
        loadAdminProjects();
        // Load inbox client messages
        loadAdminMessages();
    }

    async function loadStats() {
        try {
            // Get projects length
            const resProjects = await fetch("/api/projects");
            const projects = await resProjects.json();
            statProjectsCount.textContent = projects.length || 0;

            // Get skills length
            const resSkills = await fetch("/api/skills");
            const skills = await resSkills.json();
            statSkillsCount.textContent = skills.length || 0;

            // Get messages length
            const resMessages = await fetch("/api/admin/messages");
            const messages = await resMessages.json();
            statMessagesCount.textContent = messages.length || 0;
        } catch (error) {
            console.error("Stats fetching error:", error);
        }
    }

    async function loadAdminProjects() {
        try {
            const response = await fetch("/api/projects");
            const projects = await response.json();
            
            if (!response.ok) throw new Error();

            if (projects.length === 0) {
                adminProjectsList.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                            No projects found in database. Click "Add Project" to create one.
                        </td>
                    </tr>
                `;
                return;
            }

            adminProjectsList.innerHTML = "";
            projects.forEach(project => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td style="font-weight: 600;">${project.title}</td>
                    <td><span style="color: var(--accent);">${project.category}</span></td>
                    <td style="font-size: 0.85rem; color: var(--text-secondary); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${project.technologies}</td>
                    <td style="text-align: right; white-space: nowrap;">
                        <button class="btn btn-secondary btn-sm edit-btn" data-id="${project.id}" style="padding: 0.3rem 0.8rem; margin-right: 0.5rem;"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-danger btn-sm delete-btn" data-id="${project.id}" style="padding: 0.3rem 0.8rem; background: var(--error);"><i class="fa-solid fa-trash-can"></i></button>
                    </td>
                `;

                // Edit click handler
                row.querySelector(".edit-btn").addEventListener("click", () => {
                    openEditProjectModal(project);
                });

                // Delete click handler
                row.querySelector(".delete-btn").addEventListener("click", () => {
                    confirmDeleteProject(project);
                });

                adminProjectsList.appendChild(row);
            });
        } catch (error) {
            adminProjectsList.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--error); padding: 2rem;">
                        Failed to load projects list.
                    </td>
                </tr>
            `;
            console.error("Projects admin load error:", error);
        }
    }

    async function loadAdminMessages() {
        try {
            const response = await fetch("/api/admin/messages");
            const messages = await response.json();

            if (!response.ok) throw new Error();

            if (messages.length === 0) {
                adminMessagesList.innerHTML = `
                    <div style="text-align: center; color: var(--text-secondary); padding: 3rem;">
                        <i class="fa-solid fa-circle-check" style="font-size: 1.8rem; color: var(--success); margin-bottom: 0.8rem;"></i>
                        <p>Inbox is empty. No messages yet!</p>
                    </div>
                `;
                return;
            }

            adminMessagesList.innerHTML = "";
            messages.forEach(msg => {
                const date = new Date(msg.created_at).toLocaleString();
                const card = document.createElement("div");
                card.className = "message-card";
                card.innerHTML = `
                    <div class="message-header">
                        <div>
                            <span class="message-sender">${msg.name}</span>
                            <div class="message-email">${msg.email}</div>
                        </div>
                        <span class="message-date">${date}</span>
                    </div>
                    <div class="message-subject">Subj: ${msg.subject}</div>
                    <div class="message-body">${msg.message}</div>
                `;
                adminMessagesList.appendChild(card);
            });
        } catch (error) {
            adminMessagesList.innerHTML = `
                <div style="text-align: center; color: var(--error); padding: 2rem;">
                    Failed to load messages inbox.
                </div>
            `;
            console.error("Messages inbox admin load error:", error);
        }
    }

    // --- ADD / EDIT PROJECT ACTIONS ---
    function openAddProjectModal() {
        projectAdminForm.reset();
        formProjectId.value = "";
        projectModalTitle.textContent = "Add New Project";
        
        // Clear floating labels visual classes
        document.querySelectorAll(".modal-form .form-group").forEach(g => g.classList.remove("has-value", "focused"));
        
        projectModal.style.display = "flex";
    }

    function openEditProjectModal(project) {
        projectAdminForm.reset();
        
        formProjectId.value = project.id;
        formTitle.value = project.title;
        formCategory.value = project.category;
        formTech.value = project.technologies;
        formImageUrl.value = project.image_url || "";
        formLiveUrl.value = project.live_url || "";
        formGithubUrl.value = project.github_url || "";
        formDesc.value = project.description;

        projectModalTitle.textContent = "Edit Project";
        
        // Add floating label indicator classes
        document.querySelectorAll(".modal-form .form-group").forEach(g => {
            const input = g.querySelector(".form-input, .form-textarea");
            if (input && input.value !== "") {
                g.classList.add("has-value");
            }
        });

        projectModal.style.display = "flex";
    }

    async function confirmDeleteProject(project) {
        if (confirm(`Are you sure you want to delete the project "${project.title}"?`)) {
            try {
                const response = await fetch(`/api/admin/projects/${project.id}`, {
                    method: "DELETE"
                });
                
                if (response.ok) {
                    loadDashboardData();
                } else {
                    const res = await response.json();
                    alert(res.error || "Failed to delete project.");
                }
            } catch (error) {
                alert("Network error. Could not delete project.");
                console.error("Delete project error:", error);
            }
        }
    }

    // Modal close controls
    function closeProjectModal() {
        projectModal.style.display = "none";
    }

    if (btnOpenAddModal) btnOpenAddModal.addEventListener("click", openAddProjectModal);
    if (btnCloseProjectModal) btnCloseProjectModal.addEventListener("click", closeProjectModal);
    if (btnCancelProjectForm) btnCancelProjectForm.addEventListener("click", closeProjectModal);
    
    if (projectModal) {
        projectModal.addEventListener("click", (e) => {
            if (e.target === projectModal) closeProjectModal();
        });
    }

    // Submit project form
    if (projectAdminForm) {
        projectAdminForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const projectId = formProjectId.value;
            
            const projectData = {
                title: formTitle.value.trim(),
                category: formCategory.value.trim(),
                technologies: formTech.value.trim(),
                image_url: formImageUrl.value.trim(),
                live_url: formLiveUrl.value.trim(),
                github_url: formGithubUrl.value.trim(),
                description: formDesc.value.trim()
            };

            const isEdit = projectId !== "";
            const url = isEdit ? `/api/admin/projects/${projectId}` : "/api/admin/projects";
            const method = isEdit ? "PUT" : "POST";

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(projectData)
                });

                const result = await response.json();

                if (response.ok) {
                    closeProjectModal();
                    loadDashboardData();
                } else {
                    alert(result.error || "Failed to save project.");
                }
            } catch (error) {
                alert("Server connection error. Failed to save project.");
                console.error("Save project error:", error);
            }
        });
    }

    // Form inputs visual classes management (both Login and CRUD Modals)
    const allFormGroups = document.querySelectorAll(".form-group");
    allFormGroups.forEach(group => {
        const input = group.querySelector(".form-input, .form-textarea");
        if (input) {
            // Check initial value (important for autofill)
            if (input.value !== "") {
                group.classList.add("has-value");
            }
            
            // Checks for browser autofill delayed injections
            setTimeout(() => {
                if (input.value !== "") group.classList.add("has-value");
            }, 100);
            setTimeout(() => {
                if (input.value !== "") group.classList.add("has-value");
            }, 500);

            input.addEventListener("focus", () => group.classList.add("focused"));
            input.addEventListener("blur", () => {
                group.classList.remove("focused");
                if (input.value !== "") group.classList.add("has-value");
                else group.classList.remove("has-value");
            });
            input.addEventListener("input", () => {
                if (input.value !== "") group.classList.add("has-value");
                else group.classList.remove("has-value");
            });
        }
    });

    // Run auth check on initial load
    checkAuthStatus();
});
