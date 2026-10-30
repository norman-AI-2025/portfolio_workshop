/**
 * Norman Lee Weng Hong - Portfolio Interactions & Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation scroll state
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active link highlighting (Scrollspy)
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 180;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });

    // 2. Typewriter Effect for Hero Subtitle
    const roles = [
        "AI & Machine Learning Specialist",
        "Backend Developer & FastAPI Engineer",
        "Award-Winning Game Developer",
        "University of Malaya (CGPA 4.0)"
    ];
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typeSpeed = 80;
    const eraseSpeed = 40;
    const delayBetweenWords = 2000;
    const typewriterElement = document.getElementById('typewriter');

    function typeEffect() {
        if (!typewriterElement) return;

        const currentRole = roles[roleIndex];
        
        if (isDeleting) {
            typewriterElement.textContent = currentRole.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typewriterElement.textContent = currentRole.substring(0, charIndex + 1);
            charIndex++;
        }

        let currentDelay = isDeleting ? eraseSpeed : typeSpeed;

        if (!isDeleting && charIndex === currentRole.length) {
            currentDelay = delayBetweenWords;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            currentDelay = 400;
        }

        setTimeout(typeEffect, currentDelay);
    }
    typeEffect();

    // 3. Resume Modal Controls
    const resumeModal = document.getElementById('resume-modal');
    const openModalBtns = document.querySelectorAll('.js-open-cv');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const resumeIframe = document.getElementById('resume-iframe');

    function openModal() {
        if (resumeModal) {
            if (resumeIframe && !resumeIframe.src) {
                resumeIframe.src = 'assets/resume.pdf';
            }
            resumeModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal() {
        if (resumeModal) {
            resumeModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    openModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    });

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (resumeModal) {
        resumeModal.addEventListener('click', (e) => {
            if (e.target === resumeModal) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && resumeModal && resumeModal.classList.contains('active')) {
            closeModal();
        }
    });

    // 4. Toast Notification
    const toast = document.getElementById('toast');
    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3200);
    }

    // 5. Contact Form Handler
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('form-name').value.trim();
            const email = document.getElementById('form-email').value.trim();
            const message = document.getElementById('form-message').value.trim();

            if (!name || !email || !message) {
                showToast('⚠️ Please fill in all fields.');
                return;
            }

            // Generate mailto link
            const subject = encodeURIComponent(`Portfolio Message from ${name}`);
            const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
            window.location.href = `mailto:normanlwh2006@gmail.com?subject=${subject}&body=${body}`;

            showToast('✓ Opening email client to send your message!');
            contactForm.reset();
        });
    }

    // 6. Copy to clipboard for contact items
    const copyTriggers = document.querySelectorAll('[data-copy]');
    copyTriggers.forEach(el => {
        el.addEventListener('click', (e) => {
            const val = el.getAttribute('data-copy');
            if (val) {
                navigator.clipboard.writeText(val).then(() => {
                    showToast(`✓ Copied: ${val}`);
                }).catch(() => {
                    showToast(`Copied to clipboard`);
                });
            }
        });
    });

    // 7. 3D Card Tilt on Hover
    const tiltCards = document.querySelectorAll('.js-tilt');
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    });

    // 8. Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('open');
            mobileToggle.setAttribute('aria-expanded', isOpen);
        });

        // Close on link click
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
            });
        });
    }
});

