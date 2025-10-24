// ============================================
// PRO CLUB HUB - CLIENT APPLICATION
// ============================================

const API_BASE = '/api';

const NATIONALITIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua e Barbuda', 'Arabia Saudita',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaigian', 'Bahamas', 'Bahrein', 'Bangladesh',
  'Barbados', 'Belgio', 'Belize', 'Benin', 'Bhutan', 'Bielorussia', 'Bolivia', 'Bosnia ed Erzegovina',
  'Botswana', 'Brasile', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambogia', 'Camerun',
  'Canada', 'Capo Verde', 'Ciad', 'Cile', 'Cina', 'Cipro', 'Colombia', 'Comore', 'Corea del Nord',
  'Corea del Sud', 'Costa d\'Avorio', 'Costa Rica', 'Croazia', 'Cuba', 'Danimarca', 'Dominica',
  'Ecuador', 'Egitto', 'El Salvador', 'Emirati Arabi Uniti', 'Eritrea', 'Estonia', 'Etiopia', 'Figi',
  'Filippine', 'Finlandia', 'Francia', 'Gabon', 'Gambia', 'Georgia', 'Germania', 'Ghana', 'Giamaica',
  'Giappone', 'Gibuti', 'Giordania', 'Grecia', 'Grenada', 'Guatemala', 'Guinea', 'Guinea Equatoriale',
  'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'India', 'Indonesia', 'Iran', 'Iraq', 'Irlanda',
  'Islanda', 'Isole Marshall', 'Isole Salomone', 'Israele', 'Italia', 'Kazakistan', 'Kenya',
  'Kirghizistan', 'Kiribati', 'Kuwait', 'Laos', 'Lesotho', 'Lettonia', 'Libano', 'Liberia', 'Libia',
  'Liechtenstein', 'Lituania', 'Lussemburgo', 'Macedonia del Nord', 'Madagascar', 'Malawi', 'Maldive',
  'Malesia', 'Mali', 'Malta', 'Marocco', 'Mauritania', 'Mauritius', 'Messico', 'Micronesia', 'Moldavia',
  'Monaco', 'Mongolia', 'Montenegro', 'Mozambico', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Nicaragua',
  'Niger', 'Nigeria', 'Norvegia', 'Nuova Zelanda', 'Oman', 'Paesi Bassi', 'Pakistan', 'Palau', 'Panama',
  'Papua Nuova Guinea', 'Paraguay', 'Perù', 'Polonia', 'Portogallo', 'Qatar', 'Regno Unito',
  'Repubblica Ceca', 'Repubblica Centrafricana', 'Repubblica del Congo', 'Repubblica Democratica del Congo',
  'Repubblica Dominicana', 'Romania', 'Ruanda', 'Russia', 'Saint Kitts e Nevis', 'Saint Lucia',
  'Saint Vincent e Grenadine', 'Samoa', 'San Marino', 'São Tomé e Príncipe', 'Senegal', 'Serbia',
  'Seychelles', 'Sierra Leone', 'Singapore', 'Siria', 'Slovacchia', 'Slovenia', 'Somalia', 'Spagna',
  'Sri Lanka', 'Stati Uniti', 'Sudafrica', 'Sudan', 'Sudan del Sud', 'Suriname', 'Svezia', 'Svizzera',
  'Swaziland', 'Tagikistan', 'Taiwan', 'Tanzania', 'Thailandia', 'Timor Est', 'Togo', 'Tonga',
  'Trinidad e Tobago', 'Tunisia', 'Turchia', 'Turkmenistan', 'Tuvalu', 'Ucraina', 'Uganda', 'Ungheria',
  'Uruguay', 'Uzbekistan', 'Vanuatu', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

let currentUser = null;
let selectedTags = [];
let selectedRating = 0;
let currentTeam = null;
let GLOBAL_MIN_LEVEL = 1;
let GLOBAL_MAX_LEVEL = 999;
let userFavorites = { giocatori: [], squadre: [] };


// ========================================
// 🔗 SISTEMA DI CONDIVISIONE PROFILI
// ========================================

function getURLParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        profile: params.get('profile'),
        id: params.get('id')
    };
}

async function shareProfile(type, profileId, profileName) {
    const baseURL = window.location.origin;
    const shareURL = `${baseURL}/?profile=${type}&id=${profileId}`;
    
    const shareText = type === 'player' 
        ? `Guarda il profilo di ${profileName} su Pro Club Hub!` 
        : `Guarda la squadra ${profileName} su Pro Club Hub!`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Pro Club Hub',
                text: shareText,
                url: shareURL
            });
            showNotification('✅ Profilo condiviso!', 'success');
            return;
        } catch (error) {
            console.log('Web Share API non supportata o cancellata');
        }
    }

    try {
        await navigator.clipboard.writeText(shareURL);
        showNotification('📋 Link copiato negli appunti!', 'success');
    } catch (error) {
        console.error('Errore copia link:', error);
        showNotification('❌ Errore nella condivisione', 'error');
    }
}

