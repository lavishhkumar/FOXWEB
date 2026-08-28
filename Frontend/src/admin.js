const api = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const list = document.querySelector('#adminList');
document.querySelectorAll('[data-table]').forEach(button => button.addEventListener('click', async () => {
  list.innerHTML = '<p class="muted">Loading...</p>';
  try {
    const response = await fetch(`${api}/admin/${button.dataset.table}`, { headers: { 'x-admin-key': document.querySelector('#adminKey').value } });
    if (!response.ok) throw new Error();
    const rows = await response.json();
    list.innerHTML = rows.length ? rows.map(row => `<article><strong>${row.name}</strong><small>${row.email || 'Feedback'} • ${new Date(row.created_at).toLocaleString()}</small><p>${row.message || row.description}</p>${row.attachment_url ? `<a href="${row.attachment_url}" target="_blank">Open attachment ↗</a>` : ''}</article>`).join('') : '<p class="muted">No submissions yet.</p>';
  } catch { list.innerHTML = '<p class="muted">Access failed. Check your key and backend URL.</p>'; }
}));