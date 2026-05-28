document.addEventListener("DOMContentLoaded", () => {
    
    // --- STICKY NAV & SCROLL INDICATOR ---
    const header = document.getElementById("main-header");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
        highlightNavLink();
    });

    // --- MOBILE NAVBAR MENU ---
    const menuToggleBtn = document.getElementById("menu-toggle-btn");
    const navMenu = document.getElementById("nav-menu");
    
    if (menuToggleBtn && navMenu) {
        menuToggleBtn.addEventListener("click", () => {
            menuToggleBtn.classList.toggle("active");
            navMenu.classList.toggle("active");
        });

        // Close menu when clicking nav link
        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", () => {
                menuToggleBtn.classList.remove("active");
                navMenu.classList.remove("active");
            });
        });
    }

    // --- NAV LINK ACTIVE STATS ---
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".nav-link");

    function highlightNavLink() {
        let scrollPos = window.scrollY + 100;
        sections.forEach(section => {
            if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
                navLinks.forEach(link => {
                    link.classList.remove("active");
                    if (link.getAttribute("href") === `#${section.id}`) {
                        link.classList.add("active");
                    }
                });
            }
        });
    }

    // --- HERO TYPING EFFECT ---
    const typingText = document.getElementById("typing-text");
    if (typingText) {
        const phrases = ["Software Developer", "Full-Stack Engineer", "Problem Solver", "Database Designer"];
        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingSpeed = 100;

        function type() {
            const currentPhrase = phrases[phraseIndex];
            
            if (isDeleting) {
                typingText.textContent = currentPhrase.substring(0, charIndex - 1);
                charIndex--;
                typingSpeed = 50;
            } else {
                typingText.textContent = currentPhrase.substring(0, charIndex + 1);
                charIndex++;
                typingSpeed = 100;
            }

            if (!isDeleting && charIndex === currentPhrase.length) {
                isDeleting = true;
                typingSpeed = 2000; // Pause at end of phrase
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                typingSpeed = 500; // Pause before typing next
            }

            setTimeout(type, typingSpeed);
        }
        
        setTimeout(type, 1000);
    }

    // --- FLOATING LABELS FOR CONTACT FORM ---
    const formGroups = document.querySelectorAll(".form-group");
    formGroups.forEach(group => {
        const input = group.querySelector(".form-input, .form-textarea");
        if (input) {
            // Initial check in case browser auto-filled
            if (input.value !== "") {
                group.classList.add("has-value");
            }
            
            input.addEventListener("focus", () => {
                group.classList.add("focused");
            });
            
            input.addEventListener("blur", () => {
                group.classList.remove("focused");
                if (input.value !== "") {
                    group.classList.add("has-value");
                } else {
                    group.classList.remove("has-value");
                }
            });

            input.addEventListener("input", () => {
                if (input.value !== "") {
                    group.classList.add("has-value");
                } else {
                    group.classList.remove("has-value");
                }
            });
        }
    });

    // --- FETCH AND POPULATE SKILLS ---
    const skillsContainer = document.getElementById("skills-container");
    
    async function loadSkills() {
        try {
            const response = await fetch("/api/skills");
            if (!response.ok) throw new Error("Failed to load skills.");
            const skills = await response.json();
            
            // Group skills by category
            const categories = {};
            skills.forEach(skill => {
                if (!categories[skill.category]) {
                    categories[skill.category] = [];
                }
                categories[skill.category].push(skill);
            });
            
            // Build layout HTML
            if (skillsContainer) {
                skillsContainer.innerHTML = "";
                
                const categoryIcons = {
                    "Frontend": "fa-solid fa-code",
                    "Backend": "fa-solid fa-server",
                    "Database": "fa-solid fa-database",
                    "Tools": "fa-solid fa-screwdriver-wrench"
                };

                for (const cat in categories) {
                    const categoryCard = document.createElement("div");
                    categoryCard.className = "skills-category";
                    
                    const icon = categoryIcons[cat] || "fa-solid fa-brain";
                    let skillsHTML = `<h3 class="category-title"><i class="${icon}"></i> ${cat}</h3>`;
                    
                    categories[cat].forEach(skill => {
                        skillsHTML += `
                            <div class="skill-item">
                                <div class="skill-info">
                                    <span class="skill-name">${skill.name}</span>
                                    <span class="skill-percentage">${skill.proficiency}%</span>
                                </div>
                                <div class="skill-bar-bg">
                                    <div class="skill-bar-fill" data-percent="${skill.proficiency}"></div>
                                </div>
                            </div>
                        `;
                    });
                    
                    categoryCard.innerHTML = skillsHTML;
                    skillsContainer.appendChild(categoryCard);
                }
                
                // Animate progress bars when in viewport
                animateProgressBars();
            }
        } catch (error) {
            console.error("Error loading skills:", error);
        }
    }

    function animateProgressBars() {
        const fillBars = document.querySelectorAll(".skill-bar-fill");
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const bar = entry.target;
                    const percent = bar.getAttribute("data-percent");
                    bar.style.width = percent + "%";
                    observer.unobserve(bar);
                }
            });
        }, { threshold: 0.1 });

        fillBars.forEach(bar => observer.observe(bar));
    }

    loadSkills();

    // --- FETCH, POPULATE, & FILTER PROJECTS ---
    const projectsGrid = document.getElementById("projects-grid");
    const filterContainer = document.getElementById("projects-filter-container");
    let allProjects = [];

    async function loadProjects() {
        try {
            const response = await fetch("/api/projects");
            if (!response.ok) throw new Error("Failed to load projects.");
            allProjects = await response.json();
            
            // Initialize filters dynamic triggers
            setupProjectFilters();
            
            // Initial render
            renderProjects(allProjects);
        } catch (error) {
            if (projectsGrid) {
                projectsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; color: var(--error); padding: 3rem;">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem;"></i>
                        <p style="margin-top: 1rem;">Failed to load projects. Please try refreshing.</p>
                    </div>
                `;
            }
            console.error("Error loading projects:", error);
        }
    }

    function renderProjects(projectsList) {
        if (!projectsGrid) return;
        
        if (projectsList.length === 0) {
            projectsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 3rem;">
                    <p>No projects found in this category.</p>
                </div>
            `;
            return;
        }

        projectsGrid.innerHTML = "";
        
        projectsList.forEach(project => {
            const card = document.createElement("div");
            card.className = "project-card";
            
            // Build tech tags
            const techList = project.technologies.split(",").map(t => t.strip ? t.strip() : t.trim());
            const tagsHTML = techList.map(tech => `<span class="tag">${tech}</span>`).join("");
            
            // Live Preview and Github Links
            let linksHTML = "";
            if (project.live_url) {
                linksHTML += `<a href="${project.live_url}" target="_blank" class="project-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> Live Demo</a>`;
            }
            if (project.github_url) {
                linksHTML += `<a href="${project.github_url}" target="_blank" class="project-link"><i class="fa-brands fa-github"></i> Code</a>`;
            }

            card.innerHTML = `
                <div class="project-img-container">
                    <img src="${project.image_url}" alt="${project.title}" class="project-img" onerror="this.src='/static/images/placeholder.jpg'">
                    <span class="project-badge">${project.category}</span>
                </div>
                <div class="project-info">
                    <h3 class="project-title">${project.title}</h3>
                    <p class="project-desc">${project.description}</p>
                    <div class="project-tags">${tagsHTML}</div>
                    <div class="project-links">${linksHTML}</div>
                </div>
            `;
            
            // Open modal on click (except if clicking on direct links)
            card.addEventListener("click", (e) => {
                if (!e.target.closest(".project-link")) {
                    openProjectModal(project);
                }
            });

            projectsGrid.appendChild(card);
        });
    }

    function setupProjectFilters() {
        if (!filterContainer) return;
        
        filterContainer.addEventListener("click", (e) => {
            const btn = e.target.closest(".filter-btn");
            if (!btn) return;
            
            // Toggle active state
            document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const filterValue = btn.getAttribute("data-filter").toLowerCase();
            
            if (filterValue === "all") {
                renderProjects(allProjects);
            } else {
                const filtered = allProjects.filter(p => p.category.toLowerCase() === filterValue);
                renderProjects(filtered);
            }
        });
    }

    loadProjects();

    // --- PROJECT DETAILS MODAL ---
    const modal = document.getElementById("project-modal");
    const modalCloseBtn = document.getElementById("modal-close-btn");
    const modalTitle = document.getElementById("modal-project-title");
    const modalImg = document.getElementById("modal-project-img");
    const modalTags = document.getElementById("modal-project-tags");
    const modalDesc = document.getElementById("modal-project-desc");
    const modalLinks = document.getElementById("modal-project-links");

    function openProjectModal(project) {
        if (!modal) return;
        
        modalTitle.textContent = project.title;
        modalImg.src = project.image_url;
        modalImg.onerror = () => { modalImg.src = '/static/images/placeholder.jpg'; };
        modalDesc.textContent = project.description;
        
        // Tags
        const techList = project.technologies.split(",").map(t => t.trim());
        modalTags.innerHTML = techList.map(tech => `<span class="tag">${tech}</span>`).join("");
        
        // Links
        let linksHTML = "";
        if (project.live_url) {
            linksHTML += `<a href="${project.live_url}" target="_blank" class="btn btn-primary btn-sm"><i class="fa-solid fa-arrow-up-right-from-square"></i> Visit Live Demo</a>`;
        }
        if (project.github_url) {
            linksHTML += `<a href="${project.github_url}" target="_blank" class="btn btn-secondary btn-sm"><i class="fa-brands fa-github"></i> View GitHub Source</a>`;
        }
        modalLinks.innerHTML = linksHTML;
        
        modal.style.display = "flex";
        document.body.style.overflow = "hidden"; // Disable scroll
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener("click", closeModal);
    }
    
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    function closeModal() {
        if (modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto"; // Re-enable scroll
        }
    }

    // --- CONTACT FORM AJAX SUBMISSION ---
    const contactForm = document.getElementById("contact-form");
    const statusBox = document.getElementById("contact-status-box");
    const submitBtn = document.getElementById("btn-submit-contact");

    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            // Set loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = `Sending... <i class="fa-solid fa-circle-notch fa-spin"></i>`;
            statusBox.className = "form-status";
            statusBox.style.display = "none";

            const formData = {
                name: document.getElementById("contact-name").value,
                email: document.getElementById("contact-email").value,
                subject: document.getElementById("contact-subject").value,
                message: document.getElementById("contact-message").value
            };

            try {
                const response = await fetch("/api/contacts", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok) {
                    // Success
                    statusBox.textContent = result.success || "Your message was sent successfully!";
                    statusBox.classList.add("success");
                    contactForm.reset();
                    // Remove floating label active state classes
                    formGroups.forEach(g => g.classList.remove("has-value", "focused"));
                } else {
                    // Error response from API
                    statusBox.textContent = result.error || "An error occurred. Please check details.";
                    statusBox.classList.add("error");
                }
            } catch (error) {
                // Connection error
                statusBox.textContent = "Network error. Failed to reach server. Please try again later.";
                statusBox.classList.add("error");
                console.error("Contact submit error:", error);
            } finally {
                // Reset submit button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = `Send Message <i class="fa-solid fa-paper-plane"></i>`;
            }
        });
    }
});
