// ============================================
// PRO CLUB HUB - MAIN APPLICATION
// ============================================

const API_BASE = '/api';
const NATIONALITIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua e Barbuda', 'Arabia Saudita', 
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaigian', 'Bahamas', 'Bahrein', 'Bangladesh',
  'Barbados', 'Belgio', 'Belize', 'Benin', 'Bhutan', 'Bielorussia', 'Birmania', 'Bolivia', 
  'Bosnia ed Erzegovina', 'Botswana', 'Brasile', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cambogia', 'Camerun', 'Canada', 'Capo Verde', 'Ciad', 'Cile', 'Cina', 'Cipro', 'Colombia',
  'Comore', 'Corea del Nord', 'Corea del Sud', 'Costa d\'Avorio', 'Costa Rica', 'Croazia', 'Cuba',
  'Danimarca', 'Dominica', 'Ecuador', 'Egitto', 'El Salvador', 'Emirati Arabi Uniti', 'Eritrea',
  'Estonia', 'Etiopia', 'Figi', 'Filippine', 'Finlandia', 'Francia', 'Gabon', 'Gambia', 'Georgia',
  'Germania', 'Ghana', 'Giamaica', 'Giappone', 'Gibuti', 'Giordania', 'Grecia', 'Grenada',
  'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guinea Equatoriale', 'Guyana', 'Haiti', 'Honduras',
  'India', 'Indonesia', 'Iran', 'Iraq', 'Irlanda', 'Islanda', 'Israele', 'Italia', 'Kazakhstan',
  'Kenya', 'Kirghizistan', 'Kiribati', 'Kosovo', 'Kuwait', 'Laos', 'Lesotho', 'Lettonia', 'Libano',
  'Liberia', 'Libia', 'Liechtenstein', 'Lituania', 'Lussemburgo', 'Macedonia del Nord', 'Madagascar',
  'Malawi', 'Malaysia', 'Maldive', 'Mali', 'Malta', 'Marocco', 'Marshall', 'Mauritania', 'Mauritius',
  'Messico', 'Micronesia', 'Moldavia', 'Monaco', 'Mongolia', 'Montenegro', 'Mozambico', 'Namibia',
  'Nauru', 'Nepal', 'Nicaragua', 'Niger', 'Nigeria', 'Norvegia', 'Nuova Zelanda', 'Oman', 'Paesi Bassi',
  'Pakistan', 'Palau', 'Palestina', 'Panama', 'Papua Nuova Guinea', 'Paraguay', 'Perù', 'Polonia',
  'Portogallo', 'Qatar', 'Regno Unito', 'Repubblica Ceca', 'Repubblica Centrafricana', 
  'Repubblica del Congo', 'Repubblica Democratica del Congo', 'Repubblica Dominicana', 'Romania',
  'Ruanda', 'Russia', 'Saint Kitts e Nevis', 'Saint Lucia', 'Saint Vincent e Grenadine', 'Samoa',
  'San Marino', 'Santa Sede', 'São Tomé e Príncipe', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone',
  'Singapore', 'Siria', 'Slovacchia', 'Slovenia', 'Somalia', 'Spagna', 'Sri Lanka', 'Stati Uniti',
  'Sudafrica', 'Sudan', 'Sudan del Sud', 'Suriname', 'Svezia', 'Svizzera', 'Swaziland', 'Tagikistan',
  'Taiwan', 'Tanzania', 'Thailandia', 'Timor Est', 'Togo', 'Tonga', 'Trinidad e Tobago', 'Tunisia',
  'Turchia', 'Turkmenistan', 'Tuvalu', 'Ucraina', 'Uganda', 'Ungheria', 'Uruguay', 'Uzbekistan',
  'Vanuatu', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

let currentUser = null;
let selectedTags = [];
let selectedRating = 0;
let currentTeam = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    checkResetToken();
});

async function initApp() {
    populateNationalities();
    setupLanguageSelector();
    updatePageLanguage();
    checkAuth();
    setupEventListeners();
    navigateTo('home');
}

function populateNationalities() {
    const lists = [
        'nationalitiesList',
        'registerNationalitiesList',
        'editNationalitiesList',
        'teamNationalitiesList',
        'teamCreateNationalitiesList'
    ];
    
    lists.forEach(listId => {
        const datalist = document.getElementById(listId);
        if (datalist) {
            datalist.innerHTML = NATIONALITIES.map(n => `<option value="${n}">`).join('');
        }
    });
}

function setupLanguageSelector() {
    const selector = document.getElementById('languageSelector');
    if (selector) {
        const savedLang = localStorage.getItem('language') || 'it';
        selector.value = savedLang;
        
        selector.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }
}

function checkResetToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('reset');
    
    if (resetToken) {
        showResetPasswordModal(resetToken);
    }
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        fetchCurrentUser();
    } else {
        updateUIForGuest();
    }
}

async function fetchCurrentUser() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/auth?action=me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUIForUser();
            
            if (currentUser.team) {
                loadCurrentTeam();
            }
        } else {
            localStorage.removeItem('token');
            updateUIForGuest();
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        localStorage.removeItem('token');
        updateUIForGuest();
    } finally {
        hideLoading();
    }
}

