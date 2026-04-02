import { auth } from '../auth.js';

// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const formTitle = document.getElementById('form-title');
const toggleBtn = document.getElementById('toggle-btn');
const toggleText = document.getElementById('toggle-text');
const errorDisplay = document.getElementById('error-display');
const errorText = document.getElementById('error-text');

// State
let isLoginMode = true;

// 1. Toggle Functionality (Switch between Login/Register)
toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    clearError();

    if (isLoginMode) {
        // Show Login
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        formTitle.innerHTML = '<i class="fas fa-fingerprint"></i> IDENTIFY';
        toggleText.innerHTML = 'New Operator? <a href="#" id="toggle-btn-inner" class="highlight-link">Request Clearance (Sign Up)</a>';
    } else {
        // Show Register
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        formTitle.innerHTML = '<i class="fas fa-user-plus"></i> ENLIST';
        toggleText.innerHTML = 'Already have clearance? <a href="#" id="toggle-btn-inner" class="highlight-link">Access Terminal (Log In)</a>';
    }

    // Re-attach listener to the new button inside innerHTML
    document.getElementById('toggle-btn-inner').addEventListener('click', (ev) => {
        ev.preventDefault();
        toggleBtn.click();
    });
});

// 2. Handle Login Submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-login');

    setLoading(btn, true);

    const result = await auth.login(email, password);
    handleAuthResult(result, btn);
});

// 3. Handle Register Submit
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const btn = document.getElementById('btn-register');

    if (password.length < 8) {
        showError("Password must be at least 8 characters.");
        return;
    }

    setLoading(btn, true);

    const result = await auth.register(email, password, name);
    handleAuthResult(result, btn);
});

// 4. Helpers
function handleAuthResult(result, btnElement) {
    if (result.success) {
        btnElement.innerText = "ACCESS GRANTED";
        btnElement.style.background = "#00ff9d";
        setTimeout(() => window.location.href = 'module1.html', 1000);
    } else {
        showError(result.message);
        setLoading(btnElement, false, isLoginMode ? "INITIALIZE SESSION" : "CREATE IDENTITY");
    }
}

function setLoading(btn, isLoading, defaultText) {
    if (isLoading) {
        btn.innerText = "AUTHENTICATING...";
        btn.disabled = true;
    } else {
        btn.innerText = defaultText;
        btn.disabled = false;
    }
}

function showError(msg) {
    errorText.innerText = msg;
    errorDisplay.classList.remove('hidden');
}

function clearError() {
    errorDisplay.classList.add('hidden');
}

window.triggerOAuth = (provider) => {
    auth.loginWithOAuth(provider);
};

// Check if already logged in (Ignore 401 error in console, that is normal here)
(async function checkSession() {
    const user = await auth.getCurrentUser();
    if (user) console.log("User already active:", user.name);
})();