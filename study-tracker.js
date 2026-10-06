// Study Tracker account and session behavior

// DOM references: authentication, profile, and tracker controls
const accountsStorageKey = 'foxweb-study-accounts';
const activeUserStorageKey = 'foxweb-study-active-user';
const authScreen = document.querySelector('#auth-screen');
const trackerApp = document.querySelector('#tracker-app');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const loginMessage = document.querySelector('#login-message');
const registerMessage = document.querySelector('#register-message');
const authTabs = document.querySelectorAll('.auth-tab');
const accountName = document.querySelector('#account-name');
const profileTrigger = document.querySelector('#profile-trigger');
const logoutButton = document.querySelector('#logout-button');
const profileDialog = document.querySelector('#profile-dialog');
const profileCloseButton = document.querySelector('#profile-close');
const profileForm = document.querySelector('#profile-form');
const profileMessage = document.querySelector('#profile-message');
const profilePhotoInput = document.querySelector('#profile-photo');
const removePhotoButton = document.querySelector('#remove-photo');
const deleteAccountButton = document.querySelector('#delete-account');
const headerAvatarImage = document.querySelector('#header-avatar-image');
const headerAvatarInitials = document.querySelector('#header-avatar-initials');
const profileAvatarImage = document.querySelector('#profile-avatar-image');
const profileAvatarInitials = document.querySelector('#profile-avatar-initials');
const sessionForm = document.querySelector('#session-form');
const dateInput = document.querySelector('#study-date');
const dayInput = document.querySelector('#study-day');
const startTimeInput = document.querySelector('#start-time');
const endTimeInput = document.querySelector('#end-time');
const sessionList = document.querySelector('#session-list');
const emptyState = document.querySelector('#empty-state');
const sessionCount = document.querySelector('#session-count');
const formMessage = document.querySelector('#form-message');
const selectAllButton = document.querySelector('#select-all-button');
const bulkActions = document.querySelector('#bulk-actions');
const deleteSelectedButton = document.querySelector('#delete-selected-button');
const cancelSelectionButton = document.querySelector('#cancel-selection-button');

// Read browser-local demo accounts and keep older account records compatible.
function readAccounts() {
  try {
    const accounts = JSON.parse(localStorage.getItem(accountsStorageKey) || '[]');
    if (!Array.isArray(accounts)) return [];

    return accounts.map((account) => {
      const nameParts = (account.name || '').trim().split(/\s+/);
      return {
        ...account,
        firstName: account.firstName || nameParts[0] || '',
        lastName: account.lastName || nameParts.slice(1).join(' '),
        mobile: account.mobile || '',
        course: account.course || '',
        studyClass: account.studyClass || '',
        photo: account.photo || ''
      };
    });
  } catch {
    return [];
  }
}

function readSessions(storageKey) {
  try {
    const savedSessions = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(savedSessions) ? savedSessions : [];
  } catch {
    return [];
  }
}

// Current demo account and its separate session history
let accounts = readAccounts();
let currentAccount = null;
let currentSessionStorageKey = '';
let sessions = [];
let bulkDeleteMode = false;
let pendingProfilePhoto = '';

// Profile display and avatar helpers
function getAccountName(account) {
  return `${account.firstName} ${account.lastName}`.trim() || account.name || 'Student';
}

function getAccountInitials(account) {
  const name = getAccountName(account);
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'S';
}

function updateAvatar(photo, initials) {
  headerAvatarInitials.textContent = initials;
  headerAvatarImage.hidden = !photo;
  if (photo) {
    headerAvatarImage.src = photo;
  } else {
    headerAvatarImage.removeAttribute('src');
  }

  updateProfileAvatar(photo, initials);
}

function updateProfileAvatar(photo, initials) {
  profileAvatarInitials.textContent = initials;
  profileAvatarImage.hidden = !photo;
  if (photo) {
    profileAvatarImage.src = photo;
  } else {
    profileAvatarImage.removeAttribute('src');
  }
}

function showProfileError(message) {
  profileMessage.textContent = message;
  profileMessage.classList.add('error');
}

function resizeProfilePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose an image file.'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Choose an image smaller than 5 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The image could not be read.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('The selected image could not be opened.'));
      image.onload = () => {
        const cropSize = Math.min(image.width, image.height);
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        context.drawImage(
          image,
          (image.width - cropSize) / 2,
          (image.height - cropSize) / 2,
          cropSize,
          cropSize,
          0,
          0,
          256,
          256
        );
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Login and registration form behavior
function showAuthMode(mode) {
  const isRegisterMode = mode === 'register';
  loginForm.hidden = isRegisterMode;
  registerForm.hidden = !isRegisterMode;
  loginMessage.textContent = '';
  registerMessage.textContent = '';
  loginMessage.classList.remove('error');
  registerMessage.classList.remove('error');

  authTabs.forEach((tab) => {
    const isActive = tab.dataset.authMode === mode;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
}

function setCurrentAccount(account) {
  currentAccount = account;
  currentSessionStorageKey = `foxweb-study-sessions:${encodeURIComponent(account.email)}`;
  sessions = readSessions(currentSessionStorageKey);
  bulkDeleteMode = false;
  sessionStorage.setItem(activeUserStorageKey, account.email);
  accountName.textContent = getAccountName(account);
  updateAvatar(account.photo, getAccountInitials(account));
  profileTrigger.hidden = false;
  logoutButton.hidden = false;
  authScreen.hidden = true;
  trackerApp.hidden = false;
  renderSessions();
}

// Populate the profile editor from the signed-in account.
function openProfile() {
  if (!currentAccount) return;

  profileForm.reset();
  document.querySelector('#profile-first-name').value = currentAccount.firstName;
  document.querySelector('#profile-last-name').value = currentAccount.lastName;
  document.querySelector('#profile-email').value = currentAccount.email;
  document.querySelector('#profile-mobile').value = currentAccount.mobile;
  document.querySelector('#profile-course').value = currentAccount.course;
  document.querySelector('#profile-class').value = currentAccount.studyClass;
  pendingProfilePhoto = currentAccount.photo;
  updateProfileAvatar(pendingProfilePhoto, getAccountInitials(currentAccount));
  profileMessage.textContent = '';
  profileMessage.classList.remove('error');
  profileDialog.showModal();
}

function showLoginError(message) {
  loginMessage.textContent = message;
  loginMessage.classList.add('error');
}

authTabs.forEach((tab) => {
  tab.addEventListener('click', () => showAuthMode(tab.dataset.authMode));
});

// Create a demo account and send the student to the login form.
registerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  registerMessage.textContent = '';
  registerMessage.classList.remove('error');

  const formData = new FormData(registerForm);
  const firstName = formData.get('firstName').trim();
  const lastName = formData.get('lastName').trim();
  const account = {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    email: formData.get('email').trim().toLowerCase(),
    mobile: formData.get('mobile').trim(),
    course: formData.get('course').trim(),
    studyClass: formData.get('studyClass').trim(),
    photo: '',
    password: formData.get('password')
  };

  if (accounts.some((savedAccount) => savedAccount.email === account.email)) {
    registerMessage.textContent = 'An account with this email already exists.';
    registerMessage.classList.add('error');
    return;
  }

  accounts.push(account);
  localStorage.setItem(accountsStorageKey, JSON.stringify(accounts));
  registerForm.reset();
  document.querySelector('#login-email').value = account.email;
  showAuthMode('login');
  loginMessage.textContent = 'Demo account created. Log in with your new details.';
});

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loginMessage.textContent = '';
  loginMessage.classList.remove('error');

  const formData = new FormData(loginForm);
  const email = formData.get('email').trim().toLowerCase();
  const password = formData.get('password');
  const account = accounts.find((savedAccount) => savedAccount.email === email && savedAccount.password === password);

  if (!account) {
    showLoginError('Email or password does not match a demo account.');
    return;
  }

  loginForm.reset();
  setCurrentAccount(account);
});

// Profile editing, photo updates, password changes, and account deletion
profileTrigger.addEventListener('click', openProfile);
profileCloseButton.addEventListener('click', () => profileDialog.close());

profileDialog.addEventListener('click', (event) => {
  if (event.target === profileDialog) profileDialog.close();
});

profileDialog.addEventListener('close', () => {
  profileForm.reset();
  if (currentAccount) {
    pendingProfilePhoto = currentAccount.photo;
    updateProfileAvatar(pendingProfilePhoto, getAccountInitials(currentAccount));
  }
});

