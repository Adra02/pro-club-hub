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
let GLOBAL_MIN_LEVEL = 1;
let GLOBAL_MAX_LEVEL = 999;
let userFavorites = { giocatori: [], squadre: [] };

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM caricato, inizializzazione app...');

    // Controlla se è un link condiviso
    const urlParams = getURLParams();
    
    if (urlParams.profile && urlParams.id) {
        console.log('🔗 Link condiviso rilevato:', urlParams);
        
        if (urlParams.profile === 'player') {
            await loadSharedPlayerProfile(urlParams.id);
        } else if (urlParams.profile === 'team') {
            await loadSharedTeamProfile(urlParams.id);
        } else {
            showNotification('Tipo di profilo non valido', 'error');
            window.location.href = '/';
        }
        
        return; // Non continuare con il caricamento normale
    }

    // Inizializzazione normale
    await initApp();
    checkResetToken();
});

async function initApp() {
    console.log('⚙️ Inizializzazione app...');
    
    populateNationalities();
    setupLanguageSelector();
    updatePageLanguage();
    await loadGlobalLevelLimits();
    setupEventListeners();
    checkAuth(); // Questa funzione esegue l'autenticazione automatica
    navigateTo('home');
    
    console.log('✅ App inizializzata con successo');
}

async function loadGlobalLevelLimits() {
    try {
        const response = await fetch(`${API_BASE}/admin?action=level-settings`);
        if (response.ok) {
            const data = await response.json();
            GLOBAL_MIN_LEVEL = data.minLevel;
            GLOBAL_MAX_LEVEL = data.maxLevel;
            console.log(`✅ Level limits loaded: ${GLOBAL_MIN_LEVEL}-${GLOBAL_MAX_LEVEL}`);
            updateLevelInputLimits(data.minLevel, data.maxLevel);
        }
    } catch (error) {
        console.error('Failed to load level limits:', error);
        GLOBAL_MIN_LEVEL = 1;
        GLOBAL_MAX_LEVEL = 999;
    }
}

function updateLevelInputLimits(minLevel, maxLevel) {
    const levelInputs = document.querySelectorAll('input[type="number"][id*="evel"], input[type="number"][id*="Level"]');
    levelInputs.forEach(input => {
        if (input.id !== 'adminMinLevel' && input.id !== 'adminMaxLevel') {
            input.min = minLevel;
            input.max = maxLevel;
            input.placeholder = `${minLevel}-${maxLevel}`;
        }
    });

    const minLevelFilter = document.getElementById('minLevelFilter');
    const maxLevelFilter = document.getElementById('maxLevelFilter');
    if (minLevelFilter) {
        minLevelFilter.min = minLevel;
        minLevelFilter.max = maxLevel;
        minLevelFilter.placeholder = minLevel.toString();
    }
    if (maxLevelFilter) {
        maxLevelFilter.min = minLevel;
        maxLevelFilter.max = maxLevel;
        maxLevelFilter.placeholder = maxLevel.toString();
    }
}

function calculateLevelPercentage(level) {
    if (GLOBAL_MAX_LEVEL === GLOBAL_MIN_LEVEL) return 100;
    const percentage = ((level - GLOBAL_MIN_LEVEL) / (GLOBAL_MAX_LEVEL - GLOBAL_MIN_LEVEL)) * 100;
    return Math.min(Math.max(percentage, 0), 100);
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
    console.log('🔐 Controllo autenticazione...');
    const token = localStorage.getItem('token');
    if (token) {
        autoLogin();
    } else {
        updateUIForGuest();
    }
}

