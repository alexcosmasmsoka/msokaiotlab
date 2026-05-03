import { supabase } from './supabase.js';

const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// Protect the page: Check for active session
async function protectPage() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
        // Not logged in, redirect to login page immediately
        window.location.replace('admin.html');
        return;
    }

    // Set user email in header
    userEmailSpan.textContent = session.user.email;
    
    // Reveal the dashboard
    document.body.classList.remove('loading-auth');
}

protectPage();

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
