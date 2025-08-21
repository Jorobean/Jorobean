// Color transition functionality
let isAutoTransitioning = true;
const transitionInterval = 4500; // Change color every 3 seconds

// Define the color sequence (0: Black, 1: Blue, 2: Oak, 3: Red)
const colorSequence = [0, 1, 2, 3];
let currentIndex = 0;

function autoTransitionColors() {
    const colorOptions = document.querySelectorAll('.color-option');
    const shoeImage = document.querySelector('.wave-shoe-img');
    
    // Function to smoothly transition between images
    function updateShoeImage(newImageSrc, colorName) {
        // Start fade out
        shoeImage.style.opacity = '0';
        shoeImage.style.transform = 'translate3d(-50%, -50%, 0) scale(0.95)';
        
        // After fade out, update source and fade in
        setTimeout(() => {
            shoeImage.src = newImageSrc;
            shoeImage.srcset = `${newImageSrc} 600w, ${newImageSrc} 1200w`;
            shoeImage.alt = `Jorobean Trail hiking shoe in ${colorName} featuring 3D printed design`;
            
            // Force browser to recognize the new image
            void shoeImage.offsetWidth;
            
            // Fade in with scale
            shoeImage.style.opacity = '1';
            shoeImage.style.transform = 'translate3d(-50%, -50%, 0) scale(1)';
        }, 500);
    }
    
    function transitionToNextColor() {
        if (!isAutoTransitioning) return;
        
        // Get the next color option from our sequence
        const nextOption = colorOptions[colorSequence[currentIndex]];
        
        // Update color picker active state
        colorOptions.forEach(opt => {
            opt.classList.remove('active');
            opt.setAttribute('aria-checked', 'false');
        });
        
        nextOption.classList.add('active');
        nextOption.setAttribute('aria-checked', 'true');
        
        // Update shoe image with transition
        updateShoeImage(nextOption.dataset.image, nextOption.dataset.name);
        
        // Move to next color in sequence
        currentIndex = (currentIndex + 1) % colorSequence.length;
    }

    // Start the interval
    const intervalId = setInterval(transitionToNextColor, transitionInterval);

    // Handle user interactions
    function handleUserInteraction(e) {
        if (e.isTrusted) { // Only for real user interactions
            isAutoTransitioning = false;
            clearInterval(intervalId);
            
            const option = e.currentTarget;
            const selectedIndex = Array.from(colorOptions).indexOf(option);
            
            // Update color picker state
            colorOptions.forEach(opt => {
                opt.classList.remove('active');
                opt.setAttribute('aria-checked', 'false');
            });
            
            option.classList.add('active');
            option.setAttribute('aria-checked', 'true');
            
            // Update shoe image with transition
            updateShoeImage(option.dataset.image, option.dataset.name);
            
            // Update sequence index to match selected color
            currentIndex = colorSequence.indexOf(selectedIndex);
            if (currentIndex === -1) currentIndex = 0;
            
            // Handle mobile tooltip (show color name on tap)
            if (e.type === 'touchstart') {
                // Create and show tooltip
                const tooltip = document.createElement('div');
                tooltip.style.cssText = `
                    position: absolute;
                    background: var(--text-color);
                    color: var(--bg-color);
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    white-space: nowrap;
                    pointer-events: none;
                    z-index: 1000;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                `;
                tooltip.textContent = option.dataset.name;
                document.body.appendChild(tooltip);
                
                // Position the tooltip
                const rect = option.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = rect.bottom + 10 + 'px';
                
                // Show tooltip
                requestAnimationFrame(() => {
                    tooltip.style.opacity = '1';
                    
                    // Remove tooltip after animation
                    setTimeout(() => {
                        tooltip.style.opacity = '0';
                        setTimeout(() => {
                            document.body.removeChild(tooltip);
                        }, 200);
                    }, 1500);
                });
            }
        }
    }

    // Add event listeners for user interactions
    colorOptions.forEach(option => {
        option.addEventListener('mousedown', handleUserInteraction);
        option.addEventListener('touchstart', handleUserInteraction);
    });
}