profilePhotoInput.addEventListener('change', async () => {
  const [file] = profilePhotoInput.files;
  if (!file) return;

  profileMessage.textContent = '';
  profileMessage.classList.remove('error');
  try {
    pendingProfilePhoto = await resizeProfilePhoto(file);
    updateProfileAvatar(pendingProfilePhoto, getAccountInitials(currentAccount));
  } catch (error) {
    showProfileError(error.message);
    profilePhotoInput.value = '';
  }
});

removePhotoButton.addEventListener('click', () => {
  pendingProfilePhoto = '';
  profilePhotoInput.value = '';
  updateProfileAvatar('', getAccountInitials(currentAccount));
});

profileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  profileMessage.textContent = '';
  profileMessage.classList.remove('error');

  const formData = new FormData(profileForm);
  const firstName = formData.get('firstName').trim();
  const lastName = formData.get('lastName').trim();
  const email = formData.get('email').trim().toLowerCase();
  const currentPassword = formData.get('currentPassword');
  const newPassword = formData.get('newPassword');
  const confirmPassword = formData.get('confirmPassword');

  if (accounts.some((account) => account.email === email && account.email !== currentAccount.email)) {
    showProfileError('That email is already used by another account.');
    return;
  }

  if (currentPassword || newPassword || confirmPassword) {
    if (currentPassword !== currentAccount.password) {
      showProfileError('Enter your current password to change it.');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      showProfileError('Your new password must be at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showProfileError('The new passwords do not match.');
      return;
    }
  }

  const previousEmail = currentAccount.email;
  const previousStorageKey = currentSessionStorageKey;
  const updatedAccount = {
    ...currentAccount,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    email,
    mobile: formData.get('mobile').trim(),
    course: formData.get('course').trim(),
    studyClass: formData.get('studyClass').trim(),
    photo: pendingProfilePhoto
  };

  if (newPassword) updatedAccount.password = newPassword;

  accounts = accounts.map((account) => account.email === previousEmail ? updatedAccount : account);
  localStorage.setItem(accountsStorageKey, JSON.stringify(accounts));

  const updatedStorageKey = `foxweb-study-sessions:${encodeURIComponent(email)}`;
  if (updatedStorageKey !== previousStorageKey) {
    localStorage.setItem(updatedStorageKey, JSON.stringify(sessions));
    localStorage.removeItem(previousStorageKey);
  }

  currentAccount = updatedAccount;
  currentSessionStorageKey = updatedStorageKey;
  sessionStorage.setItem(activeUserStorageKey, email);
  accountName.textContent = getAccountName(updatedAccount);
  updateAvatar(updatedAccount.photo, getAccountInitials(updatedAccount));
  profileDialog.close();
  profileForm.reset();
});

deleteAccountButton.addEventListener('click', () => {
  if (!currentAccount || !window.confirm('Delete this demo account and all of its study sessions from this browser?')) return;

  accounts = accounts.filter((account) => account.email !== currentAccount.email);
  localStorage.setItem(accountsStorageKey, JSON.stringify(accounts));
  localStorage.removeItem(currentSessionStorageKey);
  sessionStorage.removeItem(activeUserStorageKey);
  currentAccount = null;
  currentSessionStorageKey = '';
  sessions = [];
  profileDialog.close();
  trackerApp.hidden = true;
  authScreen.hidden = false;
  profileTrigger.hidden = true;
  logoutButton.hidden = true;
  showAuthMode('login');
  loginMessage.textContent = 'Your demo account and its study sessions were deleted.';
});

logoutButton.addEventListener('click', () => {
  sessionStorage.removeItem(activeUserStorageKey);
  currentAccount = null;
  currentSessionStorageKey = '';
  sessions = [];
  trackerApp.hidden = true;
  authScreen.hidden = false;
  accountName.hidden = true;
  profileTrigger.hidden = true;
  logoutButton.hidden = true;
  loginForm.reset();
  showAuthMode('login');
});

// Date and time formatting for saved study sessions
function updateWeekday() {
  if (!dateInput.value) {
    dayInput.value = '';
    return;
  }

  const [year, month, day] = dateInput.value.split('-').map(Number);
  dayInput.value = new Intl.DateTimeFormat('en', { weekday: 'long' }).format(new Date(year, month - 1, day));
}

function formatDate(date, weekday) {
  const [year, month, day] = date.split('-').map(Number);
  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(year, month - 1, day));
  return `${weekday} / ${formattedDate}`;
}

function formatTime(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(2000, 0, 1, hours, minutes));
}