async function loadSharedPlayerProfile(playerId) {
    try {
        showNotification('Caricamento profilo...', 'info');

        const response = await fetch(`${API_BASE}/users?id=${playerId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Profilo giocatore non trovato');
            }
            throw new Error('Errore nel caricamento del profilo');
        }

        const data = await response.json();
        const player = data.user || data;

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

        const response = await fetch(`${API_BASE}/teams?id=${teamId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Squadra non trovata');
            }
            throw new Error('Errore nel caricamento della squadra');
        }

        const data = await response.json();
        const team = data.team || data;

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
}

function addBackToHomeButton(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const existingBtn = modal.querySelector('.back-to-home-btn');
    if (existingBtn) return;

    const modalHeader = modal.querySelector('.modal-header');
    if (!modalHeader) return;

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary back-to-home-btn';
    backBtn.innerHTML = '<i class="fas fa-home"></i> Torna alla Home';
    backBtn.style.marginTop = '10px';
    backBtn.onclick = () => {
        window.location.href = '/';
    };

    modalHeader.appendChild(backBtn);
}

function showProfileNotFoundPage(type) {
    document.body.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 20px;
        ">
            <i class="fas fa-exclamation-triangle" style="font-size: 80px; margin-bottom: 20px; opacity: 0.8;"></i>
            <h1 style="font-size: 42px; margin-bottom: 10px;">Profilo Non Trovato</h1>
            <p style="font-size: 20px; opacity: 0.9; max-width: 500px;">
                Il ${type} che stai cercando non esiste o è stato eliminato.
            </p>
            <button onclick="window.location.href='/'" style="
                margin-top: 30px;
                background: white;
                color: #667eea;
                border: none;
                padding: 15px 30px;
                border-radius: 10px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                🏠 Vai alla Homepage
            </button>
        </div>
    `;
}


// ============================================
// NAVIGATION
// ============================================

function navigateTo(page) {
    console.log('🧭 Navigating to:', page);
    
    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const targetPage = document.getElementById(`${page}Page`);
    const targetNavBtn = document.querySelector(`[data-page="${page}"]`);

    if (targetPage) {
        targetPage.style.display = 'block';
        targetPage.classList.add('active');
    }

    if (targetNavBtn) {
        targetNavBtn.classList.add('active');
    }

    if (page === 'profile') {
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
    } else if (page === 'admin') {
        loadAdminDashboard();
    }
}


// ============================================
// UI HELPERS
// ============================================

function showLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) loader.style.display = 'flex';
}

function hideLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) loader.style.display = 'none';
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function calculateLevelPercentage(level) {
    return Math.min(100, (level / GLOBAL_MAX_LEVEL) * 100);
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

function checkResetToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('reset');
    
    if (resetToken) {
        showResetPasswordModal(resetToken);
    }
}

function showResetPasswordModal(token) {
    document.getElementById('resetToken').value = token;
    document.getElementById('resetPasswordModal').classList.add('active');
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
            
            await loadUserFavorites();
            
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

function updateUIForUser() {
    document.querySelectorAll('.auth-buttons').forEach(btn => btn.style.display = 'none');
    document.querySelector('nav').style.display = 'flex';
    document.getElementById('userProfile').style.display = 'flex';
    document.getElementById('userProfileName').textContent = currentUser.username;

    if (currentUser.isAdmin) {
        document.getElementById('adminNavBtn').style.display = 'block';
    }

    navigateTo('home');
}

function updateUIForGuest() {
    document.querySelectorAll('.auth-buttons').forEach(btn => btn.style.display = 'flex');
    document.querySelector('nav').style.display = 'none';
    document.getElementById('userProfile').style.display = 'none';
    document.getElementById('adminNavBtn').style.display = 'none';
    navigateTo('home');
}


// ============================================
// MODALS
// ============================================

function openAuthModal(tab) {
    document.getElementById('authModal').classList.add('active');
    switchAuthTab(tab);
}

function closeAuthModalFn() {
    document.getElementById('authModal').classList.remove('active');
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.remove('active');
        t.style.display = 'none';
    });
    
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(`${tab}Tab`).classList.add('active');
    document.getElementById(`${tab}Tab`).style.display = 'block';
    document.querySelector(`[data-auth-tab="${tab}"]`).classList.add('active');
}

function openRecoverModal() {
    closeAuthModalFn();
    document.getElementById('recoverPasswordModal').classList.add('active');
}

function closeRecoverModalFn() {
    document.getElementById('recoverPasswordModal').classList.remove('active');
}

function openCreateTeamModalFn() {
    if (!currentUser) {
        showNotification('⚠️ Devi effettuare il login', 'error');
        return;
    }

    if (!currentUser.profileCompleted) {
        showNotification('⚠️ Completa il profilo prima di creare una squadra', 'error');
        navigateTo('profile');
        return;
    }

    if (currentUser.team) {
        showNotification('⚠️ Sei già in una squadra', 'error');
        return;
    }

    document.getElementById('createTeamModal').classList.add('active');
}

function closeCreateTeamModalFn() {
    document.getElementById('createTeamModal').classList.remove('active');
}

function closePlayerDetailModalFn() {
    document.getElementById('playerDetailModal').classList.remove('active');
}

function closeTeamDetailModalFn() {
    document.getElementById('teamDetailModal').classList.remove('active');
}


// ============================================
// AUTH
// ============================================

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showNotification('⚠️ Compila tutti i campi', 'error');
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
        console.error('Register error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function handleRecoverPassword(e) {
    e.preventDefault();

    const email = document.getElementById('recoverEmail').value.trim();

    if (!email || !email.includes('@')) {
        showNotification('⚠️ Inserisci un\'email valida', 'error');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/auth?action=recover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Email di recupero inviata! Controlla la tua casella.', 'success');
            closeRecoverModalFn();
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Recover password error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function handleResetPassword(e) {
    e.preventDefault();

    const token = document.getElementById('resetToken').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showNotification('⚠️ Le password non corrispondono', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showNotification('⚠️ Password deve essere almeno 6 caratteri', 'error');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/auth?action=reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('resetPasswordModal').classList.remove('active');
            showNotification('✅ Password reimpostata con successo! Ora puoi effettuare il login.', 'success');
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
    document.getElementById('profileLookingForTeam').textContent = currentUser.lookingForTeam ? 'Sì ✅' : 'No ❌';
    document.getElementById('profileInstagram').textContent = currentUser.instagram || 'Non specificato';
    document.getElementById('profileTiktok').textContent = currentUser.tiktok || 'Non specificato';

    if (currentTeam) {
        document.getElementById('profileTeamName').textContent = currentTeam.name;
        document.getElementById('profileTeamInfo').style.display = 'block';
    } else {
        document.getElementById('profileTeamInfo').style.display = 'none';
    }
}

function openEditProfileModal() {
    if (!currentUser) return;

    document.getElementById('editUsername').value = currentUser.username;
    document.getElementById('editPrimaryRole').value = currentUser.primaryRole;
    document.getElementById('editPlatform').value = currentUser.platform;
    document.getElementById('editNationality').value = currentUser.nationality || '';
    document.getElementById('editLevel').value = currentUser.level;
    document.getElementById('editBio').value = currentUser.bio || '';
    document.getElementById('editInstagram').value = currentUser.instagram || '';
    document.getElementById('editTiktok').value = currentUser.tiktok || '';
    document.getElementById('editLookingForTeam').checked = currentUser.lookingForTeam || false;

    const container = document.getElementById('editSecondaryRolesContainer');
    container.innerHTML = '';
    if (currentUser.secondaryRoles && currentUser.secondaryRoles.length > 0) {
        currentUser.secondaryRoles.forEach(role => addSecondaryRoleField(role));
    } else {
        addSecondaryRoleField('');
    }

    document.getElementById('editProfileModal').classList.add('active');
}

function closeEditProfileModal() {
    document.getElementById('editProfileModal').classList.remove('active');
}

async function handleEditProfile(e) {
    e.preventDefault();

    const username = document.getElementById('editUsername').value.trim();
    const primaryRole = document.getElementById('editPrimaryRole').value;
    const platform = document.getElementById('editPlatform').value;
    const nationality = document.getElementById('editNationality').value.trim();
    const level = parseInt(document.getElementById('editLevel').value);
    const bio = document.getElementById('editBio').value.trim();
    const instagram = document.getElementById('editInstagram').value.trim();
    const tiktok = document.getElementById('editTiktok').value.trim();
    const lookingForTeam = document.getElementById('editLookingForTeam').checked;

    const secondaryRoleSelects = document.querySelectorAll('.secondary-role-select');
    const secondaryRoles = Array.from(secondaryRoleSelects)
        .map(select => select.value)
        .filter(role => role !== '');

    if (!username || username.length < 3) {
        showNotification('⚠️ Username deve essere almeno 3 caratteri', 'error');
        return;
    }

    if (secondaryRoles.length < 1) {
        showNotification('⚠️ Seleziona almeno 1 ruolo secondario', 'error');
        return;
    }

    if (secondaryRoles.length > 2) {
        showNotification('⚠️ Massimo 2 ruoli secondari', 'error');
        return;
    }

    if (isNaN(level) || level < GLOBAL_MIN_LEVEL || level > GLOBAL_MAX_LEVEL) {
        showNotification(`⚠️ Il livello deve essere tra ${GLOBAL_MIN_LEVEL} e ${GLOBAL_MAX_LEVEL}`, 'error');
        return;
    }

    try {
        showLoading();
        
        // FIX CRITICO: Usa /auth?action=me con metodo PUT
        const response = await fetch(`${API_BASE}/auth?action=me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                username, primaryRole, platform, nationality, level, bio,
                instagram, tiktok, lookingForTeam, secondaryRoles
            })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            closeEditProfileModal();
            loadProfile();
            updateUIForUser();
            showNotification('✅ Profilo aggiornato!', 'success');
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
            renderPlayers(data.users || data);
        } else {
            const data = await response.json();
            showNotification('❌ ' + (data.error || 'Errore nel caricamento giocatori'), 'error');
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
                                <button class="btn-favorite ${isFavorite ? 'active' : ''}" 
                                        onclick="event.stopPropagation(); toggleFavorite('${player._id}', 'giocatori')">
                                    <i class="fas fa-star"></i>
                                </button>
                            ` : ''}
                        </h3>
                        <p class="player-role">${player.primaryRole}</p>
                        <div class="player-level-bar">
                            <div class="player-level-progress" style="width: ${calculateLevelPercentage(player.level)}%"></div>
                            <span class="player-level-text">Liv. ${player.level}</span>
                        </div>
                    </div>
                </div>
                <div class="player-card-body">
                    <p class="player-platform">
                        <i class="fas fa-gamepad"></i> ${player.platform}
                    </p>
                    <p class="player-nationality">
                        <i class="fas fa-flag"></i> ${player.nationality || 'N/A'}
                    </p>
                    <p class="player-rating">
                        <i class="fas fa-star"></i> ${player.averageRating.toFixed(1)} (${player.feedbackCount})
                    </p>
                </div>
                ${player.lookingForTeam ? '<div class="player-badge">🔍 Cerca Squadra</div>' : ''}
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
            const data = await response.json();
            const player = data.user || data;

            const feedbackResponse = await fetch(`${API_BASE}/feedback?userId=${playerId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            let feedbacks = [];
            if (feedbackResponse.ok) {
                const feedbackData = await feedbackResponse.json();
                feedbacks = feedbackData.feedbacks || feedbackData || [];
            }

            renderPlayerDetail(player, feedbacks);
            document.getElementById('playerDetailModal').classList.add('active');
        } else {
            const data = await response.json();
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Show player detail error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function renderPlayerDetail(player, feedbacks) {
    const isFavorite = userFavorites.giocatori.some(g => g._id === player._id);
    
    document.getElementById('playerDetailName').innerHTML = `
        ${player.username}
        ${currentUser && player._id !== currentUser._id ? `
            <button class="btn-favorite ${isFavorite ? 'active' : ''}" 
                    onclick="toggleFavorite('${player._id}', 'giocatori')">
                <i class="fas fa-star"></i>
            </button>
        ` : ''}
    `;
    
    document.getElementById('playerDetailLevel').textContent = player.level;
    document.getElementById('playerDetailLevelProgress').style.width = `${calculateLevelPercentage(player.level)}%`;
    document.getElementById('playerDetailRating').textContent = player.averageRating.toFixed(1);
    document.getElementById('playerDetailRatingCount').textContent = player.feedbackCount;
    document.getElementById('playerDetailPlatform').textContent = player.platform;
    document.getElementById('playerDetailNationality').textContent = player.nationality || 'Non specificata';
    document.getElementById('playerDetailPrimaryRole').textContent = player.primaryRole;
    document.getElementById('playerDetailSecondaryRoles').textContent = 
        player.secondaryRoles && player.secondaryRoles.length > 0 
        ? player.secondaryRoles.join(', ') 
        : 'Nessuno';
    document.getElementById('playerDetailBio').textContent = player.bio || 'Nessuna bio';
    document.getElementById('playerDetailLookingForTeam').textContent = player.lookingForTeam ? 'Sì ✅' : 'No ❌';

    let socialsHTML = '<div class="player-socials">';
    if (player.instagram) {
        socialsHTML += `
            <a href="https://instagram.com/${player.instagram}" target="_blank" class="social-link">
                <i class="fab fa-instagram"></i> @${player.instagram}
            </a>
        `;
    }
    if (player.tiktok) {
        socialsHTML += `
            <a href="https://tiktok.com/@${player.tiktok}" target="_blank" class="social-link">
                <i class="fab fa-tiktok"></i> @${player.tiktok}
            </a>
        `;
    }
    if (!player.instagram && !player.tiktok) {
        socialsHTML += '<p>Nessun social</p>';
    }
    socialsHTML += '</div>';
    document.getElementById('playerDetailSocials').innerHTML = socialsHTML;

    const feedbackBtn = document.getElementById('leaveFeedbackBtn');
    const shareBtn = document.getElementById('sharePlayerBtn');
    
    if (currentUser && currentUser._id !== player._id) {
        feedbackBtn.style.display = 'inline-block';
        feedbackBtn.onclick = () => openFeedbackModal(player._id, 'player');
        
        shareBtn.style.display = 'inline-block';
        shareBtn.onclick = () => shareProfile('player', player._id, player.username);
    } else {
        feedbackBtn.style.display = 'none';
        
        shareBtn.style.display = 'inline-block';
        shareBtn.onclick = () => shareProfile('player', player._id, player.username);
    }

    renderPlayerFeedback(feedbacks);
}

function renderPlayerFeedback(feedbacks) {
    const container = document.getElementById('playerFeedbackList');

    if (!feedbacks || feedbacks.length === 0) {
        container.innerHTML = '<p>Nessun feedback ricevuto</p>';
        return;
    }

    container.innerHTML = feedbacks.map(fb => `
        <div class="feedback-item">
            <div class="feedback-header">
                <div class="feedback-author">
                    <i class="fas fa-user-circle"></i>
                    ${fb.fromUser && fb.fromUser.username ? fb.fromUser.username : 'Utente'}
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
            renderTeams(data.teams || data);
        } else {
            const data = await response.json();
            showNotification('❌ ' + (data.error || 'Errore nel caricamento squadre'), 'error');
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
                                <button class="btn-favorite ${isFavorite ? 'active' : ''}" 
                                        onclick="event.stopPropagation(); toggleFavorite('${team._id}', 'squadre')">
                                    <i class="fas fa-star"></i>
                                </button>
                            ` : ''}
                        </h3>
                        <p class="team-platform"><i class="fas fa-gamepad"></i> ${team.platform}</p>
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
                ${team.lookingForPlayers ? '<div class="team-badge">🔍 Cercano Giocatori</div>' : ''}
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
            const team = data.team || data;

            const feedbackResponse = await fetch(`${API_BASE}/feedback?teamId=${teamId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            let feedbacks = [];
            if (feedbackResponse.ok) {
                const feedbackData = await feedbackResponse.json();
                feedbacks = feedbackData.feedbacks || feedbackData || [];
            }

            renderTeamDetail(team, feedbacks);
            document.getElementById('teamDetailModal').classList.add('active');
        } else {
            const data = await response.json();
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Show team detail error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function renderTeamDetail(team, feedbacks) {
    const isFavorite = userFavorites.squadre.some(s => s._id === team._id);
    
    document.getElementById('teamDetailName').innerHTML = `
        ${team.name}
        ${currentUser ? `
            <button class="btn-favorite ${isFavorite ? 'active' : ''}" 
                    onclick="toggleFavorite('${team._id}', 'squadre')">
                <i class="fas fa-star"></i>
            </button>
        ` : ''}
    `;
    
    document.getElementById('teamDetailPlatform').textContent = team.platform;
    document.getElementById('teamDetailNationality').textContent = team.nationality || 'Non specificata';
    document.getElementById('teamDetailDescription').textContent = team.description || 'Nessuna descrizione';
    document.getElementById('teamDetailMembers').textContent = team.members.length;
    document.getElementById('teamDetailRating').textContent = team.averageRating.toFixed(1);
    document.getElementById('teamDetailRatingCount').textContent = team.feedbackCount;
    document.getElementById('teamDetailLookingForPlayers').textContent = team.lookingForPlayers ? 'Sì ✅' : 'No ❌';

    let socialsHTML = '<div class="team-socials">';
    if (team.instagram) {
        socialsHTML += `
            <a href="https://instagram.com/${team.instagram}" target="_blank" class="social-link">
                <i class="fab fa-instagram"></i> @${team.instagram}
            </a>
        `;
    }
    if (team.tiktok) {
        socialsHTML += `
            <a href="https://tiktok.com/@${team.tiktok}" target="_blank" class="social-link">
                <i class="fab fa-tiktok"></i> @${team.tiktok}
            </a>
        `;
    }
    if (team.liveLink) {
        socialsHTML += `
            <a href="${team.liveLink}" target="_blank" class="social-link live-link">
                <i class="fas fa-play-circle"></i> Guarda Live
            </a>
        `;
    }
    if (!team.instagram && !team.tiktok && !team.liveLink) {
        socialsHTML += '<p>Nessun social</p>';
    }
    socialsHTML += '</div>';
    document.getElementById('teamDetailSocials').innerHTML = socialsHTML;

    let membersHTML = '<div class="team-members-list">';
    team.members.forEach(member => {
        const isCaptain = member._id === team.captain.toString();
        const isViceCaptain = team.viceCaptain && member._id === team.viceCaptain.toString();
        
        membersHTML += `
            <div class="member-item">
                <div class="member-info">
                    <i class="fas fa-user"></i>
                    <span>${member.username}</span>
                    ${isCaptain ? '<span class="badge captain">Capitano</span>' : ''}
                    ${isViceCaptain ? '<span class="badge vice-captain">Vice</span>' : ''}
                </div>
                <span class="member-role">${member.primaryRole}</span>
            </div>
        `;
    });
    membersHTML += '</div>';
    document.getElementById('teamDetailMembersList').innerHTML = membersHTML;

    const actionButtons = document.getElementById('teamDetailActions');
    actionButtons.innerHTML = '';

    if (currentUser) {
        const isMember = team.members.some(m => m._id === currentUser._id);
        const isCaptain = team.captain.toString() === currentUser._id;

        if (!isMember) {
            actionButtons.innerHTML = `
                <button class="btn btn-primary" onclick="requestJoinTeam('${team._id}')">
                    <i class="fas fa-plus"></i> Richiedi di Unirti
                </button>
                <button class="btn btn-secondary" onclick="openFeedbackModal('${team._id}', 'team')">
                    <i class="fas fa-comment"></i> Lascia Feedback
                </button>
                <button class="btn btn-secondary" onclick="shareProfile('team', '${team._id}', '${team.name}')">
                    <i class="fas fa-share-alt"></i> Condividi
                </button>
            `;
        } else if (isCaptain) {
            actionButtons.innerHTML = `
                <button class="btn btn-danger" onclick="leaveTeam('${team._id}')">
                    <i class="fas fa-sign-out-alt"></i> Lascia Squadra
                </button>
                <button class="btn btn-secondary" onclick="shareProfile('team', '${team._id}', '${team.name}')">
                    <i class="fas fa-share-alt"></i> Condividi
                </button>
            `;
        } else {
            actionButtons.innerHTML = `
                <button class="btn btn-danger" onclick="leaveTeam('${team._id}')">
                    <i class="fas fa-sign-out-alt"></i> Lascia Squadra
                </button>
                <button class="btn btn-secondary" onclick="openFeedbackModal('${team._id}', 'team')">
                    <i class="fas fa-comment"></i> Lascia Feedback
                </button>
                <button class="btn btn-secondary" onclick="shareProfile('team', '${team._id}', '${team.name}')">
                    <i class="fas fa-share-alt"></i> Condividi
                </button>
            `;
        }
    } else {
        actionButtons.innerHTML = `
            <button class="btn btn-secondary" onclick="shareProfile('team', '${team._id}', '${team.name}')">
                <i class="fas fa-share-alt"></i> Condividi
            </button>
        `;
    }

    renderTeamFeedback(feedbacks);
}

function renderTeamFeedback(feedbacks) {
    const container = document.getElementById('teamFeedbackList');

    if (!feedbacks || feedbacks.length === 0) {
        container.innerHTML = '<p>Nessun feedback ricevuto</p>';
        return;
    }

    container.innerHTML = feedbacks.map(fb => `
        <div class="feedback-item">
            <div class="feedback-header">
                <div class="feedback-author">
                    <i class="fas fa-user-circle"></i>
                    ${fb.fromUser && fb.fromUser.username ? fb.fromUser.username : 'Utente'}
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
            currentUser.team = data.team._id;
            await loadCurrentTeam();
            searchTeams();
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

async function requestJoinTeam(teamId) {
    if (!currentUser) return;

    if (!confirm('Vuoi richiedere di unirti a questa squadra?')) return;

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
            showNotification('✅ Richiesta inviata!', 'success');
            closeTeamDetailModalFn();
        } else if (response.status === 429) {
            handleRateLimitError(data.error);
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Request join error:', error);
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
            showNotification('✅ Hai lasciato la squadra', 'info');
            closeTeamDetailModalFn();
            currentUser.team = null;
            currentTeam = null;
            searchTeams();
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

async function removeMember(teamId, userId) {
    if (!confirm('Vuoi rimuovere questo membro dalla squadra?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ teamId, action: 'removeMember', targetUserId: userId })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Membro rimosso!', 'success');
            closeTeamDetailModalFn();
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

async function setViceCaptain(teamId, userId) {
    if (!confirm('Vuoi nominare questo giocatore come vice capitano?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ teamId, action: 'setViceCaptain', targetUserId: userId })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Vice capitano nominato!', 'success');
            closeTeamDetailModalFn();
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

async function loadCurrentTeam() {
    if (!currentUser || !currentUser.team) {
        currentTeam = null;
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/teams?id=${currentUser.team}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            currentTeam = data.team || data;
        }
    } catch (error) {
        console.error('Load current team error:', error);
    }
}


// ============================================
// FEEDBACK
// ============================================

function openFeedbackModal(targetId, type) {
    if (!currentUser) {
        showNotification('⚠️ Devi effettuare il login', 'error');
        return;
    }

    document.getElementById('feedbackTargetId').value = targetId;
    document.getElementById('feedbackTargetType').value = type;
    document.getElementById('feedbackForm').reset();
    selectedRating = 0;
    selectedTags = [];
    
    document.querySelectorAll('#starRating i').forEach(star => {
        star.classList.remove('active');
    });
    
    document.querySelectorAll('.tag-item').forEach(tag => {
        tag.classList.remove('active');
    });

    document.getElementById('feedbackModal').classList.add('active');
}

function closeFeedbackModalFn() {
    document.getElementById('feedbackModal').classList.remove('active');
}

async function handleSubmitFeedback(e) {
    e.preventDefault();

    const targetId = document.getElementById('feedbackTargetId').value;
    const targetType = document.getElementById('feedbackTargetType').value;
    const comment = document.getElementById('feedbackComment').value.trim();

    if (selectedRating === 0) {
        showNotification('⚠️ Seleziona una valutazione', 'error');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                targetId,
                targetType,
                rating: selectedRating,
                tags: selectedTags,
                comment
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Feedback inviato!', 'success');
            closeFeedbackModalFn();
            
            if (targetType === 'player') {
                closePlayerDetailModalFn();
            } else {
                closeTeamDetailModalFn();
            }
        } else if (response.status === 429) {
            handleRateLimitError(data.error);
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

function loadRequests() {
    if (!currentUser) return;

    if (currentTeam) {
        document.getElementById('receivedRequestsSection').style.display = 'block';
        loadTeamRequests();
    } else {
        document.getElementById('receivedRequestsSection').style.display = 'none';
    }

    loadSentRequests();
}

function switchRequestsTab(tab) {
    document.querySelectorAll('.requests-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tab).classList.add('active');
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
}

async function loadTeamRequests() {
    if (!currentTeam) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/requests?teamId=${currentTeam._id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            renderTeamRequests(data.requests || data);
        }
    } catch (error) {
        console.error('Load team requests error:', error);
    } finally {
        hideLoading();
    }
}

function renderTeamRequests(requests) {
    const container = document.getElementById('receivedRequests');

    if (!requests || requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Nessuna richiesta ricevuta</p>
            </div>
        `;
        return;
    }

    container.innerHTML = requests.map(req => `
        <div class="request-card">
            <div class="request-header">
                <div class="request-info">
                    <div class="request-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="request-details">
                        <h4>${req.playerDetails ? req.playerDetails.username : 'Giocatore'}</h4>
                        <p class="request-meta">
                            ${req.playerDetails ? `${req.playerDetails.primaryRole} • Liv. ${req.playerDetails.level}` : ''}
                        </p>
                    </div>
                </div>
                ${req.status === 'pending' ? `
                    <div class="request-actions">
                        <button class="btn btn-success btn-small" onclick="approveRequest('${req._id}')">
                            <i class="fas fa-check"></i> Accetta
                        </button>
                        <button class="btn btn-danger btn-small" onclick="rejectRequest('${req._id}')">
                            <i class="fas fa-times"></i> Rifiuta
                        </button>
                    </div>
                ` : `
                    <span class="request-status ${req.status}">${req.status === 'approved' ? 'Approvata' : 'Rifiutata'}</span>
                `}
            </div>
        </div>
    `).join('');
}

async function loadSentRequests() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/requests`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            renderSentRequests(data.requests || data);
        }
    } catch (error) {
        console.error('Load sent requests error:', error);
    } finally {
        hideLoading();
    }
}

function renderSentRequests(requests) {
    const container = document.getElementById('sentRequests');

    if (!requests || requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-paper-plane"></i>
                <p>Nessuna richiesta inviata</p>
            </div>
        `;
        return;
    }

    container.innerHTML = requests.map(req => `
        <div class="request-card">
            <div class="request-header">
                <div class="request-info">
                    <div class="request-avatar">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="request-details">
                        <h4>${req.teamDetails ? req.teamDetails.name : 'Squadra'}</h4>
                        <p class="request-meta">
                            ${req.teamDetails ? `${req.teamDetails.platform} • ${req.teamDetails.members.length} membri` : ''}
                        </p>
                    </div>
                </div>
                ${req.status === 'pending' ? `
                    <div class="request-actions">
                        <button class="btn btn-danger btn-small" onclick="cancelRequest('${req._id}')">
                            <i class="fas fa-times"></i> Annulla
                        </button>
                    </div>
                ` : `
                    <span class="request-status ${req.status}">${req.status === 'approved' ? 'Approvata' : 'Rifiutata'}</span>
                `}
            </div>
        </div>
    `).join('');
}

async function approveRequest(requestId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/requests`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ requestId, action: 'approve' })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Richiesta approvata!', 'success');
            loadTeamRequests();
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
        const response = await fetch(`${API_BASE}/requests`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ requestId, action: 'reject' })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Richiesta rifiutata', 'info');
            loadTeamRequests();
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
            showNotification('✅ Richiesta annullata', 'info');
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
// PREFERITI
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
    const isFavorite = favorites.some(f => f._id === targetId);

    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/preferiti`, {
            method: isFavorite ? 'DELETE' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ targetId, type })
        });

        const data = await response.json();

        if (response.ok) {
            userFavorites = data.preferiti;
            updateFavoriteIcons();
            showNotification(isFavorite ? '❌ Rimosso dai preferiti' : '⭐ Aggiunto ai preferiti', 'success');
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Toggle favorite error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function updateFavoriteIcons() {
    document.querySelectorAll('.btn-favorite').forEach(btn => {
        btn.classList.remove('active');
    });

    userFavorites.giocatori.forEach(player => {
        const btns = document.querySelectorAll(`[onclick*="'${player._id}'"][onclick*="giocatori"]`);
        btns.forEach(btn => btn.classList.add('active'));
    });

    userFavorites.squadre.forEach(team => {
        const btns = document.querySelectorAll(`[onclick*="'${team._id}'"][onclick*="squadre"]`);
        btns.forEach(btn => btn.classList.add('active'));
    });
}

function loadFavoritesPage() {
    if (!currentUser) {
        showNotification('⚠️ Devi effettuare il login', 'error');
        navigateTo('home');
        return;
    }

    renderFavoritePlayers();
    renderFavoriteTeams();
}

function switchFavoritesTab(tab) {
    document.querySelectorAll('.favorites-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tab).classList.add('active');
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
}

function renderFavoritePlayers() {
    const container = document.getElementById('favoritePlayers');

    if (!userFavorites.giocatori || userFavorites.giocatori.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-star"></i>
                <p>Nessun giocatore preferito</p>
            </div>
        `;
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
                        <button class="btn-favorite active" 
                                onclick="event.stopPropagation(); toggleFavorite('${player._id}', 'giocatori')">
                            <i class="fas fa-star"></i>
                        </button>
                    </h3>
                    <p class="player-role">${player.primaryRole}</p>
                    <div class="player-level-bar">
                        <div class="player-level-progress" style="width: ${calculateLevelPercentage(player.level)}%"></div>
                        <span class="player-level-text">Liv. ${player.level}</span>
                    </div>
                </div>
            </div>
            <div class="player-card-body">
                <p class="player-platform">
                    <i class="fas fa-gamepad"></i> ${player.platform}
                </p>
                <p class="player-nationality">
                    <i class="fas fa-flag"></i> ${player.nationality || 'N/A'}
                </p>
                <p class="player-rating">
                    <i class="fas fa-star"></i> ${player.averageRating.toFixed(1)} (${player.feedbackCount})
                </p>
            </div>
        </div>
    `).join('');
}

function renderFavoriteTeams() {
    const container = document.getElementById('favoriteTeams');

    if (!userFavorites.squadre || userFavorites.squadre.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-star"></i>
                <p>Nessuna squadra preferita</p>
            </div>
        `;
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
                        <button class="btn-favorite active" 
                                onclick="event.stopPropagation(); toggleFavorite('${team._id}', 'squadre')">
                            <i class="fas fa-star"></i>
                        </button>
                    </h3>
                    <p class="team-platform"><i class="fas fa-gamepad"></i> ${team.platform}</p>
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
// ADMIN PANEL
// ============================================

async function loadAdminDashboard() {
    if (!currentUser || !currentUser.isAdmin) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/admin?action=stats`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const stats = await response.json();
            renderAdminDashboard(stats);
        }
    } catch (error) {
        console.error('Load admin dashboard error:', error);
    } finally {
        hideLoading();
    }

    loadAllUsers();
}

async function loadAllUsers() {
    try {
        const response = await fetch(`${API_BASE}/admin?action=users`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            renderUsersList(data.users || data);
        }
    } catch (error) {
        console.error('Load users error:', error);
    }
}

function renderAdminDashboard(stats) {
    document.getElementById('totalUsersCount').textContent = stats.totalUsers || 0;
    document.getElementById('totalTeamsCount').textContent = stats.totalTeams || 0;
    document.getElementById('totalFeedbacksCount').textContent = stats.totalFeedbacks || 0;
    document.getElementById('activeUsersCount').textContent = stats.activeUsers || 0;
}

function renderUsersList(users) {
    const container = document.getElementById('usersListContainer');

    if (!users || users.length === 0) {
        container.innerHTML = '<p>Nessun utente trovato</p>';
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="admin-user-card">
            <div class="user-info">
                <strong>${user.username}</strong>
                <span>${user.email}</span>
                ${user.isAdmin ? '<span class="badge">Admin</span>' : ''}
                ${user.isSuspended ? '<span class="badge suspended">Sospeso</span>' : ''}
            </div>
            <div class="user-actions">
                ${!user.isSuspended ? `
                    <button class="btn btn-warning btn-small" onclick="suspendUser('${user._id}')">Sospendi</button>
                ` : `
                    <button class="btn btn-success btn-small" onclick="unsuspendUser('${user._id}')">Riattiva</button>
                `}
                <button class="btn btn-danger btn-small" onclick="deleteUser('${user._id}')">Elimina</button>
            </div>
        </div>
    `).join('');
}

async function suspendUser(userId) {
    if (!confirm('Vuoi sospendere questo utente?')) return;

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
            loadAllUsers();
        }
    } catch (error) {
        console.error('Suspend user error:', error);
        showNotification('❌ Errore', 'error');
    } finally {
        hideLoading();
    }
}

async function unsuspendUser(userId) {
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
            showNotification('✅ Utente riattivato', 'success');
            loadAllUsers();
        }
    } catch (error) {
        console.error('Unsuspend user error:', error);
        showNotification('❌ Errore', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteUser(userId) {
    if (!confirm('ATTENZIONE: Vuoi eliminare definitivamente questo utente? Questa azione non può essere annullata.')) return;

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
            loadAllUsers();
        }
    } catch (error) {
        console.error('Delete user error:', error);
        showNotification('❌ Errore', 'error');
    } finally {
        hideLoading();
    }
}


// ============================================
// UTILITY FUNCTIONS
// ============================================

function setupStarRating() {
    const stars = document.querySelectorAll('#starRating i');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.getAttribute('data-rating'));
            document.getElementById('feedbackRating').value = selectedRating;
            
            stars.forEach(s => s.classList.remove('active'));
            for (let i = 0; i < selectedRating; i++) {
                stars[i].classList.add('active');
            }
        });
    });
}

