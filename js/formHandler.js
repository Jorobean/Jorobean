// Form handling module
export function initFormHandler() {
  // Create form structure
  const formPlaceholder = document.getElementById("form-placeholder");
  
  // Setup floating pill button handler
  const floatingPromoBtns = document.querySelectorAll("#floatingPromoBtn");
  floatingPromoBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const form = document.getElementById("notifyForm");
      if (form) {
        form.classList.add("expanded");
        const nameInput = document.getElementById("name");
        if (nameInput) {
          setTimeout(() => {
            nameInput.focus();
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    });
  });
  
  const formHTML = `
    <form id="notifyForm" novalidate style="display:flex;flex-direction:column;align-items:center;gap:12px;max-width:320px;margin:20px auto 0;" aria-labelledby="formTitle">
      <h2 id="formTitle" class="visually-hidden">Newsletter Signup</h2>
      <button type="button" id="starterInput" class="stay-updated-btn" aria-expanded="false">Enter Contest</button>
      <div class="form-expanded-content" role="region" aria-labelledby="formTitle">
        <div class="input-group">
          <label for="name" class="visually-hidden">Name</label>
          <input type="text" id="name" name="name" placeholder="Name" required aria-required="true" style="padding: 12px 24px; font-size: 1rem; border: 1px solid var(--input-border); border-radius: 9999px; width: 280px; max-width: 240px; margin: 0 auto; box-shadow: 0 4px 10px var(--box-shadow-color); text-align: left; background-color: var(--input-bg); color: var(--text-color);">
        </div>
        <div class="input-group">
          <label for="email" class="visually-hidden">Email</label>
          <input type="email" id="email" name="email" placeholder="Email" required aria-required="true" style="padding: 12px 24px; font-size: 1rem; border: 1px solid var(--input-border); border-radius: 9999px; width: 280px; max-width: 240px; margin: 0 auto; box-shadow: 0 4px 10px var(--box-shadow-color); text-align: left; background-color: var(--input-bg); color: var(--text-color);">
        </div>
        <div class="instagram-input-group">
          <div class="instagram-input-wrapper">
            <label for="instagram" class="visually-hidden">Instagram Handle</label>
            <input type="text" id="instagram" name="instagram" placeholder="username" aria-required="false" style="padding: 12px 24px; font-size: 1rem; border: 1px solid var(--input-border); border-radius: 9999px; width: 280px; max-width: 240px; margin: 0 auto; box-shadow: 0 4px 10px var(--box-shadow-color); text-align: left; background-color: var(--input-bg); color: var(--text-color);">
          </div>
          <p class="instagram-note" style="margin-top: 8px;">Follow <a href="https://instagram.com/jorobean" target="_blank" rel="noopener noreferrer" style="color: #b71111; text-decoration: none;">@Jorobean</a> to double your chances!</p>
        </div>
        <div class="button-group">
          <button type="button" id="closeBtn" class="cancel-btn">Cancel</button>
          <button type="submit" id="submitBtn">
            <span class="btn-text">Submit</span>
            <span id="spinner" class="spinner" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </form>
  `;
  formPlaceholder.innerHTML = formHTML;
  
  const form = document.getElementById("notifyForm");
  const starterInput = document.getElementById("starterInput");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const button = document.getElementById("submitBtn");
  const btnText = button.querySelector(".btn-text");
  const spinner = document.getElementById("spinner");
  const closeBtn = document.getElementById("closeBtn"); // Add reference to close button

  // Handle all "Enter Contest" buttons
  const enterContestButtons = document.querySelectorAll('.stay-updated-btn');
  enterContestButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      if (form) {
        form.classList.add("expanded");
        setTimeout(() => {
          if (nameInput) {
            nameInput.focus();
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    });
  });

  const phrase = "Stay Updated";
  let charIndex = 0, isDeleting = false;
  let typingInterval;

  function type() {
    if (!form.classList.contains("expanded")) {
      if (!isDeleting) {
        starterInput.value = phrase.substring(0, charIndex++);
        if (charIndex > phrase.length) {
          isDeleting = true;
          setTimeout(type, 4000);
          return;
        }
      } else {
        starterInput.value = phrase.substring(0, charIndex--);
        if (charIndex === -1) {
          starterInput.value = '';
          isDeleting = false;
          setTimeout(type, 1200);
          charIndex = 0;
          return;
        }
      }
      typingInterval = setTimeout(type, 100);
    }
  }

  type();

  // Form expansion - handle both click and focus
  function expandForm() {
    clearTimeout(typingInterval);
    form.classList.add("expanded");
    starterInput.value = "";
    // Ensure reliable focus by using a small delay
    setTimeout(() => {
      nameInput.focus();
      nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
      if (window.innerHeight < 500 || window.innerWidth > 600) {
        contentWrapper.style.display = 'none';
      } else {
        contentWrapper.style.opacity = '0.3';
      }
    }
    document.body.classList.add('scrolled');
  }

  starterInput.addEventListener("click", expandForm);
  starterInput.addEventListener("focus", expandForm);

  // Close form function
  function restoreAfterClose() {
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
      if (contentWrapper.style.display === 'none') {
        contentWrapper.style.opacity = 0;
        contentWrapper.style.display = '';
        setTimeout(() => {
          contentWrapper.style.opacity = 1;
        }, 10);
      } else {
        contentWrapper.style.opacity = 1;
      }
    }
    starterInput.value = '';
    starterInput.disabled = false;
    starterInput.style.display = '';
    charIndex = 0;
    isDeleting = false;
    type();
    if (window.scrollY <= 25) {
      document.body.classList.remove('scrolled');
    }
  }

  // Close button event listener
  if (closeBtn) {
    closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      form.classList.remove('expanded');
      nameInput.value = '';
      emailInput.value = '';
      button.disabled = false;
      btnText.style.display = "inline-block";
      spinner.style.display = "none";
      restoreAfterClose();
    });
  } else {
    console.warn('Close button not found in the DOM. Make sure you have an element with id="closeBtn"');
  }

  // Instagram handle validation
  async function validateInstagramHandle(handle) {
    // Remove @ if user included it
    handle = handle.replace('@', '');
    
    // Basic format validation
    const validFormat = /^[a-zA-Z0-9._]{1,30}$/.test(handle);
    if (!validFormat) {
      return { 
        isValid: false, 
        error: "Instagram handle can only contain letters, numbers, periods, and underscores" 
      };
    }

    try {
      // Check if handle has been used before
      const checkDuplicate = await fetch('https://script.google.com/macros/s/AKfycbzqIkE-C45jtw6B-E549upyZkW0aRie2n1xOV50fMM9e7xk4q4v2omf-Qupyt4xoWFQ/exec?check_instagram=' + handle);
      const result = await checkDuplicate.json();
      
      if (result.isDuplicate) {
        return { 
          isValid: false, 
          error: "This Instagram handle has already been used for an entry" 
        };
      }

      // Basic existence check (this is a simplified version)
      const response = await fetch('https://www.instagram.com/' + handle + '/');
      if (response.status === 404) {
        return { 
          isValid: false, 
          error: "This Instagram handle doesn't seem to exist" 
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validating Instagram handle:', error);
      return { 
        isValid: true  // Allow it to pass if our validation service fails
      };
    }
  }

  // Form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!nameInput.value.trim() || !emailInput.value.trim()) {
      alert("Please enter both name and email.");
      return;
    }

    const igInput = document.getElementById("instagram");
    if (igInput && igInput.value.trim()) {
      const validation = await validateInstagramHandle(igInput.value.trim());
      if (!validation.isValid) {
        alert(validation.error);
        igInput.focus();
        return;
      }
    }

    btnText.style.display = "none";
    spinner.style.display = "inline-block";
    button.disabled = true;

    const formData = new FormData();
    formData.append("name", nameInput.value.trim());
    formData.append("email", emailInput.value.trim());
    
    // Add Instagram handle if provided
    const instagramInput = document.getElementById("instagram");
    let entries = 1;
    
    if (instagramInput && instagramInput.value.trim()) {
      const instagramHandle = instagramInput.value.trim().replace('@', '');
      formData.append("instagram", instagramHandle);
      
      try {
        // Verify Instagram follow status
        const verifyResponse = await fetch('https://api.jorobean.com/verify-instagram-follow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instagram_handle: instagramHandle
          })
        });
        
        const verifyResult = await verifyResponse.json();
        
        if (verifyResult.isFollowing) {
          entries = 2;
        }
      } catch (error) {
        console.error('Error verifying Instagram follow:', error);
        // Still store the handle but don't grant extra entry if verification fails
      }
    }
    
    formData.append("entries", entries.toString());

    try {
      // Send to Formspree
      const formspreeRes = await fetch("https://formspree.io/f/meoabwgg", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData
      });

      // Send to Google Sheets
      const sheetsRes = await fetch('https://script.google.com/macros/s/AKfycbzqIkE-C45jtw6B-E549upyZkW0aRie2n1xOV50fMM9e7xk4q4v2omf-Qupyt4xoWFQ/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          instagram: formData.get('instagram') || '',
          entries: formData.get('entries') || '1',
          timestamp: new Date().toISOString()
        })
      });

      if (!formspreeRes.ok) throw new Error("Submit failed");

      spinner.style.display = "none";
      btnText.textContent = "Submit";
      btnText.style.display = "inline-block";

      // Show custom thank you message based on entry count
      const entries = formData.get('entries');
      const thankYouMessage = 
        '<div style="text-align: center; padding: 20px;">' +
        '<h3 style="color: #b71111; margin-bottom: 16px;">Thank you for signing up!</h3>' +
        '<p>You have ' + entries + ' ' + (entries === "1" ? 'entry' : 'entries') + ' in the drawing.</p>' +
        (entries === "1" ? '<p>Follow us on <a href="https://instagram.com/jorobean" target="_blank" rel="noopener noreferrer" style="color: #b71111;">Instagram</a> to double your chances!</p>' : '') +
        '</div>';
      form.innerHTML = thankYouMessage;
      
      setTimeout(() => {
        form.reset();
        form.classList.remove("expanded");
        const contentWrapper = document.querySelector('.content-wrapper');
        if (contentWrapper) {
          contentWrapper.style.display = '';
        }
        if (window.scrollY <= 25) {
          document.body.classList.remove('scrolled');
        }
      }, 5000);

      starterInput.value = "Thank You";
      starterInput.disabled = true;
      starterInput.style.display = "block";

      setTimeout(() => {
        location.reload();
      }, 30000);

    } catch (err) {
      spinner.style.display = "none";
      btnText.style.display = "inline-block";
      btnText.textContent = "Submit";
      button.disabled = false;
      alert("Something went wrong. Try again later.");
      console.error(err);
    }
  });
}
