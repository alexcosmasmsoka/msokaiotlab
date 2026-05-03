import { supabase } from './supabase.js';

const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const projectForm = document.getElementById('project-form');
const projectsContainer = document.getElementById('projects-container');

// Protect the page: Check for active session
async function protectPage() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
        window.location.replace('admin.html');
        return;
    }

    userEmailSpan.textContent = session.user.email;
    document.body.classList.remove('loading-auth');
    
    // Load projects once authenticated
    loadProjects();
}

protectPage();

// --- CRUD Operations ---

async function loadProjects() {
    projectsContainer.innerHTML = '<p style="color: var(--muted);">Loading projects...</p>';
    
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        projectsContainer.innerHTML = '<p style="color: #ef4444;">Error loading projects. Check console.</p>';
        return;
    }

    if (data.length === 0) {
        projectsContainer.innerHTML = '<p style="color: var(--muted);">No projects found. Add your first one!</p>';
        return;
    }

    projectsContainer.innerHTML = data.map(project => `
        <div class="project-item" data-id="${project.id}">
            <img src="${project.image_url}" alt="${project.name}" class="project-thumb" onerror="this.src='https://via.placeholder.com/120x80?text=No+Image'">
            <div class="project-info">
                <h3>${project.name}</h3>
                <p>${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}</p>
                <span class="status-badge ${project.status === 'published' ? 'status-published' : 'status-draft'}">
                    ${project.status}
                </span>
            </div>
            <div class="project-actions">
                <button class="btn-icon" onclick="editProject('${project.id}')" title="Edit">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="btn-icon" onclick="togglePublish('${project.id}', '${project.status}')" title="${project.status === 'published' ? 'Unpublish' : 'Publish'}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
                <button class="btn-icon delete" onclick="deleteProject('${project.id}')" title="Delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        </div>
    `).join('');
}

// Handle Form Submission (Add/Update)
projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const saveBtn = document.getElementById('save-project-btn');
    const originalText = saveBtn.innerText;
    saveBtn.innerText = 'Saving...';
    saveBtn.disabled = true;

    const projectId = document.getElementById('project-id').value;
    const projectData = {
        name: document.getElementById('proj-name').value,
        image_url: document.getElementById('proj-image').value,
        video_url: document.getElementById('proj-video').value,
        status: document.getElementById('proj-status').value,
        description: document.getElementById('proj-desc').value,
    };

    let result;
    if (projectId) {
        // Update
        result = await supabase.from('projects').update(projectData).eq('id', projectId);
    } else {
        // Insert
        result = await supabase.from('projects').insert([projectData]);
    }

    if (result.error) {
        console.error('Save error:', result.error);
        alert('Error saving project: ' + result.error.message);
    } else {
        projectForm.reset();
        document.getElementById('project-id').value = '';
        saveBtn.innerText = 'Save Project';
        loadProjects();
    }
    
    saveBtn.disabled = false;
    saveBtn.innerText = originalText;
});

// Expose functions to global scope for onclick handlers
window.deleteProject = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) alert('Error deleting: ' + error.message);
    else loadProjects();
};

window.togglePublish = async (id, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', id);
    if (error) alert('Error updating status: ' + error.message);
    else loadProjects();
};

window.editProject = async (id) => {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
    if (error) {
        alert('Error fetching project details');
        return;
    }

    document.getElementById('project-id').value = data.id;
    document.getElementById('proj-name').value = data.name;
    document.getElementById('proj-image').value = data.image_url;
    document.getElementById('proj-video').value = data.video_url || '';
    document.getElementById('proj-status').value = data.status;
    document.getElementById('proj-desc').value = data.description;
    
    document.getElementById('save-project-btn').innerText = 'Update Project';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Logout functionality
logoutBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Logout error:', error.message);
        alert('Error logging out. Check console.');
    } else {
        window.location.href = 'admin.html';
    }
});

// Auth listener to handle session changes (e.g., token expiry)
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        window.location.href = 'admin.html';
    }
});