// Initialize auto-transition when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS for smooth transitions
    const style = document.createElement('style');
    style.textContent = `
        .wave-shoe-img {
            transition: opacity 0.7s ease-in-out,
                        transform 1.2s cubic-bezier(0.4, 0, 0.2, 1),
                        filter 1.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .mountain-bg {
            transition: transform 1.2s cubic-bezier(0.4, 0, 0.2, 1),
                        filter 1.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        /* Hover effect styles for both desktop and mobile */
        .shoe-container.hover-triggered .wave-shoe-img {
            transform: translate3d(-50%, -50%, 60px) !important;
            filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3)) !important;
            transition: transform 0.8s cubic-bezier(0.2, 0, 0.2, 1),
                        filter 0.8s cubic-bezier(0.2, 0, 0.2, 1) !important;
        }

        .shoe-container.hover-triggered .mountain-bg {
            transform: translate3d(0, 0, -50px) scale(0.98) !important;
            filter: brightness(0.8) !important;
            transition: transform 0.8s cubic-bezier(0.2, 0, 0.2, 1),
                        filter 0.8s cubic-bezier(0.2, 0, 0.2, 1) !important;
        }
        
        /* Additional mobile adjustments */
        @media (max-width: 600px) {
            .shoe-container.hover-triggered .wave-shoe-img {
                transform: translate3d(-50%, -50%, 30px) !important;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Set up video behavior
    const mountainVideo = document.getElementById('mountainVideo');
    let lastTriggered = 0;
    let isUserHovering = false;
    let restartTimeout;

    // Configure video for mobile
    mountainVideo.playsInline = true;
    mountainVideo.setAttribute('playsinline', '');
    mountainVideo.setAttribute('webkit-playsinline', '');
    mountainVideo.setAttribute('x-webkit-airplay', 'allow');
    mountainVideo.muted = true;
    mountainVideo.setAttribute('muted', '');
    mountainVideo.defaultMuted = true;
    mountainVideo.loop = false;
    mountainVideo.removeAttribute('loop');
    
    // Force autoplay
    function forcePlay() {
        const playPromise = mountainVideo.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('Video playback started');
            }).catch(error => {
                console.log('Video autoplay failed, trying again:', error);
                // Try again after a short delay
                setTimeout(forcePlay, 100);
            });
        }
    }

    // Initialize video on page visibility and focus
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            forcePlay();
        }
    });

    window.addEventListener('focus', forcePlay);

    // Track user hover state (desktop only)
    const shoeContainer = document.querySelector('.shoe-container');
    if (window.matchMedia('(min-width: 601px)').matches) {
        shoeContainer.addEventListener('mouseenter', () => { isUserHovering = true; });
        shoeContainer.addEventListener('mouseleave', () => { isUserHovering = false; });
    }    function startVideoSequence() {
        mountainVideo.currentTime = 0;
        // Trigger hover effect when video restarts
        shoeContainer.classList.add('hover-triggered');
        setTimeout(() => {
            shoeContainer.classList.remove('hover-triggered');
        }, 2000); // Remove hover effect after 2 seconds
        
        forcePlay(); // Use our robust play function
    }

    function pauseAndWait() {
        mountainVideo.pause();
        // Clear any existing timeout
        if (restartTimeout) {
            clearTimeout(restartTimeout);
        }
        // Set new timeout for restart
        restartTimeout = setTimeout(() => {
            startVideoSequence();
        }, 13000); // 13 seconds
    }

    // Wait for video to be loaded
    mountainVideo.addEventListener('loadedmetadata', () => {
        const videoDuration = mountainVideo.duration;
        console.log('Video duration:', videoDuration);
        
        mountainVideo.addEventListener('timeupdate', () => {
            const currentTime = mountainVideo.currentTime;
            const timeLeft = videoDuration - currentTime;
            const now = Date.now();
            
            // Check if we're near the end of the video
            if (timeLeft < 0.1) {
                pauseAndWait();
            }
        });

        // Handle video ending
        mountainVideo.addEventListener('ended', () => {
            pauseAndWait();
        });
    });

    // Start video on load with multiple triggers
    mountainVideo.addEventListener('canplay', () => {
        startVideoSequence();
    });
    
    // Additional autoplay triggers
    mountainVideo.addEventListener('loadedmetadata', forcePlay);
    window.addEventListener('load', forcePlay);
    
    // Try to start immediately if video is already loaded
    if (mountainVideo.readyState >= 2) {
        forcePlay();
    }
    
    // Start auto-transition after a delay
    setTimeout(autoTransitionColors, 1000);
});