async function autoLogin() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/auth?action=me`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            console.log('✅ Login automatico:', currentUser.username);
            updateUIForUser();
            await loadUserFavorites();
        } else {
            console.log('❌ Token non valido, logout...');
            logout();
        }
    } catch (error) {
        console.error('Auto login error:', error);
        logout();
    } finally {
        hideLoading();
    }
}

function updateUIForUser() {
    console.log('🎨 Aggiornamento UI per utente autenticato');
    
    document.getElementById('profileNavBtn').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'block';
    document.getElementById('requestsNavBtn').style.display = 'block';
    document.getElementById('favoritesNavBtn').style.display = 'block';
    document.getElementById('adminNavBtn').style.display = currentUser.isAdmin ? 'block' : 'none';
    document.getElementById('heroActions').style.display = 'none';
    document.getElementById('heroUserInfo').style.display = 'block';
    document.getElementById('createTeamBtn').style.display = currentUser.profileCompleted ? 'block' : 'none';

    document.getElementById('heroUsername').textContent = currentUser.username;
    document.getElementById('heroRole').textContent = currentUser.primaryRole;
    document.getElementById('heroLevel').textContent = currentUser.level;
    
    const heroLevelPercent = calculateLevelPercentage(currentUser.level);
    document.getElementById('heroLevelProgress').style.width = `${heroLevelPercent}%`;
    
    document.getElementById('heroRating').textContent = currentUser.averageRating.toFixed(1);
    document.getElementById('heroRatingCount').textContent = currentUser.feedbackCount;
}

function updateUIForGuest() {
    console.log('🎨 Aggiornamento UI per ospite');
    
    document.getElementById('profileNavBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('requestsNavBtn').style.display = 'none';
    document.getElementById('adminNavBtn').style.display = 'none';
    document.getElementById('favoritesNavBtn').style.display = 'none';
    document.getElementById('heroActions').style.display = 'flex';
    document.getElementById('heroUserInfo').style.display = 'none';
    document.getElementById('createTeamBtn').style.display = 'none';
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    console.log('🔧 Configurazione event listeners...');
    
    // NAVIGATION
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const page = this.getAttribute('data-page');
            navigateTo(page);
        });
    });

    // HERO BUTTONS
    const heroLoginBtn = document.getElementById('heroLoginBtn');
    if (heroLoginBtn) {
        heroLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openAuthModal('login');
        });
    }
    
    const heroRegisterBtn = document.getElementById('heroRegisterBtn');
    if (heroRegisterBtn) {
        heroRegisterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openAuthModal('register');
        });
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            logout();
        });
    }

    // AUTH FORM SWITCHES
    const showRegisterForm = document.getElementById('showRegisterForm');
    const showLoginForm = document.getElementById('showLoginForm');
    const showForgotPassword = document.getElementById('showForgotPassword');
    const backToLogin = document.getElementById('backToLogin');
    
    if (showRegisterForm) showRegisterForm.addEventListener('click', (e) => { e.preventDefault(); switchAuthForm('register'); });
    if (showLoginForm) showLoginForm.addEventListener('click', (e) => { e.preventDefault(); switchAuthForm('login'); });
    if (showForgotPassword) showForgotPassword.addEventListener('click', (e) => { e.preventDefault(); switchAuthForm('forgot'); });
    if (backToLogin) backToLogin.addEventListener('click', (e) => { e.preventDefault(); switchAuthForm('login'); });

    // MODAL CLOSES
    const closeAuthModal = document.getElementById('closeAuthModal');
    if (closeAuthModal) closeAuthModal.addEventListener('click', closeAuthModalFn);

    const closePlayerDetailModal = document.getElementById('closePlayerDetailModal');
    if (closePlayerDetailModal) closePlayerDetailModal.addEventListener('click', closePlayerDetailModalFn);

    const closeTeamDetailModal = document.getElementById('closeTeamDetailModal');
    if (closeTeamDetailModal) closeTeamDetailModal.addEventListener('click', closeTeamDetailModalFn);

    const closeFeedbackModal = document.getElementById('closeFeedbackModal');
    if (closeFeedbackModal) closeFeedbackModal.addEventListener('click', closeFeedbackModalFn);

    // FORMS
    const loginFormElement = document.getElementById('loginFormElement');
    if (loginFormElement) loginFormElement.addEventListener('submit', handleLogin);

    const registerFormElement = document.getElementById('registerFormElement');
    if (registerFormElement) registerFormElement.addEventListener('submit', handleRegister);

    const forgotPasswordFormElement = document.getElementById('forgotPasswordFormElement');
    if (forgotPasswordFormElement) forgotPasswordFormElement.addEventListener('submit', handleForgotPassword);

    // PROFILE
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) editProfileBtn.addEventListener('click', openEditProfileModal);

    const closeEditModal = document.getElementById('closeEditModal');
    if (closeEditModal) closeEditModal.addEventListener('click', closeEditProfileModal);

    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) editProfileForm.addEventListener('submit', handleEditProfile);

    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    if (resetPasswordBtn) resetPasswordBtn.addEventListener('click', handleRequestPasswordReset);

    // TEAMS
    const createTeamBtn = document.getElementById('createTeamBtn');
    if (createTeamBtn) createTeamBtn.addEventListener('click', openCreateTeamModal);

    const closeCreateTeamModal = document.getElementById('closeCreateTeamModal');
    if (closeCreateTeamModal) closeCreateTeamModal.addEventListener('click', closeCreateTeamModalFn);

    const createTeamForm = document.getElementById('createTeamForm');
    if (createTeamForm) createTeamForm.addEventListener('submit', handleCreateTeam);

    // SEARCH
    const searchPlayersBtn = document.getElementById('searchPlayersBtn');
    if (searchPlayersBtn) searchPlayersBtn.addEventListener('click', searchPlayers);

    const searchTeamsBtn = document.getElementById('searchTeamsBtn');
    if (searchTeamsBtn) searchTeamsBtn.addEventListener('click', searchTeams);

    // FEEDBACK
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) feedbackForm.addEventListener('submit', handleSubmitFeedback);

    // REQUESTS TABS
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.getAttribute('data-tab');
            if (tab === 'received-requests') {
                loadReceivedRequests();
            } else if (tab === 'sent-requests') {
                loadSentRequests();
            } else if (tab === 'favorite-players') {
                switchFavoritesTab('favorite-players');
            } else if (tab === 'favorite-teams') {
                switchFavoritesTab('favorite-teams');
            }
        });
    });

    // ADMIN PANEL
    const levelSettingsForm = document.getElementById('levelSettingsForm');
    if (levelSettingsForm) levelSettingsForm.addEventListener('submit', handleLevelSettings);

    const deleteAllTeamsBtn = document.getElementById('deleteAllTeamsBtn');
    if (deleteAllTeamsBtn) deleteAllTeamsBtn.addEventListener('click', handleDeleteAllTeams);

    const resetProfilesBtn = document.getElementById('resetProfilesBtn');
    if (resetProfilesBtn) resetProfilesBtn.addEventListener('click', handleResetProfiles);

    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) newsletterForm.addEventListener('submit', handleNewsletterSubmit);

    console.log('✅ Event listeners configurati');
}

// ============================================
// NAVIGATION
// ============================================

function navigateTo(page) {
    console.log('📍 Navigazione a:', page);
    
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const pageElement = document.getElementById(`${page}Page`);
    if (pageElement) pageElement.style.display = 'block';

    const navBtn = document.querySelector(`[data-page="${page}"]`);
    if (navBtn) navBtn.classList.add('active');

    // CARICA CONTENUTO SPECIFICO PAGINA
    if (page === 'players') searchPlayers();
    if (page === 'teams') searchTeams();
    if (page === 'profile') loadProfile();
    if (page === 'requests') loadRequests();
    if (page === 'favorites') loadFavoritesPage();
    if (page === 'admin') loadAdminPanel();

    window.scrollTo(0, 0);
}

// ============================================
// AUTH MODALS
// ============================================

function openAuthModal(form = 'login') {
    document.getElementById('authModal').classList.add('active');
    switchAuthForm(form);
}

function closeAuthModalFn() {
    document.getElementById('authModal').classList.remove('active');
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

    if (isNaN(level) || level < GLOBAL_MIN_LEVEL || level > GLOBAL_MAX_LEVEL) {
        showNotification(`⚠️ Il livello deve essere tra ${GLOBAL_MIN_LEVEL} e ${GLOBAL_MAX_LEVEL}`, 'error');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/auth?action=register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username, email, password, primaryRole, platform, nationality, level 
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            closeAuthModalFn();
            updateUIForUser();
            showNotification('🎉 Registrazione completata! Completa il tuo profilo.', 'success');
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
            showNotification('📧 Se l\'email esiste, riceverai un link', 'success');
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
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
            showNotification('📧 Email inviata! Controlla la tua casella.', 'success');
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
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
            showNotification('✅ Password reimpostata! Ora puoi effettuare il login.', 'success');
            openAuthModal('login');
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
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
    updateUIForGuest();
    navigateTo('home');
    showNotification('👋 Logout effettuato', 'info');
}

// ============================================
// PROFILE
// ============================================

function loadProfile() {
    if (!currentUser) {
        showNotification('⚠️ Devi effettuare il login', 'error');
        navigateTo('home');
        return;
    }

    renderProfile();
}

function renderProfile() {
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileRole').textContent = currentUser.primaryRole;
    document.getElementById('profilePlatform').textContent = currentUser.platform;
    document.getElementById('profileNationality').textContent = currentUser.nationality || '-';
    document.getElementById('profileLevel').textContent = currentUser.level;
    
    const profileLevelPercent = calculateLevelPercentage(currentUser.level);
    document.getElementById('profileLevelProgress').style.width = `${profileLevelPercent}%`;
    
    document.getElementById('profileRating').textContent = currentUser.averageRating.toFixed(1);
    document.getElementById('profileFeedbackCount').textContent = currentUser.feedbackCount;
    document.getElementById('profileInstagram').textContent = currentUser.instagram || '-';
    document.getElementById('profileTiktok').textContent = currentUser.tiktok || '-';
    document.getElementById('profileBio').textContent = currentUser.bio || '-';
    document.getElementById('profileLookingForTeam').textContent = currentUser.lookingForTeam ? '✅ Sì' : '❌ No';

    const secondaryRolesEl = document.getElementById('profileSecondaryRoles');
    if (currentUser.secondaryRoles && currentUser.secondaryRoles.length > 0) {
        secondaryRolesEl.textContent = currentUser.secondaryRoles.join(', ');
    } else {
        secondaryRolesEl.textContent = '-';
    }

    renderReceivedFeedback();
}

async function renderReceivedFeedback() {
    try {
        const response = await fetch(`${API_BASE}/feedback?userId=${currentUser._id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            const feedbackContainer = document.getElementById('receivedFeedbackList');
            
            if (data.feedback && data.feedback.length > 0) {
                feedbackContainer.innerHTML = data.feedback.map(fb => `
                    <div class="feedback-item">
                        <div class="feedback-header">
                            <div class="feedback-author">
                                <i class="fas fa-user-circle"></i>
                                ${fb.fromUser ? fb.fromUser.username : 'Utente'}
                            </div>
                            <div class="feedback-rating">
                                ${'<i class="fas fa-star"></i>'.repeat(fb.rating)}
                                ${'<i class="far fa-star"></i>'.repeat(5 - fb.rating)}
                            </div>
                        </div>
                        ${fb.tags && fb.tags.length > 0 ? `
                            <div class="feedback-tags">
                                ${fb.tags.map(tag => `<span class="feedback-tag"><i class="fas fa-tag"></i> ${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                        ${fb.comment ? `<p class="feedback-comment">${fb.comment}</p>` : ''}
                        <p class="feedback-date">${new Date(fb.createdAt).toLocaleDateString()}</p>
                    </div>
                `).join('');
            } else {
                feedbackContainer.innerHTML = '<p class="empty-state">Nessun feedback ricevuto</p>';
            }
        }
    } catch (error) {
        console.error('Error loading feedback:', error);
    }
}

function openEditProfileModal() {
    if (!currentUser) return;

    document.getElementById('editUsername').value = currentUser.username;
    document.getElementById('editPrimaryRole').value = currentUser.primaryRole;
    document.getElementById('editPlatform').value = currentUser.platform;
    document.getElementById('editNationality').value = currentUser.nationality || '';
    document.getElementById('editLevel').value = currentUser.level;
    document.getElementById('editInstagram').value = currentUser.instagram || '';
    document.getElementById('editTiktok').value = currentUser.tiktok || '';
    document.getElementById('editBio').value = currentUser.bio || '';
    document.getElementById('editLookingForTeam').checked = currentUser.lookingForTeam || false;

    // Secondary roles checkboxes
    document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]').forEach(cb => {
        cb.checked = currentUser.secondaryRoles && currentUser.secondaryRoles.includes(cb.value);
    });

    // Setup event listener for profile completion check
    const instagramInput = document.getElementById('editInstagram');
    const tiktokInput = document.getElementById('editTiktok');
    
    if (instagramInput) instagramInput.addEventListener('input', checkProfileCompletion);
    if (tiktokInput) tiktokInput.addEventListener('input', checkProfileCompletion);
    
    checkProfileCompletion();

    document.getElementById('editProfileModal').classList.add('active');
}

