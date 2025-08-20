// Color transition functionality
let isAutoTransitioning = true;
const transitionInterval = 4500; // Change color every 3 seconds

// Define the color sequence (0: Black, 1: Blue, 2: Oak, 3: Orange, 4: Red)
const colorSequence = [0, 1, 2, 3, 4];
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
                        transform 2s cubic-bezier(0.2, 0, 0, 1) !important;
        }
    `;
    document.head.appendChild(style);
    
    // Start auto-transition after a delay
    setTimeout(autoTransitionColors, 1000);
});
