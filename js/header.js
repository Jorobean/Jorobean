let lastScrollTop = 0;

document.addEventListener('DOMContentLoaded', () => {
  // Initial class on body based on scroll position
  if (window.scrollY > 25) {
    document.body.classList.add('scrolled');
  }

  // Handle scroll events
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    
    // Add/remove scrolled class on body
    if (currentScroll > 25) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }
    
    // Handle header visibility
    if (currentScroll > lastScrollTop && currentScroll > 50) {
      // Scrolling down & past threshold - hide header
      document.body.classList.add('header-hidden');
    } else {
      // Scrolling up or at top - show header
      document.body.classList.remove('header-hidden');
    }
    
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  });
});
