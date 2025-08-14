// Loading state management
class LoadingManager {
    constructor() {
        this.loadingCount = 0;
        this.loadingContainer = document.querySelector('.loading-container');
        this.isPageRefresh = true; // Flag to track if this is a page load/refresh
        this.setupEventListeners();
        this.setupAjaxInterceptor();
    }

    show() {
        this.loadingCount++;
        if (this.loadingCount > 0) {
            // Store the form state before showing loading
            if (!this.isPageRefresh) {
                const form = document.getElementById('notifyForm');
                this.wasAtForm = form && form.contains(document.activeElement);
                this.lastScrollPosition = this.wasAtForm ? window.scrollY : 0;
            }

            document.documentElement.classList.add('loading');
            document.body.classList.add('loading');
            this.loadingContainer.classList.add('active');
            // Add backdrop if it doesn't exist
            let backdrop = document.querySelector('.loading-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.className = 'loading-backdrop';
                document.body.appendChild(backdrop);
            }
            // Force a reflow before adding active class
            backdrop.offsetHeight;
            backdrop.classList.add('active');
        }
    }

    hide() {
        this.loadingCount--;
        if (this.loadingCount <= 0) {
            this.loadingCount = 0;
            
            // Remove loading states
            document.documentElement.classList.remove('loading');
            document.body.classList.remove('loading');
            this.loadingContainer.classList.remove('active');
            
            // Handle backdrop
            const backdrop = document.querySelector('.loading-backdrop');
            if (backdrop) {
                backdrop.classList.remove('active');
                // Remove backdrop after transition
                setTimeout(() => {
                    if (backdrop.parentNode) {
                        backdrop.parentNode.removeChild(backdrop);
                    }
                }, 200);
            }
            
            // Handle scroll position
            setTimeout(() => {
                if (this.isPageRefresh || document.readyState !== 'complete') {
                    // On page refresh/load, always go to top
                    window.scrollTo({ top: 0, behavior: 'instant' });
                    // Add an extra scroll to top after a brief delay to handle mobile browsers
                    setTimeout(() => {
                        window.scrollTo(0, 0);
                    }, 100);
                    this.isPageRefresh = false; // Reset the flag
                } else if (this.wasAtForm) {
                    // If user was interacting with form, maintain position
                    window.scrollTo({
                        top: this.lastScrollPosition,
                        behavior: 'instant'
                    });
                }
            }, 0);
        }
    }

    setupEventListeners() {
        // Force scroll to top immediately when page starts loading
        document.addEventListener('DOMContentLoaded', () => {
            window.scrollTo(0, 0);
            this.show();
            // Force hide loading after 5 seconds maximum
            setTimeout(() => {
                this.hide();
                window.scrollTo(0, 0);
            }, 5000);
        }, { capture: true }); // Use capture to ensure this runs first

        // Handle page load completion
        window.addEventListener('load', () => {
            this.hide();
            // Force scroll to top after everything is loaded
            window.scrollTo(0, 0);
        });
        
        // Handle image loading
        document.addEventListener('DOMContentLoaded', () => {
            Promise.all(Array.from(document.images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => img.addEventListener('load', resolve));
            })).then(() => {
                this.hide();
                window.scrollTo(0, 0);
            });
        });

        // Show loading when navigating away
        window.addEventListener('beforeunload', () => {
            this.show();
        });
    }

    setupAjaxInterceptor() {
        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            this.show();
            try {
                const response = await originalFetch(...args);
                return response;
            } finally {
                this.hide();
            }
        };

        // Intercept XMLHttpRequest
        const originalXHR = window.XMLHttpRequest;
        function newXHR() {
            const xhr = new originalXHR();
            xhr.addEventListener('loadstart', () => loadingManager.show());
            xhr.addEventListener('loadend', () => loadingManager.hide());
            return xhr;
        }
        window.XMLHttpRequest = newXHR;
    }
}

// Initialize the loading manager
const loadingManager = new LoadingManager();

// Function to manually show/hide loading
window.showLoading = () => loadingManager.show();
window.hideLoading = () => loadingManager.hide();

// Handle image switching in loading indicator
function switchLoadingImages() {
    const images = document.querySelectorAll('.loading-img');
    const currentActive = document.querySelector('.loading-img.active');
    const nextActive = currentActive.nextElementSibling?.classList.contains('loading-img') ? 
                    currentActive.nextElementSibling : 
                    images[0];
    
    currentActive.classList.remove('active');
    nextActive.classList.add('active');
}

// Start the interval when the loading container becomes visible
const loadingContainer = document.querySelector('.loading-container');
let switchInterval;

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.target.classList.contains('active')) {
            // Container became visible
            switchInterval = setInterval(switchLoadingImages, 3000);
        } else {
            // Container was hidden
            clearInterval(switchInterval);
            // Reset to first image
            document.querySelectorAll('.loading-img').forEach((img, index) => {
                img.classList.toggle('active', index === 0);
            });
        }
    });
});

observer.observe(loadingContainer, { 
    attributes: true, 
    attributeFilter: ['class']
});
