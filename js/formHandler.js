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
            <label for="instagram" class="visually-hidden">Instagram Username</label>
            <input type="text" id="instagram" name="instagram" placeholder="Username (without @)" pattern="^[a-zA-Z0-9._]{1,30}$" aria-required="false" style="padding: 12px 24px; font-size: 1rem; border: 1px solid var(--input-border); border-radius: 9999px; width: 280px; max-width: 240px; margin: 0 auto; box-shadow: 0 4px 10px var(--box-shadow-color); text-align: left; background-color: var(--input-bg); color: var(--text-color);">
          </div>
                      <p class="instagram-note">Follow <a href="https://instagram.com/jorobean" target="_blank" rel="noopener noreferrer" style="color: #b71111; text-decoration: underline;">@jorobean</a> to double your chances!</p>
      </div>
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
  const closeBtn = document.getElementById("closeBtn");

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
    setTimeout(() => {
      nameInput.focus();
      // Calculate vertical scroll position that shows both form and shoe
      const formRect = form.getBoundingClientRect();
      const scrollY = window.scrollY + formRect.top - (window.innerHeight / 2) + (formRect.height / 2);
      window.scrollTo({ top: scrollY, behavior: 'smooth' });
    }, 300);
    document.body.classList.add('scrolled');
  }

  starterInput.addEventListener("click", expandForm);
  starterInput.addEventListener("focus", expandForm);

  // Close form function
  function restoreAfterClose() {
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
  }

  // Instagram handle basic validation
  function validateInstagramHandle(handle) {
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
    return { isValid: true };
  }  // Form submission
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
    if (window.showLoading) window.showLoading();

    // Prepare data for both services
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const instagramInput = document.getElementById("instagram");
    const instagramHandle = instagramInput && instagramInput.value.trim() ? 
      instagramInput.value.trim().replace('@', '') : '';

    try {
      // Send to Formspree first
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      if (instagramHandle) {
        formData.append("instagram", instagramHandle);
      }
      formData.append("entries", "1");

      const formspreeRes = await fetch("https://formspree.io/f/meoabwgg", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData
      });

      if (!formspreeRes.ok) {
        throw new Error('Formspree submission failed');
      }

      // Send to Google Sheets - Updated URL
      const sheetsUrl = 'https://script.google.com/macros/s/AKfycbzlCUZKRlBshwW3PByoh0TVPErbyDL6I1kbSNuggmvLp03emrL__GsRN52RxHXqqDX9/exec';
      const now = new Date();
      const formattedDate = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      const sheetsParams = new URLSearchParams({
        name: name,
        email: email,
        instagram: instagramHandle,
        timestamp: formattedDate
      });

      const sheetsResponse = await fetch(`${sheetsUrl}?${sheetsParams.toString()}`, {
        method: 'GET'
      });

      const sheetsResult = await sheetsResponse.json();
      
      if (sheetsResult.status !== 'success') {
        console.error('Google Sheets error:', sheetsResult.message);
        // Continue anyway since Formspree worked
      }

      // Show success message
      spinner.style.display = "none";
      btnText.textContent = "Submit";
      btnText.style.display = "inline-block";
      if (window.hideLoading) window.hideLoading();

      const thankYouMessage = 
        '<div style="text-align: center; padding: 20px;">' +
        '<h3 style="color: #b71111; margin-bottom: 16px;">Thank you for signing up!</h3>' +
        '<p>You have 1 entry in the drawing.</p>' +
        '<p>Follow us on <a href="https://instagram.com/jorobean" target="_blank" rel="noopener noreferrer" style="color: #b71111;">@jorobean</a> on Instagram to double your chances!</p>' +
        '</div>';
      form.innerHTML = thankYouMessage;
      
      // Reset after delay
      setTimeout(() => {
        form.reset();
        form.classList.remove("expanded");
        restoreAfterClose();
      }, 10000);

      starterInput.value = "Thank You";
      starterInput.disabled = true;

      setTimeout(() => {
        location.reload();
      }, 30000);

    } catch (err) {
      spinner.style.display = "none";
      btnText.style.display = "inline-block";
      btnText.textContent = "Submit";
      button.disabled = false;
      if (window.hideLoading) window.hideLoading();
      alert("Unable to submit form. Please try again.");
      console.error('Form submission error:', err);
    }
  });
}