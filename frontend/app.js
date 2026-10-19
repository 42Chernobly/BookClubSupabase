// Change this to your deployed backend URL after deployment (no trailing slash)
const API_BASE = window.API_BASE ?? (location.protocol === 'file:' ? 'http://localhost:3000' : '');
const API = `${API_BASE}/api/meetings`;

const form = document.getElementById('meetingForm');
const tbody = document.getElementById('tbody');
const msg = document.getElementById('msg');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');
const fields = ['book_title', 'author', 'meeting_date', 'location', 'host_name', 'attendees', 'discussion_notes'];

function showMsg(text, isError = false) {
  msg.textContent = text;
  msg.className = isError ? 'error' : '';
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function request(url, options) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function loadMeetings() {
  try {
    const rows = await request(API);
    tbody.innerHTML = rows.length
      ? rows.map((m) => `
        <tr>
          <td>${m.id}</td>
          <td>${esc(m.book_title)}</td>
          <td>${esc(m.author)}</td>
          <td>${esc(m.meeting_date)}</td>
          <td>${esc(m.location)}</td>
          <td>${esc(m.host_name)}</td>
          <td>${esc(m.attendees)}</td>
          <td>${esc(m.discussion_notes)}</td>
          <td>
            <button class="edit" onclick="editMeeting(${m.id})">Edit</button>
            <button class="del" onclick="deleteMeeting(${m.id})">Delete</button>
          </td>
        </tr>`).join('')
      : '<tr><td colspan="9">No meetings yet.</td></tr>';
  } catch (err) {
    showMsg('Could not load meetings: ' + err.message, true);
  }
}

function resetForm() {
  form.reset();
  document.getElementById('meetingId').value = '';
  document.getElementById('attendees').value = 0;
  formTitle.textContent = 'Add a new meeting';
  cancelBtn.hidden = true;
}

async function editMeeting(id) {
  try {
    const m = await request(`${API}/${id}`);
    document.getElementById('meetingId').value = m.id;
    fields.forEach((f) => (document.getElementById(f).value = m[f] ?? ''));
    formTitle.textContent = `Editing meeting #${m.id}`;
    cancelBtn.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    showMsg(err.message, true);
  }
}

async function deleteMeeting(id) {
  if (!confirm(`Delete meeting #${id}?`)) return;
  try {
    await request(`${API}/${id}`, { method: 'DELETE' });
    showMsg('Meeting deleted.');
    if (document.getElementById('meetingId').value == id) resetForm();
    loadMeetings();
  } catch (err) {
    showMsg(err.message, true);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('meetingId').value;
  const body = {};
  fields.forEach((f) => (body[f] = document.getElementById(f).value));
  body.attendees = Number(body.attendees) || 0;

  try {
    if (id) {
      await request(`${API}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      showMsg('Meeting updated.');
    } else {
      await request(API, { method: 'POST', body: JSON.stringify(body) });
      showMsg('Meeting created.');
    }
    resetForm();
    loadMeetings();
  } catch (err) {
    showMsg(err.message, true);
  }
});

cancelBtn.addEventListener('click', () => {
  resetForm();
  showMsg('');
});

loadMeetings();
