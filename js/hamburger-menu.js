document.addEventListener('DOMContentLoaded', () => {
  const hamburgerMenu = document.querySelector('.hamburger-menu');
  const menuOverlay = document.querySelector('.menu-overlay');
  const accordionItems = document.querySelectorAll('.accordion-item');

  // Function to determine if a color is dark
  function isColorDark(color) {
    // Handle rgba colors
    if (color.startsWith('rgba')) {
      const values = color.match(/[\d.]+/g);
      if (values[3] === '0') return false; // Transparent background, assume light
      return (parseInt(values[0]) * 299 + parseInt(values[1]) * 587 + parseInt(values[2]) * 114) / 1000 < 128;
    }
    // Handle rgb colors
    const rgb = color.match(/\d+/g);
    if (!rgb) return false;
    return (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000 < 128;
  }

  // Function to get the background color of the element behind the hamburger
  function getBackgroundColor() {
    const rect = hamburgerMenu.getBoundingClientRect();
    const elements = document.elementsFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    ).filter(el => !hamburgerMenu.contains(el) && el !== hamburgerMenu);

    for (const element of elements) {
      const bgColor = window.getComputedStyle(element).backgroundColor;
      if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        return bgColor;
      }
    }
    return 'rgb(255, 255, 255)'; // Default to white if no background found
  }

  // Function to update hamburger color based on background
  function updateHamburgerColor() {
    const backgroundColor = getBackgroundColor();
    const isDark = isColorDark(backgroundColor);
    hamburgerMenu.classList.toggle('light', isDark);
    hamburgerMenu.classList.toggle('dark', !isDark);
  }

  // Update color on scroll and every 100ms for dynamic content
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateHamburgerColor, 10);
  });

  // Check color periodically for dynamic content changes
  setInterval(updateHamburgerColor, 100);

  // Handle scroll to show/hide hamburger menu
  function handleScroll() {
    const isMenuOpen = menuOverlay.classList.contains('active');
    const logoCorner = document.querySelector('.logo-corner');
    
    if (isMenuOpen) {
      // Keep elements visible when menu is open
      hamburgerMenu.style.opacity = '1';
      hamburgerMenu.style.visibility = 'visible';
      logoCorner.style.opacity = '1';
      logoCorner.style.visibility = 'visible';
    } else {
      // Normal scroll behavior when menu is closed
      if (window.scrollY > 100) {
        document.body.classList.add('scrolled');
        hamburgerMenu.style.opacity = '1';
        hamburgerMenu.style.visibility = 'visible';
        logoCorner.style.opacity = '1';
        logoCorner.style.visibility = 'visible';
      } else {
        document.body.classList.remove('scrolled');
        hamburgerMenu.style.opacity = '0';
        hamburgerMenu.style.visibility = 'hidden';
        logoCorner.style.opacity = '0';
        logoCorner.style.visibility = 'hidden';
      }
    }
  }

  // Add scroll event listener
  window.addEventListener('scroll', handleScroll);
  
  // Initial check for scroll position
  handleScroll();

    // Toggle menu with click and touch events
  function toggleMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    const isOpening = !menuOverlay.classList.contains('active');
    
    hamburgerMenu.classList.toggle('active');
    menuOverlay.classList.toggle('active');
    document.body.style.overflow = isOpening ? 'hidden' : '';
    
    // Handle promo pill visibility
    const promoPill = document.querySelector('.floating-promo-button');
    if (promoPill) {
      promoPill.style.display = isOpening ? 'none' : '';
    }
    
    const logoCorner = document.querySelector('.logo-corner');    if (!isOpening) {
      // When closing, revert to scroll-based visibility
      handleScroll();
      logoCorner.style.removeProperty('opacity');
      logoCorner.style.removeProperty('visibility');
    } else {
      // When opening, ensure visibility
      hamburgerMenu.style.opacity = '1';
      hamburgerMenu.style.visibility = 'visible';
      logoCorner.style.opacity = '1';
      logoCorner.style.visibility = 'visible';
    }
  }

  // Add event listeners for both the main hamburger and close button
  hamburgerMenu.addEventListener('click', toggleMenu);
  hamburgerMenu.addEventListener('touchend', toggleMenu);
  
  // Handle close button in menu
  const closeButton = document.querySelector('.close-button');
  if (closeButton && closeButton !== hamburgerMenu) {
    closeButton.addEventListener('click', toggleMenu);
    closeButton.addEventListener('touchend', toggleMenu);
  }

  // Handle accordion items
  accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');
    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close other accordion items
      accordionItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
        }
      });

      // Toggle current item
      item.classList.toggle('active');
    });
  });

  // Removed click-outside-to-close functionality

  // Ensure menu visibility matches scroll position on load
  if (window.scrollY > 100) {
    document.body.classList.add('scrolled');
  }
});
