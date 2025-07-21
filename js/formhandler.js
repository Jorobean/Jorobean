// Form typing animation and submission handling
export function initFormHandler() {
  const form = document.getElementById("notifyForm");
  const starterInput = document.getElementById("starterInput");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const button = document.getElementById("submitBtn");
  const btnText = button.querySelector(".btn-text");
  const spinner = document.getElementById("spinner");
  const closeBtn = document.getElementById("closeBtn"); // Add reference to close button

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

  // Form expansion
  starterInput.addEventListener("focus", () => {
    clearTimeout(typingInterval);
    form.classList.add("expanded");
    starterInput.value = "";
    nameInput.focus();
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
      if (window.innerHeight < 500 || window.innerWidth > 600) {
        contentWrapper.style.display = 'none';
      } else {
        contentWrapper.style.opacity = '0.3';
      }
    }
    document.body.classList.add('scrolled');
  });

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
      form.classList.remove('expanded');
      restoreAfterClose();
    });
  }

  // Form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!nameInput.value.trim() || !emailInput.value.trim()) {
      alert("Please enter both name and email.");
      return;
    }

    btnText.style.display = "none";
    spinner.style.display = "inline-block";
    button.disabled = true;

    const formData = new FormData();
    formData.append("name", nameInput.value.trim());
    formData.append("email", emailInput.value.trim());

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
          email: emailInput.value.trim()
        })
      });

      if (!formspreeRes.ok) throw new Error("Submit failed");

      spinner.style.display = "none";
      btnText.textContent = "Submit";
      btnText.style.display = "inline-block";

      form.reset();
      form.classList.remove("expanded");
      const contentWrapper = document.querySelector('.content-wrapper');
      if (contentWrapper) {
        contentWrapper.style.display = '';
      }
      if (window.scrollY <= 25) {
        document.body.classList.remove('scrolled');
      }

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