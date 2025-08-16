// Logo scroll effect
export function initLogoScroll() {
  let lastScrollPosition = 0;
  const scrollThreshold = 25;
  let ticking = false;

  function handleScroll() {
    const currentScroll = window.scrollY;
    const notifyForm = document.getElementById('notifyForm');
    
    // Only check form if it exists (index page)
    if (notifyForm?.classList.contains('expanded')) {
      if (!document.body.classList.contains('scrolled')) {
        document.body.classList.add('scrolled');
      }
      ticking = false;
      return;
    }

    const shouldBeScrolled = currentScroll > scrollThreshold;
    const isCurrentlyScrolled = document.body.classList.contains('scrolled');

    if (shouldBeScrolled !== isCurrentlyScrolled) {
      document.body.classList.toggle('scrolled', shouldBeScrolled);
    }
    
    lastScrollPosition = currentScroll;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleScroll();
      });
      ticking = true;
    }
  }, { passive: true });

  const form = document.getElementById('notifyForm');
  if (form) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (mutation.target.classList.contains('expanded')) {
            document.body.classList.add('scrolled');
          } else if (!window.scrollY) {
            document.body.classList.remove('scrolled');
          }
          break;
        }
      }
    });

    observer.observe(form, { attributes: true, attributeFilter: ['class'] });
  }

  // Initial check
  handleScroll();
}
