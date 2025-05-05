document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Functionality
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('utilicraft-theme');
    if (savedTheme) {
        document.body.className = savedTheme;
        updateThemeIcon(savedTheme);
    } else {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            localStorage.setItem('utilicraft-theme', 'light-theme');
            updateThemeIcon('light-theme');
        }
    }
    
    themeToggle.addEventListener('click', () => {
        // Add click animation
        themeToggle.classList.add('pulse');
        setTimeout(() => {
            themeToggle.classList.remove('pulse');
        }, 500);
        
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            localStorage.setItem('utilicraft-theme', 'light-theme');
            updateThemeIcon('light-theme');
            
            // Update meta theme color for browsers
            document.querySelector('meta[name="theme-color"]').setAttribute('content', '#f8f9fc');
            
            // Notify iframes about theme change
            notifyIframesThemeChange(false);
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            localStorage.setItem('utilicraft-theme', 'dark-theme');
            updateThemeIcon('dark-theme');
            
            // Update meta theme color for browsers
            document.querySelector('meta[name="theme-color"]').setAttribute('content', '#131620');
            
            // Notify iframes about theme change
            notifyIframesThemeChange(true);
        }
    });
    
    function updateThemeIcon(theme) {
        if (theme === 'light-theme') {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        } else {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    }
    
    // Function to notify iframes about theme changes
    function notifyIframesThemeChange(isDarkTheme) {
        // Find all iframes in the document
        const iframes = document.querySelectorAll('iframe');
        
        // Send message to each iframe
        iframes.forEach(iframe => {
            try {
                iframe.contentWindow.postMessage({
                    type: 'theme-change',
                    isDarkTheme: isDarkTheme
                }, '*');
            } catch(e) {
                console.error("Could not send theme to iframe:", e);
            }
        });
    }
    
    // View Toggle Functionality
    const gridViewBtn = document.getElementById('grid-view');
    const listViewBtn = document.getElementById('list-view');
    const toolsContainer = document.querySelector('.tools-container');
    
    // Check for saved view preference or use default
    const savedView = localStorage.getItem('utilicraft-view');
    if (savedView) {
        toolsContainer.className = `tools-container ${savedView}`;
        updateViewButtons(savedView);
    }
    
    gridViewBtn.addEventListener('click', (event) => {
        // Add ripple effect
        addRippleEffect(gridViewBtn, event);
        
        toolsContainer.classList.remove('list-view');
        toolsContainer.classList.add('grid-view');
        localStorage.setItem('utilicraft-view', 'grid-view');
        updateViewButtons('grid-view');
        
        // Add transition effect to cards
        animateCards();
    });
    
    listViewBtn.addEventListener('click', (event) => {
        // Add ripple effect
        addRippleEffect(listViewBtn, event);
        
        toolsContainer.classList.remove('grid-view');
        toolsContainer.classList.add('list-view');
        localStorage.setItem('utilicraft-view', 'list-view');
        updateViewButtons('list-view');
        
        // Add transition effect to cards
        animateCards();
    });
    
    function updateViewButtons(view) {
        if (view === 'grid-view') {
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
        } else {
            gridViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');
        }
    }
    
    function animateCards() {
        const toolCards = document.querySelectorAll('.tool-card');
        toolCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = '';
            }, index * 50);
        });
    }
    
    // Run initial animation on page load
    setTimeout(() => {
        animateCards();
    }, 100);
    
    // Tool Card Click Animation
    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        card.addEventListener('click', () => {
            card.style.transform = 'scale(0.97)';
            setTimeout(() => {
                card.style.transform = '';
                // Here you would normally add navigation to the tool page
                // window.location.href = '/tool/tool-id';
            }, 150);
        });
    });
    
    // Add ripple effect for buttons
    function addRippleEffect(button, event) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        button.appendChild(ripple);
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
        
        ripple.classList.add('active');
        
        setTimeout(() => {
            ripple.remove();
        }, 500);
    }
    
    // Search functionality
    const searchInput = document.querySelector('.search-container input');
    
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const toolCards = document.querySelectorAll('.tool-card');
        
        toolCards.forEach(card => {
            const toolName = card.querySelector('h3').textContent.toLowerCase();
            const toolDescription = card.querySelector('p').textContent.toLowerCase();
            
            if (toolName.includes(searchTerm) || toolDescription.includes(searchTerm)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });
    
    // Donate button animation
    const donateBtn = document.querySelector('.donate-btn');
    
    donateBtn.addEventListener('mouseenter', () => {
        if (!donateBtn.classList.contains('animated')) {
            donateBtn.classList.add('animated');
            const heartIcon = donateBtn.querySelector('i');
            
            heartIcon.classList.add('fa-beat');
            
            setTimeout(() => {
                heartIcon.classList.remove('fa-beat');
                donateBtn.classList.remove('animated');
            }, 1000);
        }
    });
    
    // Add tooltip functionality for new and popular badges
    const toolCardsWithBadges = document.querySelectorAll('.tool-card .badge');
    
    toolCardsWithBadges.forEach(badge => {
        const card = badge.closest('.tool-card');
        
        card.addEventListener('mouseenter', () => {
            // Add a subtle pulse animation to the badge on hover
            badge.style.animation = 'pulse 1.5s infinite';
        });
        
        card.addEventListener('mouseleave', () => {
            badge.style.animation = '';
        });
    });
    
    // Add smooth scroll for footer links
    const footerLinks = document.querySelectorAll('.footer-links a');
    
    footerLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // This would normally navigate to the appropriate page
            // For now, let's just add a visual effect
            e.preventDefault();
            
            link.style.transform = 'scale(1.1)';
            setTimeout(() => {
                link.style.transform = '';
            }, 300);
        });
    });
    
    // Handle mobile view adjustments
    function handleResponsiveLayout() {
        const isMobile = window.innerWidth <= 768;
        const donateBtn = document.querySelector('.donate-btn');
        const donateText = donateBtn.querySelector('span');
        
        if (isMobile) {
            donateText.style.display = 'none';
        } else {
            donateText.style.display = '';
        }
    }
    
    // Run on load and window resize
    handleResponsiveLayout();
    window.addEventListener('resize', handleResponsiveLayout);
    
    // Add keyboard navigation support
    document.addEventListener('keydown', (e) => {
        // If pressing Tab key, add a visual indicator for focus
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
    
    // Notify iframes of the current theme on page load
    const isDarkTheme = document.body.classList.contains('dark-theme');
    notifyIframesThemeChange(isDarkTheme);
    
    // Add initialization complete indicator
    console.log('UtiliCraft UI initialized successfully');
});