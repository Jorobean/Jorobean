// Enhanced 3D tilt effect for notifyForm panel with spring physics
export function initTiltEffect() {
  let rafId = null;
  let tiltActive = false;
  let isTilting = false;
  
  // Spring configuration
  const spring = {
    stiffness: 40,   // Further reduced for extremely gentle movement
    damping: 35,     // Increased damping for even less bounce
    mass: 2.5        // Increased mass for even more stability
  };
  
  // Current rotation values
  let currentRotateX = 0;
  let currentRotateY = 0;
  let targetRotateX = 0;
  let targetRotateY = 0;
  let currentScale = 1;
  let targetScale = 1;
  
  function applySpring(current, target, velocity = { value: 0 }) {
    const force = (target - current) * spring.stiffness;
    const damping = velocity.value * spring.damping;
    const acceleration = (force - damping) / spring.mass;
    velocity.value += acceleration * 0.001;
    return current + velocity.value;
  }
  
  function applyTilt(form, e) {
    const rect = form.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const px = (x / rect.width) * 2 - 1;
    const py = (y / rect.height) * 2 - 1;
    
    const maxDeg = 1.5; // Reduced even further for extremely subtle effect
    targetRotateX = -py * maxDeg;
    targetRotateY = px * maxDeg;
    targetScale = 1.002; // Minimal scale effect on hover
  }

  // Persistent velocity objects
  const velocityX = { value: 0 };
  const velocityY = { value: 0 };
  const velocityScale = { value: 0 };

  function animate() {
    const form = document.getElementById('notifyForm');
    if (!form || !form.classList.contains('expanded')) return;

    currentRotateX = applySpring(currentRotateX, targetRotateX, velocityX);
    currentRotateY = applySpring(currentRotateY, targetRotateY, velocityY);
    currentScale = applySpring(currentScale, targetScale, velocityScale);

    // Check if animation should continue
    const isMoving = (
      Math.abs(targetRotateX - currentRotateX) > 0.01 ||
      Math.abs(targetRotateY - currentRotateY) > 0.01 ||
      Math.abs(targetScale - currentScale) > 0.001
    );

    form.style.transform = `
      perspective(800px) 
      rotateX(${currentRotateX}deg) 
      rotateY(${currentRotateY}deg)
      scale(${currentScale})
    `.replace(/\s+/g, ' ');

    if (tiltActive || isMoving) {
      rafId = requestAnimationFrame(animate);
    } else {
      rafId = null;
    }
  }

  function handleMouseMove(e) {
    if (!tiltActive) return;
    
    const form = document.getElementById('notifyForm');
    if (!form || !form.classList.contains('expanded')) return;
    
    applyTilt(form, e);
    
    if (!rafId) {
      rafId = requestAnimationFrame(animate);
    }
  }

  function resetTilt() {
    const form = document.getElementById('notifyForm');
    if (!form || !form.classList.contains('expanded')) return;
    
    targetRotateX = 0;
    targetRotateY = 0;
    targetScale = 1;
    
    if (!isTilting) {
      if (!rafId) {
        rafId = requestAnimationFrame(animate);
      }
      
      setTimeout(() => {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }, 300);
    }
  }

  function handleTouchTap(e) {
    const form = document.getElementById('notifyForm');
    if (!form || !form.classList.contains('expanded')) return;
    
    const touch = e.touches[0];
    const rect = form.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const px = (x / rect.width) * 2 - 1;
    const py = (y / rect.height) * 2 - 1;
    
    const maxDeg = 2; // Even more reduced for touch devices
    targetRotateX = -py * maxDeg;
    targetRotateY = px * maxDeg;
    targetScale = 1.002; // Extremely subtle scale for touch
    
    if (!isTilting) {
      isTilting = true;
      
      if (!rafId) {
        rafId = requestAnimationFrame(animate);
      }
      
      setTimeout(() => {
        targetRotateX = 0;
        targetRotateY = 0;
        targetScale = 1;
        
        setTimeout(() => {
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
          isTilting = false;
        }, 300);
      }, 300);
    }
    
    if (isTilting) {
      tiltActive = false;
    }
  }

  function initTiltListeners() {
    const form = document.getElementById('notifyForm');
    if (!form) return;
    
    tiltActive = true;
    isTilting = false;
    
    // Reset initial state
    currentRotateX = 0;
    currentRotateY = 0;
    currentScale = 1;
    targetRotateX = 0;
    targetRotateY = 0;
    targetScale = 1;
    
    form.style.transform = '';
    form.style.transition = '';
    
    form.addEventListener('touchstart', handleTouchTap);
    form.addEventListener('mousemove', handleMouseMove);
    form.addEventListener('mouseleave', resetTilt);
    form.addEventListener('mouseenter', () => {
      targetScale = 1.005;
      if (!rafId) {
        rafId = requestAnimationFrame(animate);
      }
    });
    form.addEventListener('blur', resetTilt, true);
    
    form.addEventListener('touchend', () => {
      setTimeout(() => {
        if (!isTilting) {
          tiltActive = true;
        }
      }, 50);
    });
  }

  function stopTilt() {
    tiltActive = false;
    resetTilt();
    
    const form = document.getElementById('notifyForm');
    if (form) {
      form.removeEventListener('mousemove', handleMouseMove);
      form.removeEventListener('mouseleave', resetTilt);
      form.removeEventListener('mouseenter', () => {});
      form.removeEventListener('blur', resetTilt, true);
      form.removeEventListener('touchstart', handleTouchTap);
    }
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        if (mutation.target.classList.contains('expanded')) {
          initTiltListeners();
        } else {
          stopTilt();
        }
      }
    });
  });

  const form = document.getElementById('notifyForm');
  if (form) {
    observer.observe(form, { attributes: true, attributeFilter: ['class'] });
  }
}
