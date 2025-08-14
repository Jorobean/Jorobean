// Loading state management
class LoadingManager {
    constructor() {
        this.loadingCount = 0;
        this.loadingContainer = document.querySelector('.loading-container');
        this.setupEventListeners();
        this.setupAjaxInterceptor();
    }

    show() {
        this.loadingCount++;
        if (this.loadingCount > 0) {
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
            
            // Store current scroll position and form
            const scrollPosition = window.scrollY;
            const form = document.getElementById('notifyForm');
            const formRect = form ? form.getBoundingClientRect() : null;
            
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
            
            // Only restore the previous scroll position
            setTimeout(() => {
                window.scrollTo({
                    top: scrollPosition,
                    behavior: 'instant'
                });
            }, 0);
        }
    }

    setupEventListeners() {
        // Show loading on page load
        document.addEventListener('DOMContentLoaded', () => {
            this.show();
            // Force hide loading after 5 seconds maximum
            setTimeout(() => {
                this.hide();
            }, 5000);
        });

        // Hide loading when page is fully loaded
        window.addEventListener('load', () => {
            this.hide();
        });
        
        // Hide loading if images are loaded
        document.addEventListener('DOMContentLoaded', () => {
            Promise.all(Array.from(document.images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => img.addEventListener('load', resolve));
            })).then(() => {
                this.hide();
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
