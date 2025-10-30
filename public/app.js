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
let GLOBAL_MAX_LEVEL = 50;
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
        GLOBAL_MAX_LEVEL = 50;
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
        console.log('✅ Token trovato, verifico utente...');
        fetchCurrentUser();
    } else {
        console.log('ℹ️ Nessun token trovato, modalità guest');
        updateUIForGuest();
    }
}

async function fetchCurrentUser() {
    try {
        showLoading();
        console.log('📡 Recupero dati utente corrente...');
        
        const response = await fetch(`${API_BASE}/auth?action=me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            console.log('✅ Utente autenticato:', currentUser.username);
            
            updateUIForUser();
            
            // Carica preferiti
            await loadUserFavorites();
            
            if (currentUser.team) {
                loadCurrentTeam();
            }
        } else {
            console.log('❌ Token non valido, rimuovo...');
            localStorage.removeItem('token');
            updateUIForGuest();
        }
    } catch (error) {
        console.error('❌ Error fetching user:', error);
        localStorage.removeItem('token');
        updateUIForGuest();
    } finally {
        hideLoading();
    }
}

function updateUIForUser() {
    console.log('🎨 Aggiornamento UI per utente autenticato');
    
    document.getElementById('profileNavBtn').style.display = 'flex';
    document.getElementById('logoutBtn').style.display = 'flex';
    document.getElementById('requestsNavBtn').style.display = 'flex';
    document.getElementById('heroActions').style.display = 'none';
    document.getElementById('heroUserInfo').style.display = 'block';
    document.getElementById('favoritesNavBtn').style.display = 'flex';

    if (currentUser.profileCompleted) {
        document.getElementById('createTeamBtn').style.display = 'flex';
    } else {
        document.getElementById('createTeamBtn').style.display = 'none';
    }

    if (currentUser.isAdmin) {
        document.getElementById('adminNavBtn').style.display = 'flex';
    }

    document.getElementById('heroUsername').textContent = currentUser.username;
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

    if (page === 'profile' && currentUser) {
        loadProfile();
    } else if (page === 'players') {
        if (!currentUser) {
            showNotification('⚠️ Devi effettuare il login', 'error');
            openAuthModal('login');
            return;
        }
        if (!currentUser.profileCompleted) {
            showNotification('⚠️ Completa il profilo per cercare giocatori', 'error');
            navigateTo('profile');
            return;
        }
        searchPlayers();
    } else if (page === 'teams') {
        if (!currentUser) {
            showNotification('⚠️ Devi effettuare il login', 'error');
            openAuthModal('login');
            return;
        }
        if (!currentUser.profileCompleted) {
            showNotification('⚠️ Completa il profilo per cercare squadre', 'error');
            navigateTo('profile');
            return;
        }
        searchTeams();
    } else if (page === 'favorites') {
        loadFavoritesPage();
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
    console.log('🔓 Opening auth modal:', form);
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
    currentTeam = null;
    userFavorites = { giocatori: [], squadre: [] };
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
    document.getElementById('profileLevel').textContent = currentUser.level;
    
    const profileLevelPercent = calculateLevelPercentage(currentUser.level);
    document.getElementById('profileLevelProgress').style.width = `${profileLevelPercent}%`;
    
    document.getElementById('profileRating').textContent = currentUser.averageRating.toFixed(1);
    document.getElementById('profileRatingCount').textContent = currentUser.feedbackCount;

    document.getElementById('profilePlatform').textContent = currentUser.platform;
    document.getElementById('profileNationality').textContent = currentUser.nationality || 'Non specificata';
    document.getElementById('profilePrimaryRole').textContent = currentUser.primaryRole;
    document.getElementById('profileSecondaryRoles').textContent = 
        currentUser.secondaryRoles && currentUser.secondaryRoles.length > 0 
        ? currentUser.secondaryRoles.join(', ') 
        : 'Nessuno';
    document.getElementById('profileBio').textContent = currentUser.bio || 'Nessuna bio';
    document.getElementById('profileLookingForTeam').textContent = currentUser.lookingForTeam ? '✅ Sì' : '❌ No';

    const instagram = currentUser.instagram ? `<a href="https://instagram.com/${currentUser.instagram}" target="_blank">@${currentUser.instagram}</a>` : 'Non aggiunto';
    const tiktok = currentUser.tiktok ? `<a href="https://tiktok.com/@${currentUser.tiktok}" target="_blank">@${currentUser.tiktok}</a>` : 'Non aggiunto';
    
    document.getElementById('profileInstagram').innerHTML = instagram;
    document.getElementById('profileTiktok').innerHTML = tiktok;

    try {
        const response = await fetch(`${API_BASE}/feedback?userId=${currentUser._id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            renderProfileFeedback(data.feedback);
        }
    } catch (error) {
        console.error('Load feedback error:', error);
    }
}

function renderProfileFeedback(feedback) {
    const container = document.getElementById('profileFeedbackList');

    if (!feedback || feedback.length === 0) {
        container.innerHTML = '<p class="empty-feedback">Nessun feedback ricevuto ancora</p>';
        return;
    }

    container.innerHTML = feedback.map(fb => `
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
    const instagramInput = document.getElementById('editInstagram');
    const tiktokInput = document.getElementById('editTiktok');
    const lookingForTeamCheckbox = document.getElementById('editLookingForTeam');
    const checkedRoles = document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]:checked');

    const hasInstagram = instagramInput && instagramInput.value.trim().length > 0;
    const hasTiktok = tiktokInput && tiktokInput.value.trim().length > 0;
    const hasSecondaryRole = checkedRoles.length >= 1;
    const hasSocial = hasInstagram || hasTiktok;

    const canEnable = hasSecondaryRole && hasSocial;

    if (lookingForTeamCheckbox) {
        lookingForTeamCheckbox.disabled = !canEnable;
        
        if (!canEnable) {
            lookingForTeamCheckbox.checked = false;
        }
    }

    const container = document.querySelector('.looking-for-team-checkbox');
    if (container) {
        let warningText = container.querySelector('.helper-text');
        
        if (!canEnable) {
            if (!warningText) {
                warningText = document.createElement('p');
                warningText.className = 'helper-text';
                warningText.innerHTML = '⚠️ Per abilitare "Cerco squadra": aggiungi 1+ ruolo secondario + Instagram O TikTok';
                container.appendChild(warningText);
            }
        } else if (warningText) {
            warningText.remove();
        }
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

    const checkedRoles = Array.from(document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]:checked'))
        .map(cb => cb.value);

    if (checkedRoles.length < 1) {
        showNotification('⚠️ Seleziona almeno 1 ruolo secondario', 'error');
        return;
    }

    if (!instagram && !tiktok) {
        showNotification('⚠️ Aggiungi almeno un social (Instagram O TikTok)', 'error');
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
                username,
                primaryRole,
                secondaryRoles: checkedRoles,
                platform,
                nationality,
                level,
                instagram,
                tiktok,
                bio,
                lookingForTeam
            })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            closeEditProfileModal();
            loadProfile();
            updateUIForUser();
            showNotification('✅ Profilo aggiornato con successo!', 'success');
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
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
    const role = document.getElementById('roleFilter').value;
    const platform = document.getElementById('platformFilter').value;
    const search = document.getElementById('playerSearchInput').value.trim();
    const nationality = document.getElementById('nationalityFilter').value.trim();
    const minLevel = document.getElementById('minLevelFilter').value;
    const maxLevel = document.getElementById('maxLevelFilter').value;

    try {
        showLoading();
        
        const params = new URLSearchParams();
        if (role) params.append('role', role);
        if (platform) params.append('platform', platform);
        if (search) params.append('search', search);
        if (nationality) params.append('nationality', nationality);
        if (minLevel) params.append('minLevel', minLevel);
        if (maxLevel) params.append('maxLevel', maxLevel);

        const response = await fetch(`${API_BASE}/users?${params}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            renderPlayers(data.users);
        } else {
            showNotification('❌ Errore nel caricamento giocatori', 'error');
        }
    } catch (error) {
        console.error('Search players error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function renderPlayers(players) {
    const container = document.getElementById('playersResults');

    if (!players || players.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-slash"></i>
                <p>Nessun giocatore trovato</p>
            </div>
        `;
        return;
    }

    container.innerHTML = players.map(player => {
        const isFavorite = userFavorites.giocatori.some(g => g._id === player._id);
        return `
            <div class="player-card" onclick="showPlayerDetail('${player._id}')">
                <div class="player-card-header">
                    <div class="player-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="player-info">
                        <h3>
                            ${player.username}
                            ${currentUser && player._id !== currentUser._id ? `
                                <i class="${isFavorite ? 'fas' : 'far'} fa-heart" 
                                   style="color: ${isFavorite ? '#ef4444' : '#94a3b8'}; cursor: pointer; margin-left: 0.5rem;" 
                                   data-favorite-id="${player._id}"
                                   onclick="event.stopPropagation(); toggleFavorite('${player._id}', 'giocatori');">
                                </i>
                            ` : ''}
                        </h3>
                        <p class="player-role">${player.primaryRole}</p>
                    </div>
                </div>
                <div class="player-stats">
                    <span class="stat">
                        <i class="fas fa-trophy"></i> Livello ${player.level}
                    </span>
                    <span class="stat">
                        <i class="fas fa-gamepad"></i> ${player.platform}
                    </span>
                    <span class="stat star">
                        <i class="fas fa-star"></i> ${player.averageRating.toFixed(1)} (${player.feedbackCount})
                    </span>
                </div>
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

    content.innerHTML = `
        <div class="player-detail-header">
            <div class="detail-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="detail-info">
                <h2>
                    ${player.username}
                    ${currentUser && player._id !== currentUser._id ? `
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart" 
                           style="color: ${isFavorite ? '#ef4444' : '#94a3b8'}; cursor: pointer; margin-left: 0.5rem; font-size: 1.2rem;" 
                           data-favorite-id="${player._id}"
                           onclick="toggleFavorite('${player._id}', 'giocatori');">
                        </i>
                    ` : ''}
                </h2>
                <div class="detail-stats">
                    <span class="stat"><i class="fas fa-trophy"></i> Livello ${player.level}</span>
                    <span class="stat"><i class="fas fa-gamepad"></i> ${player.platform}</span>
                    <span class="stat"><i class="fas fa-flag"></i> ${player.nationality || 'N/A'}</span>
                    <span class="stat star"><i class="fas fa-star"></i> ${player.averageRating.toFixed(1)} (${player.feedbackCount})</span>
                </div>
            </div>
        </div>

        <div class="detail-body">
            <div class="detail-section">
                <h3><i class="fas fa-users"></i> Ruoli</h3>
                <p><strong>Principale:</strong> ${player.primaryRole}</p>
                <p><strong>Secondari:</strong> ${player.secondaryRoles && player.secondaryRoles.length > 0 ? player.secondaryRoles.join(', ') : 'Nessuno'}</p>
            </div>

            ${player.bio ? `
                <div class="detail-section">
                    <h3><i class="fas fa-info-circle"></i> Bio</h3>
                    <p>${player.bio}</p>
                </div>
            ` : ''}

          ${player.instagram || player.tiktok ? `
    <div class="detail-section">
        <h3><i class="fas fa-share-alt"></i> Social</h3>
        <div class="social-links-colored">
            ${player.instagram ? `
                <a href="https://instagram.com/${player.instagram}" target="_blank" class="social-link-box instagram">
                    <i class="fab fa-instagram"></i>
                    <span>@${player.instagram}</span>
                </a>
            ` : ''}
            ${player.tiktok ? `
                <a href="https://tiktok.com/@${player.tiktok}" target="_blank" class="social-link-box tiktok">
                    <i class="fab fa-tiktok"></i>
                    <span>@${player.tiktok}</span>
                </a>
            ` : ''}
        </div>
    </div>
` : ''}

            <div class="detail-section">
                <p><strong>Cerca squadra:</strong> ${player.lookingForTeam ? '✅ Sì' : '❌ No'}</p>
                ${player.team ? `<p><strong>Squadra attuale:</strong> ${player.team.name}</p>` : ''}
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
        return '<p class="empty-feedback">Nessun feedback ricevuto ancora</p>';
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
    const platform = document.getElementById('teamPlatformFilter').value;
    const search = document.getElementById('teamSearchInput').value.trim();
    const nationality = document.getElementById('teamNationalityFilter').value.trim();

    try {
        showLoading();
        
        const params = new URLSearchParams();
        if (platform) params.append('platform', platform);
        if (search) params.append('search', search);
        if (nationality) params.append('nationality', nationality);

        const response = await fetch(`${API_BASE}/teams?${params}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            renderTeams(data.teams);
        } else {
            showNotification('❌ Errore nel caricamento squadre', 'error');
        }
    } catch (error) {
        console.error('Search teams error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function renderTeams(teams) {
    const container = document.getElementById('teamsResults');

    if (!teams || teams.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shield-alt"></i>
                <p>Nessuna squadra trovata</p>
            </div>
        `;
        return;
    }

    container.innerHTML = teams.map(team => {
        const isFavorite = userFavorites.squadre.some(s => s._id === team._id);
        return `
            <div class="team-card" onclick="showTeamDetail('${team._id}')">
                <div class="team-card-header">
                    <div class="team-avatar">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="team-info">
                        <h3>
                            ${team.name}
                            ${currentUser ? `
                                <i class="${isFavorite ? 'fas' : 'far'} fa-heart" 
                                   style="color: ${isFavorite ? '#ef4444' : '#94a3b8'}; cursor: pointer; margin-left: 0.5rem;" 
                                   data-favorite-id="${team._id}"
                                   onclick="event.stopPropagation(); toggleFavorite('${team._id}', 'squadre');">
                                </i>
                            ` : ''}
                        </h3>
                        <p class="team-platform">${team.platform}</p>
                    </div>
                </div>
                ${team.description ? `<p class="team-description">${team.description}</p>` : ''}
                <div class="team-stats">
                    <span class="stat">
                        <i class="fas fa-users"></i> ${team.members.length} membri
                    </span>
                    <span class="stat">
                        <i class="fas fa-flag"></i> ${team.nationality || 'N/A'}
                    </span>
                    <span class="stat star">
                        <i class="fas fa-star"></i> ${team.averageRating.toFixed(1)} (${team.feedbackCount})
                    </span>
                </div>
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
            const team = data.team;

            const feedbackResponse = await fetch(`${API_BASE}/feedback?teamId=${teamId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            let feedback = [];
            if (feedbackResponse.ok) {
                const feedbackData = await feedbackResponse.json();
                feedback = feedbackData.feedback;
            }

            renderTeamDetail(team, feedback);
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
    const isCaptain = currentUser && team.captain.toString() === currentUser._id;
    const isViceCaptain = currentUser && team.viceCaptain && team.viceCaptain.toString() === currentUser._id;
    const isMember = currentUser && team.members.some(m => m.toString() === currentUser._id);
    const isFavorite = userFavorites.squadre.some(s => s._id === team._id);

    content.innerHTML = `
        <div class="team-detail-header">
            <div class="detail-avatar">
                <i class="fas fa-shield-alt"></i>
            </div>
            <div class="detail-info">
                <h2>
                    ${team.name}
                    ${currentUser ? `
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart" 
                           style="color: ${isFavorite ? '#ef4444' : '#94a3b8'}; cursor: pointer; margin-left: 0.5rem; font-size: 1.2rem;" 
                           data-favorite-id="${team._id}"
                           onclick="toggleFavorite('${team._id}', 'squadre');">
                        </i>
                    ` : ''}
                </h2>
                <div class="detail-stats">
                    <span class="stat"><i class="fas fa-gamepad"></i> ${team.platform}</span>
                    <span class="stat"><i class="fas fa-flag"></i> ${team.nationality || 'N/A'}</span>
                    <span class="stat"><i class="fas fa-users"></i> ${team.members.length} membri</span>
                    <span class="stat star"><i class="fas fa-star"></i> ${team.averageRating.toFixed(1)} (${team.feedbackCount})</span>
                </div>
            </div>
        </div>

        <div class="detail-body">
            ${team.description ? `
                <div class="detail-section">
                    <h3><i class="fas fa-info-circle"></i> Descrizione</h3>
                    <p>${team.description}</p>
                </div>
            ` : ''}

            <div class="detail-section">
                <h3><i class="fas fa-users"></i> Membri</h3>
                <div class="team-members-list">
                    ${team.memberDetails && team.memberDetails.length > 0 
                        ? team.memberDetails.map(member => `
                            <div class="member-item">
                                <div class="member-info">
                                    <i class="fas fa-user-circle"></i>
                                    <span>${member.username}</span>
                                    ${team.captain.toString() === member._id ? '<span class="role-badge captain">⭐ Capitano</span>' : ''}
                                    ${team.viceCaptain && team.viceCaptain.toString() === member._id ? '<span class="role-badge vice">Vice</span>' : ''}
                                </div>
                                ${isCaptain && member._id !== currentUser._id ? `
                                    <div class="member-actions">
                                        ${!team.viceCaptain && member._id !== team.captain.toString() ? `
                                            <button class="btn-icon" onclick="setViceCaptain('${team._id}', '${member._id}')" title="Nomina Vice">
                                                <i class="fas fa-user-shield"></i>
                                            </button>
                                        ` : ''}
                                        <button class="btn-icon danger" onclick="removeMember('${team._id}', '${member._id}')" title="Rimuovi">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')
                        : '<p>Nessun membro</p>'}
                </div>
            </div>

            ${team.instagram || team.tiktok || team.liveLink ? `
                <div class="detail-section">
                    <h3><i class="fas fa-share-alt"></i> Social & Live</h3>
                    ${team.instagram ? `<p><i class="fab fa-instagram"></i> <a href="https://instagram.com/${team.instagram}" target="_blank">@${team.instagram}</a></p>` : ''}
                    ${team.tiktok ? `<p><i class="fab fa-tiktok"></i> <a href="https://tiktok.com/@${team.tiktok}" target="_blank">@${team.tiktok}</a></p>` : ''}
                    ${team.liveLink ? `<p><i class="fas fa-video"></i> <a href="${team.liveLink}" target="_blank">Guarda Live</a></p>` : ''}
                </div>
            ` : ''}

            <div class="detail-section">
                <p><strong>Cerca giocatori:</strong> ${team.lookingForPlayers ? '✅ Sì' : '❌ No'}</p>
            </div>
        </div>

        ${currentUser ? `
            <div class="detail-actions">
                ${!isMember && !isCaptain ? `
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

function openFeedbackModal(userId, teamId) {
    if (!currentUser) {
        showNotification('⚠️ Devi effettuare il login', 'error');
        return;
    }

    selectedRating = 0;
    selectedTags = [];
    
    document.getElementById('feedbackTargetUserId').value = userId || '';
    document.getElementById('feedbackTargetTeamId').value = teamId || '';
    
    document.querySelectorAll('#starRating i').forEach(star => {
        star.classList.remove('fas', 'active');
        star.classList.add('far');
    });
    
    document.querySelectorAll('#tagSelector .tag-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById('feedbackModal').classList.add('active');
    
    // Setup star rating
    setupStarRating();
    setupTagSelection();
}

function setupStarRating() {
    const stars = document.querySelectorAll('#starRating i');
    stars.forEach((star, index) => {
        star.onclick = () => {
            selectedRating = index + 1;
            stars.forEach((s, i) => {
                if (i < selectedRating) {
                    s.classList.remove('far');
                    s.classList.add('fas', 'active');
                } else {
                    s.classList.remove('fas', 'active');
                    s.classList.add('far');
                }
            });
        };
    });
}

function setupTagSelection() {
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
        playersContainer.style.display = 'grid';
        teamsContainer.style.display = 'none';
        renderFavoritePlayers();
    } else if (tab === 'favorite-teams') {
        playersContainer.style.display = 'none';
        teamsContainer.style.display = 'grid';
        renderFavoriteTeams();
    }
}

function renderFavoritePlayers() {
    const container = document.getElementById('favoritePlayersContainer');
    
    if (!userFavorites.giocatori || userFavorites.giocatori.length === 0) {
        container.innerHTML = '<p class="empty-state">Nessun giocatore nei preferiti</p>';
        return;
    }

    container.innerHTML = userFavorites.giocatori.map(player => `
        <div class="player-card" onclick="showPlayerDetail('${player._id}')">
            <div class="player-card-header">
                <div class="player-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="player-info">
                    <h3>
                        ${player.username}
                        <i class="fas fa-heart" 
                           style="color: #ef4444; cursor: pointer; margin-left: 0.5rem;" 
                           data-favorite-id="${player._id}"
                           onclick="event.stopPropagation(); toggleFavorite('${player._id}', 'giocatori');">
                        </i>
                    </h3>
                    <p class="player-role">${player.primaryRole}</p>
                </div>
            </div>
            <div class="player-stats">
                <span class="stat">
                    <i class="fas fa-trophy"></i> Livello ${player.level}
                </span>
                <span class="stat">
                    <i class="fas fa-gamepad"></i> ${player.platform}
                </span>
                <span class="stat star">
                    <i class="fas fa-star"></i> ${player.averageRating.toFixed(1)} (${player.feedbackCount})
                </span>
            </div>
        </div>
    `).join('');
}

function renderFavoriteTeams() {
    const container = document.getElementById('favoriteTeamsContainer');
    
    if (!userFavorites.squadre || userFavorites.squadre.length === 0) {
        container.innerHTML = '<p class="empty-state">Nessuna squadra nei preferiti</p>';
        return;
    }

    container.innerHTML = userFavorites.squadre.map(team => `
        <div class="team-card" onclick="showTeamDetail('${team._id}')">
            <div class="team-card-header">
                <div class="team-avatar">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div class="team-info">
                    <h3>
                        ${team.name}
                        <i class="fas fa-heart" 
                           style="color: #ef4444; cursor: pointer; margin-left: 0.5rem;" 
                           data-favorite-id="${team._id}"
                           onclick="event.stopPropagation(); toggleFavorite('${team._id}', 'squadre');">
                        </i>
                    </h3>
                    <p class="team-platform">${team.platform}</p>
                </div>
            </div>
            ${team.description ? `<p class="team-description">${team.description}</p>` : ''}
            <div class="team-stats">
                <span class="stat">
                    <i class="fas fa-users"></i> ${team.members.length} membri
                </span>
                <span class="stat">
                    <i class="fas fa-flag"></i> ${team.nationality || 'N/A'}
                </span>
                <span class="stat star">
                    <i class="fas fa-star"></i> ${team.averageRating.toFixed(1)} (${team.feedbackCount})
                </span>
            </div>
        </div>
    `).join('');
}

// ============================================
// SHARE SYSTEM
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
        showNotification('Caricamento profilo...', 'info');

        const response = await fetch(`/api/users?id=${playerId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Profilo giocatore non trovato');
            }
            throw new Error('Errore nel caricamento del profilo');
        }

        const player = await response.json();

        const feedbackResponse = await fetch(`/api/feedback?userId=${playerId}`);
        const feedbacks = feedbackResponse.ok ? await feedbackResponse.json() : [];

        document.title = `${player.username} - Pro Club Hub`;

        hideHomepageForSharedProfile();

        await showPlayerDetail(playerId);

        addBackToHomeButton('playerDetailModal');

    } catch (error) {
        console.error('Errore caricamento profilo condiviso:', error);
        showNotification(error.message || 'Profilo non trovato', 'error');
        showProfileNotFoundPage('giocatore');
    }
}

async function loadSharedTeamProfile(teamId) {
    try {
        showNotification('Caricamento squadra...', 'info');

        const response = await fetch(`/api/teams?id=${teamId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Squadra non trovata');
            }
            throw new Error('Errore nel caricamento della squadra');
        }

        const team = await response.json();

        const feedbackResponse = await fetch(`/api/feedback?teamId=${teamId}`);
        const feedbacks = feedbackResponse.ok ? await feedbackResponse.json() : [];

        document.title = `${team.name} - Pro Club Hub`;

        hideHomepageForSharedProfile();

        await showTeamDetail(teamId);

        addBackToHomeButton('teamDetailModal');

    } catch (error) {
        console.error('Errore caricamento squadra condivisa:', error);
        showNotification(error.message || 'Squadra non trovata', 'error');
        showProfileNotFoundPage('squadra');
    }
}

function hideHomepageForSharedProfile() {
    const mainContent = document.querySelector('.container');
    if (mainContent) {
        mainContent.style.display = 'none';
    }

    const navbar = document.querySelector('nav');
    if (navbar) {
        navbar.style.display = 'none';
    }

    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        authButtons.style.display = 'none';
    }
}

function showHomepage() {
    const mainContent = document.querySelector('.container');
    if (mainContent) {
        mainContent.style.display = 'block';
    }

    const navbar = document.querySelector('nav');
    if (navbar) {
        navbar.style.display = 'block';
    }

    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        authButtons.style.display = 'flex';
    }

    document.title = 'Pro Club Hub';
}

function addBackToHomeButton(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (modal.querySelector('.back-to-home-btn')) return;

    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) return;

    const backBtn = document.createElement('button');
    backBtn.className = 'back-to-home-btn';
    backBtn.innerHTML = '🏠 Torna alla Home';
    backBtn.style.cssText = `
        position: absolute;
        top: 15px;
        left: 15px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        z-index: 1001;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    `;

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
// ADMIN (only stubs, full implementation in project)
// ============================================

async function loadAdminDashboard() {
    if (!currentUser || !currentUser.isAdmin) return;

    try {
        showLoading();
        
        const statsResponse = await fetch(`${API_BASE}/admin?action=stats`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            document.getElementById('totalUsers').textContent = stats.totalUsers;
            document.getElementById('totalTeams').textContent = stats.totalTeams;
            document.getElementById('inactiveUsers').textContent = stats.inactiveUsers;
            document.getElementById('pendingRequests').textContent = stats.pendingRequests;
        }
    } catch (error) {
        console.error('Load admin stats error:', error);
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

        // Carica utenti
        await loadAllUsers();

    } catch (error) {
        console.error('❌ Errore caricamento admin panel:', error);
        showNotification('❌ Errore caricamento pannello admin', 'error');
    } finally {
        hideLoading();
    }
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







