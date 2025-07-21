// Logo scroll effect
export function initLogoScroll() {
  let lastScrollPosition = 0;
  const scrollThreshold = 25;

  function handleScroll() {
    const currentScroll = window.scrollY;
    const notifyForm = document.getElementById('notifyForm');
    
    // Only check form if it exists (index page)
    if (notifyForm && notifyForm.classList.contains('expanded')) {
      document.body.classList.add('scrolled');
      return;
    }

    if (currentScroll > scrollThreshold && lastScrollPosition <= scrollThreshold) {
      document.body.classList.add('scrolled');
    } else if (currentScroll <= scrollThreshold && lastScrollPosition > scrollThreshold) {
      document.body.classList.remove('scrolled');
    }
    
    lastScrollPosition = currentScroll;
  }

  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) {
      window.cancelAnimationFrame(scrollTimeout);
    }
    scrollTimeout = window.requestAnimationFrame(() => {
      handleScroll();
    });
  });

  const form = document.getElementById('notifyForm');
  if (form) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (mutation.target.classList.contains('expanded')) {
            document.body.classList.add('scrolled');
          } else if (!window.scrollY) {
            document.body.classList.remove('scrolled');
          }
        }
      });
    });

    observer.observe(form, { attributes: true, attributeFilter: ['class'] });
  }

  // Initial check
  handleScroll();
}