async function loadCurrentTeam() {
    if (!currentUser.team) return;
    
    try {
        const response = await fetch(`${API_BASE}/teams?id=${currentUser.team}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentTeam = data.team;
            
            const isCaptain = currentTeam.captain.toString() === currentUser._id;
            const isViceCaptain = currentTeam.viceCaptain && currentTeam.viceCaptain.toString() === currentUser._id;
            
            if (isCaptain || isViceCaptain) {
                document.getElementById('requestsNavBtn').style.display = 'flex';
                loadTeamRequests();
            }
        }
    } catch (error) {
        console.error('Error loading team:', error);
    }
}

async function loadTeamRequests() {
    if (!currentTeam) return;
    
    try {
        const response = await fetch(`${API_BASE}/requests?teamId=${currentTeam._id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const pendingCount = data.requests.filter(r => r.status === 'pending').length;
            
            const badge = document.getElementById('requestsBadge');
            if (pendingCount > 0) {
                badge.textContent = pendingCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading requests:', error);
    }
}

function updateUIForUser() {
    document.getElementById('profileNavBtn').style.display = 'flex';
    document.getElementById('logoutBtn').style.display = 'flex';
    document.getElementById('heroActions').style.display = 'none';
    document.getElementById('heroUserInfo').style.display = 'block';

    // Show create team button only if profile completed
    if (currentUser.profileCompleted) {
        document.getElementById('createTeamBtn').style.display = 'flex';
    }

    if (currentUser.isAdmin) {
        document.getElementById('adminNavBtn').style.display = 'flex';
    }

    document.getElementById('heroUsername').textContent = currentUser.username;
    document.getElementById('heroLevel').textContent = currentUser.level;
    const levelPercent = Math.min((currentUser.level / 100) * 100, 100);
    document.getElementById('heroLevelProgress').style.width = `${levelPercent}%`;
    document.getElementById('heroRating').textContent = currentUser.averageRating.toFixed(1);
    document.getElementById('heroRatingCount').textContent = currentUser.feedbackCount;
}

function updateUIForGuest() {
    document.getElementById('profileNavBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('requestsNavBtn').style.display = 'none';
    document.getElementById('adminNavBtn').style.display = 'none';
    document.getElementById('heroActions').style.display = 'flex';
    document.getElementById('heroUserInfo').style.display = 'none';
    document.getElementById('createTeamBtn').style.display = 'none';
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = e.currentTarget.dataset.page;
            navigateTo(page);
        });
    });

    // Auth buttons
    const heroLoginBtn = document.getElementById('heroLoginBtn');
    const heroRegisterBtn = document.getElementById('heroRegisterBtn');
    if (heroLoginBtn) heroLoginBtn.addEventListener('click', () => openAuthModal('login'));
    if (heroRegisterBtn) heroRegisterBtn.addEventListener('click', () => openAuthModal('register'));
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Auth form switches
    const showRegisterForm = document.getElementById('showRegisterForm');
    const showLoginForm = document.getElementById('showLoginForm');
    const showForgotPassword = document.getElementById('showForgotPassword');
    const backToLogin = document.getElementById('backToLogin');
    
    if (showRegisterForm) showRegisterForm.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('register');
    });
    if (showLoginForm) showLoginForm.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('login');
    });
    if (showForgotPassword) showForgotPassword.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('forgot');
    });
    if (backToLogin) backToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('login');
    });

    // Modal closes
    const closeAuthModal = document.getElementById('closeAuthModal');
    if (closeAuthModal) closeAuthModal.addEventListener('click', closeAuthModalFn);

    // Forms
    const loginFormElement = document.getElementById('loginFormElement');
    if (loginFormElement) loginFormElement.addEventListener('submit', handleLogin);

    const registerFormElement = document.getElementById('registerFormElement');
    if (registerFormElement) registerFormElement.addEventListener('submit', handleRegister);

    const forgotPasswordFormElement = document.getElementById('forgotPasswordFormElement');
    if (forgotPasswordFormElement) forgotPasswordFormElement.addEventListener('submit', handleForgotPassword);

    // Profile
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) editProfileBtn.addEventListener('click', openEditProfileModal);

    const closeEditModal = document.getElementById('closeEditModal');
    if (closeEditModal) closeEditModal.addEventListener('click', closeEditProfileModal);

    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) editProfileForm.addEventListener('submit', handleEditProfile);

    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    if (resetPasswordBtn) resetPasswordBtn.addEventListener('click', handleRequestPasswordReset);

    // Teams
    const createTeamBtn = document.getElementById('createTeamBtn');
    if (createTeamBtn) createTeamBtn.addEventListener('click', openCreateTeamModal);

    const closeCreateTeamModal = document.getElementById('closeCreateTeamModal');
    if (closeCreateTeamModal) closeCreateTeamModal.addEventListener('click', closeCreateTeamModalFn);

    const createTeamForm = document.getElementById('createTeamForm');
    if (createTeamForm) createTeamForm.addEventListener('submit', handleCreateTeam);

    // Search
    const searchPlayersBtn = document.getElementById('searchPlayersBtn');
    if (searchPlayersBtn) searchPlayersBtn.addEventListener('click', searchPlayers);

    const searchTeamsBtn = document.getElementById('searchTeamsBtn');
    if (searchTeamsBtn) searchTeamsBtn.addEventListener('click', searchTeams);

    // Feedback
    const closeFeedbackModal = document.getElementById('closeFeedbackModal');
    if (closeFeedbackModal) closeFeedbackModal.addEventListener('click', closeFeedbackModalFn);

    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) feedbackForm.addEventListener('submit', handleSubmitFeedback);

    // Detail modals
    const closePlayerDetailModal = document.getElementById('closePlayerDetailModal');
    if (closePlayerDetailModal) closePlayerDetailModal.addEventListener('click', closePlayerDetailModalFn);

    const closeTeamDetailModal = document.getElementById('closeTeamDetailModal');
    if (closeTeamDetailModal) closeTeamDetailModal.addEventListener('click', closeTeamDetailModalFn);

    // Requests tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            switchRequestsTab(tab);
        });
    });

    // Admin
    const deleteAllTeamsBtn = document.getElementById('deleteAllTeamsBtn');
    if (deleteAllTeamsBtn) deleteAllTeamsBtn.addEventListener('click', handleDeleteAllTeams);

    const resetProfilesBtn = document.getElementById('resetProfilesBtn');
    if (resetProfilesBtn) resetProfilesBtn.addEventListener('click', handleResetProfiles);

    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) newsletterForm.addEventListener('submit', handleSendNewsletter);

    // Setup interactive elements
    setupStarRating();
    setupTagSelector();
    setupSecondaryRolesLimit();
    setupProfileCompletionCheck();

    // Close modals on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Check profile completion
function setupProfileCompletionCheck() {
    const instagramInput = document.getElementById('editInstagram');
    const tiktokInput = document.getElementById('editTiktok');
    const lookingForTeamCheckbox = document.getElementById('editLookingForTeam');
    const secondaryRolesCheckboxes = document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]');

    function checkCompletion() {
        const hasSecondaryRole = Array.from(secondaryRolesCheckboxes).some(cb => cb.checked);
        const hasContact = instagramInput.value.trim() || tiktokInput.value.trim();

        if (hasSecondaryRole && hasContact) {
            lookingForTeamCheckbox.disabled = false;
        } else {
            lookingForTeamCheckbox.disabled = true;
            lookingForTeamCheckbox.checked = false;
        }
    }

    if (instagramInput) instagramInput.addEventListener('input', checkCompletion);
    if (tiktokInput) tiktokInput.addEventListener('input', checkCompletion);
    secondaryRolesCheckboxes.forEach(cb => cb.addEventListener('change', checkCompletion));
}

// ============================================
// NAVIGATION
// ============================================

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const pageElement = document.getElementById(`${page}Page`);
    if (pageElement) {
        pageElement.style.display = 'block';
    }

    const navBtn = document.querySelector(`[data-page="${page}"]`);
    if (navBtn) {
        navBtn.classList.add('active');
    }

    if (page === 'profile' && currentUser) {
        loadProfile();
    } else if (page === 'players') {
        searchPlayers();
    } else if (page === 'teams') {
        searchTeams();
    } else if (page === 'requests') {
        loadRequests();
    } else if (page === 'admin' && currentUser && currentUser.isAdmin) {
        loadAdminDashboard();
    }
}

// ============================================
// AUTHENTICATION
// ============================================

function openAuthModal(form) {
    switchAuthForm(form);
    document.getElementById('authModal').classList.add('active');
}

function closeAuthModalFn() {
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.remove('active');
    
    const loginFormElement = document.getElementById('loginFormElement');
    const registerFormElement = document.getElementById('registerFormElement');
    const forgotPasswordFormElement = document.getElementById('forgotPasswordFormElement');
    
    if (loginFormElement) loginFormElement.reset();
    if (registerFormElement) registerFormElement.reset();
    if (forgotPasswordFormElement) forgotPasswordFormElement.reset();
}

