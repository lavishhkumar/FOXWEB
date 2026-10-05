const sessionStorageKey = 'foxweb-study-sessions';
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

function readSessions() {
  try {
    const savedSessions = JSON.parse(localStorage.getItem(sessionStorageKey) || '[]');
    return Array.isArray(savedSessions) ? savedSessions : [];
  } catch {
    return [];
  }
}

let sessions = readSessions();
let bulkDeleteMode = false;

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
        localStorage.setItem(sessionStorageKey, JSON.stringify(sessions));
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
  localStorage.setItem(sessionStorageKey, JSON.stringify(sessions));
  bulkDeleteMode = false;
  renderSessions();
});

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
  localStorage.setItem(sessionStorageKey, JSON.stringify(sessions));
  bulkDeleteMode = false;
  renderSessions();
  sessionForm.reset();
  dayInput.value = '';
  formMessage.textContent = 'Session saved.';
  dateInput.focus();
});

renderSessions();