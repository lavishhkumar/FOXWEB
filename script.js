const themeToggle = document.querySelector('.theme-toggle');
const filters = document.querySelectorAll('.filter');
const projects = document.querySelectorAll('.project-card');
const contactForm = document.querySelector('#contact-form');
const emailInput = document.querySelector('#email');
const formStatus = document.querySelector('#form-status');
const avatarScene = document.querySelector('.avatar-scene');

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

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('warm');
  const isWarm = document.body.classList.contains('warm');
  themeToggle.querySelector('.theme-label').textContent = isWarm ? 'Warm' : 'Theme';
});

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