function switchAuthForm(form) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    if (loginForm) loginForm.style.display = form === 'login' ? 'block' : 'none';
    if (registerForm) registerForm.style.display = form === 'register' ? 'block' : 'none';
    if (forgotPasswordForm) forgotPasswordForm.style.display = form === 'forgot' ? 'block' : 'none';
}

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showNotification('⚠️ Email e password sono obbligatori', 'error');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/auth?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            
            closeAuthModalFn();
            updateUIForUser();
            showNotification('✅ Login effettuato con successo!', 'success');
            navigateTo('home');
        } else {
            showNotification('❌ ' + (data.error || 'Errore durante il login'), 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const primaryRole = document.getElementById('registerRole').value;
    const platform = document.getElementById('registerPlatform').value;
    const nationality = document.getElementById('registerNationality').value.trim();
    const level = parseInt(document.getElementById('registerLevel').value);

    if (!username || username.length < 3) {
        showNotification('⚠️ Username deve essere almeno 3 caratteri', 'error');
        return;
    }

    if (!email || !email.includes('@')) {
        showNotification('⚠️ Inserisci un\'email valida', 'error');
        return;
    }

    if (!password || password.length < 6) {
        showNotification('⚠️ Password deve essere almeno 6 caratteri', 'error');
        return;
    }

    if (!primaryRole || !platform || !nationality) {
        showNotification('⚠️ Compila tutti i campi obbligatori', 'error');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/auth?action=register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username, 
                email, 
                password, 
                primaryRole, 
                platform,
                nationality,
                level 
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            closeAuthModalFn();
            updateUIForUser();
            showNotification('🎉 Registrazione completata! Completa il tuo profilo per iniziare.', 'success');
            navigateTo('profile');
        } else {
            showNotification('❌ ' + (data.error || 'Errore durante la registrazione'), 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}
// CONTINUAZIONE DI app.js - PARTE 2

async function handleForgotPassword(e) {
    e.preventDefault();

    const email = document.getElementById('forgotEmail').value.trim();

    if (!email || !email.includes('@')) {
        showNotification('⚠️ Inserisci un\'email valida', 'error');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/auth?action=request-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            closeAuthModalFn();
            showNotification('📧 Se l\'email esiste, riceverai un link per il reset', 'success');
        } else {
            showNotification('❌ ' + (data.error || 'Errore durante la richiesta'), 'error');
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function handleRequestPasswordReset() {
    if (!currentUser) return;

    if (!confirm('Riceverai un\'email con il link per reimpostare la password. Continuare?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/auth?action=request-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('📧 Email inviata! Controlla la tua casella di posta.', 'success');
        } else {
            showNotification('❌ ' + (data.error || 'Errore durante la richiesta'), 'error');
        }
    } catch (error) {
        console.error('Request reset error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function showResetPasswordModal(token) {
    const newPassword = prompt('Inserisci la nuova password (minimo 6 caratteri):');
    
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
        showNotification('⚠️ Password deve essere almeno 6 caratteri', 'error');
        return;
    }

    resetPassword(token, newPassword);
}

async function resetPassword(token, newPassword) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/auth?action=reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            window.history.replaceState({}, document.title, "/");
            showNotification('✅ Password reimpostata con successo! Ora puoi effettuare il login.', 'success');
            openAuthModal('login');
        } else {
            showNotification('❌ ' + (data.error || 'Errore durante il reset'), 'error');
        }
    } catch (error) {
        console.error('Reset password error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    currentTeam = null;
    updateUIForGuest();
    showNotification('👋 Logout effettuato', 'info');
    navigateTo('home');
}

// ============================================
// PROFILE
// ============================================

async function loadProfile() {
    if (!currentUser) return;

    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profilePlatform').textContent = currentUser.platform;
    document.getElementById('profileNationality').textContent = currentUser.nationality || 'Italia';
    document.getElementById('profilePrimaryRole').textContent = currentUser.primaryRole;
    document.getElementById('profileLevel').textContent = currentUser.level;
    
    const levelPercent = Math.min((currentUser.level / 100) * 100, 100);
    document.getElementById('profileLevelProgress').style.width = `${levelPercent}%`;
    
    document.getElementById('profileRating').textContent = currentUser.averageRating.toFixed(1);
    document.getElementById('profileRatingCount').textContent = currentUser.feedbackCount;

    const secondaryRoles = currentUser.secondaryRoles && currentUser.secondaryRoles.length > 0
        ? currentUser.secondaryRoles.join(', ')
        : 'Nessuno';
    document.getElementById('profileSecondaryRoles').textContent = secondaryRoles;

    document.getElementById('profileBio').textContent = currentUser.bio || 'Nessuna bio';
    document.getElementById('profileLookingForTeam').textContent = currentUser.lookingForTeam ? 'Sì' : 'No';

    const socialLinks = [];
    if (currentUser.instagram) {
        socialLinks.push(`<a href="https://instagram.com/${currentUser.instagram}" target="_blank" class="social-link instagram"><i class="fab fa-instagram"></i> ${currentUser.instagram}</a>`);
    }
    if (currentUser.tiktok) {
        socialLinks.push(`<a href="https://tiktok.com/@${currentUser.tiktok}" target="_blank" class="social-link tiktok"><i class="fab fa-tiktok"></i> ${currentUser.tiktok}</a>`);
    }

    const socialCard = document.getElementById('profileSocialCard');
    if (socialLinks.length > 0) {
        document.getElementById('profileSocialLinks').innerHTML = socialLinks.join('');
        if (socialCard) socialCard.style.display = 'block';
    } else {
        if (socialCard) socialCard.style.display = 'none';
    }

    // Load feedback
    try {
        const response = await fetch(`${API_BASE}/feedback?userId=${currentUser._id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok && data.feedback) {
            displayProfileFeedback(data.feedback);
        }
    } catch (error) {
        console.error('Load feedback error:', error);
    }
}

function displayProfileFeedback(feedback) {
    const container = document.getElementById('profileFeedbackList');

    if (feedback.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-star"></i><p>Nessun feedback ancora</p></div>';
        return;
    }

    container.innerHTML = feedback.map(fb => {
        const stars = '⭐'.repeat(fb.rating);
        const tags = fb.tags && fb.tags.length > 0
            ? `<div class="feedback-tags">${fb.tags.map(tag => `<span class="feedback-tag"><i class="fas fa-tag"></i> ${tag}</span>`).join('')}</div>`
            : '';
        const comment = fb.comment ? `<p class="feedback-comment">${fb.comment}</p>` : '';
        const date = new Date(fb.createdAt).toLocaleDateString(currentLang());
        
        return `
            <div class="feedback-item-compact">
                <div class="feedback-header-compact">
                    <span class="feedback-user-compact">
                        <i class="fas fa-user-circle"></i> ${fb.fromUser.username}
                    </span>
                    <span class="feedback-rating-compact">${stars}</span>
                </div>
                ${tags}
                ${comment}
                <span class="feedback-date-compact">${date}</span>
            </div>
        `;
    }).join('');
}

function openEditProfileModal() {
    if (!currentUser) return;

    document.getElementById('editUsername').value = currentUser.username;
    document.getElementById('editPrimaryRole').value = currentUser.primaryRole;
    document.getElementById('editPlatform').value = currentUser.platform;
    document.getElementById('editNationality').value = currentUser.nationality || 'Italia';
    document.getElementById('editLevel').value = currentUser.level;
    document.getElementById('editInstagram').value = currentUser.instagram || '';
    document.getElementById('editTiktok').value = currentUser.tiktok || '';
    document.getElementById('editBio').value = currentUser.bio || '';
    document.getElementById('editLookingForTeam').checked = currentUser.lookingForTeam || false;

    const checkboxes = document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = currentUser.secondaryRoles && currentUser.secondaryRoles.includes(cb.value);
    });

    // Check if profile can enable lookingForTeam
    const hasSecondaryRole = currentUser.secondaryRoles && currentUser.secondaryRoles.length >= 1;
    const hasContact = currentUser.instagram || currentUser.tiktok;
    
    if (hasSecondaryRole && hasContact) {
        document.getElementById('editLookingForTeam').disabled = false;
    } else {
        document.getElementById('editLookingForTeam').disabled = true;
        document.getElementById('editLookingForTeam').checked = false;
    }

    document.getElementById('editProfileModal').classList.add('active');
}

function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) modal.classList.remove('active');
    
    const form = document.getElementById('editProfileForm');
    if (form) form.reset();
}

async function handleEditProfile(e) {
    e.preventDefault();

    const username = document.getElementById('editUsername').value.trim();
    const primaryRole = document.getElementById('editPrimaryRole').value;
    const platform = document.getElementById('editPlatform').value;
    const nationality = document.getElementById('editNationality').value.trim();
    const level = parseInt(document.getElementById('editLevel').value);
    const instagram = document.getElementById('editInstagram').value.trim();
    const tiktok = document.getElementById('editTiktok').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    const lookingForTeam = document.getElementById('editLookingForTeam').checked;

    const secondaryRoles = Array.from(document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]:checked'))
        .map(cb => cb.value);

    if (!username || username.length < 3) {
        showNotification('⚠️ Username deve essere almeno 3 caratteri', 'error');
        return;
    }

    if (!level || level < 1) {
        showNotification('⚠️ Livello deve essere almeno 1', 'error');
        return;
    }

    if (secondaryRoles.length < 1) {
        showNotification('⚠️ Almeno 1 ruolo secondario richiesto', 'error');
        return;
    }

    if (secondaryRoles.length > 2) {
        showNotification('⚠️ Massimo 2 ruoli secondari', 'error');
        return;
    }

    if (!instagram && !tiktok) {
        showNotification('⚠️ Almeno un contatto social richiesto (Instagram o TikTok)', 'error');
        return;
    }

    const updates = {
        username,
        primaryRole,
        secondaryRoles,
        platform,
        nationality,
        level,
        instagram,
        tiktok,
        bio,
        lookingForTeam
    };

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/auth?action=me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(updates)
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            closeEditProfileModal();
            showNotification('✅ Profilo aggiornato con successo!', 'success');
            loadProfile();
            updateUIForUser();
        } else {
            showNotification('❌ ' + (data.error || 'Errore durante l\'aggiornamento'), 'error');
        }
    } catch (error) {
        console.error('Edit profile error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function setupSecondaryRolesLimit() {
    const checkboxes = document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checkedCount = document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]:checked').length;
            
            if (checkedCount >= 2) {
                checkboxes.forEach(cb => {
                    if (!cb.checked) {
                        cb.disabled = true;
                    }
                });
            } else {
                checkboxes.forEach(cb => {
                    cb.disabled = false;
                });
            }
        });
    });
}

// ============================================
// PLAYERS SEARCH
// ============================================

async function searchPlayers() {
    if (!currentUser) {
        showNotification('⚠️ Devi effettuare il login per cercare giocatori', 'error');
        openAuthModal('login');
        return;
    }

    const search = document.getElementById('playerSearchInput').value.trim();
    const role = document.getElementById('roleFilter').value;
    const platform = document.getElementById('platformFilter').value;
    const nationality = document.getElementById('nationalityFilter').value;
    const minLevel = document.getElementById('minLevelFilter').value;
    const maxLevel = document.getElementById('maxLevelFilter').value;

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (platform) params.append('platform', platform);
    if (nationality) params.append('nationality', nationality);
    if (minLevel) params.append('minLevel', minLevel);
    if (maxLevel) params.append('maxLevel', maxLevel);

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/users?${params}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            displayPlayers(data.users);
        } else {
            showNotification('❌ ' + (data.error || 'Errore nel caricamento giocatori'), 'error');
        }
    } catch (error) {
        console.error('Search players error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function displayPlayers(players) {
    const container = document.getElementById('playersResults');

    if (players.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>Nessun giocatore trovato</p>
            </div>
        `;
        return;
    }

    container.innerHTML = players.map(player => {
        const levelPercent = Math.min((player.level / 100) * 100, 100);
        return `
            <div class="player-card" onclick="showPlayerDetail('${player._id}')">
                <div class="player-card-header">
                    <div class="player-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="player-info">
                        <h3>${player.username}</h3>
                        <p class="player-role">${player.primaryRole}</p>
                    </div>
                </div>
                <div class="player-stats">
                    <div class="stat">
                        <i class="fas fa-trophy"></i>
                        <span>Liv. ${player.level}</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-gamepad"></i>
                        <span>${player.platform}</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-flag"></i>
                        <span>${player.nationality}</span>
                    </div>
                    <div class="stat star">
                        <i class="fas fa-star"></i>
                        <span>${player.averageRating.toFixed(1)}</span>
                    </div>
                </div>
                <div class="level-bar">
                    <div class="level-progress" style="width: ${levelPercent}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// PLAYER DETAIL (CON FEEDBACK INLINE)
// ============================================

async function showPlayerDetail(playerId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/users?id=${playerId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            const player = data.user;
            const feedbackResponse = await fetch(`${API_BASE}/feedback?userId=${playerId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const feedbackData = await feedbackResponse.json();

            displayPlayerDetailModal(player, feedbackData);
        } else {
            showNotification('❌ ' + (data.error || 'Errore nel caricamento del profilo'), 'error');
        }
    } catch (error) {
        console.error('Show player detail error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function displayPlayerDetailModal(player, feedbackData) {
    const levelPercent = Math.min((player.level / 100) * 100, 100);
    const isOwnProfile = currentUser && currentUser._id === player._id;

    const secondaryRoles = player.secondaryRoles && player.secondaryRoles.length > 0
        ? player.secondaryRoles.map(r => `<span class="role-badge">${r}</span>`).join('')
        : '<p style="color: #64748b;">Nessuno</p>';

    const socialLinks = [];
    if (player.instagram) {
        socialLinks.push(`<a href="https://instagram.com/${player.instagram}" target="_blank" class="social-link instagram"><i class="fab fa-instagram"></i> ${player.instagram}</a>`);
    }
    if (player.tiktok) {
        socialLinks.push(`<a href="https://tiktok.com/@${player.tiktok}" target="_blank" class="social-link tiktok"><i class="fab fa-tiktok"></i> ${player.tiktok}</a>`);
    }

    const feedbackList = feedbackData.feedback && feedbackData.feedback.length > 0
        ? feedbackData.feedback.map(fb => {
            const stars = '⭐'.repeat(fb.rating);
            const tags = fb.tags && fb.tags.length > 0
                ? `<div class="feedback-tags-compact">${fb.tags.map(tag => `<span class="feedback-tag-compact">${tag}</span>`).join(' ')}</div>`
                : '';
            const comment = fb.comment ? `<p class="feedback-comment-compact">${fb.comment}</p>` : '';
            const date = new Date(fb.createdAt).toLocaleDateString(currentLang());
            
            return `
                <div class="feedback-item-compact">
                    <div class="feedback-header-compact">
                        <span class="feedback-user-compact">
                            <i class="fas fa-user-circle"></i> ${fb.fromUser.username}
                        </span>
                        <span class="feedback-rating-compact">${stars}</span>
                    </div>
                    ${tags}
                    ${comment}
                    <span class="feedback-date-compact">${date}</span>
                </div>
            `;
        }).join('')
        : '<div class="empty-state"><i class="fas fa-star"></i><p>Nessun feedback ancora</p></div>';

    const lookingForTeam = player.lookingForTeam ? 'Sì' : 'No';

    const content = `
        <div class="player-detail-header">
            <div class="detail-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="detail-info">
                <h2>${player.username}</h2>
                <div class="detail-meta">
                    <div class="meta-item">
                        <i class="fas fa-trophy"></i>
                        <span>Livello ${player.level}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-gamepad"></i>
                        <span>${player.platform}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-flag"></i>
                        <span>${player.nationality}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-star"></i>
                        <span>${player.averageRating.toFixed(1)} (${player.feedbackCount} feedback)</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-search"></i>
                        <span>Cerca squadra: ${lookingForTeam}</span>
                    </div>
                </div>
                <div class="level-bar level-bar-large" style="margin-top: 1rem;">
                    <div class="level-progress" style="width: ${levelPercent}%"></div>
                </div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <h4><i class="fas fa-trophy"></i> Ruolo Principale</h4>
                <p>${player.primaryRole}</p>
            </div>
            <div class="info-card">
                <h4><i class="fas fa-users"></i> Ruoli Secondari</h4>
                <div class="roles-list">${secondaryRoles}</div>
            </div>
            ${player.bio ? `
                <div class="info-card">
                    <h4><i class="fas fa-comment"></i> Bio</h4>
                    <p>${player.bio}</p>
                </div>
            ` : ''}
            ${socialLinks.length > 0 ? `
                <div class="info-card">
                    <h4><i class="fas fa-share-alt"></i> Social</h4>
                    <div class="social-links">${socialLinks.join('')}</div>
                </div>
            ` : ''}
        </div>

        ${!isOwnProfile ? `
            <div class="detail-actions">
                <button class="btn btn-primary" onclick="openFeedbackModalInline('${player._id}', 'user')">
                    <i class="fas fa-star"></i>
                    Lascia Feedback
                </button>
            </div>
            <div id="inlineFeedbackForm" style="display: none; margin: 2rem 0;"></div>
        ` : ''}

        <div class="feedback-section-compact">
            <h3><i class="fas fa-star"></i> Feedback Ricevuti</h3>
            <div class="feedback-list-compact">
                ${feedbackList}
            </div>
        </div>
    `;

    document.getElementById('playerDetailContent').innerHTML = content;
    document.getElementById('playerDetailModal').classList.add('active');
}

function closePlayerDetailModalFn() {
    const modal = document.getElementById('playerDetailModal');
    if (modal) modal.classList.remove('active');
}
// CONTINUAZIONE DI app.js - PARTE 3

// ============================================
// TEAMS SEARCH
// ============================================

async function searchTeams() {
    if (!currentUser) {
        showNotification('⚠️ Devi effettuare il login per cercare squadre', 'error');
        openAuthModal('login');
        return;
    }

    const search = document.getElementById('teamSearchInput').value.trim();
    const platform = document.getElementById('teamPlatformFilter').value;
    const nationality = document.getElementById('teamNationalityFilter').value;

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (platform) params.append('platform', platform);
    if (nationality) params.append('nationality', nationality);

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams?${params}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            displayTeams(data.teams);
        } else {
            showNotification('❌ ' + (data.error || 'Errore nel caricamento squadre'), 'error');
        }
    } catch (error) {
        console.error('Search teams error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function displayTeams(teams) {
    const container = document.getElementById('teamsResults');

    if (teams.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>Nessuna squadra trovata</p>
            </div>
        `;
        return;
    }

    container.innerHTML = teams.map(team => `
        <div class="team-card" onclick="showTeamDetail('${team._id}')">
            <div class="team-card-header">
                <div class="team-avatar">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div class="team-info">
                    <h3>${team.name}</h3>
                    <p class="team-platform">${team.platform} - ${team.nationality}</p>
                </div>
            </div>
            ${team.description ? `<p style="margin: 1rem 0; color: #cbd5e1;">${team.description}</p>` : ''}
            <div class="team-stats">
                <div class="stat">
                    <i class="fas fa-users"></i>
                    <span>${team.members.length} membri</span>
                </div>
                <div class="stat star">
                    <i class="fas fa-star"></i>
                    <span>${team.averageRating.toFixed(1)}</span>
                </div>
                ${team.lookingForPlayers ? '<div class="stat"><i class="fas fa-search"></i><span>Cercano giocatori</span></div>' : ''}
            </div>
        </div>
    `).join('');
}

// ============================================
// TEAM DETAIL
// ============================================

async function showTeamDetail(teamId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams?id=${teamId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            const team = data.team;
            const feedbackResponse = await fetch(`${API_BASE}/feedback?teamId=${teamId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const feedbackData = await feedbackResponse.json();

            displayTeamDetailModal(team, feedbackData);
        } else {
            showNotification('❌ ' + (data.error || 'Errore nel caricamento della squadra'), 'error');
        }
    } catch (error) {
        console.error('Show team detail error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function displayTeamDetailModal(team, feedbackData) {
    const isCaptain = currentUser && team.captain.toString() === currentUser._id;
    const isViceCaptain = currentUser && team.viceCaptain && team.viceCaptain.toString() === currentUser._id;
    const isMember = currentUser && team.members.some(m => m.toString() === currentUser._id);

    const socialLinks = [];
    if (team.instagram) {
        socialLinks.push(`<a href="https://instagram.com/${team.instagram}" target="_blank" class="social-link instagram"><i class="fab fa-instagram"></i> ${team.instagram}</a>`);
    }
    if (team.tiktok) {
        socialLinks.push(`<a href="https://tiktok.com/@${team.tiktok}" target="_blank" class="social-link tiktok"><i class="fab fa-tiktok"></i> ${team.tiktok}</a>`);
    }
    if (team.liveLink) {
        socialLinks.push(`<a href="${team.liveLink}" target="_blank" class="btn btn-live"><i class="fas fa-video"></i> GUARDA LIVE</a>`);
    }

    const membersList = team.memberDetails && team.memberDetails.length > 0
        ? team.memberDetails.map(member => {
            const captainBadge = member._id === team.captain.toString() 
                ? '<span class="captain-badge"><i class="fas fa-crown"></i> Capitano</span>' 
                : '';
            const viceCaptainBadge = team.viceCaptain && member._id === team.viceCaptain.toString()
                ? '<span class="vice-captain-badge"><i class="fas fa-star"></i> Vice Capitano</span>'
                : '';
            
            return `
                <div class="member-item">
                    <div class="member-info">
                        <div class="member-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="member-details">
                            <h5>${member.username} ${captainBadge} ${viceCaptainBadge}</h5>
                            <p class="member-role">${member.primaryRole} - Liv. ${member.level}</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn btn-small btn-primary" onclick="showPlayerDetail('${member._id}')">
                            <i class="fas fa-eye"></i>
                            Vedi
                        </button>
                        ${isCaptain && member._id !== team.captain.toString() ? `
                            <button class="btn btn-small btn-danger" onclick="removeMember('${team._id}', '${member._id}')">
                                <i class="fas fa-times"></i>
                                Espelli
                            </button>
                        ` : ''}
                        ${isCaptain && member._id !== team.captain.toString() && (!team.viceCaptain || team.viceCaptain.toString() !== member._id) ? `
                            <button class="btn btn-small btn-secondary" onclick="setViceCaptain('${team._id}', '${member._id}')">
                                <i class="fas fa-star"></i> Vice
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('')
        : '<p style="color: #64748b;">Nessun membro</p>';

    const feedbackList = feedbackData.feedback && feedbackData.feedback.length > 0
        ? feedbackData.feedback.map(fb => {
            const stars = '⭐'.repeat(fb.rating);
            const tags = fb.tags && fb.tags.length > 0
                ? `<div class="feedback-tags-compact">${fb.tags.map(tag => `<span class="feedback-tag-compact">${tag}</span>`).join(' ')}</div>`
                : '';
            const comment = fb.comment ? `<p class="feedback-comment-compact">${fb.comment}</p>` : '';
            const date = new Date(fb.createdAt).toLocaleDateString(currentLang());
            
            return `
                <div class="feedback-item-compact">
                    <div class="feedback-header-compact">
                        <span class="feedback-user-compact">
                            <i class="fas fa-user-circle"></i> ${fb.fromUser.username}
                        </span>
                        <span class="feedback-rating-compact">${stars}</span>
                    </div>
                    ${tags}
                    ${comment}
                    <span class="feedback-date-compact">${date}</span>
                </div>
            `;
        }).join('')
        : '<div class="empty-state"><i class="fas fa-star"></i><p>Nessun feedback ancora</p></div>';

    const actionButtons = [];
    
    if (!isMember && currentUser && !currentUser.team && team.lookingForPlayers && currentUser.profileCompleted) {
        actionButtons.push(`
            <button class="btn btn-success" onclick="requestJoinTeam('${team._id}')">
                <i class="fas fa-paper-plane"></i>
                Richiedi di Unirti
            </button>
        `);
    }
    
    if (isMember && !isCaptain) {
        actionButtons.push(`
            <button class="btn btn-danger" onclick="leaveTeam('${team._id}')">
                <i class="fas fa-sign-out-alt"></i>
                Lascia Squadra
            </button>
        `);
    }
    
    if (!isMember) {
        actionButtons.push(`
            <button class="btn btn-primary" onclick="openFeedbackModalInline('${team._id}', 'team')">
                <i class="fas fa-star"></i>
                Lascia Feedback
            </button>
        `);
    }

    const lookingForPlayers = team.lookingForPlayers ? 'Sì' : 'No';

    const content = `
        <div class="team-detail-header">
            <div class="detail-avatar">
                <i class="fas fa-shield-alt"></i>
            </div>
            <div class="detail-info">
                <h2>${team.name}</h2>
                <div class="detail-meta">
                    <div class="meta-item">
                        <i class="fas fa-gamepad"></i>
                        <span>${team.platform}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-flag"></i>
                        <span>${team.nationality}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-users"></i>
                        <span>${team.members.length} membri</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-star"></i>
                        <span>${team.averageRating.toFixed(1)} (${team.feedbackCount} feedback)</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-search"></i>
                        <span>Cercano giocatori: ${lookingForPlayers}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="info-grid">
            ${team.description ? `
                <div class="info-card">
                    <h4><i class="fas fa-info-circle"></i> Descrizione</h4>
                    <p>${team.description}</p>
                </div>
            ` : ''}
            ${socialLinks.length > 0 ? `
                <div class="info-card">
                    <h4><i class="fas fa-share-alt"></i> Social & Live</h4>
                    <div class="social-links">${socialLinks.join('')}</div>
                </div>
            ` : ''}
        </div>

        ${actionButtons.length > 0 ? `
            <div class="detail-actions">
                ${actionButtons.join('')}
            </div>
            <div id="inlineFeedbackForm" style="display: none; margin: 2rem 0;"></div>
        ` : ''}

        <div class="team-members">
            <h4><i class="fas fa-users"></i> Membri della Squadra</h4>
            <div class="member-list">
                ${membersList}
            </div>
        </div>

        <div class="feedback-section-compact">
            <h3><i class="fas fa-star"></i> Feedback Ricevuti</h3>
            <div class="feedback-list-compact">
                ${feedbackList}
            </div>
        </div>
    `;

    document.getElementById('teamDetailContent').innerHTML = content;
    document.getElementById('teamDetailModal').classList.add('active');
}

function closeTeamDetailModalFn() {
    const modal = document.getElementById('teamDetailModal');
    if (modal) modal.classList.remove('active');
}

// ============================================
// FEEDBACK INLINE (NUOVO)
// ============================================

function openFeedbackModalInline(targetId, type) {
    const container = document.getElementById('inlineFeedbackForm');
    if (!container) return;

    selectedTags = [];
    selectedRating = 0;

    const form = `
        <div class="feedback-form-inline">
            <h3><i class="fas fa-star"></i> Lascia il tuo Feedback</h3>
            
            <div class="form-group">
                <label>Valutazione *</label>
                <div class="star-rating" id="inlineStarRating">
                    <i class="far fa-star" data-rating="1"></i>
                    <i class="far fa-star" data-rating="2"></i>
                    <i class="far fa-star" data-rating="3"></i>
                    <i class="far fa-star" data-rating="4"></i>
                    <i class="far fa-star" data-rating="5"></i>
                </div>
            </div>
            
            <div class="form-group">
                <label>Tag (opzionale)</label>
                <div class="tag-selector" id="inlineTagSelector">
                    <button type="button" class="tag-btn" data-tag="Serio"><i class="fas fa-user-tie"></i> Serio</button>
                    <button type="button" class="tag-btn" data-tag="Comunicativo"><i class="fas fa-comments"></i> Comunicativo</button>
                    <button type="button" class="tag-btn" data-tag="Divertente"><i class="fas fa-laugh"></i> Divertente</button>
                    <button type="button" class="tag-btn" data-tag="Tossico"><i class="fas fa-skull-crossbones"></i> Tossico</button>
                    <button type="button" class="tag-btn" data-tag="Giocatore di squadra"><i class="fas fa-users"></i> Squadra</button>
                    <button type="button" class="tag-btn" data-tag="Leader"><i class="fas fa-crown"></i> Leader</button>
                    <button type="button" class="tag-btn" data-tag="Affidabile"><i class="fas fa-handshake"></i> Affidabile</button>
                    <button type="button" class="tag-btn" data-tag="Puntuale"><i class="fas fa-clock"></i> Puntuale</button>
                    <button type="button" class="tag-btn" data-tag="Tecnico"><i class="fas fa-futbol"></i> Tecnico</button>
                    <button type="button" class="tag-btn" data-tag="Tattico"><i class="fas fa-chess"></i> Tattico</button>
                </div>
            </div>
            
            <div class="form-group">
                <label>Commento (opzionale)</label>
                <textarea id="inlineFeedbackComment" class="textarea" rows="3" maxlength="500"></textarea>
            </div>
            
            <div style="display: flex; gap: 1rem;">
                <button class="btn btn-primary" onclick="submitInlineFeedback('${targetId}', '${type}')">
                    <i class="fas fa-paper-plane"></i> Invia Feedback
                </button>
                <button class="btn btn-secondary" onclick="closeInlineFeedback()">
                    <i class="fas fa-times"></i> Annulla
                </button>
            </div>
        </div>
    `;

    container.innerHTML = form;
    container.style.display = 'block';

    // Setup inline star rating
    const stars = document.querySelectorAll('#inlineStarRating i');
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.classList.remove('far');
                    s.classList.add('fas', 'active');
                } else {
                    s.classList.remove('fas', 'active');
                    s.classList.add('far');
                }
            });
        });
    });

    // Setup inline tag selector
    const tagButtons = document.querySelectorAll('#inlineTagSelector .tag-btn');
    tagButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const tag = btn.dataset.tag;
            
            if (selectedTags.includes(tag)) {
                selectedTags = selectedTags.filter(t => t !== tag);
                btn.classList.remove('active');
            } else {
                selectedTags.push(tag);
                btn.classList.add('active');
            }
        });
    });

    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeInlineFeedback() {
    const container = document.getElementById('inlineFeedbackForm');
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
    selectedTags = [];
    selectedRating = 0;
}

async function submitInlineFeedback(targetId, type) {
    if (!selectedRating || selectedRating < 1 || selectedRating > 5) {
        showNotification('⚠️ Seleziona una valutazione (1-5 stelle)', 'error');
        return;
    }

    const comment = document.getElementById('inlineFeedbackComment')?.value.trim() || '';

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                targetUserId: type === 'user' ? targetId : undefined,
                targetTeamId: type === 'team' ? targetId : undefined,
                rating: selectedRating,
                comment,
                tags: selectedTags
            })
        });

        const data = await response.json();

        if (response.ok) {
            closeInlineFeedback();
            showNotification('✅ Feedback inviato con successo!', 'success');
            
            // Refresh the detail view
            if (type === 'user') {
                showPlayerDetail(targetId);
            } else if (type === 'team') {
                showTeamDetail(targetId);
            }
        } else {
            showNotification('❌ ' + (data.error || 'Errore durante l\'invio del feedback'), 'error');
        }
    } catch (error) {
        console.error('Submit feedback error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// TEAM ACTIONS
// ============================================

async function requestJoinTeam(teamId) {
    if (!currentUser.profileCompleted) {
        showNotification('⚠️ Devi completare il profilo prima di unirti a una squadra', 'error');
        navigateTo('profile');
        return;
    }

    if (!confirm('Vuoi inviare la richiesta per unirti a questa squadra?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/requests?action=create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ teamId })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Richiesta inviata con successo!', 'success');
            closeTeamDetailModalFn();
        } else {
            showNotification('❌ ' + (data.error || 'Errore durante l\'invio della richiesta'), 'error');
        }
    } catch (error) {
        console.error('Request join team error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function leaveTeam(teamId) {
    if (!confirm('Sei sicuro di voler lasciare questa squadra?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ teamId, action: 'leave' })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('👋 Hai lasciato la squadra', 'info');
            closeTeamDetailModalFn();
            await fetchCurrentUser();
            searchTeams();
        } else {
            showNotification('❌ ' + (data.error || 'Errore durante l\'operazione'), 'error');
        }
    } catch (error) {
        console.error('Leave team error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function removeMember(teamId, memberId) {
    if (!confirm('Sei sicuro di voler espellere questo membro? (Solo il capitano può farlo)')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ teamId, action: 'removeMember', targetUserId: memberId })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Membro espulso con successo', 'success');
            showTeamDetail(teamId);
        } else {
            showNotification('❌ ' + (data.error || 'Errore durante l\'operazione'), 'error');
        }
    } catch (error) {
        console.error('Remove member error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function setViceCaptain(teamId, memberId) {
    if (!confirm('Vuoi nominare questo giocatore come vice capitano?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ teamId, action: 'setViceCaptain', targetUserId: memberId })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Vice capitano nominato!', 'success');
            showTeamDetail(teamId);
        } else {
            showNotification('❌ ' + (data.error || 'Errore durante l\'operazione'), 'error');
        }
    } catch (error) {
        console.error('Set vice captain error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

// CREATE TEAM
function openCreateTeamModal() {
    if (!currentUser) {
        showNotification('⚠️ Devi effettuare il login', 'error');
        return;
    }

    if (!currentUser.profileCompleted) {
        showNotification('⚠️ Devi completare il profilo prima di creare una squadra', 'error');
        navigateTo('profile');
        return;
    }

    document.getElementById('createTeamModal').classList.add('active');
}

function closeCreateTeamModalFn() {
    const modal = document.getElementById('createTeamModal');
    if (modal) modal.classList.remove('active');
    
    const form = document.getElementById('createTeamForm');
    if (form) form.reset();
}

async function handleCreateTeam(e) {
    e.preventDefault();

    const name = document.getElementById('teamName').value.trim();
    const description = document.getElementById('teamDescription').value.trim();
    const platform = document.getElementById('teamPlatform').value;
    const nationality = document.getElementById('teamNationality').value.trim();
    const instagram = document.getElementById('teamInstagram').value.trim();
    const tiktok = document.getElementById('teamTiktok').value.trim();
    const liveLink = document.getElementById('teamLiveLink').value.trim();
    const lookingForPlayers = document.getElementById('teamLookingForPlayers').checked;

    if (!name || name.length < 3) {
        showNotification('⚠️ Nome squadra deve essere almeno 3 caratteri', 'error');
        return;
    }

    if (!platform || !nationality) {
        showNotification('⚠️ Seleziona piattaforma e nazionalità', 'error');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, description, platform, nationality, instagram, tiktok, liveLink, lookingForPlayers })
        });

        const data = await response.json();

        if (response.ok) {
            closeCreateTeamModalFn();
            showNotification('🎉 Squadra creata con successo!', 'success');
            await fetchCurrentUser();
            navigateTo('teams');
        } else {
            showNotification('❌ ' + (data.error || 'Errore durante la creazione'), 'error');
        }
    } catch (error) {
        console.error('Create team error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function setupStarRating() {
    const stars = document.querySelectorAll('.star-rating i');
    
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            document.getElementById('feedbackRating').value = selectedRating;
            
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.classList.remove('far');
                    s.classList.add('fas', 'active');
                } else {
                    s.classList.remove('fas', 'active');
                    s.classList.add('far');
                }
            });
        });
    });
}

