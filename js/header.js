let lastScrollTop = 0;
let scrollTimeout;

document.addEventListener('DOMContentLoaded', () => {
  // Initial class on body based on scroll position
  if (window.scrollY > 25) {
    document.body.classList.add('scrolled');
  }

  // Handle scroll events with debouncing
  window.addEventListener('scroll', () => {
    if (!scrollTimeout) {
      scrollTimeout = setTimeout(() => {
        const currentScroll = window.scrollY;
        
        // Add/remove scrolled class on body with a small threshold
        if (currentScroll > 25) {
          document.body.classList.add('scrolled');
        } else if (currentScroll === 0) {
          // Only remove when actually at top to prevent flicker
          document.body.classList.remove('scrolled');
        }
        
        // Handle header visibility with larger threshold
        if (currentScroll > lastScrollTop && currentScroll > 100) {
          // Scrolling down & past threshold - hide header
          document.body.classList.add('header-hidden');
        } else if (currentScroll < lastScrollTop || currentScroll < 50) {
          // Scrolling up or near top - show header
          document.body.classList.remove('header-hidden');
        }
        
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        scrollTimeout = null;
      }, 10); // Small delay to debounce scroll events
    }
  }, { passive: true }); // Add passive flag for better scroll performance
});
