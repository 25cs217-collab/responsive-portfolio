document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // ==========================================================================
    // THEME TOGGLE FUNCTIONALITY
    // ==========================================================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Theme switching handler
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // ==========================================================================
    // MOBILE NAVIGATION DRAWER
    // ==========================================================================
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    function toggleMobileMenu() {
        const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
        mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
        mobileMenuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.classList.toggle('no-scroll', !isExpanded);
    }
    
    function closeMobileMenu() {
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        mobileMenuToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
        
        // Close mobile menu on clicking any navigation link
        navLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // Close mobile menu when clicking outside of the navbar
        document.addEventListener('click', (event) => {
            const isClickInsideNavbar = navMenu.contains(event.target) || 
                                        mobileMenuToggle.contains(event.target) ||
                                        document.getElementById('header').contains(event.target);
            if (!isClickInsideNavbar && navMenu.classList.contains('active')) {
                closeMobileMenu();
            }
        });
    }

    // ==========================================================================
    // INTERSECTION OBSERVER - SCROLL REVEAL ANIMATIONS
    // ==========================================================================
    const animatedElements = document.querySelectorAll('.fade-in, .fade-in-up');
    
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                // Unobserve since we only want to trigger the animation once
                observer.unobserve(entry.target);
            }
        });
    };
    
    const revealOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before element enters view
    };
    
    const revealObserver = new IntersectionObserver(revealCallback, revealOptions);
    
    animatedElements.forEach(element => {
        revealObserver.observe(element);
    });

    // ==========================================================================
    // SCROLL SPY - ACTIVE NAVIGATION LINK HIGHLIGHTING
    // ==========================================================================
    const sections = document.querySelectorAll('section[id]');
    
    const scrollSpyOptions = {
        threshold: 0.2,
        rootMargin: '-20% 0px -60% 0px' // Highlight middle sections correctly
    };
    
    const scrollSpyCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };
    
    const scrollSpyObserver = new IntersectionObserver(scrollSpyCallback, scrollSpyOptions);
    
    sections.forEach(section => {
        scrollSpyObserver.observe(section);
    });

    // ==========================================================================
    // CONTACT FORM VALIDATION & INTERACTION
    // ==========================================================================
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let isValid = true;
            
            // Validate Name
            const nameInput = document.getElementById('form-name');
            const nameGroup = nameInput.closest('.form-group');
            if (nameInput.value.trim() === '') {
                nameGroup.classList.add('has-error');
                isValid = false;
            } else {
                nameGroup.classList.remove('has-error');
            }
            
            // Validate Email
            const emailInput = document.getElementById('form-email');
            const emailGroup = emailInput.closest('.form-group');
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailInput.value.trim())) {
                emailGroup.classList.add('has-error');
                isValid = false;
            } else {
                emailGroup.classList.remove('has-error');
            }
            
            // Validate Subject
            const subjectInput = document.getElementById('form-subject');
            const subjectGroup = subjectInput.closest('.form-group');
            if (subjectInput.value.trim() === '') {
                subjectGroup.classList.add('has-error');
                isValid = false;
            } else {
                subjectGroup.classList.remove('has-error');
            }
            
            // Validate Message
            const messageInput = document.getElementById('form-message');
            const messageGroup = messageInput.closest('.form-group');
            if (messageInput.value.trim() === '') {
                messageGroup.classList.add('has-error');
                isValid = false;
            } else {
                messageGroup.classList.remove('has-error');
            }
            
            if (isValid) {
                // Mock form submission details
                const formData = {
                    name: nameInput.value.trim(),
                    email: emailInput.value.trim(),
                    subject: subjectInput.value.trim(),
                    message: messageInput.value.trim()
                };
                
                // Disable submit button and show loading status
                const submitBtn = contactForm.querySelector('.submit-btn');
                const submitBtnText = submitBtn.querySelector('span');
                const submitBtnIcon = submitBtn.querySelector('i');
                const originalText = submitBtnText.textContent;
                
                submitBtn.disabled = true;
                submitBtnText.textContent = 'Sending Message...';
                if (submitBtnIcon) submitBtnIcon.style.opacity = '0.5';
                
                // Simulate server latency
                setTimeout(() => {
                    // Reset Button
                    submitBtn.disabled = false;
                    submitBtnText.textContent = originalText;
                    if (submitBtnIcon) submitBtnIcon.style.opacity = '1';
                    
                    // Show Toast Alert
                    showToast('Message sent successfully! Thank you for reaching out.', 'success');
                    
                    // Reset Form fields
                    contactForm.reset();
                }, 1500);
            }
        });
        
        // Remove error messages in real-time as user type/interact
        const inputs = contactForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                const group = input.closest('.form-group');
                if (group.classList.contains('has-error')) {
                    group.classList.remove('has-error');
                }
            });
        });
    }

    // ==========================================================================
    // TOAST SYSTEM
    // ==========================================================================
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Icon template
        const iconName = type === 'success' ? 'check-circle' : 'alert-circle';
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i data-lucide="${iconName}"></i>
            </div>
            <div class="toast-message">${message}</div>
        `;
        
        container.appendChild(toast);
        
        // Rerender icons within the new Toast
        if (typeof lucide !== 'undefined') {
            lucide.createIcons({
                attrs: {
                    class: 'toast-lucide-icon'
                },
                nameAttr: 'data-lucide'
            });
        }
        
        // Remove toast from DOM after animations complete
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
});
