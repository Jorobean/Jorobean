let lastScrollTop = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
  const header = document.querySelector('.header');
  
  // Determine scroll direction
  if (currentScroll > lastScrollTop && currentScroll > 50) {
    // Scrolling down & past threshold
    header.classList.add('nav-up');
  } else {
    // Scrolling up or at top
    header.classList.remove('nav-up');
  }
  
  lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
});
