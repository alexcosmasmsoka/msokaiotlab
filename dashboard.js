import { supabase } from './supabase.js';

// ─── DOM refs ────────────────────────────────────────────────────────────────
const userEmailSpan     = document.getElementById('user-email');
const logoutBtn         = document.getElementById('logout-btn');
const projectForm       = document.getElementById('project-form');
const projectsContainer = document.getElementById('projects-container');
const saveBtn           = document.getElementById('save-project-btn');

// ─── Auth guard ──────────────────────────────────────────────────────────────
async function protectPage() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    window.location.replace('admin.html');
    return;
  }

  if (userEmailSpan) userEmailSpan.textContent = session.user.email;
  document.body.classList.remove('loading-auth');

  await loadProjects();
  await loadMessages();
}

protectPage();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Safely escape a string for use in attribute values. */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Build a project card using DOM API (no innerHTML with user data). */
function buildProjectItem(project) {
  const item = document.createElement('div');
  item.className  = 'project-item';
  item.dataset.id = String(project.id);

  // — Thumbnail —
  const img = document.createElement('img');
  img.className = 'project-thumb';
  img.alt       = project.name;          // textContent-equivalent for alt
  img.src       = project.image_url;
  img.onerror   = () => {
    img.src = `https://placehold.co/120x80/0b0f24/59d4ff?text=No+Image`;
  };

  // — Info column —
  const info = document.createElement('div');
  info.className = 'project-info';

  const title = document.createElement('h3');
  title.textContent = project.name;         // ← textContent prevents XSS

  const desc = document.createElement('p');
  const descText = project.description ?? '';
  desc.textContent = descText.length > 120
    ? descText.substring(0, 120) + '…'
    : descText;                              // ← textContent prevents XSS

  const badge = document.createElement('span');
  badge.className   = `status-badge ${project.status === 'published' ? 'status-published' : 'status-draft'}`;
  badge.textContent = project.status;

  info.append(title, desc, badge);

  // — Actions column —
  const actions = document.createElement('div');
  actions.className = 'project-actions';

  // Edit button
  const editBtn = document.createElement('button');
  editBtn.className      = 'btn-icon';
  editBtn.dataset.action = 'edit';
  editBtn.dataset.id     = String(project.id);
  editBtn.title          = 'Edit';
  editBtn.setAttribute('aria-label', `Edit ${project.name}`);
  editBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

  // Publish / Unpublish button
  const isPublished = project.status === 'published';
  const toggleBtn = document.createElement('button');
  toggleBtn.className      = 'btn-icon';
  toggleBtn.dataset.action = 'toggle';
  toggleBtn.dataset.id     = String(project.id);
  toggleBtn.dataset.status = project.status;
  toggleBtn.title          = isPublished ? 'Unpublish' : 'Publish';
  toggleBtn.setAttribute('aria-label', `${isPublished ? 'Unpublish' : 'Publish'} ${project.name}`);
  toggleBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className      = 'btn-icon delete';
  deleteBtn.dataset.action = 'delete';
  deleteBtn.dataset.id     = String(project.id);
  deleteBtn.title          = 'Delete';
  deleteBtn.setAttribute('aria-label', `Delete ${project.name}`);
  deleteBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

  actions.append(editBtn, toggleBtn, deleteBtn);
  item.append(img, info, actions);
  return item;
}

// ─── Load projects ────────────────────────────────────────────────────────────
async function loadProjects() {
  if (!projectsContainer) return;

  const loading = document.createElement('p');
  loading.style.color = 'var(--muted)';
  loading.textContent = 'Loading projects…';
  projectsContainer.replaceChildren(loading);

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    const msg = document.createElement('p');
    msg.style.color = '#ef4444';
    msg.textContent = `Error loading projects: ${error.message}`;
    projectsContainer.replaceChildren(msg);
    return;
  }

  if (!data || data.length === 0) {
    const msg = document.createElement('p');
    msg.style.color = 'var(--muted)';
    msg.textContent = 'No projects yet. Add your first one above!';
    projectsContainer.replaceChildren(msg);
    return;
  }

  // Use a DocumentFragment to minimise reflows
  const fragment = document.createDocumentFragment();
  data.forEach((project) => fragment.appendChild(buildProjectItem(project)));
  projectsContainer.replaceChildren(fragment);
}

// ─── Event delegation for project actions ────────────────────────────────────
projectsContainer?.addEventListener('click', async (e) => {
  const btn = e.target instanceof Element ? e.target.closest('[data-action]') : null;
  if (!btn || !(btn instanceof HTMLElement)) return;

  const id     = btn.dataset.id;
  const action = btn.dataset.action;
  if (!id || !action) return;

  if (action === 'edit')   await handleEdit(id);
  if (action === 'toggle') await handleToggle(id, btn.dataset.status ?? 'draft');
  if (action === 'delete') await handleDelete(id);
});

