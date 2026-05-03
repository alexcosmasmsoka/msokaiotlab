import { supabase } from './supabase.js';

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('error-msg');
const loginBtn = document.getElementById('login-btn');

// Check if user is already logged in
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = 'dashboard.html';
    }
}

checkSession();

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // UI Loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span>Verifying...</span>';
    errorMsg.style.display = 'none';

    const email = emailInput.value;
    const password = passwordInput.value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        errorMsg.textContent = error.message;
        errorMsg.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>Initialize Access</span>';
    } else {
        // Successful login
        window.location.href = 'dashboard.html';
    }
});