function closeEditProfileModal() {
    document.getElementById('editProfileModal').classList.remove('active');
}

function checkProfileCompletion() {
    const instagram = document.getElementById('editInstagram').value.trim();
    const tiktok = document.getElementById('editTiktok').value.trim();
    
    const warningEl = document.getElementById('profileCompletionWarning');
    if (!instagram && !tiktok) {
        if (warningEl) warningEl.style.display = 'block';
    } else {
        if (warningEl) warningEl.style.display = 'none';
    }
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

    const secondaryRoles = Array.from(
        document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]:checked')
    ).map(cb => cb.value);

    if (!username || username.length < 3) {
        showNotification('⚠️ Username deve essere almeno 3 caratteri', 'error');
        return;
    }

    if (isNaN(level) || level < GLOBAL_MIN_LEVEL || level > GLOBAL_MAX_LEVEL) {
        showNotification(`⚠️ Il livello deve essere tra ${GLOBAL_MIN_LEVEL} e ${GLOBAL_MAX_LEVEL}`, 'error');
        return;
    }

    if (secondaryRoles.length > 2) {
        showNotification('⚠️ Massimo 2 ruoli secondari', 'error');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/auth?action=me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                username, primaryRole, platform, nationality, level,
                instagram, tiktok, bio, lookingForTeam, secondaryRoles
            })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            closeEditProfileModal();
            renderProfile();
            updateUIForUser();
            showNotification('✅ Profilo aggiornato con successo!', 'success');
        } else {
            showNotification('❌ ' + (data.error || 'Errore aggiornamento profilo'), 'error');
        }
    } catch (error) {
        console.error('Edit profile error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// PLAYERS SEARCH
// ============================================

async function searchPlayers() {
    if (!currentUser) {
        showNotification('⚠️ Devi effettuare il login', 'error');
        navigateTo('home');
        return;
    }

    const role = document.getElementById('roleFilter').value;
    const platform = document.getElementById('platformFilter').value;
    const nationality = document.getElementById('nationalityFilter').value.trim();
    const minLevel = document.getElementById('minLevelFilter').value;
    const maxLevel = document.getElementById('maxLevelFilter').value;
    const search = document.getElementById('searchInput').value.trim();

    try {
        showLoading();
        const params = new URLSearchParams();
        if (role) params.append('role', role);
        if (platform) params.append('platform', platform);
        if (nationality) params.append('nationality', nationality);
        if (minLevel) params.append('minLevel', minLevel);
        if (maxLevel) params.append('maxLevel', maxLevel);
        if (search) params.append('search', search);

        const response = await fetch(`${API_BASE}/users?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            renderPlayersList(data.users);
        }
    } catch (error) {
        console.error('Search players error:', error);
        showNotification('❌ Errore nella ricerca', 'error');
    } finally {
        hideLoading();
    }
}

function renderPlayersList(players) {
    const container = document.getElementById('playersContainer');

    if (!players || players.length === 0) {
        container.innerHTML = '<p class="empty-state">Nessun giocatore trovato</p>';
        return;
    }

    container.innerHTML = players.map(player => {
        const isFavorite = userFavorites.giocatori.some(g => g._id === player._id);
        const levelPercent = calculateLevelPercentage(player.level);
        
        return `
            <div class="player-card">
                <div class="player-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="player-info">
                    <h3>
                        ${player.username}
                        ${currentUser._id !== player._id ? `
                            <i class="${isFavorite ? 'fas' : 'far'} fa-heart favorite-icon" 
                               data-favorite-id="${player._id}"
                               style="color: ${isFavorite ? '#ef4444' : '#94a3b8'}; cursor: pointer;" 
                               onclick="toggleFavorite('${player._id}', 'giocatori')"></i>
                        ` : ''}
                    </h3>
                    <p><i class="fas fa-gamepad"></i> ${player.primaryRole}</p>
                    <p><i class="fas fa-globe"></i> ${player.platform} | ${player.nationality}</p>
                    <div class="player-level">
                        <span>Livello ${player.level}</span>
                        <div class="level-bar">
                            <div class="level-progress" style="width: ${levelPercent}%"></div>
                        </div>
                    </div>
                    <div class="player-rating">
                        <i class="fas fa-star"></i>
                        <span>${player.averageRating.toFixed(1)} (${player.feedbackCount} feedback)</span>
                    </div>
                </div>
                <button class="btn btn-primary btn-sm" onclick="showPlayerDetail('${player._id}')">
                    <i class="fas fa-eye"></i> Dettagli
                </button>
                ${player.lookingForTeam ? '<span class="looking-badge"><i class="fas fa-search"></i> Cerca squadra</span>' : ''}
            </div>
        `;
    }).join('');
}

async function showPlayerDetail(playerId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/users?id=${playerId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const player = await response.json();

            const feedbackResponse = await fetch(`${API_BASE}/feedback?userId=${playerId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            let feedback = [];
            if (feedbackResponse.ok) {
                const feedbackData = await feedbackResponse.json();
                feedback = feedbackData.feedback;
            }

            renderPlayerDetail(player, feedback);
            document.getElementById('playerDetailModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading player:', error);
        showNotification('❌ Errore nel caricamento', 'error');
    } finally {
        hideLoading();
    }
}

function renderPlayerDetail(player, feedback) {
    const content = document.getElementById('playerDetailContent');
    const isFavorite = userFavorites.giocatori.some(g => g._id === player._id);
    const levelPercent = calculateLevelPercentage(player.level);

    content.innerHTML = `
        <div class="player-detail-header">
            <div class="detail-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="detail-info">
                <h2>
                    ${player.username}
                    ${currentUser && player._id !== currentUser._id ? `
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart favorite-icon" 
                           data-favorite-id="${player._id}"
                           style="color: ${isFavorite ? '#ef4444' : '#94a3b8'}; cursor: pointer;" 
                           onclick="toggleFavorite('${player._id}', 'giocatori')"></i>
                    ` : ''}
                </h2>
                <p><i class="fas fa-gamepad"></i> ${player.primaryRole}</p>
                ${player.secondaryRoles && player.secondaryRoles.length > 0 ? `
                    <p><i class="fas fa-plus-circle"></i> Ruoli secondari: ${player.secondaryRoles.join(', ')}</p>
                ` : ''}
                <p><i class="fas fa-globe"></i> ${player.platform} | ${player.nationality}</p>
                <div class="player-level">
                    <span>Livello ${player.level}</span>
                    <div class="level-bar">
                        <div class="level-progress" style="width: ${levelPercent}%"></div>
                    </div>
                </div>
                <div class="player-rating">
                    <i class="fas fa-star"></i>
                    <span>${player.averageRating.toFixed(1)} (${player.feedbackCount} feedback)</span>
                </div>
                ${player.bio ? `<p class="player-bio"><i class="fas fa-align-left"></i> ${player.bio}</p>` : ''}
                ${player.instagram ? `
                    <p><i class="fab fa-instagram"></i> 
                        <a href="https://instagram.com/${player.instagram}" target="_blank">@${player.instagram}</a>
                    </p>
                ` : ''}
                ${player.tiktok ? `
                    <p><i class="fab fa-tiktok"></i> 
                        <a href="https://tiktok.com/@${player.tiktok}" target="_blank">@${player.tiktok}</a>
                    </p>
                ` : ''}
                ${player.lookingForTeam ? '<span class="looking-badge"><i class="fas fa-search"></i> Cerca squadra</span>' : ''}
            </div>
        </div>

        ${currentUser && player._id !== currentUser._id ? `
            <div class="detail-actions">
                <button class="btn btn-primary" onclick="openFeedbackModal('${player._id}', null)">
                    <i class="fas fa-star"></i> Lascia Feedback
                </button>
                <button class="btn btn-secondary" onclick="shareProfile('player', '${player._id}', '${player.username}')">
                    <i class="fas fa-share-alt"></i> Condividi
                </button>
            </div>
        ` : ''}

        <div class="feedback-section">
            <h3><i class="fas fa-star"></i> Feedback Ricevuti</h3>
            ${renderFeedbackItems(feedback)}
        </div>
    `;
}

function renderFeedbackItems(feedback) {
    if (!feedback || feedback.length === 0) {
        return '<p class="empty-state">Nessun feedback</p>';
    }

    return feedback.map(fb => `
        <div class="feedback-item">
            <div class="feedback-header">
                <div class="feedback-author">
                    <i class="fas fa-user-circle"></i>
                    ${fb.fromUser ? fb.fromUser.username : 'Utente'}
                </div>
                <div class="feedback-rating">
                    ${'<i class="fas fa-star"></i>'.repeat(fb.rating)}
                    ${'<i class="far fa-star"></i>'.repeat(5 - fb.rating)}
                </div>
            </div>
            ${fb.tags && fb.tags.length > 0 ? `
                <div class="feedback-tags">
                    ${fb.tags.map(tag => `<span class="feedback-tag"><i class="fas fa-tag"></i> ${tag}</span>`).join('')}
                </div>
            ` : ''}
            ${fb.comment ? `<p class="feedback-comment">${fb.comment}</p>` : ''}
            <p class="feedback-date">${new Date(fb.createdAt).toLocaleDateString()}</p>
        </div>
    `).join('');
}

// ============================================
// TEAMS SEARCH
// ============================================

async function searchTeams() {
    if (!currentUser) {
        showNotification('⚠️ Devi effettuare il login', 'error');
        navigateTo('home');
        return;
    }

    const platform = document.getElementById('teamPlatformFilter').value;
    const nationality = document.getElementById('teamNationalityFilter').value.trim();
    const search = document.getElementById('teamSearchInput').value.trim();

    try {
        showLoading();
        const params = new URLSearchParams();
        if (platform) params.append('platform', platform);
        if (nationality) params.append('nationality', nationality);
        if (search) params.append('search', search);

        const response = await fetch(`${API_BASE}/teams?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            renderTeamsList(data.teams);
        }
    } catch (error) {
        console.error('Search teams error:', error);
        showNotification('❌ Errore nella ricerca', 'error');
    } finally {
        hideLoading();
    }
}

function renderTeamsList(teams) {
    const container = document.getElementById('teamsContainer');

    if (!teams || teams.length === 0) {
        container.innerHTML = '<p class="empty-state">Nessuna squadra trovata</p>';
        return;
    }

    container.innerHTML = teams.map(team => {
        const isFavorite = userFavorites.squadre.some(s => s._id === team._id);
        
        return `
            <div class="team-card">
                <div class="team-header">
                    <h3>
                        <i class="fas fa-shield-alt"></i>
                        ${team.name}
                        ${currentUser && !team.members.some(m => m._id === currentUser._id) ? `
                            <i class="${isFavorite ? 'fas' : 'far'} fa-heart favorite-icon" 
                               data-favorite-id="${team._id}"
                               style="color: ${isFavorite ? '#ef4444' : '#94a3b8'}; cursor: pointer;" 
                               onclick="toggleFavorite('${team._id}', 'squadre')"></i>
                        ` : ''}
                    </h3>
                </div>
                <div class="team-info">
                    <p><i class="fas fa-globe"></i> ${team.platform} | ${team.nationality}</p>
                    <p><i class="fas fa-users"></i> ${team.members.length} membri</p>
                    ${team.description ? `<p class="team-description">${team.description}</p>` : ''}
                    <div class="team-rating">
                        <i class="fas fa-star"></i>
                        <span>${team.averageRating.toFixed(1)} (${team.feedbackCount} feedback)</span>
                    </div>
                </div>
                <button class="btn btn-primary btn-sm" onclick="showTeamDetail('${team._id}')">
                    <i class="fas fa-eye"></i> Dettagli
                </button>
                ${team.lookingForPlayers ? '<span class="looking-badge"><i class="fas fa-user-plus"></i> Cerca giocatori</span>' : ''}
            </div>
        `;
    }).join('');
}

async function showTeamDetail(teamId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams?id=${teamId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();

            const feedbackResponse = await fetch(`${API_BASE}/feedback?teamId=${teamId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            let feedback = [];
            if (feedbackResponse.ok) {
                const feedbackData = await feedbackResponse.json();
                feedback = feedbackData.feedback;
            }

            renderTeamDetail(data.team, feedback);
            document.getElementById('teamDetailModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading team:', error);
        showNotification('❌ Errore nel caricamento', 'error');
    } finally {
        hideLoading();
    }
}

function renderTeamDetail(team, feedback) {
    const content = document.getElementById('teamDetailContent');
    const isFavorite = userFavorites.squadre.some(s => s._id === team._id);
    const isCaptain = currentUser && team.captain.toString() === currentUser._id;
    const isViceCaptain = currentUser && team.viceCaptain && team.viceCaptain.toString() === currentUser._id;
    const isMember = currentUser && team.members.some(m => m._id === currentUser._id);

    content.innerHTML = `
        <div class="team-detail-header">
            <div class="detail-avatar">
                <i class="fas fa-shield-alt"></i>
            </div>
            <div class="detail-info">
                <h2>
                    ${team.name}
                    ${currentUser && !isMember ? `
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart favorite-icon" 
                           data-favorite-id="${team._id}"
                           style="color: ${isFavorite ? '#ef4444' : '#94a3b8'}; cursor: pointer;" 
                           onclick="toggleFavorite('${team._id}', 'squadre')"></i>
                    ` : ''}
                </h2>
                <p><i class="fas fa-globe"></i> ${team.platform} | ${team.nationality}</p>
                ${team.description ? `<p class="team-description">${team.description}</p>` : ''}
                <div class="team-rating">
                    <i class="fas fa-star"></i>
                    <span>${team.averageRating.toFixed(1)} (${team.feedbackCount} feedback)</span>
                </div>
                ${team.instagram ? `
                    <p><i class="fab fa-instagram"></i> 
                        <a href="https://instagram.com/${team.instagram}" target="_blank">@${team.instagram}</a>
                    </p>
                ` : ''}
                ${team.tiktok ? `
                    <p><i class="fab fa-tiktok"></i> 
                        <a href="https://tiktok.com/@${team.tiktok}" target="_blank">@${team.tiktok}</a>
                    </p>
                ` : ''}
                ${team.liveLink ? `
                    <p><i class="fas fa-link"></i> 
                        <a href="${team.liveLink}" target="_blank">Live Link</a>
                    </p>
                ` : ''}
                ${team.lookingForPlayers ? '<span class="looking-badge"><i class="fas fa-user-plus"></i> Cerca giocatori</span>' : ''}
            </div>
        </div>

        <div class="team-members">
            <h3><i class="fas fa-users"></i> Membri</h3>
            ${team.members.map(member => {
                const memberIsCaptain = member._id === team.captain.toString();
                const memberIsVice = team.viceCaptain && member._id === team.viceCaptain.toString();
                const levelPercent = calculateLevelPercentage(member.level);
                
                return `
                    <div class="member-item">
                        <div class="member-info">
                            <h4>
                                ${member.username}
                                ${memberIsCaptain ? '<span class="captain-badge"><i class="fas fa-crown"></i> Capitano</span>' : ''}
                                ${memberIsVice ? '<span class="vice-badge"><i class="fas fa-star"></i> Vice</span>' : ''}
                            </h4>
                            <p><i class="fas fa-gamepad"></i> ${member.primaryRole} | Livello ${member.level}</p>
                            <div class="level-bar">
                                <div class="level-progress" style="width: ${levelPercent}%"></div>
                            </div>
                        </div>
                        ${isCaptain && !memberIsCaptain ? `
                            <div class="member-actions">
                                ${!memberIsVice ? `
                                    <button class="btn btn-primary btn-sm" onclick="setViceCaptain('${team._id}', '${member._id}')">
                                        <i class="fas fa-star"></i> Vice
                                    </button>
                                ` : ''}
                                <button class="btn btn-danger btn-sm" onclick="removeMember('${team._id}', '${member._id}')">
                                    <i class="fas fa-user-times"></i> Rimuovi
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>

        ${currentUser ? `
            <div class="detail-actions">
                ${!isMember && !currentUser.team ? `
                    <button class="btn btn-primary" onclick="requestJoinTeam('${team._id}')">
                        <i class="fas fa-user-plus"></i> Richiedi di Unirti
                    </button>
                ` : ''}
                ${isMember && !isCaptain ? `
                    <button class="btn btn-warning" onclick="leaveTeam('${team._id}')">
                        <i class="fas fa-door-open"></i> Lascia Squadra
                    </button>
                ` : ''}
                ${currentUser._id !== team.captain.toString() ? `
                    <button class="btn btn-secondary" onclick="openFeedbackModal(null, '${team._id}')">
                        <i class="fas fa-star"></i> Lascia Feedback
                    </button>
                ` : ''}
                <button class="btn btn-secondary" onclick="shareProfile('team', '${team._id}', '${team.name}')">
                    <i class="fas fa-share-alt"></i> Condividi
                </button>
            </div>
        ` : ''}

        <div class="feedback-section">
            <h3><i class="fas fa-star"></i> Feedback Ricevuti</h3>
            ${renderFeedbackItems(feedback)}
        </div>
    `;
}

// ============================================
// TEAM ACTIONS
// ============================================

function openCreateTeamModal() {
    if (!currentUser) {
        showNotification('⚠️ Devi effettuare il login', 'error');
        return;
    }

    if (!currentUser.profileCompleted) {
        showNotification('⚠️ Completa il profilo prima', 'error');
        return;
    }

    document.getElementById('createTeamModal').classList.add('active');
}

function closeCreateTeamModalFn() {
    document.getElementById('createTeamModal').classList.remove('active');
    document.getElementById('createTeamForm').reset();
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
        showNotification('⚠️ Piattaforma e nazionalità sono obbligatori', 'error');
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
            body: JSON.stringify({
                name, description, platform, nationality,
                instagram, tiktok, liveLink, lookingForPlayers
            })
        });

        const data = await response.json();

        if (response.ok) {
            closeCreateTeamModalFn();
            showNotification('✅ Squadra creata con successo!', 'success');
            currentTeam = data.team;
            currentUser.team = data.team._id;
            navigateTo('teams');
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Create team error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function loadCurrentTeam() {
    if (!currentUser || !currentUser.team) return;

    try {
        const response = await fetch(`${API_BASE}/teams?id=${currentUser.team}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            currentTeam = data.team;
        }
    } catch (error) {
        console.error('Load current team error:', error);
    }
}

async function requestJoinTeam(teamId) {
    if (!currentUser) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ teamId })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Richiesta inviata!', 'success');
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Request join team error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function leaveTeam(teamId) {
    if (!confirm('Sei sicuro di voler lasciare la squadra?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams/leave`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ teamId })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Hai lasciato la squadra', 'info');
            currentUser.team = null;
            currentTeam = null;
            document.getElementById('teamDetailModal').classList.remove('active');
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Leave team error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function removeMember(teamId, memberId) {
    if (!confirm('Rimuovere questo membro dalla squadra?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams/remove-member`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ teamId, memberId })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Membro rimosso', 'success');
            showTeamDetail(teamId);
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Remove member error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function setViceCaptain(teamId, memberId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams/set-vice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ teamId, memberId })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Vice-capitano nominato', 'success');
            showTeamDetail(teamId);
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Set vice captain error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// FEEDBACK
// ============================================

function openFeedbackModal(userId = null, teamId = null) {
    if (!currentUser) {
        showNotification('⚠️ Devi effettuare il login', 'error');
        return;
    }

    document.getElementById('feedbackTargetUserId').value = userId || '';
    document.getElementById('feedbackTargetTeamId').value = teamId || '';
    
    selectedRating = 0;
    selectedTags = [];
    
    document.querySelectorAll('#starRating i').forEach((star, index) => {
        star.onclick = () => selectRating(index + 1);
    });

    setupTagSelector();
    
    document.getElementById('feedbackModal').classList.add('active');
}

function selectRating(rating) {
    selectedRating = rating;
    document.querySelectorAll('#starRating i').forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('far');
            star.classList.add('fas', 'active');
        } else {
            star.classList.remove('fas', 'active');
            star.classList.add('far');
        }
    });
}

function setupTagSelector() {
    const tagBtns = document.querySelectorAll('#tagSelector .tag-btn');
    tagBtns.forEach(btn => {
        btn.onclick = () => {
            const tag = btn.getAttribute('data-tag');
            if (selectedTags.includes(tag)) {
                selectedTags = selectedTags.filter(t => t !== tag);
                btn.classList.remove('active');
            } else {
                selectedTags.push(tag);
                btn.classList.add('active');
            }
        };
    });
}

async function handleSubmitFeedback(e) {
    e.preventDefault();

    if (selectedRating === 0) {
        showNotification('⚠️ Seleziona una valutazione', 'error');
        return;
    }

    const userId = document.getElementById('feedbackTargetUserId').value;
    const teamId = document.getElementById('feedbackTargetTeamId').value;
    const comment = document.getElementById('feedbackComment').value.trim();

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                toUserId: userId || undefined,
                toTeamId: teamId || undefined,
                rating: selectedRating,
                tags: selectedTags,
                comment
            })
        });

        const data = await response.json();

        if (response.ok) {
            closeFeedbackModalFn();
            showNotification('✅ Feedback inviato!', 'success');
            
            if (userId) {
                showPlayerDetail(userId);
            } else if (teamId) {
                showTeamDetail(teamId);
            }
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Submit feedback error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// REQUESTS
// ============================================

async function loadRequests() {
    if (!currentUser) return;
    
    loadReceivedRequests();
}

async function loadReceivedRequests() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams/requests`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            renderReceivedRequests(data.requests);
        }
    } catch (error) {
        console.error('Load requests error:', error);
    } finally {
        hideLoading();
    }
}

function renderReceivedRequests(requests) {
    const container = document.getElementById('receivedRequestsContainer');

    if (!requests || requests.length === 0) {
        container.innerHTML = '<p class="empty-state">Nessuna richiesta ricevuta</p>';
        return;
    }

    container.innerHTML = requests.map(req => `
        <div class="request-card">
            <div class="request-info">
                <h4>${req.fromUser.username}</h4>
                <p><i class="fas fa-shield-alt"></i> ${req.team.name}</p>
                <p class="request-date">${new Date(req.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="request-actions">
                <button class="btn btn-success btn-sm" onclick="approveRequest('${req._id}')">
                    <i class="fas fa-check"></i> Approva
                </button>
                <button class="btn btn-danger btn-sm" onclick="rejectRequest('${req._id}')">
                    <i class="fas fa-times"></i> Rifiuta
                </button>
            </div>
        </div>
    `).join('');
}

async function loadSentRequests() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams/my-requests`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            renderSentRequests(data.requests);
        }
    } catch (error) {
        console.error('Load sent requests error:', error);
    } finally {
        hideLoading();
    }
}

function renderSentRequests(requests) {
    const container = document.getElementById('sentRequestsContainer');

    if (!requests || requests.length === 0) {
        container.innerHTML = '<p class="empty-state">Nessuna richiesta inviata</p>';
        return;
    }

    container.innerHTML = requests.map(req => `
        <div class="request-card">
            <div class="request-info">
                <h4>${req.team.name}</h4>
                <p class="request-status ${req.status}">${req.status === 'pending' ? '⏳ In attesa' : req.status}</p>
                <p class="request-date">${new Date(req.createdAt).toLocaleDateString()}</p>
            </div>
            ${req.status === 'pending' ? `
                <div class="request-actions">
                    <button class="btn btn-warning btn-sm" onclick="cancelRequest('${req._id}')">
                        <i class="fas fa-times"></i> Annulla
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function approveRequest(requestId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams/approve-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ requestId })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Richiesta approvata', 'success');
            loadReceivedRequests();
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Approve request error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function rejectRequest(requestId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams/reject-request`, {
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
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Reject request error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function cancelRequest(requestId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams/cancel-request`, {
            method: 'POST',
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
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Cancel request error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// FAVORITES SYSTEM
// ============================================

async function loadUserFavorites() {
    if (!currentUser) {
        userFavorites = { giocatori: [], squadre: [] };
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/preferiti`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            userFavorites = data.preferiti || { giocatori: [], squadre: [] };
            console.log('✅ Preferiti caricati:', userFavorites);
            
            updateFavoriteIcons();
        } else {
            console.error('❌ Errore caricamento preferiti');
            userFavorites = { giocatori: [], squadre: [] };
        }
    } catch (error) {
        console.error('Errore caricamento preferiti:', error);
        userFavorites = { giocatori: [], squadre: [] };
    }
}

async function toggleFavorite(targetId, type) {
    if (!currentUser) {
        showNotification('⚠️ Devi effettuare il login', 'error');
        return;
    }

    console.log('🔄 Toggle favorite:', { targetId, type });

    const favorites = type === 'giocatori' ? userFavorites.giocatori : userFavorites.squadre;
    const isFavorite = favorites.some(item => item._id === targetId);

    try {
        showLoading();
        
        if (isFavorite) {
            const response = await fetch(`${API_BASE}/preferiti?action=remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ targetId, type })
            });

            const data = await response.json();

            if (response.ok) {
                await loadUserFavorites();
                
                showNotification('💔 Rimosso dai preferiti', 'info');
                console.log('✅ Rimosso dai preferiti');
                
                updateFavoriteIcon(targetId, false);
            } else {
                showNotification('❌ ' + (data.error || 'Errore'), 'error');
            }
        } else {
            const response = await fetch(`${API_BASE}/preferiti?action=add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ targetId, type })
            });

            const data = await response.json();

            if (response.ok) {
                await loadUserFavorites();
                
                showNotification('❤️ Aggiunto ai preferiti', 'success');
                console.log('✅ Aggiunto ai preferiti');
                
                updateFavoriteIcon(targetId, true);
            } else {
                showNotification('❌ ' + (data.error || 'Errore'), 'error');
            }
        }
    } catch (error) {
        console.error('Toggle favorite error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function updateFavoriteIcon(targetId, isFavorite) {
    const icons = document.querySelectorAll(`[data-favorite-id="${targetId}"]`);
    icons.forEach(icon => {
        if (isFavorite) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            icon.style.color = '#ef4444';
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            icon.style.color = '#94a3b8';
        }
    });
}

function updateFavoriteIcons() {
    userFavorites.giocatori.forEach(player => {
        updateFavoriteIcon(player._id, true);
    });

    userFavorites.squadre.forEach(team => {
        updateFavoriteIcon(team._id, true);
    });
}

async function loadFavoritesPage() {
    if (!currentUser) {
        showNotification('⚠️ Devi effettuare il login', 'error');
        navigateTo('home');
        return;
    }
    
    await loadUserFavorites();
    switchFavoritesTab('favorite-players');
}

function switchFavoritesTab(tab) {
    document.querySelectorAll('.requests-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    const playersContainer = document.getElementById('favoritePlayersContainer');
    const teamsContainer = document.getElementById('favoriteTeamsContainer');

    if (tab === 'favorite-players') {
        playersContainer.style.display = 'block';
        teamsContainer.style.display = 'none';
        renderFavoritePlayers();
    } else {
        playersContainer.style.display = 'none';
        teamsContainer.style.display = 'block';
        renderFavoriteTeams();
    }
}

function renderFavoritePlayers() {
    const container = document.getElementById('favoritePlayersContainer');

    if (!userFavorites.giocatori || userFavorites.giocatori.length === 0) {
        container.innerHTML = '<p class="empty-state">Nessun giocatore preferito</p>';
        return;
    }

    container.innerHTML = userFavorites.giocatori.map(player => {
        const levelPercent = calculateLevelPercentage(player.level);
        
        return `
            <div class="player-card">
                <div class="player-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="player-info">
                    <h3>
                        ${player.username}
                        <i class="fas fa-heart favorite-icon" 
                           data-favorite-id="${player._id}"
                           style="color: #ef4444; cursor: pointer;" 
                           onclick="toggleFavorite('${player._id}', 'giocatori')"></i>
                    </h3>
                    <p><i class="fas fa-gamepad"></i> ${player.primaryRole}</p>
                    <p><i class="fas fa-globe"></i> ${player.platform} | ${player.nationality}</p>
                    <div class="player-level">
                        <span>Livello ${player.level}</span>
                        <div class="level-bar">
                            <div class="level-progress" style="width: ${levelPercent}%"></div>
                        </div>
                    </div>
                    <div class="player-rating">
                        <i class="fas fa-star"></i>
                        <span>${player.averageRating.toFixed(1)} (${player.feedbackCount} feedback)</span>
                    </div>
                </div>
                <button class="btn btn-primary btn-sm" onclick="showPlayerDetail('${player._id}')">
                    <i class="fas fa-eye"></i> Dettagli
                </button>
            </div>
        `;
    }).join('');
}

function renderFavoriteTeams() {
    const container = document.getElementById('favoriteTeamsContainer');

    if (!userFavorites.squadre || userFavorites.squadre.length === 0) {
        container.innerHTML = '<p class="empty-state">Nessuna squadra preferita</p>';
        return;
    }

    container.innerHTML = userFavorites.squadre.map(team => {
        return `
            <div class="team-card">
                <div class="team-header">
                    <h3>
                        <i class="fas fa-shield-alt"></i>
                        ${team.name}
                        <i class="fas fa-heart favorite-icon" 
                           data-favorite-id="${team._id}"
                           style="color: #ef4444; cursor: pointer;" 
                           onclick="toggleFavorite('${team._id}', 'squadre')"></i>
                    </h3>
                </div>
                <div class="team-info">
                    <p><i class="fas fa-globe"></i> ${team.platform} | ${team.nationality}</p>
                    <p><i class="fas fa-users"></i> ${team.members.length} membri</p>
                    ${team.description ? `<p class="team-description">${team.description}</p>` : ''}
                    <div class="team-rating">
                        <i class="fas fa-star"></i>
                        <span>${team.averageRating.toFixed(1)} (${team.feedbackCount} feedback)</span>
                    </div>
                </div>
                <button class="btn btn-primary btn-sm" onclick="showTeamDetail('${team._id}')">
                    <i class="fas fa-eye"></i> Dettagli
                </button>
            </div>
        `;
    }).join('');
}

// ============================================
// SHARED PROFILES
// ============================================

function getURLParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        profile: params.get('profile'),
        id: params.get('id')
    };
}

async function loadSharedPlayerProfile(playerId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/users?id=${playerId}`);

        if (response.ok) {
            const player = await response.json();

            const feedbackResponse = await fetch(`${API_BASE}/feedback?userId=${playerId}`);
            let feedback = [];
            if (feedbackResponse.ok) {
                const feedbackData = await feedbackResponse.json();
                feedback = feedbackData.feedback;
            }

            renderSharedPlayerProfile(player, feedback);
        } else {
            showProfileNotFoundPage('giocatore');
        }
    } catch (error) {
        console.error('Error loading shared player:', error);
        showProfileNotFoundPage('giocatore');
    } finally {
        hideLoading();
    }
}

async function loadSharedTeamProfile(teamId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams?id=${teamId}`);

        if (response.ok) {
            const data = await response.json();

            const feedbackResponse = await fetch(`${API_BASE}/feedback?teamId=${teamId}`);
            let feedback = [];
            if (feedbackResponse.ok) {
                const feedbackData = await feedbackResponse.json();
                feedback = feedbackData.feedback;
            }

            renderSharedTeamProfile(data.team, feedback);
        } else {
            showProfileNotFoundPage('squadra');
        }
    } catch (error) {
        console.error('Error loading shared team:', error);
        showProfileNotFoundPage('squadra');
    } finally {
        hideLoading();
    }
}

function renderSharedPlayerProfile(player, feedback) {
    const modalContent = document.getElementById('playerDetailContent');
    const modal = document.getElementById('playerDetailModal');
    
    const levelPercent = calculateLevelPercentage(player.level);
    
    modalContent.innerHTML = `
        <div class="player-detail-header">
            <div class="detail-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="detail-info">
                <h2>${player.username}</h2>
                <p><i class="fas fa-gamepad"></i> ${player.primaryRole}</p>
                ${player.secondaryRoles && player.secondaryRoles.length > 0 ? `
                    <p><i class="fas fa-plus-circle"></i> Ruoli secondari: ${player.secondaryRoles.join(', ')}</p>
                ` : ''}
                <p><i class="fas fa-globe"></i> ${player.platform} | ${player.nationality}</p>
                <div class="player-level">
                    <span>Livello ${player.level}</span>
                    <div class="level-bar">
                        <div class="level-progress" style="width: ${levelPercent}%"></div>
                    </div>
                </div>
                <div class="player-rating">
                    <i class="fas fa-star"></i>
                    <span>${player.averageRating.toFixed(1)} (${player.feedbackCount} feedback)</span>
                </div>
                ${player.bio ? `<p class="player-bio"><i class="fas fa-align-left"></i> ${player.bio}</p>` : ''}
                ${player.instagram ? `
                    <p><i class="fab fa-instagram"></i> 
                        <a href="https://instagram.com/${player.instagram}" target="_blank">@${player.instagram}</a>
                    </p>
                ` : ''}
                ${player.tiktok ? `
                    <p><i class="fab fa-tiktok"></i> 
                        <a href="https://tiktok.com/@${player.tiktok}" target="_blank">@${player.tiktok}</a>
                    </p>
                ` : ''}
            </div>
        </div>

        <div class="feedback-section">
            <h3><i class="fas fa-star"></i> Feedback Ricevuti</h3>
            ${renderFeedbackItems(feedback)}
        </div>
    `;

    modal.classList.add('active');
    
    addBackToHomeButton(modalContent);
}

function renderSharedTeamProfile(team, feedback) {
    const modalContent = document.getElementById('teamDetailContent');
    const modal = document.getElementById('teamDetailModal');

    modalContent.innerHTML = `
        <div class="team-detail-header">
            <div class="detail-avatar">
                <i class="fas fa-shield-alt"></i>
            </div>
            <div class="detail-info">
                <h2>${team.name}</h2>
                <p><i class="fas fa-globe"></i> ${team.platform} | ${team.nationality}</p>
                ${team.description ? `<p class="team-description">${team.description}</p>` : ''}
                <div class="team-rating">
                    <i class="fas fa-star"></i>
                    <span>${team.averageRating.toFixed(1)} (${team.feedbackCount} feedback)</span>
                </div>
                ${team.instagram ? `
                    <p><i class="fab fa-instagram"></i> 
                        <a href="https://instagram.com/${team.instagram}" target="_blank">@${team.instagram}</a>
                    </p>
                ` : ''}
                ${team.tiktok ? `
                    <p><i class="fab fa-tiktok"></i> 
                        <a href="https://tiktok.com/@${team.tiktok}" target="_blank">@${team.tiktok}</a>
                    </p>
                ` : ''}
                ${team.liveLink ? `
                    <p><i class="fas fa-link"></i> 
                        <a href="${team.liveLink}" target="_blank">Live Link</a>
                    </p>
                ` : ''}
            </div>
        </div>

        <div class="team-members">
            <h3><i class="fas fa-users"></i> Membri</h3>
            ${team.members.map(member => {
                const memberIsCaptain = member._id === team.captain.toString();
                const memberIsVice = team.viceCaptain && member._id === team.viceCaptain.toString();
                const levelPercent = calculateLevelPercentage(member.level);
                
                return `
                    <div class="member-item">
                        <div class="member-info">
                            <h4>
                                ${member.username}
                                ${memberIsCaptain ? '<span class="captain-badge"><i class="fas fa-crown"></i> Capitano</span>' : ''}
                                ${memberIsVice ? '<span class="vice-badge"><i class="fas fa-star"></i> Vice</span>' : ''}
                            </h4>
                            <p><i class="fas fa-gamepad"></i> ${member.primaryRole} | Livello ${member.level}</p>
                            <div class="level-bar">
                                <div class="level-progress" style="width: ${levelPercent}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>

        <div class="feedback-section">
            <h3><i class="fas fa-star"></i> Feedback Ricevuti</h3>
            ${renderFeedbackItems(feedback)}
        </div>
    `;

    modal.classList.add('active');
    
    addBackToHomeButton(modalContent);
}

function addBackToHomeButton(modalContent) {
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-primary btn-large';
    backBtn.style.marginTop = '20px';
    backBtn.style.width = '100%';
    backBtn.innerHTML = '<i class="fas fa-home"></i> Torna alla Home';
    
    backBtn.addEventListener('mouseenter', () => {
        backBtn.style.transform = 'translateY(-2px)';
        backBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
    });

    backBtn.addEventListener('mouseleave', () => {
        backBtn.style.transform = 'translateY(0)';
        backBtn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
    });

    backBtn.addEventListener('click', () => {
        window.location.href = '/';
    });

    modalContent.insertBefore(backBtn, modalContent.firstChild);
}

function showProfileNotFoundPage(type) {
    document.body.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; text-align: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: #ef4444; margin-bottom: 20px;"></i>
            <h1 style="font-size: 32px; margin-bottom: 10px;">Profilo ${type} non trovato</h1>
            <p style="font-size: 18px; color: #94a3b8; margin-bottom: 30px;">
                Il profilo che stai cercando potrebbe essere stato eliminato o il link non è più valido.
            </p>
            <a href="/" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                🏠 Torna alla Home
            </a>
        </div>
    `;
}

function shareProfile(type, id, name) {
    const url = `${window.location.origin}?profile=${type}&id=${id}`;
    
    if (navigator.share) {
        navigator.share({
            title: `${name} - Pro Club Hub`,
            text: `Guarda ${type === 'player' ? 'il profilo di' : 'la squadra'} ${name} su Pro Club Hub!`,
            url: url
        }).then(() => {
            showNotification('✅ Link condiviso!', 'success');
        }).catch(err => {
            console.log('Share cancelled or error:', err);
        });
    } else {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('📋 Link copiato negli appunti!', 'success');
        }).catch(err => {
            console.error('Copy failed:', err);
            showNotification('❌ Errore nella copia del link', 'error');
        });
    }
}

// ============================================
// ADMIN PANEL - GESTIONE COMPLETA
// ============================================

async function loadAdminPanel() {
    if (!currentUser || !currentUser.isAdmin) {
        console.log('❌ Accesso admin negato');
        return;
    }

    console.log('🔧 Caricamento pannello admin...');
    
    try {
        showLoading();
        
        // Carica statistiche
        const statsResponse = await fetch(`${API_BASE}/admin?action=stats`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (statsResponse.ok) {
            const data = await statsResponse.json();
            document.getElementById('totalUsers').textContent = data.stats.totalUsers;
            document.getElementById('totalTeams').textContent = data.stats.totalTeams;
            document.getElementById('inactiveUsers').textContent = data.stats.inactiveUsers;
            document.getElementById('pendingRequests').textContent = data.stats.pendingRequests;
        }

        // Carica impostazioni livelli
        const levelsResponse = await fetch(`${API_BASE}/admin?action=level-settings`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (levelsResponse.ok) {
            const data = await levelsResponse.json();
            document.getElementById('adminMinLevel').value = data.minLevel;
            document.getElementById('adminMaxLevel').value = data.maxLevel;
        }

        // Carica utenti
        await loadAllUsers();

    } catch (error) {
        console.error('❌ Errore caricamento admin panel:', error);
        showNotification('❌ Errore caricamento pannello admin', 'error');
    } finally {
        hideLoading();
    }
}

async function loadAllUsers() {
    try {
        const response = await fetch(`${API_BASE}/admin?action=users`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            renderUsersList(data.users);
        } else {
            showNotification('❌ Errore caricamento utenti', 'error');
        }
    } catch (error) {
        console.error('❌ Errore caricamento utenti:', error);
        showNotification('❌ Errore di connessione', 'error');
    }
}

function renderUsersList(users) {
    const container = document.getElementById('usersList');
    if (!container) return;

    if (!users || users.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #94a3b8;">Nessun utente trovato</p>';
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="user-item" style="background: rgba(15, 23, 42, 0.6); padding: 20px; border-radius: 12px; margin-bottom: 15px; border: 1px solid rgba(148, 163, 184, 0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div style="flex: 1; min-width: 200px;">
                    <h4 style="margin: 0 0 8px 0; color: #f1f5f9; font-size: 18px;">
                        <i class="fas fa-user"></i> ${user.username}
                        ${user.isAdmin ? '<span style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 2px 8px; border-radius: 6px; font-size: 12px; margin-left: 8px;">ADMIN</span>' : ''}
                        ${user.isSuspended ? '<span style="background: #ef4444; padding: 2px 8px; border-radius: 6px; font-size: 12px; margin-left: 8px;">SOSPESO</span>' : ''}
                    </h4>
                    <p style="margin: 4px 0; color: #94a3b8; font-size: 14px;">
                        <i class="fas fa-envelope"></i> ${user.email}
                    </p>
                    <p style="margin: 4px 0; color: #94a3b8; font-size: 14px;">
                        <i class="fas fa-gamepad"></i> ${user.primaryRole} | ${user.platform} | Livello ${user.level}
                    </p>
                    <p style="margin: 4px 0; color: #94a3b8; font-size: 14px;">
                        <i class="fas fa-star"></i> ${user.averageRating?.toFixed(1) || '0.0'} (${user.feedbackCount || 0} feedback)
                    </p>
                    <p style="margin: 4px 0; color: #64748b; font-size: 12px;">
                        <i class="fas fa-calendar"></i> Registrato: ${new Date(user.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    ${!user.isAdmin ? `
                        ${!user.isSuspended ? `
                            <button class="btn btn-warning btn-sm" onclick="suspendUser('${user._id}')">
                                <i class="fas fa-ban"></i> Sospendi
                            </button>
                        ` : `
                            <button class="btn btn-success btn-sm" onclick="unsuspendUser('${user._id}')">
                                <i class="fas fa-check-circle"></i> Riabilita
                            </button>
                        `}
                        <button class="btn btn-danger btn-sm" onclick="deleteUser('${user._id}', '${user.username}')">
                            <i class="fas fa-trash"></i> Elimina
                        </button>
                    ` : '<span style="color: #94a3b8; font-size: 14px; padding: 8px;">Account Amministratore</span>'}
                </div>
            </div>
        </div>
    `).join('');
}

async function handleLevelSettings(e) {
    e.preventDefault();

    const minLevel = parseInt(document.getElementById('adminMinLevel').value);
    const maxLevel = parseInt(document.getElementById('adminMaxLevel').value);

    if (minLevel >= maxLevel) {
        showNotification('❌ Il livello minimo deve essere inferiore al massimo', 'error');
        return;
    }

    if (minLevel < 1 || maxLevel > 9999) {
        showNotification('❌ I livelli devono essere tra 1 e 9999', 'error');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/admin?action=level-settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ minLevel, maxLevel })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Limiti livello aggiornati con successo!', 'success');
            GLOBAL_MIN_LEVEL = minLevel;
            GLOBAL_MAX_LEVEL = maxLevel;
            updateLevelInputLimits(minLevel, maxLevel);
        } else {
            showNotification('❌ ' + (data.error || 'Errore aggiornamento limiti'), 'error');
        }
    } catch (error) {
        console.error('❌ Errore aggiornamento livelli:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
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

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Utente sospeso con successo', 'success');
            await loadAllUsers();
        } else {
            showNotification('❌ ' + (data.error || 'Errore sospensione utente'), 'error');
        }
    } catch (error) {
        console.error('❌ Errore sospensione utente:', error);
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

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Utente riabilitato con successo', 'success');
            await loadAllUsers();
        } else {
            showNotification('❌ ' + (data.error || 'Errore riabilitazione utente'), 'error');
        }
    } catch (error) {
        console.error('❌ Errore riabilitazione utente:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`Sei ASSOLUTAMENTE sicuro di voler eliminare l'utente "${username}"?\n\nQuesta azione è IRREVERSIBILE e cancellerà:\n- Il profilo utente\n- Tutti i suoi feedback\n- Le sue squadre (se capitano)\n- Le sue richieste\n\nDigita "ELIMINA" per confermare.`)) {
        return;
    }

    const confirmText = prompt('Digita "ELIMINA" per confermare l\'eliminazione:');
    if (confirmText !== 'ELIMINA') {
        showNotification('❌ Eliminazione annullata', 'info');
        return;
    }

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

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Utente eliminato con successo', 'success');
            await loadAllUsers();
        } else {
            showNotification('❌ ' + (data.error || 'Errore eliminazione utente'), 'error');
        }
    } catch (error) {
        console.error('❌ Errore eliminazione utente:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function handleDeleteAllTeams() {
    if (!confirm('Sei ASSOLUTAMENTE sicuro di voler eliminare TUTTE le squadre?\n\nQuesta azione è IRREVERSIBILE!')) {
        return;
    }

    const confirmText = prompt('Digita "ELIMINA TUTTO" per confermare:');
    if (confirmText !== 'ELIMINA TUTTO') {
        showNotification('❌ Operazione annullata', 'info');
        return;
    }

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
            await loadAdminPanel();
        } else {
            showNotification('❌ ' + (data.error || 'Errore eliminazione squadre'), 'error');
        }
    } catch (error) {
        console.error('❌ Errore eliminazione squadre:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function handleResetProfiles() {
    if (!confirm('Sei sicuro di voler resettare i profili inattivi?\n\nVerranno resettati i profili degli utenti inattivi da più di 30 giorni.')) {
        return;
    }

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
            showNotification(`✅ ${data.count} profili resettati con successo`, 'success');
            await loadAdminPanel();
        } else {
            showNotification('❌ ' + (data.error || 'Errore reset profili'), 'error');
        }
    } catch (error) {
        console.error('❌ Errore reset profili:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function handleNewsletterSubmit(e) {
    e.preventDefault();

    const subject = document.getElementById('newsletterSubject').value.trim();
    const message = document.getElementById('newsletterMessage').value.trim();

    if (!subject || !message) {
        showNotification('❌ Oggetto e messaggio sono obbligatori', 'error');
        return;
    }

    if (!confirm(`Inviare la newsletter a tutti gli utenti?\n\nOggetto: ${subject}`)) {
        return;
    }

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
            showNotification('❌ ' + (data.error || 'Errore invio newsletter'), 'error');
        }
    } catch (error) {
        console.error('❌ Errore invio newsletter:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// MODAL CLOSE FUNCTIONS
// ============================================

function closePlayerDetailModalFn() {
    const modal = document.getElementById('playerDetailModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            document.getElementById('playerDetailContent').innerHTML = '';
        }, 300);
    }
}

function closeTeamDetailModalFn() {
    const modal = document.getElementById('teamDetailModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            document.getElementById('teamDetailContent').innerHTML = '';
        }, 300);
    }
}

function closeFeedbackModalFn() {
    const modal = document.getElementById('feedbackModal');
    if (modal) modal.classList.remove('active');
    
    selectedRating = 0;
    selectedTags = [];
    
    const form = document.getElementById('feedbackForm');
    if (form) form.reset();
    
    document.querySelectorAll('#starRating i').forEach(star => {
        star.classList.remove('fas', 'active');
        star.classList.add('far');
    });
    
    document.querySelectorAll('#tagSelector .tag-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

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
window.openFeedbackModal = openFeedbackModal;
window.requestJoinTeam = requestJoinTeam;
window.leaveTeam = leaveTeam;
window.removeMember = removeMember;
window.setViceCaptain = setViceCaptain;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
window.cancelRequest = cancelRequest;
window.toggleFavorite = toggleFavorite;
window.shareProfile = shareProfile;
window.suspendUser = suspendUser;
window.unsuspendUser = unsuspendUser;
window.deleteUser = deleteUser;

console.log('📦 app.js caricato completamente');