// ─── Project actions ──────────────────────────────────────────────────────────
async function handleEdit(id) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    alert('Could not load project details.');
    return;
  }

  const idField = document.getElementById('project-id');
  if (idField) idField.value = data.id;
  document.getElementById('proj-name').value  = data.name;
  document.getElementById('proj-image').value = data.image_url;
  document.getElementById('proj-video').value = data.video_url ?? '';
  document.getElementById('proj-status').value = data.status;
  document.getElementById('proj-desc').value  = data.description;

  if (saveBtn) saveBtn.textContent = 'Update Project';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleToggle(id, currentStatus) {
  const newStatus = currentStatus === 'published' ? 'draft' : 'published';
  const { error } = await supabase
    .from('projects')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    alert(`Error updating status: ${error.message}`);
  } else {
    await loadProjects();
  }
}

async function handleDelete(id) {
  if (!confirm('Delete this project? This cannot be undone.')) return;

  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) {
    alert(`Error deleting project: ${error.message}`);
  } else {
    await loadProjects();
  }
}

// ─── Add / Update project form ────────────────────────────────────────────────
projectForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const originalLabel = saveBtn?.textContent ?? 'Save Project';

  try {
    if (saveBtn) {
      saveBtn.textContent = 'Saving…';
      saveBtn.disabled    = true;
    }

    const projectId = document.getElementById('project-id')?.value ?? '';
    const projectData = {
      name:        document.getElementById('proj-name')?.value  ?? '',
      image_url:   document.getElementById('proj-image')?.value ?? '',
      video_url:   document.getElementById('proj-video')?.value ?? '',
      status:      document.getElementById('proj-status')?.value ?? 'draft',
      description: document.getElementById('proj-desc')?.value  ?? '',
    };

    const result = projectId
      ? await supabase.from('projects').update(projectData).eq('id', projectId)
      : await supabase.from('projects').insert([projectData]);

    if (result.error) {
      alert(`Error saving project: ${result.error.message}`);
    } else {
      projectForm.reset();
      const idField = document.getElementById('project-id');
      if (idField) idField.value = '';
      await loadProjects();
    }
  } finally {
    // Always restore button, regardless of success or error
    if (saveBtn) {
      saveBtn.textContent = 'Save Project';
      saveBtn.disabled    = false;
    }
  }
});

// ─── Messages panel ───────────────────────────────────────────────────────────
async function loadMessages() {
  const container = document.getElementById('messages-container');
  if (!container) return;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = '';
    const msg = document.createElement('p');
    msg.style.color = '#ef4444';
    msg.textContent = `Error loading messages: ${error.message}`;
    container.appendChild(msg);
    return;
  }

  if (!data || data.length === 0) {
    const msg = document.createElement('p');
    msg.style.color = 'var(--muted)';
    msg.textContent = 'No messages yet.';
    container.replaceChildren(msg);
    return;
  }

  const fragment = document.createDocumentFragment();
  data.forEach((m) => {
    const card = document.createElement('div');
    card.className = 'message-card';

    const meta = document.createElement('div');
    meta.className = 'message-meta';

    const nameSpan = document.createElement('strong');
    nameSpan.textContent = m.name;

    const emailSpan = document.createElement('span');
    emailSpan.textContent = m.email;
    emailSpan.style.color = 'var(--muted)';
    emailSpan.style.fontSize = '0.85rem';
    emailSpan.style.marginLeft = '0.5rem';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'message-date';
    dateSpan.textContent = new Date(m.created_at).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });

    meta.append(nameSpan, emailSpan, dateSpan);

    const body = document.createElement('p');
    body.className = 'message-body';
    body.textContent = m.message;     // textContent — no XSS

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon delete';
    deleteBtn.dataset.action  = 'delete-msg';
    deleteBtn.dataset.id      = String(m.id);
    deleteBtn.title = 'Delete message';
    deleteBtn.setAttribute('aria-label', `Delete message from ${m.name}`);
    deleteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

    card.append(meta, body, deleteBtn);
    fragment.appendChild(card);
  });

  container.replaceChildren(fragment);
}

// Event delegation for message delete
document.getElementById('messages-container')?.addEventListener('click', async (e) => {
  const btn = e.target instanceof Element ? e.target.closest('[data-action="delete-msg"]') : null;
  if (!btn || !(btn instanceof HTMLElement)) return;

  const id = btn.dataset.id;
  if (!id || !confirm('Delete this message?')) return;

  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) {
    alert(`Error deleting message: ${error.message}`);
  } else {
    await loadMessages();
  }
});

// ─── Logout ──────────────────────────────────────────────────────────────────
logoutBtn?.addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    alert('Error logging out. Please try again.');
  } else {
    window.location.href = 'admin.html';
  }
});

// ─── Auth state listener (handles token expiry) ───────────────────────────────
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') window.location.href = 'admin.html';
});