function setupTagSelector() {
    const tagButtons = document.querySelectorAll('.tag-btn');
    
    tagButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const tag = btn.dataset.tag;
            
            if (selectedTags.includes(tag)) {
                selectedTags = selectedTags.filter(t => t !== tag);
                btn.classList.remove('active');
            } else {
                selectedTags.push(tag);
                btn.classList.add('active');
            }
        });
    });
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
}

// ============================================
// GLOBAL FUNCTIONS FOR ONCLICK
// ============================================

window.showPlayerDetail = showPlayerDetail;
window.showTeamDetail = showTeamDetail;
window.openFeedbackModalInline = openFeedbackModalInline;
window.submitInlineFeedback = submitInlineFeedback;
window.closeInlineFeedback = closeInlineFeedback;
window.requestJoinTeam = requestJoinTeam;
window.leaveTeam = leaveTeam;
window.removeMember = removeMember;
window.setViceCaptain = setViceCaptain;
// CONTINUAZIONE DI app.js - PARTE 4 FINALE

// ============================================
// REQUESTS
// ============================================

async function loadRequests() {
    if (!currentUser || !currentTeam) {
        showNotification('⚠️ Non hai i permessi per vedere le richieste', 'error');
        navigateTo('home');
        return;
    }

    loadReceivedRequests();
    loadSentRequests();
}

function switchRequestsTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    document.getElementById('receivedRequests').style.display = tab === 'received' ? 'grid' : 'none';
    document.getElementById('sentRequests').style.display = tab === 'sent' ? 'grid' : 'none';

    if (tab === 'received') {
        loadReceivedRequests();
    } else {
        loadSentRequests();
    }
}

async function loadReceivedRequests() {
    if (!currentTeam) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/requests?teamId=${currentTeam._id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            displayReceivedRequests(data.requests);
        } else {
            showNotification('❌ Errore nel caricamento richieste', 'error');
        }
    } catch (error) {
        console.error('Load received requests error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function loadSentRequests() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/requests?playerId=${currentUser._id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            displaySentRequests(data.requests);
        } else {
            showNotification('❌ Errore nel caricamento richieste', 'error');
        }
    } catch (error) {
        console.error('Load sent requests error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function displayReceivedRequests(requests) {
    const container = document.getElementById('receivedRequests');

    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Nessuna richiesta ricevuta</p>
            </div>
        `;
        return;
    }

    container.innerHTML = requests.map(req => {
        const player = req.playerDetails;
        if (!player) return '';

        const date = new Date(req.createdAt).toLocaleDateString(currentLang());
        const isPending = req.status === 'pending';

        return `
            <div class="request-card">
                <div class="request-header">
                    <div class="request-info">
                        <div class="request-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="request-details">
                            <h4>${player.username}</h4>
                            <p class="request-meta">
                                ${player.primaryRole} - Livello ${player.level} - ${player.platform}
                            </p>
                            <p class="request-meta">Richiesta inviata il ${date}</p>
                        </div>
                    </div>
                    ${isPending ? `
                        <div class="request-actions">
                            <button class="btn btn-small btn-success" onclick="approveRequest('${req._id}')">
                                <i class="fas fa-check"></i>
                                Approva
                            </button>
                            <button class="btn btn-small btn-danger" onclick="rejectRequest('${req._id}')">
                                <i class="fas fa-times"></i>
                                Rifiuta
                            </button>
                            <button class="btn btn-small btn-primary" onclick="showPlayerDetail('${player._id}')">
                                <i class="fas fa-eye"></i>
                                Vedi
                            </button>
                        </div>
                    ` : `
                        <span class="request-status ${req.status}">${req.status === 'approved' ? 'Approvata' : 'Rifiutata'}</span>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

function displaySentRequests(requests) {
    const container = document.getElementById('sentRequests');

    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-paper-plane"></i>
                <p>Nessuna richiesta inviata</p>
            </div>
        `;
        return;
    }

    container.innerHTML = requests.map(req => {
        const team = req.teamDetails;
        if (!team) return '';

        const date = new Date(req.createdAt).toLocaleDateString(currentLang());
        const isPending = req.status === 'pending';

        let statusText = 'In attesa';
        let statusClass = 'pending';
        
        if (req.status === 'approved') {
            statusText = 'Approvata';
            statusClass = 'approved';
        } else if (req.status === 'rejected') {
            statusText = 'Rifiutata';
            statusClass = 'rejected';
        } else if (req.status === 'cancelled') {
            statusText = 'Cancellata';
            statusClass = 'rejected';
        }

        return `
            <div class="request-card">
                <div class="request-header">
                    <div class="request-info">
                        <div class="request-avatar">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="request-details">
                            <h4>${team.name}</h4>
                            <p class="request-meta">${team.platform} - ${team.members.length} membri</p>
                            <p class="request-meta">Richiesta inviata il ${date}</p>
                        </div>
                    </div>
                    <div class="request-actions">
                        <span class="request-status ${statusClass}">${statusText}</span>
                        ${isPending ? `
                            <button class="btn btn-small btn-danger" onclick="cancelRequest('${req._id}')">
                                <i class="fas fa-times"></i>
                                Cancella
                            </button>
                        ` : ''}
                        <button class="btn btn-small btn-primary" onclick="showTeamDetail('${team._id}')">
                            <i class="fas fa-eye"></i>
                            Vedi
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function approveRequest(requestId) {
    if (!confirm('Vuoi approvare questa richiesta?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/requests?action=approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ requestId })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Richiesta approvata! Il giocatore è ora nella squadra.', 'success');
            loadReceivedRequests();
            await fetchCurrentUser();
        } else {
            showNotification('❌ ' + (data.error || 'Errore durante l\'approvazione'), 'error');
        }
    } catch (error) {
        console.error('Approve request error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function rejectRequest(requestId) {
    if (!confirm('Vuoi rifiutare questa richiesta?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/requests?action=reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ requestId })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Richiesta rifiutata', 'info');
            loadReceivedRequests();
        } else {
            showNotification('❌ ' + (data.error || 'Errore durante il rifiuto'), 'error');
        }
    } catch (error) {
        console.error('Reject request error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function cancelRequest(requestId) {
    if (!confirm('Vuoi cancellare questa richiesta?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/requests`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ requestId })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Richiesta cancellata', 'info');
            loadSentRequests();
        } else {
            showNotification('❌ ' + (data.error || 'Errore durante la cancellazione'), 'error');
        }
    } catch (error) {
        console.error('Cancel request error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// ADMIN DASHBOARD
// ============================================

async function loadAdminDashboard() {
    if (!currentUser || !currentUser.isAdmin) {
        showNotification('⚠️ Accesso negato', 'error');
        navigateTo('home');
        return;
    }

    try {
        showLoading();
        
        const statsResponse = await fetch(`${API_BASE}/admin?action=stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            document.getElementById('totalUsers').textContent = stats.totalUsers;
            document.getElementById('totalTeams').textContent = stats.totalTeams;
            document.getElementById('inactiveUsers').textContent = stats.inactiveUsers;
            document.getElementById('pendingRequests').textContent = stats.pendingRequests;
        }

        const usersResponse = await fetch(`${API_BASE}/admin?action=users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (usersResponse.ok) {
            const data = await usersResponse.json();
            displayUsersList(data.users);
        }

    } catch (error) {
        console.error('Load admin dashboard error:', error);
        showNotification('❌ Errore nel caricamento dashboard', 'error');
    } finally {
        hideLoading();
    }
}

function displayUsersList(users) {
    const container = document.getElementById('usersList');

    if (users.length === 0) {
        container.innerHTML = '<p style="color: #64748b;">Nessun utente registrato</p>';
        return;
    }

    container.innerHTML = users.map(user => {
        const isSuspended = user.isSuspended;
        const statusBadge = isSuspended 
            ? '<span style="color: #ef4444; font-weight: 600;">SOSPESO</span>'
            : '<span style="color: #10b981; font-weight: 600;">ATTIVO</span>';

        return `
            <div class="user-item">
                <div class="user-item-info">
                    <h4>${user.username} ${statusBadge}</h4>
                    <p>${user.email} - ${user.platform} - Livello ${user.level}</p>
                </div>
                <div class="user-item-actions">
                    ${isSuspended ? `
                        <button class="btn btn-small btn-success" onclick="unsuspendUser('${user._id}')">
                            <i class="fas fa-check"></i> Riabilita
                        </button>
                    ` : `
                        <button class="btn btn-small btn-warning" onclick="suspendUser('${user._id}')">
                            <i class="fas fa-ban"></i> Sospendi
                        </button>
                    `}
                    <button class="btn btn-small btn-danger" onclick="deleteUser('${user._id}')">
                        <i class="fas fa-trash"></i> Elimina
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function suspendUser(userId) {
    if (!confirm('Sei sicuro di voler sospendere questo utente?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/admin?action=suspend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ userId })
        });

        if (response.ok) {
            showNotification('✅ Utente sospeso', 'success');
            loadAdminDashboard();
        } else {
            showNotification('❌ Errore durante la sospensione', 'error');
        }
    } catch (error) {
        console.error('Suspend user error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function unsuspendUser(userId) {
    if (!confirm('Sei sicuro di voler riabilitare questo utente?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/admin?action=unsuspend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ userId })
        });

        if (response.ok) {
            showNotification('✅ Utente riabilitato', 'success');
            loadAdminDashboard();
        } else {
            showNotification('❌ Errore durante la riabilitazione', 'error');
        }
    } catch (error) {
        console.error('Unsuspend user error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteUser(userId) {
    if (!confirm('⚠️ ATTENZIONE! Sei sicuro di voler ELIMINARE questo utente? Questa azione è IRREVERSIBILE!')) return;
    if (!confirm('Confermi definitivamente l\'eliminazione?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/admin?action=user`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ userId })
        });

        if (response.ok) {
            showNotification('✅ Utente eliminato', 'success');
            loadAdminDashboard();
        } else {
            showNotification('❌ Errore durante l\'eliminazione', 'error');
        }
    } catch (error) {
        console.error('Delete user error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function handleDeleteAllTeams() {
    if (!confirm('⚠️ ATTENZIONE! Vuoi ELIMINARE TUTTE LE SQUADRE? Questa azione è IRREVERSIBILE!')) return;
    if (!confirm('Confermi definitivamente l\'eliminazione di TUTTE le squadre?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/admin?action=teams`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showNotification(`✅ ${data.count} squadre eliminate con successo`, 'success');
            loadAdminDashboard();
        } else {
            showNotification('❌ Errore durante l\'eliminazione', 'error');
        }
    } catch (error) {
        console.error('Delete all teams error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function handleResetProfiles() {
    if (!confirm('⚠️ ATTENZIONE! Vuoi resettare tutti i profili dei giocatori? Questa azione resetterà livelli, ruoli e statistiche!')) return;
    if (!confirm('Confermi definitivamente il reset di tutti i profili?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/admin?action=reset-profiles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Profili resettati con successo!', 'success');
            loadAdminDashboard();
        } else {
            showNotification('❌ Errore durante il reset', 'error');
        }
    } catch (error) {
        console.error('Reset profiles error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function handleSendNewsletter(e) {
    e.preventDefault();

    const subject = document.getElementById('newsletterSubject').value.trim();
    const message = document.getElementById('newsletterMessage').value.trim();

    if (!subject || !message) {
        showNotification('⚠️ Compila tutti i campi', 'error');
        return;
    }

    if (!confirm(`Vuoi inviare questa newsletter a TUTTI gli utenti?\n\nOggetto: ${subject}`)) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/admin?action=newsletter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ subject, message })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification(`✅ Newsletter inviata a ${data.sent} utenti!`, 'success');
            document.getElementById('newsletterForm').reset();
        } else {
            showNotification('❌ Errore durante l\'invio', 'error');
        }
    } catch (error) {
        console.error('Send newsletter error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// GLOBAL FUNCTIONS EXPORTS
// ============================================

window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
window.cancelRequest = cancelRequest;
window.suspendUser = suspendUser;
window.unsuspendUser = unsuspendUser;
window.deleteUser = deleteUser;