// Render saved sessions and handle individual or bulk deletion
function renderSessions() {
  sessionList.replaceChildren();
  emptyState.hidden = sessions.length > 0;
  sessionCount.textContent = `${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}`;
  selectAllButton.hidden = bulkDeleteMode;
  selectAllButton.disabled = sessions.length === 0;
  bulkActions.hidden = !bulkDeleteMode;

  sessions
    .slice()
    .sort((first, second) => `${second.date}${second.startTime}`.localeCompare(`${first.date}${first.startTime}`))
    .forEach((session) => {
      const item = document.createElement('li');
      item.className = 'session-item';
      item.dataset.sessionId = session.id;

      const details = document.createElement('div');
      const date = document.createElement('p');
      date.className = 'session-date';
      date.textContent = formatDate(session.date, session.day);

      const subject = document.createElement('h3');
      subject.textContent = session.subject;

      const topic = document.createElement('p');
      topic.className = 'session-topic';
      topic.textContent = session.topic;

      const time = document.createElement('p');
      time.className = 'session-time';
      time.textContent = `${formatTime(session.startTime)} – ${formatTime(session.endTime)}`;

      details.append(date, subject, topic, time);

      const actions = document.createElement('div');
      actions.className = 'session-item-actions';

      const selectLabel = document.createElement('label');
      selectLabel.className = 'session-select-label';
      selectLabel.hidden = !bulkDeleteMode;

      const checkbox = document.createElement('input');
      checkbox.className = 'session-select';
      checkbox.type = 'checkbox';
      checkbox.checked = bulkDeleteMode;
      checkbox.setAttribute('aria-label', `Select ${session.subject} session for deletion`);
      checkbox.addEventListener('change', updateDeleteSelection);
      selectLabel.append(checkbox);

      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-session';
      deleteButton.type = 'button';
      deleteButton.textContent = '×';
      deleteButton.setAttribute('aria-label', `Delete ${session.subject} session`);
      deleteButton.addEventListener('click', () => {
        sessions = sessions.filter((savedSession) => savedSession.id !== session.id);
        localStorage.setItem(currentSessionStorageKey, JSON.stringify(sessions));
        renderSessions();
      });

      actions.append(selectLabel, deleteButton);
      item.append(details, actions);
      sessionList.append(item);
    });

  updateDeleteSelection();
}

function updateDeleteSelection() {
  const selectedCount = sessionList.querySelectorAll('.session-select:checked').length;
  deleteSelectedButton.textContent = `Delete selected (${selectedCount})`;
  deleteSelectedButton.disabled = selectedCount === 0;
}

dateInput.addEventListener('change', updateWeekday);

selectAllButton.addEventListener('click', () => {
  bulkDeleteMode = true;
  renderSessions();
});

cancelSelectionButton.addEventListener('click', () => {
  bulkDeleteMode = false;
  renderSessions();
});

deleteSelectedButton.addEventListener('click', () => {
  const selectedIds = new Set(
    Array.from(sessionList.querySelectorAll('.session-select:checked'), (checkbox) => {
      const item = checkbox.closest('.session-item');
      return item.dataset.sessionId;
    })
  );
  sessions = sessions.filter((session) => !selectedIds.has(session.id));
  localStorage.setItem(currentSessionStorageKey, JSON.stringify(sessions));
  bulkDeleteMode = false;
  renderSessions();
});

// Validate and save a study session for the active account
sessionForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formMessage.textContent = '';

  if (endTimeInput.value <= startTimeInput.value) {
    formMessage.textContent = 'End time must be later than start time.';
    endTimeInput.focus();
    return;
  }

  const formData = new FormData(sessionForm);
  const session = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: formData.get('date'),
    day: dayInput.value,
    subject: formData.get('subject'),
    topic: formData.get('topic').trim(),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime')
  };

  sessions.push(session);
  localStorage.setItem(currentSessionStorageKey, JSON.stringify(sessions));
  bulkDeleteMode = false;
  renderSessions();
  sessionForm.reset();
  dayInput.value = '';
  formMessage.textContent = 'Session saved.';
  dateInput.focus();
});

// Restore the signed-in account for this browser tab, if one exists.
const activeEmail = sessionStorage.getItem(activeUserStorageKey);
const activeAccount = accounts.find((account) => account.email === activeEmail);

if (activeAccount) {
  setCurrentAccount(activeAccount);
} else {
  authScreen.hidden = false;
  trackerApp.hidden = true;
}