function setupTagSelector() {
    const tags = document.querySelectorAll('.tag-item');
    tags.forEach(tag => {
        tag.addEventListener('click', function() {
            const tagValue = this.getAttribute('data-tag');
            
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                selectedTags = selectedTags.filter(t => t !== tagValue);
            } else {
                this.classList.add('active');
                selectedTags.push(tagValue);
            }
        });
    });
}

function setupSecondaryRolesLimit() {
    const container = document.getElementById('editSecondaryRolesContainer');
    if (!container) return;

    const addBtn = document.getElementById('addSecondaryRole');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const currentRoles = container.querySelectorAll('.secondary-role-field').length;
            if (currentRoles >= 2) {
                showNotification('⚠️ Massimo 2 ruoli secondari', 'error');
                return;
            }
            addSecondaryRoleField('');
        });
    }
}

function addSecondaryRoleField(value = '') {
    const container = document.getElementById('editSecondaryRolesContainer');
    const roleDiv = document.createElement('div');
    roleDiv.className = 'secondary-role-field';
    
    roleDiv.innerHTML = `
        <select class="secondary-role-select">
            <option value="">Seleziona ruolo</option>
            <option value="Portiere (PT)" ${value === 'Portiere (PT)' ? 'selected' : ''}>Portiere (PT)</option>
            <option value="Terzino Destro (TD)" ${value === 'Terzino Destro (TD)' ? 'selected' : ''}>Terzino Destro (TD)</option>
            <option value="Terzino Sinistro (TS)" ${value === 'Terzino Sinistro (TS)' ? 'selected' : ''}>Terzino Sinistro (TS)</option>
            <option value="Difensore Centrale (DC)" ${value === 'Difensore Centrale (DC)' ? 'selected' : ''}>Difensore Centrale (DC)</option>
            <option value="Mediano (MED)" ${value === 'Mediano (MED)' ? 'selected' : ''}>Mediano (MED)</option>
            <option value="Centrocampista (CC)" ${value === 'Centrocampista (CC)' ? 'selected' : ''}>Centrocampista (CC)</option>
            <option value="Trequartista (TRQ)" ${value === 'Trequartista (TRQ)' ? 'selected' : ''}>Trequartista (TRQ)</option>
            <option value="Esterno Destro (ED)" ${value === 'Esterno Destro (ED)' ? 'selected' : ''}>Esterno Destro (ED)</option>
            <option value="Esterno Sinistro (ES)" ${value === 'Esterno Sinistro (ES)' ? 'selected' : ''}>Esterno Sinistro (ES)</option>
            <option value="Ala Destra (AD)" ${value === 'Ala Destra (AD)' ? 'selected' : ''}>Ala Destra (AD)</option>
            <option value="Ala Sinistra (AS)" ${value === 'Ala Sinistra (AS)' ? 'selected' : ''}>Ala Sinistra (AS)</option>
            <option value="Attaccante (ATT)" ${value === 'Attaccante (ATT)' ? 'selected' : ''}>Attaccante (ATT)</option>
        </select>
        <button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(roleDiv);
}

function handleRateLimitError(errorMessage) {
    const match = errorMessage.match(/(\d+)/);
    const seconds = match ? match[1] : '60';
    showNotification(`⏱️ Troppo veloce! Riprova tra ${seconds} secondi`, 'error');
}

function setupEventListeners() {
    console.log('⚙️ Setting up event listeners...');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = e.currentTarget.dataset.page;
            navigateTo(page);
        });
    });

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    const recoverForm = document.getElementById('recoverForm');
    if (recoverForm) recoverForm.addEventListener('submit', handleRecoverPassword);

    const resetForm = document.getElementById('resetPasswordForm');
    if (resetForm) resetForm.addEventListener('submit', handleResetPassword);

    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) editProfileForm.addEventListener('submit', handleEditProfile);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    const closeAuthModal = document.getElementById('closeAuthModal');
    if (closeAuthModal) closeAuthModal.addEventListener('click', closeAuthModalFn);

    const closeRecoverModal = document.getElementById('closeRecoverModal');
    if (closeRecoverModal) closeRecoverModal.addEventListener('click', closeRecoverModalFn);

    const closeEditProfileModal = document.getElementById('closeEditProfileModal');
    if (closeEditProfileModal) closeEditProfileModal.addEventListener('click', closeEditProfileModal);

    const closeFeedbackModal = document.getElementById('closeFeedbackModal');
    if (closeFeedbackModal) closeFeedbackModal.addEventListener('click', closeFeedbackModalFn);

    const closePlayerDetailModal = document.getElementById('closePlayerDetailModal');
    if (closePlayerDetailModal) closePlayerDetailModal.addEventListener('click', closePlayerDetailModalFn);

    const closeTeamDetailModal = document.getElementById('closeTeamDetailModal');
    if (closeTeamDetailModal) closeTeamDetailModal.addEventListener('click', closeTeamDetailModalFn);

    const closeCreateTeamModal = document.getElementById('closeCreateTeamModal');
    if (closeCreateTeamModal) closeCreateTeamModal.addEventListener('click', closeCreateTeamModalFn);

    const createTeamForm = document.getElementById('createTeamForm');
    if (createTeamForm) createTeamForm.addEventListener('submit', handleCreateTeam);

    const searchPlayersBtn = document.getElementById('searchPlayersBtn');
    if (searchPlayersBtn) searchPlayersBtn.addEventListener('click', searchPlayers);

    const searchTeamsBtn = document.getElementById('searchTeamsBtn');
    if (searchTeamsBtn) searchTeamsBtn.addEventListener('click', searchTeams);

    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) feedbackForm.addEventListener('submit', handleSubmitFeedback);

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            if (tab === 'favorite-players' || tab === 'favorite-teams') {
                switchFavoritesTab(tab);
            } else {
                switchRequestsTab(tab);
            }
        });
    });

    setupStarRating();
    setupTagSelector();
    setupSecondaryRolesLimit();

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
    
    console.log('✅ Event listeners setup complete');
}


// ============================================
// GESTIONE CHIUSURA MODAL CONDIVISI
// ============================================

document.addEventListener('click', (event) => {
    if (event.target.classList.contains('close')) {
        const urlParams = getURLParams();
        
        if (urlParams.profile && urlParams.id) {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
   
            window.history.pushState({}, '', window.location.pathname);
            
            showHomepage();
            
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
    }
});

window.addEventListener('popstate', (event) => {
    const urlParams = getURLParams();
    
    if (!urlParams.profile && !urlParams.id) {
        showHomepage();
        window.location.reload();
    }
});


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
window.suspendUser = suspendUser;
window.unsuspendUser = unsuspendUser;
window.deleteUser = deleteUser;
window.toggleFavorite = toggleFavorite;
window.shareProfile = shareProfile;


// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM caricato, inizializzazione app...');

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
        
        return;
    }

    initApp();
    checkResetToken();
});

async function initApp() {
    populateNationalities();
    setupEventListeners();
    checkAuth();
    
    console.log('✅ App inizializzata con successo!');
}
