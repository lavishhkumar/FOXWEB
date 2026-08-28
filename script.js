const themeToggle = document.querySelector('.theme-toggle');
const filters = document.querySelectorAll('.filter');
const projects = document.querySelectorAll('.project-card');
const contactForm = document.querySelector('#contact-form');
const emailInput = document.querySelector('#email');
const formStatus = document.querySelector('#form-status');
const avatarScene = document.querySelector('.avatar-scene');
const backToTop = document.querySelector('.back-to-top');

// Back-to-top button: reveal it after scrolling and return smoothly to the page top.
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 420);
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Homepage avatar: move the pupils toward the pointer position.
if (avatarScene) {
  avatarScene.addEventListener('pointermove', (event) => {
    const bounds = avatarScene.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    const y = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    const pupilX = `${Math.max(-7, Math.min(7, x * 7))}px`;
    const pupilY = `${Math.max(-7, Math.min(7, y * 7))}px`;
    avatarScene.style.setProperty('--pupil-x', pupilX);
    avatarScene.style.setProperty('--pupil-y', pupilY);
  });

  avatarScene.addEventListener('pointerleave', () => {
    avatarScene.style.setProperty('--pupil-x', '0px');
    avatarScene.style.setProperty('--pupil-y', '0px');
  });
}

// Theme toggle: switch the page color variables between the default and warm themes.
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('warm');
    const isWarm = document.body.classList.contains('warm');
    themeToggle.querySelector('.theme-label').textContent = isWarm ? 'Warm' : 'Theme';
  });
}

// Project filters: show only cards matching the selected category.
filters.forEach((filter) => {
  filter.addEventListener('click', () => {
    filters.forEach((button) => button.classList.remove('active'));
    filter.classList.add('active');
    const category = filter.dataset.filter;
    projects.forEach((project) => {
      project.classList.toggle('hidden', category !== 'all' && project.dataset.category !== category);
    });
  });
});

// Contact form: validate the email and show a success message without reloading the page.
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    emailInput.setCustomValidity('');
    if (!emailInput.validity.valid) {
      emailInput.setCustomValidity('Enter a valid email');
      emailInput.reportValidity();
      return;
    }
    formStatus.textContent = 'Thank you for contacting me. I will reply soon.';
    contactForm.reset();
  });

  emailInput.addEventListener('input', () => {
    emailInput.setCustomValidity('');
  });

  emailInput.addEventListener('invalid', () => {
    if (!emailInput.validity.valid) {
      emailInput.setCustomValidity('Enter a valid email');
    }
  });
}