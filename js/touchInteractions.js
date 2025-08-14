// Touch interactions for the shoe container
export function initTouchInteractions() {
  const container = document.querySelector('.shoe-image-container');
  if (!container) return;

  let animationTimer = null;
  let isTouching = false;

  function animateElements(forward = true) {
    const trailImage = document.querySelector('.wave-shoe-img');
    if (!trailImage) return;

    // Clear any existing animation timer
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }

    const transformValue = forward ? 
      'translate(-50%, -50%) translateZ(30px) scale(1.05)' :
      'translate(-50%, -50%) translateZ(0) scale(1)';

    const backgroundTransform = forward ?
      'translateZ(-60px)' :
      'translateZ(0)';

    // Apply transforms with proper timing
    requestAnimationFrame(() => {
      if (trailImage) {
        trailImage.style.transform = transformValue;
      }
      container.style.setProperty('--background-transform', backgroundTransform);
    });

    if (forward) {
      // Set timer to reset the animation
      animationTimer = setTimeout(() => {
        if (!isTouching) { // Only reset if not still touching
          animateElements(false);
        }
      }, 1000);
    }
  }

  // Touch handling
  container.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isTouching = true;
    animateElements(true);
  }, { passive: false });

  container.addEventListener('touchend', () => {
    isTouching = false;
    // Add a small delay before resetting
    setTimeout(() => {
      if (!isTouching) {
        animateElements(false);
      }
    }, 200);
  });

  container.addEventListener('touchcancel', () => {
    isTouching = false;
    animateElements(false);
  });

  // Mouse handling (only for devices with hover)
  const hasHover = window.matchMedia('(hover: hover)').matches;
  if (hasHover) {
    container.addEventListener('mouseenter', () => {
      isTouching = true;
      animateElements(true);
    });
    
    container.addEventListener('mouseleave', () => {
      isTouching = false;
      animateElements(false);
    });
  }
}
