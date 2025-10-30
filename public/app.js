// ============================================
// 🎮 PRO CLUB HUB - APP.JS COMPLETO v2.0
// ============================================
// Sistema completo di gestione per giocatori EA Sports FC Pro Clubs
// Stack: Vanilla JavaScript + Node.js + MongoDB + Vercel

// ============================================
// 📊 COSTANTI E CONFIGURAZIONE
// ============================================

const API_BASE = '/api';
const GLOBAL_MIN_LEVEL = 1;
const GLOBAL_MAX_LEVEL = 50;

// Ruoli disponibili
const ROLES = [
  'GK', 'CB', 'RB', 'LB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'ST'
];

// Piattaforme disponibili
const PLATFORMS = ['PlayStation 5', 'Xbox Series X/S', 'PC'];

// Nazionalità disponibili
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

// Tag per feedback
const FEEDBACK_TAGS = [
  'Serio',
  'Comunicativo',
  'Divertente',
  'Tossico',
  'Giocatore di squadra',
  'Leader',
  'Affidabile',
  'Puntuale',
  'Tecnico',
  'Tattico'
];

// ============================================
// 🌍 VARIABILI GLOBALI
// ============================================

let currentUser = null;
let currentPage = 'home';
let allPlayers = [];
let allTeams = [];
let selectedFeedbackTags = [];
let feedbackRating = 5;

// ============================================
// 🛠️ UTILITY FUNCTIONS
// ============================================

/**
 * 🔔 Mostra notifica all'utente
 */
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

/**
 * ⏳ Mostra overlay loading
 */
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('active');
}

/**
 * ✅ Nascondi overlay loading
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
}

/**
 * 🔒 Escape HTML per sicurezza
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * ✅ Verifica se profilo è completo
 */
function isProfileComplete() {
    if (!currentUser) return false;
    return !!(
        currentUser.username &&
        currentUser.email &&
        currentUser.primaryRole &&
        currentUser.platform &&
        currentUser.nationality &&
        currentUser.level &&
        (currentUser.instagram || currentUser.tiktok)
    );
}

// ============================================
// 🔐 AUTENTICAZIONE - ✅ CORREZIONI APPLICATE
// ============================================

/**
 * 📝 Mostra modal login - ✅ CORRETTO
 */
function showLoginModal() {
    const modal = document.getElementById('authModal');
    if (!modal) {
        console.error('❌ authModal non trovato nell\'HTML!');
        return;
    }
    switchAuthForm('login');
    modal.classList.add('active');
}

/**
 * 📝 Mostra modal registrazione - ✅ CORRETTO
 */
function showRegisterModal() {
    const modal = document.getElementById('authModal');
    if (!modal) {
        console.error('❌ authModal non trovato nell\'HTML!');
        return;
    }
    switchAuthForm('register');
    modal.classList.add('active');
}

/**
 * ❌ Chiudi modal auth - ✅ CORRETTO
 */
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * 🔄 Switcha tra i form del modal auth - ✅ NUOVA FUNZIONE
 */
function switchAuthForm(formType) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    if (!loginForm || !registerForm || !forgotPasswordForm) {
        console.error('❌ Form non trovati nell\'HTML!');
        return;
    }
    
    // Nascondi tutti i form
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    forgotPasswordForm.style.display = 'none';
    
    // Mostra il form richiesto
    switch(formType) {
        case 'login':
            loginForm.style.display = 'block';
            break;
        case 'register':
            registerForm.style.display = 'block';
            break;
        case 'forgot':
            forgotPasswordForm.style.display = 'block';
            break;
    }
}

/**
 * 🔍 Verifica autenticazione al caricamento
 */
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        updateUIForGuest();
        return false;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUIForAuthenticatedUser();
            loadRequestsBadge();
            return true;
        } else {
            localStorage.removeItem('token');
            updateUIForGuest();
            return false;
        }
    } catch (error) {
        console.error('❌ Errore verifica auth:', error);
        localStorage.removeItem('token');
        updateUIForGuest();
        return false;
    }
}

/**
 * 📝 Gestione form login
 */
async function handleLogin(e) {
    e.preventDefault();
    showLoading();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            showNotification('Login effettuato con successo!', 'success');
            updateUIForAuthenticatedUser();
            closeAuthModal();
            navigateTo('profile');
        } else {
            showNotification(data.error || 'Credenziali non valide', 'error');
        }
    } catch (error) {
        console.error('❌ Errore login:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 📝 Gestione form registrazione
 */
async function handleRegister(e) {
    e.preventDefault();
    showLoading();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const primaryRole = document.getElementById('registerPrimaryRole').value;
    const platform = document.getElementById('registerPlatform').value;
    const nationality = document.getElementById('registerNationality').value;
    const level = document.getElementById('registerLevel').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username, 
                email, 
                password, 
                primaryRole, 
                platform, 
                nationality,
                level: parseInt(level)
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            showNotification('Registrazione completata! Benvenuto!', 'success');
            updateUIForAuthenticatedUser();
            closeAuthModal();
            navigateTo('profile');
        } else {
            showNotification(data.error || 'Errore durante la registrazione', 'error');
        }
    } catch (error) {
        console.error('❌ Errore registrazione:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 📧 Gestione forgot password
 */
async function handleForgotPassword(e) {
    e.preventDefault();
    showLoading();
    
    const email = document.getElementById('forgotEmail').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/recover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Email di reset inviata! Controlla la tua casella.', 'success');
            switchAuthForm('login');
        } else {
            showNotification(data.error || 'Errore durante il reset', 'error');
        }
    } catch (error) {
        console.error('❌ Errore forgot password:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🎨 Aggiorna UI per ospite (non autenticato)
 */
function updateUIForGuest() {
    // Mostra bottoni login/registrazione nell'hero
    const heroActions = document.getElementById('heroActions');
    const heroUserInfo = document.getElementById('heroUserInfo');
    
    if (heroActions) heroActions.style.display = 'flex';
    if (heroUserInfo) heroUserInfo.style.display = 'none';
    
    // Nascondi nav per utenti autenticati
    const authNavButtons = ['favoritesNavBtn', 'requestsNavBtn', 'profileNavBtn', 'adminNavBtn', 'logoutBtn'];
    authNavButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) btn.style.display = 'none';
    });
}

/**
 * 🎨 Aggiorna UI per utente autenticato
 */
function updateUIForAuthenticatedUser() {
    // Nascondi bottoni login/registrazione nell'hero e mostra info utente
    const heroActions = document.getElementById('heroActions');
    const heroUserInfo = document.getElementById('heroUserInfo');
    
    if (heroActions) heroActions.style.display = 'none';
    if (heroUserInfo) {
        heroUserInfo.style.display = 'block';
        const usernameEl = document.getElementById('heroUsername');
        const levelEl = document.getElementById('heroLevel');
        if (usernameEl) usernameEl.textContent = currentUser.username;
        if (levelEl) levelEl.textContent = currentUser.level || 'N/A';
    }
    
    // Mostra nav per utenti autenticati
    const favBtn = document.getElementById('favoritesNavBtn');
    const reqBtn = document.getElementById('requestsNavBtn');
    const profBtn = document.getElementById('profileNavBtn');
    const logBtn = document.getElementById('logoutBtn');
    
    if (favBtn) favBtn.style.display = 'block';
    if (reqBtn) reqBtn.style.display = 'block';
    if (profBtn) profBtn.style.display = 'block';
    if (logBtn) logBtn.style.display = 'block';
    
    // Mostra admin nav solo per admin
    if (currentUser.role === 'admin') {
        const adminBtn = document.getElementById('adminNavBtn');
        if (adminBtn) adminBtn.style.display = 'block';
    }
}

/**
 * 📬 Carica badge richieste
 */
async function loadRequestsBadge() {
    if (!currentUser || !currentUser.team) return;
    
    try {
        const response = await fetch(`${API_BASE}/teams/requests/received`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const requests = await response.json();
            const pendingCount = requests.filter(r => r.status === 'pending').length;
            
            const badge = document.getElementById('requestsBadge');
            if (badge) {
                badge.textContent = pendingCount;
                badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
            }
        }
    } catch (error) {
        console.error('❌ Errore caricamento badge richieste:', error);
    }
}

/**
 * 🚪 Logout utente
 */
function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    showNotification('Logout effettuato con successo', 'success');
    updateUIForGuest();
    navigateTo('home');
}

// ============================================
// 🧭 NAVIGAZIONE
// ============================================

/**
 * 🗺️ Naviga tra le pagine
 */
function navigateTo(page) {
    console.log(`🧭 Navigazione verso: ${page}`);
    currentPage = page;
    
    // Nascondi tutte le pagine
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    
    // Mostra la pagina richiesta
    const targetPage = document.getElementById(`${page}Page`);
    if (targetPage) {
        targetPage.style.display = 'block';
    }
    
    // Aggiorna active nav
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-page="${page}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Carica contenuto specifico della pagina
    switch(page) {
        case 'players':
            loadPlayers();
            break;
        case 'teams':
            loadTeams();
            break;
        case 'profile':
            if (currentUser) loadUserProfile();
            break;
        case 'requests':
            if (currentUser) loadRequests();
            break;
        case 'favorites':
            if (currentUser) loadFavorites();
            break;
        case 'admin':
            if (currentUser && currentUser.role === 'admin') {
                loadAdminPanel();
            } else {
                showNotification('Accesso negato', 'error');
                navigateTo('home');
            }
            break;
    }
}

// ============================================
// 👤 GESTIONE PROFILO
// ============================================

/**
 * 📄 Carica profilo utente
 */
async function loadUserProfile() {
    if (!currentUser) return;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/users/${currentUser._id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            currentUser = userData;
            displayUserProfile(userData);
        }
    } catch (error) {
        console.error('❌ Errore caricamento profilo:', error);
        showNotification('Errore nel caricamento del profilo', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🖼️ Mostra profilo utente
 */
function displayUserProfile(user) {
    const usernameEl = document.getElementById('profileUsername');
    const emailEl = document.getElementById('profileEmail');
    const roleEl = document.getElementById('profilePrimaryRole');
    const platformEl = document.getElementById('profilePlatform');
    const nationalityEl = document.getElementById('profileNationality');
    const levelEl = document.getElementById('profileLevel');
    const secondaryRolesEl = document.getElementById('profileSecondaryRoles');
    const bioEl = document.getElementById('profileBio');
    const lookingEl = document.getElementById('profileLookingForTeam');
    
    if (usernameEl) usernameEl.textContent = user.username;
    if (emailEl) emailEl.textContent = user.email;
    if (roleEl) roleEl.textContent = user.primaryRole || 'Non specificato';
    if (platformEl) platformEl.textContent = user.platform || 'Non specificata';
    if (nationalityEl) nationalityEl.textContent = user.nationality || 'Non specificata';
    if (levelEl) levelEl.textContent = user.level || 'Non specificato';
    
    const secondaryRoles = user.secondaryRoles && user.secondaryRoles.length > 0 
        ? user.secondaryRoles.join(', ') 
        : 'Nessuno';
    if (secondaryRolesEl) secondaryRolesEl.textContent = secondaryRoles;
    
    if (bioEl) bioEl.textContent = user.bio || 'Nessuna descrizione';
    if (lookingEl) lookingEl.textContent = user.lookingForTeam ? '✅ Sì' : '❌ No';
    
    // Social links
    const socialCard = document.getElementById('profileSocialCard');
    const socialLinks = document.getElementById('profileSocialLinks');
    
    if (socialCard && socialLinks && (user.instagram || user.tiktok)) {
        socialCard.style.display = 'block';
        let linksHTML = '';
        if (user.instagram) {
            linksHTML += `<a href="https://instagram.com/${user.instagram}" target="_blank"><i class="fab fa-instagram"></i> @${user.instagram}</a>`;
        }
        if (user.tiktok) {
            linksHTML += `<a href="https://tiktok.com/@${user.tiktok}" target="_blank"><i class="fab fa-tiktok"></i> @${user.tiktok}</a>`;
        }
        socialLinks.innerHTML = linksHTML;
    } else if (socialCard) {
        socialCard.style.display = 'none';
    }
    
    // Feedback ricevuti
    loadProfileFeedbacks(user._id);
}

/**
 * ⭐ Carica feedback del profilo
 */
async function loadProfileFeedbacks(userId) {
    try {
        const response = await fetch(`${API_BASE}/feedback?userId=${userId}`);
        
        if (response.ok) {
            const feedbacks = await response.json();
            displayProfileFeedbacks(feedbacks);
        }
    } catch (error) {
        console.error('❌ Errore caricamento feedback:', error);
    }
}

/**
 * 🖼️ Mostra feedback del profilo
 */
function displayProfileFeedbacks(feedbacks) {
    const container = document.getElementById('profileFeedbackList');
    if (!container) return;
    
    if (feedbacks.length === 0) {
        container.innerHTML = '<p class="no-results">Nessun feedback ricevuto</p>';
        return;
    }
    
    container.innerHTML = feedbacks.map(fb => `
        <div class="feedback-item">
            <div class="feedback-header">
                <div class="feedback-rating">
                    ${'⭐'.repeat(fb.rating)}
                </div>
                <span class="feedback-author">Da: ${fb.fromUser?.username || 'Anonymous'}</span>
            </div>
            ${fb.tags && fb.tags.length > 0 ? `
                <div class="feedback-tags">
                    ${fb.tags.map(tag => `<span class="feedback-tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
            ${fb.comment ? `<p class="feedback-comment">${fb.comment}</p>` : ''}
            <div class="feedback-date">${new Date(fb.createdAt).toLocaleDateString()}</div>
        </div>
    `).join('');
}

/**
 * 📝 Apri modal modifica profilo
 */
function openEditProfileModal() {
    if (!currentUser) return;
    
    const modal = document.getElementById('editProfileModal');
    if (!modal) return;
    
    // Popola i campi
    document.getElementById('editUsername').value = currentUser.username || '';
    document.getElementById('editPrimaryRole').value = currentUser.primaryRole || '';
    document.getElementById('editPlatform').value = currentUser.platform || '';
    document.getElementById('editNationality').value = currentUser.nationality || '';
    document.getElementById('editLevel').value = currentUser.level || '';
    document.getElementById('editInstagram').value = currentUser.instagram || '';
    document.getElementById('editTiktok').value = currentUser.tiktok || '';
    document.getElementById('editBio').value = currentUser.bio || '';
    document.getElementById('editLookingForTeam').checked = currentUser.lookingForTeam || false;
    
    // Popola ruoli secondari
    if (currentUser.secondaryRoles) {
        ROLES.forEach(role => {
            const checkbox = document.querySelector(`#editSecondaryRoles input[value="${role}"]`);
            if (checkbox) {
                checkbox.checked = currentUser.secondaryRoles.includes(role);
            }
        });
    }
    
    modal.classList.add('active');
}

/**
 * ❌ Chiudi modal modifica profilo
 */
function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) modal.classList.remove('active');
}

/**
 * 💾 Gestione form modifica profilo
 */
async function handleEditProfile(e) {
    e.preventDefault();
    showLoading();
    
    const secondaryRolesCheckboxes = document.querySelectorAll('#editSecondaryRoles input[type="checkbox"]:checked');
    const secondaryRoles = Array.from(secondaryRolesCheckboxes).map(cb => cb.value);
    
    const profileData = {
        username: document.getElementById('editUsername').value,
        primaryRole: document.getElementById('editPrimaryRole').value,
        secondaryRoles,
        platform: document.getElementById('editPlatform').value,
        nationality: document.getElementById('editNationality').value,
        level: parseInt(document.getElementById('editLevel').value),
        instagram: document.getElementById('editInstagram').value,
        tiktok: document.getElementById('editTiktok').value,
        bio: document.getElementById('editBio').value,
        lookingForTeam: document.getElementById('editLookingForTeam').checked
    };
    
    try {
        const response = await fetch(`${API_BASE}/users/${currentUser._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(profileData)
        });
        
        if (response.ok) {
            const updatedUser = await response.json();
            currentUser = updatedUser;
            showNotification('Profilo aggiornato con successo!', 'success');
            closeEditProfileModal();
            loadUserProfile();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Errore durante l\'aggiornamento', 'error');
        }
    } catch (error) {
        console.error('❌ Errore aggiornamento profilo:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🔄 Reset password
 */
async function handleResetPassword() {
    if (!currentUser) return;
    
    if (!confirm('Riceverai un\'email con le istruzioni per reimpostare la password. Continuare?')) return;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/auth/recover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email })
        });
        
        if (response.ok) {
            showNotification('Email di reset inviata! Controlla la tua casella.', 'success');
        } else {
            showNotification('Errore durante l\'invio dell\'email', 'error');
        }
    } catch (error) {
        console.error('❌ Errore reset password:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🔗 Copia link condivisione profilo
 */
function copyShareLink() {
    if (!currentUser) return;
    
    const shareUrl = `${window.location.origin}/share.html?type=player&id=${currentUser._id}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
        showNotification('Link copiato negli appunti!', 'success');
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Link copiato negli appunti!', 'success');
    });
}

// ============================================
// 🔍 RICERCA GIOCATORI
// ============================================

/**
 * 👥 Carica lista giocatori
 */
async function loadPlayers() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/users`);
        
        if (response.ok) {
            const data = await response.json();
            allPlayers = data.users || data || [];
            displayPlayers(allPlayers);
        }
    } catch (error) {
        console.error('❌ Errore caricamento giocatori:', error);
        showNotification('Errore nel caricamento dei giocatori', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🖼️ Mostra giocatori
 */
function displayPlayers(players) {
    const container = document.getElementById('playersContainer');
    if (!container) return;
    
    if (!players || players.length === 0) {
        container.innerHTML = '<p class="no-results">Nessun giocatore trovato</p>';
        return;
    }
    
    container.innerHTML = players.map(player => `
        <div class="player-card">
            <div class="player-header">
                <div class="player-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="player-info">
                    <h3>${escapeHtml(player.username)}</h3>
                    <p class="player-role">
                        <i class="fas fa-star"></i> ${player.primaryRole}
                        ${player.secondaryRoles && player.secondaryRoles.length > 0 
                            ? ` | ${player.secondaryRoles.join(', ')}` 
                            : ''}
                    </p>
                </div>
                ${currentUser ? `
                    <button onclick="toggleFavorite('${player._id}', 'players')" class="btn-favorite ${isFavorite(player._id, 'players') ? 'active' : ''}">
                        <i class="fas fa-heart"></i>
                    </button>
                ` : ''}
            </div>
            <div class="player-details">
                <p><i class="fas fa-gamepad"></i> ${player.platform}</p>
                <p><i class="fas fa-trophy"></i> Livello ${player.level}</p>
                <p><i class="fas fa-flag"></i> ${player.nationality || 'N/A'}</p>
                ${player.lookingForTeam ? '<p class="looking-team"><i class="fas fa-search"></i> Cerca squadra</p>' : ''}
            </div>
            ${player.bio ? `<p class="player-bio">${escapeHtml(player.bio)}</p>` : ''}
            <div class="player-actions">
                <button onclick="viewPlayerDetail('${player._id}')" class="btn btn-primary">
                    <i class="fas fa-eye"></i> Vedi Profilo
                </button>
                ${currentUser && currentUser._id !== player._id ? `
                    <button onclick="openFeedbackModal('${player._id}', null)" class="btn btn-secondary">
                        <i class="fas fa-star"></i> Feedback
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

/**
 * 🔍 Filtra giocatori
 */
function filterPlayers() {
    const searchQuery = document.getElementById('searchPlayersInput')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('filterRole')?.value;
    const platformFilter = document.getElementById('filterPlatform')?.value;
    const nationalityFilter = document.getElementById('filterNationality')?.value;
    const minLevel = parseInt(document.getElementById('filterMinLevel')?.value) || GLOBAL_MIN_LEVEL;
    const maxLevel = parseInt(document.getElementById('filterMaxLevel')?.value) || GLOBAL_MAX_LEVEL;
    
    let filtered = [...allPlayers];
    
    if (searchQuery) {
        filtered = filtered.filter(p => 
            p.username.toLowerCase().includes(searchQuery) ||
            (p.bio && p.bio.toLowerCase().includes(searchQuery))
        );
    }
    
    if (roleFilter) {
        filtered = filtered.filter(p => 
            p.primaryRole === roleFilter ||
            (p.secondaryRoles && p.secondaryRoles.includes(roleFilter))
        );
    }
    
    if (platformFilter) {
        filtered = filtered.filter(p => p.platform === platformFilter);
    }
    
    if (nationalityFilter) {
        filtered = filtered.filter(p => p.nationality === nationalityFilter);
    }
    
    filtered = filtered.filter(p => {
        const level = parseInt(p.level) || 0;
        return level >= minLevel && level <= maxLevel;
    });
    
    displayPlayers(filtered);
}

/**
 * 🔄 Reset filtri giocatori
 */
function resetPlayerFilters() {
    const searchInput = document.getElementById('searchPlayersInput');
    const roleSelect = document.getElementById('filterRole');
    const platformSelect = document.getElementById('filterPlatform');
    const nationalityInput = document.getElementById('filterNationality');
    const minLevelInput = document.getElementById('filterMinLevel');
    const maxLevelInput = document.getElementById('filterMaxLevel');
    
    if (searchInput) searchInput.value = '';
    if (roleSelect) roleSelect.value = '';
    if (platformSelect) platformSelect.value = '';
    if (nationalityInput) nationalityInput.value = '';
    if (minLevelInput) minLevelInput.value = GLOBAL_MIN_LEVEL;
    if (maxLevelInput) maxLevelInput.value = GLOBAL_MAX_LEVEL;
    
    displayPlayers(allPlayers);
}

/**
 * 👁️ Visualizza dettaglio giocatore
 */
async function viewPlayerDetail(playerId) {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/share?type=player&id=${playerId}`);
        
        if (response.ok) {
            const data = await response.json();
            displayPlayerDetailModal(data.data, data.team, data.feedbacks, data.stats);
        } else {
            showNotification('Errore nel caricamento del profilo', 'error');
        }
    } catch (error) {
        console.error('❌ Errore caricamento dettaglio giocatore:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🖼️ Mostra modal dettaglio giocatore
 */
function displayPlayerDetailModal(player, team, feedbacks, stats) {
    const modal = document.getElementById('playerDetailModal');
    if (!modal) return;
    
    const content = document.getElementById('playerDetailContent');
    if (content) {
        content.innerHTML = `
            <div class="detail-header">
                <div class="detail-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div>
                    <h2>${escapeHtml(player.username)}</h2>
                    <p class="detail-role">
                        <i class="fas fa-star"></i> ${player.primaryRole}
                        ${player.secondaryRoles && player.secondaryRoles.length > 0 
                            ? ` | ${player.secondaryRoles.join(', ')}` 
                            : ''}
                    </p>
                </div>
            </div>
            
            <div class="detail-info">
                <div class="info-item">
                    <i class="fas fa-gamepad"></i>
                    <span>${player.platform}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-trophy"></i>
                    <span>Livello ${player.level}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-flag"></i>
                    <span>${player.nationality || 'N/A'}</span>
                </div>
                ${player.lookingForTeam ? '<div class="info-item looking-team"><i class="fas fa-search"></i><span>Cerca squadra</span></div>' : ''}
            </div>
            
            ${player.bio ? `<div class="detail-bio"><p>${escapeHtml(player.bio)}</p></div>` : ''}
            
            ${player.instagram || player.tiktok ? `
                <div class="detail-social">
                    ${player.instagram ? `
                        <a href="https://instagram.com/${player.instagram}" target="_blank" class="social-link">
                            <i class="fab fa-instagram"></i> @${player.instagram}
                        </a>
                    ` : ''}
                    ${player.tiktok ? `
                        <a href="https://tiktok.com/@${player.tiktok}" target="_blank" class="social-link">
                            <i class="fab fa-tiktok"></i> @${player.tiktok}
                        </a>
                    ` : ''}
                </div>
            ` : ''}
            
            ${team ? `
                <div class="detail-team">
                    <h4><i class="fas fa-shield-alt"></i> Squadra attuale</h4>
                    <p>${escapeHtml(team.name)} - ${team.platform}</p>
                </div>
            ` : ''}
            
            ${stats && stats.totalFeedbacks > 0 ? `
                <div class="detail-stats">
                    <h4><i class="fas fa-star"></i> Statistiche Feedback</h4>
                    <p>Media: ${stats.averageRating.toFixed(1)}/5 (${stats.totalFeedbacks} feedback)</p>
                    ${stats.topTags && stats.topTags.length > 0 ? `
                        <div class="stats-tags">
                            ${stats.topTags.map(t => `<span class="tag">${escapeHtml(t.tag)} (${t.count})</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            ${currentUser && player._id !== currentUser._id ? `
                <div class="detail-actions">
                    <button onclick="openFeedbackModal('${player._id}', null)" class="btn btn-primary">
                        <i class="fas fa-star"></i> Lascia Feedback
                    </button>
                </div>
            ` : ''}
            
            ${feedbacks && feedbacks.length > 0 ? `
                <div class="detail-feedbacks">
                    <h4><i class="fas fa-comments"></i> Ultimi Feedback</h4>
                    ${feedbacks.slice(0, 5).map(fb => `
                        <div class="feedback-item">
                            <div class="feedback-rating">${'⭐'.repeat(fb.rating)}</div>
                            ${fb.tags && fb.tags.length > 0 ? `
                                <div class="feedback-tags">
                                    ${fb.tags.map(tag => `<span class="feedback-tag">${escapeHtml(tag)}</span>`).join('')}
                                </div>
                            ` : ''}
                            ${fb.comment ? `<p class="feedback-comment">${escapeHtml(fb.comment)}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }
    
    modal.classList.add('active');
}

/**
 * ❌ Chiudi modal dettaglio giocatore
 */
function closePlayerDetailModal() {
    const modal = document.getElementById('playerDetailModal');
    if (modal) modal.classList.remove('active');
}

// ============================================
// 🏆 RICERCA SQUADRE
// ============================================

/**
 * 👥 Carica lista squadre
 */
async function loadTeams() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/teams`);
        
        if (response.ok) {
            const data = await response.json();
            allTeams = data.teams || data || [];
            displayTeams(allTeams);
        }
    } catch (error) {
        console.error('❌ Errore caricamento squadre:', error);
        showNotification('Errore nel caricamento delle squadre', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🖼️ Mostra squadre
 */
function displayTeams(teams) {
    const container = document.getElementById('teamsContainer');
    if (!container) return;
    
    if (!teams || teams.length === 0) {
        container.innerHTML = '<p class="no-results">Nessuna squadra trovata</p>';
        return;
    }
    
    container.innerHTML = teams.map(team => `
        <div class="team-card">
            <div class="team-header">
                <div class="team-avatar">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div class="team-info">
                    <h3>${escapeHtml(team.name)}</h3>
                    <p class="team-platform"><i class="fas fa-gamepad"></i> ${team.platform}</p>
                </div>
                ${currentUser ? `
                    <button onclick="toggleFavorite('${team._id}', 'teams')" class="btn-favorite ${isFavorite(team._id, 'teams') ? 'active' : ''}">
                        <i class="fas fa-heart"></i>
                    </button>
                ` : ''}
            </div>
            <div class="team-details">
                <p><i class="fas fa-user-tie"></i> Capitano: ${team.captain?.username || 'N/A'}</p>
                <p><i class="fas fa-users"></i> Membri: ${team.members?.length || 0}/${team.maxMembers || 11}</p>
                <p><i class="fas fa-flag"></i> ${team.nationality || 'Internazionale'}</p>
                ${team.lookingForPlayers ? '<p class="looking-players"><i class="fas fa-search"></i> Cercano giocatori</p>' : ''}
            </div>
            ${team.description ? `<p class="team-description">${escapeHtml(team.description)}</p>` : ''}
            <div class="team-actions">
                <button onclick="viewTeamDetail('${team._id}')" class="btn btn-primary">
                    <i class="fas fa-eye"></i> Dettagli
                </button>
                ${currentUser && !userInTeam(team._id) && canRequestJoin() ? `
                    <button onclick="requestJoinTeam('${team._id}')" class="btn btn-secondary">
                        <i class="fas fa-paper-plane"></i> Richiedi
                    </button>
                ` : ''}
                ${currentUser ? `
                    <button onclick="openFeedbackModal(null, '${team._id}')" class="btn btn-secondary">
                        <i class="fas fa-star"></i> Feedback
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

/**
 * ✅ Verifica se utente è già in una squadra
 */
function userInTeam(teamId) {
    if (!currentUser) return false;
    return currentUser.team && currentUser.team.toString() === teamId;
}

/**
 * ✅ Verifica se utente può richiedere di unirsi
 */
function canRequestJoin() {
    if (!currentUser) return false;
    if (currentUser.team) return false;
    if (!isProfileComplete()) return false;
    return true;
}

/**
 * 🔍 Filtra squadre
 */
function filterTeams() {
    const searchQuery = document.getElementById('searchTeamsInput')?.value.toLowerCase() || '';
    const platformFilter = document.getElementById('filterTeamPlatform')?.value;
    const nationalityFilter = document.getElementById('filterTeamNationality')?.value;
    
    let filtered = [...allTeams];
    
    if (searchQuery) {
        filtered = filtered.filter(t => 
            t.name.toLowerCase().includes(searchQuery) ||
            (t.description && t.description.toLowerCase().includes(searchQuery))
        );
    }
    
    if (platformFilter) {
        filtered = filtered.filter(t => t.platform === platformFilter);
    }
    
    if (nationalityFilter) {
        filtered = filtered.filter(t => t.nationality === nationalityFilter);
    }
    
    const lookingOnlyCheckbox = document.getElementById('filterLookingOnly');
    if (lookingOnlyCheckbox && lookingOnlyCheckbox.checked) {
        filtered = filtered.filter(t => t.lookingForPlayers);
    }
    
    displayTeams(filtered);
}

/**
 * 🔄 Reset filtri squadre
 */
function resetTeamFilters() {
    const searchInput = document.getElementById('searchTeamsInput');
    const platformSelect = document.getElementById('filterTeamPlatform');
    const nationalityInput = document.getElementById('filterTeamNationality');
    const lookingCheckbox = document.getElementById('filterLookingOnly');
    
    if (searchInput) searchInput.value = '';
    if (platformSelect) platformSelect.value = '';
    if (nationalityInput) nationalityInput.value = '';
    if (lookingCheckbox) lookingCheckbox.checked = false;
    
    displayTeams(allTeams);
}

/**
 * 👁️ Visualizza dettaglio squadra
 */
async function viewTeamDetail(teamId) {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/share?type=team&id=${teamId}`);
        
        if (response.ok) {
            const data = await response.json();
            displayTeamDetailModal(data.data, data.members, data.feedbacks, data.stats);
        } else {
            showNotification('Errore nel caricamento della squadra', 'error');
        }
    } catch (error) {
        console.error('❌ Errore caricamento dettaglio squadra:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🖼️ Mostra modal dettaglio squadra
 */
function displayTeamDetailModal(team, members, feedbacks, stats) {
    const modal = document.getElementById('teamDetailModal');
    if (!modal) return;
    
    const content = document.getElementById('teamDetailContent');
    if (content) {
        content.innerHTML = `
            <div class="detail-header">
                <div class="detail-avatar">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div>
                    <h2>${escapeHtml(team.name)}</h2>
                    <p class="detail-role"><i class="fas fa-gamepad"></i> ${team.platform}</p>
                </div>
            </div>
            
            <div class="detail-info">
                <div class="info-item">
                    <i class="fas fa-user-tie"></i>
                    <span>Capitano: ${team.captain?.username || 'N/A'}</span>
                </div>
                ${team.viceCaptain ? `
                    <div class="info-item">
                        <i class="fas fa-star"></i>
                        <span>Vice: ${team.viceCaptain.username}</span>
                    </div>
                ` : ''}
                <div class="info-item">
                    <i class="fas fa-users"></i>
                    <span>${team.members?.length || 0}/${team.maxMembers || 11} membri</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-flag"></i>
                    <span>${team.nationality || 'Internazionale'}</span>
                </div>
                ${team.lookingForPlayers ? '<div class="info-item looking-players"><i class="fas fa-search"></i><span>Cercano giocatori</span></div>' : ''}
            </div>
            
            ${team.description ? `<div class="detail-bio"><p>${escapeHtml(team.description)}</p></div>` : ''}
            
            ${team.instagram || team.tiktok || team.liveLink ? `
                <div class="detail-social">
                    ${team.instagram ? `
                        <a href="https://instagram.com/${team.instagram}" target="_blank" class="social-link">
                            <i class="fab fa-instagram"></i> @${team.instagram}
                        </a>
                    ` : ''}
                    ${team.tiktok ? `
                        <a href="https://tiktok.com/@${team.tiktok}" target="_blank" class="social-link">
                            <i class="fab fa-tiktok"></i> @${team.tiktok}
                        </a>
                    ` : ''}
                    ${team.liveLink ? `
                        <a href="${team.liveLink}" target="_blank" class="social-link">
                            <i class="fas fa-broadcast-tower"></i> Live
                        </a>
                    ` : ''}
                </div>
            ` : ''}
            
            ${members && members.length > 0 ? `
                <div class="detail-members">
                    <h4><i class="fas fa-users"></i> Membri</h4>
                    <div class="members-list">
                        ${members.map(m => `
                            <div class="member-item">
                                <i class="fas fa-user-circle"></i>
                                <span>${escapeHtml(m.username)}</span>
                                <span class="member-role">${m.primaryRole}</span>
                                ${m._id === team.captain?._id ? '<span class="member-badge captain">👑</span>' : ''}
                                ${m._id === team.viceCaptain?._id ? '<span class="member-badge vice">⭐</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${stats && stats.totalFeedbacks > 0 ? `
                <div class="detail-stats">
                    <h4><i class="fas fa-star"></i> Statistiche Feedback</h4>
                    <p>Media: ${stats.averageRating.toFixed(1)}/5 (${stats.totalFeedbacks} feedback)</p>
                </div>
            ` : ''}
            
            ${currentUser && !userInTeam(team._id) && canRequestJoin() ? `
                <div class="detail-actions">
                    <button onclick="requestJoinTeam('${team._id}')" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i> Richiedi di Unirti
                    </button>
                </div>
            ` : ''}
            
            ${feedbacks && feedbacks.length > 0 ? `
                <div class="detail-feedbacks">
                    <h4><i class="fas fa-comments"></i> Ultimi Feedback</h4>
                    ${feedbacks.slice(0, 5).map(fb => `
                        <div class="feedback-item">
                            <div class="feedback-rating">${'⭐'.repeat(fb.rating)}</div>
                            ${fb.tags && fb.tags.length > 0 ? `
                                <div class="feedback-tags">
                                    ${fb.tags.map(tag => `<span class="feedback-tag">${escapeHtml(tag)}</span>`).join('')}
                                </div>
                            ` : ''}
                            ${fb.comment ? `<p class="feedback-comment">${escapeHtml(fb.comment)}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }
    
    modal.classList.add('active');
}

/**
 * ❌ Chiudi modal dettaglio squadra
 */
function closeTeamDetailModal() {
    const modal = document.getElementById('teamDetailModal');
    if (modal) modal.classList.remove('active');
}

/**
 * 📝 Apri modal crea squadra
 */
function openCreateTeamModal() {
    if (!currentUser) {
        showNotification('Devi effettuare il login', 'error');
        showLoginModal();
        return;
    }
    
    if (currentUser.team) {
        showNotification('Sei già in una squadra', 'warning');
        return;
    }
    
    if (!isProfileComplete()) {
        showNotification('Completa il profilo prima di creare una squadra', 'warning');
        openEditProfileModal();
        return;
    }
    
    const modal = document.getElementById('createTeamModal');
    if (modal) modal.classList.add('active');
}

/**
 * ❌ Chiudi modal crea squadra
 */
function closeCreateTeamModal() {
    const modal = document.getElementById('createTeamModal');
    if (modal) {
        modal.classList.remove('active');
        document.getElementById('createTeamForm').reset();
    }
}

/**
 * 💾 Gestione form crea squadra
 */
async function handleCreateTeam(e) {
    e.preventDefault();
    showLoading();
    
    const teamData = {
        name: document.getElementById('createTeamName').value,
        description: document.getElementById('createTeamDescription').value,
        platform: document.getElementById('createTeamPlatform').value,
        nationality: document.getElementById('createTeamNationality').value,
        instagram: document.getElementById('createTeamInstagram').value,
        tiktok: document.getElementById('createTeamTiktok').value,
        liveLink: document.getElementById('createTeamLiveLink').value,
        lookingForPlayers: document.getElementById('createTeamLookingForPlayers').checked
    };
    
    try {
        const response = await fetch(`${API_BASE}/teams`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(teamData)
        });
        
        if (response.ok) {
            showNotification('Squadra creata con successo!', 'success');
            closeCreateTeamModal();
            navigateTo('teams');
            loadTeams();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Errore durante la creazione della squadra', 'error');
        }
    } catch (error) {
        console.error('❌ Errore creazione squadra:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 📤 Richiedi accesso squadra
 */
async function requestJoinTeam(teamId) {
    if (!currentUser) {
        showNotification('Devi effettuare il login', 'error');
        showLoginModal();
        return;
    }
    
    if (currentUser.team) {
        showNotification('Sei già in una squadra', 'warning');
        return;
    }
    
    if (!isProfileComplete()) {
        showNotification('Completa il profilo prima di richiedere l\'accesso', 'warning');
        openEditProfileModal();
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/team-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ teamId })
        });
        
        if (response.ok) {
            showNotification('Richiesta inviata con successo!', 'success');
        } else {
            const data = await response.json();
            showNotification(data.error || 'Errore durante l\'invio della richiesta', 'error');
        }
    } catch (error) {
        console.error('❌ Errore invio richiesta:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// ❤️ SISTEMA PREFERITI
// ============================================

/**
 * 💖 Toggle preferito
 */
async function toggleFavorite(targetId, targetType) {
    if (!currentUser) {
        showNotification('Devi effettuare il login', 'error');
        showLoginModal();
        return;
    }
    
    showLoading();
    
    try {
        const isFav = isFavorite(targetId, targetType);
        const endpoint = isFav ? `${API_BASE}/favorites/remove` : `${API_BASE}/favorites/add`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ targetId, targetType })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user || data;
            showNotification(
                isFav ? 'Rimosso dai preferiti' : 'Aggiunto ai preferiti',
                'success'
            );
            
            // Ricarica la vista corrente
            if (currentPage === 'players') {
                displayPlayers(allPlayers);
            } else if (currentPage === 'teams') {
                displayTeams(allTeams);
            } else if (currentPage === 'favorites') {
                loadFavorites();
            }
        }
    } catch (error) {
        console.error('❌ Errore toggle preferito:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * ✅ Verifica se è tra i preferiti
 */
function isFavorite(targetId, targetType) {
    if (!currentUser) return false;
    
    if (targetType === 'players' && currentUser.favoritePlayers) {
        return currentUser.favoritePlayers.some(id => id.toString() === targetId);
    }
    
    if (targetType === 'teams' && currentUser.favoriteTeams) {
        return currentUser.favoriteTeams.some(id => id.toString() === targetId);
    }
    
    return false;
}

/**
 * 📥 Carica preferiti
 */
async function loadFavorites() {
    if (!currentUser) return;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/favorites`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const favorites = await response.json();
            displayFavorites(favorites);
        }
    } catch (error) {
        console.error('❌ Errore caricamento preferiti:', error);
        showNotification('Errore nel caricamento dei preferiti', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🖼️ Mostra preferiti
 */
function displayFavorites(favorites) {
    const playersContainer = document.getElementById('favoritesPlayersContainer');
    const teamsContainer = document.getElementById('favoritesTeamsContainer');
    
    if (!playersContainer || !teamsContainer) return;
    
    // Giocatori preferiti
    if (!favorites.players || favorites.players.length === 0) {
        playersContainer.innerHTML = '<p class="no-results">Nessun giocatore nei preferiti</p>';
    } else {
        playersContainer.innerHTML = favorites.players.map(player => `
            <div class="favorite-card">
                <div class="favorite-header">
                    <i class="fas fa-user-circle"></i>
                    <h4>${escapeHtml(player.username)}</h4>
                </div>
                <p>${player.primaryRole || ''} - ${player.platform || ''}</p>
                <div class="favorite-actions">
                    <button onclick="viewPlayerDetail('${player._id}')" class="btn btn-primary">
                        <i class="fas fa-eye"></i> Vedi
                    </button>
                    <button onclick="toggleFavorite('${player._id}', 'players')" class="btn btn-danger">
                        <i class="fas fa-heart-broken"></i> Rimuovi
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Squadre preferite
    if (!favorites.teams || favorites.teams.length === 0) {
        teamsContainer.innerHTML = '<p class="no-results">Nessuna squadra nei preferiti</p>';
    } else {
        teamsContainer.innerHTML = favorites.teams.map(team => `
            <div class="favorite-card">
                <div class="favorite-header">
                    <i class="fas fa-shield-alt"></i>
                    <h4>${escapeHtml(team.name)}</h4>
                </div>
                <p>${team.platform || ''}</p>
                <div class="favorite-actions">
                    <button onclick="viewTeamDetail('${team._id}')" class="btn btn-primary">
                        <i class="fas fa-eye"></i> Vedi
                    </button>
                    <button onclick="toggleFavorite('${team._id}', 'teams')" class="btn btn-danger">
                        <i class="fas fa-heart-broken"></i> Rimuovi
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// ============================================
// 📬 SISTEMA RICHIESTE
// ============================================

/**
 * 📥 Carica richieste
 */
async function loadRequests() {
    if (!currentUser) return;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/team-requests`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayRequests(data);
        }
    } catch (error) {
        console.error('❌ Errore caricamento richieste:', error);
        showNotification('Errore nel caricamento delle richieste', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🖼️ Mostra richieste
 */
function displayRequests(data) {
    const receivedContainer = document.getElementById('receivedRequests');
    const sentContainer = document.getElementById('sentRequests');
    
    if (!receivedContainer || !sentContainer) return;
    
    // Richieste ricevute
    if (!data.received || data.received.length === 0) {
        receivedContainer.innerHTML = '<p class="no-results">Nessuna richiesta ricevuta</p>';
    } else {
        receivedContainer.innerHTML = data.received.map(req => `
            <div class="request-card">
                <div class="request-header">
                    <i class="fas fa-user-circle"></i>
                    <h4>${escapeHtml(req.playerDetails?.username || 'Giocatore')}</h4>
                </div>
                <p>Ruolo: ${req.playerDetails?.primaryRole || 'N/A'}</p>
                <p>Livello: ${req.playerDetails?.level || 'N/A'}</p>
                <div class="request-actions">
                    <button onclick="approveRequest('${req._id}')" class="btn btn-success">
                        <i class="fas fa-check"></i> Approva
                    </button>
                    <button onclick="rejectRequest('${req._id}')" class="btn btn-danger">
                        <i class="fas fa-times"></i> Rifiuta
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Richieste inviate
    if (!data.sent || data.sent.length === 0) {
        sentContainer.innerHTML = '<p class="no-results">Nessuna richiesta inviata</p>';
    } else {
        sentContainer.innerHTML = data.sent.map(req => `
            <div class="request-card">
                <div class="request-header">
                    <i class="fas fa-shield-alt"></i>
                    <h4>${escapeHtml(req.teamDetails?.name || 'Squadra')}</h4>
                </div>
                <p>Stato: ${req.status === 'pending' ? '⏳ In attesa' : req.status === 'approved' ? '✅ Approvata' : '❌ Rifiutata'}</p>
                ${req.status === 'pending' ? `
                    <button onclick="cancelRequest('${req._id}')" class="btn btn-danger">
                        <i class="fas fa-ban"></i> Annulla
                    </button>
                ` : ''}
            </div>
        `).join('');
    }
}

/**
 * ✅ Approva richiesta
 */
async function approveRequest(requestId) {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/team-requests/${requestId}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            showNotification('Richiesta approvata!', 'success');
            loadRequests();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Errore durante l\'approvazione', 'error');
        }
    } catch (error) {
        console.error('❌ Errore approvazione richiesta:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * ❌ Rifiuta richiesta
 */
async function rejectRequest(requestId) {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/team-requests/${requestId}/reject`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            showNotification('Richiesta rifiutata', 'success');
            loadRequests();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Errore durante il rifiuto', 'error');
        }
    } catch (error) {
        console.error('❌ Errore rifiuto richiesta:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🚫 Annulla richiesta
 */
async function cancelRequest(requestId) {
    if (!confirm('Vuoi annullare questa richiesta?')) return;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/team-requests/${requestId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            showNotification('Richiesta annullata', 'success');
            loadRequests();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Errore durante l\'annullamento', 'error');
        }
    } catch (error) {
        console.error('❌ Errore annullamento richiesta:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🔄 Switcha tra richieste ricevute e inviate
 */
function switchRequestsTab(tab) {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(t => t.classList.remove('active'));
    
    const activeTab = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    document.getElementById('receivedRequests').style.display = tab === 'received' ? 'block' : 'none';
    document.getElementById('sentRequests').style.display = tab === 'sent' ? 'block' : 'none';
}

// ============================================
// ⭐ SISTEMA FEEDBACK
// ============================================

/**
 * 📝 Apri modal feedback
 */
function openFeedbackModal(userId, teamId) {
    if (!currentUser) {
        showNotification('Devi effettuare il login', 'error');
        showLoginModal();
        return;
    }
    
    const modal = document.getElementById('feedbackModal');
    if (!modal) return;
    
    feedbackRating = 5;
    selectedFeedbackTags = [];
    
    const commentTextarea = document.getElementById('feedbackComment');
    if (commentTextarea) commentTextarea.value = '';
    
    document.getElementById('feedbackTargetUserId').value = userId || '';
    document.getElementById('feedbackTargetTeamId').value = teamId || '';
    
    setupStarRating();
    setupTagSelection();
    
    modal.classList.add('active');
}

/**
 * ❌ Chiudi modal feedback
 */
function closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (modal) modal.classList.remove('active');
}

/**
 * ⭐ Setup sistema stelle rating
 */
function setupStarRating() {
    const starContainer = document.getElementById('starRating');
    if (!starContainer) return;
    
    const stars = starContainer.querySelectorAll('i');
    
    stars.forEach((star, index) => {
        star.className = index < feedbackRating ? 'fas fa-star' : 'far fa-star';
        
        star.onclick = () => {
            feedbackRating = index + 1;
            stars.forEach((s, i) => {
                s.className = i < feedbackRating ? 'fas fa-star' : 'far fa-star';
            });
            document.getElementById('feedbackRating').value = feedbackRating;
        };
    });
    
    document.getElementById('feedbackRating').value = feedbackRating;
}

/**
 * 🏷️ Setup selezione tag
 */
function setupTagSelection() {
    const tagContainer = document.getElementById('tagSelector');
    if (!tagContainer) return;
    
    const tagButtons = tagContainer.querySelectorAll('.tag-btn');
    
    tagButtons.forEach(btn => {
        btn.classList.remove('active');
        
        btn.onclick = (e) => {
            e.preventDefault();
            const tag = btn.dataset.tag;
            
            if (selectedFeedbackTags.includes(tag)) {
                selectedFeedbackTags = selectedFeedbackTags.filter(t => t !== tag);
                btn.classList.remove('active');
            } else {
                selectedFeedbackTags.push(tag);
                btn.classList.add('active');
            }
        };
    });
    
    selectedFeedbackTags = [];
}

/**
 * 💾 Gestione form feedback
 */
async function handleFeedbackSubmit(e) {
    e.preventDefault();
    showLoading();
    
    const userId = document.getElementById('feedbackTargetUserId').value;
    const teamId = document.getElementById('feedbackTargetTeamId').value;
    const comment = document.getElementById('feedbackComment').value;
    
    const feedbackData = {
        rating: feedbackRating,
        comment,
        tags: selectedFeedbackTags
    };
    
    if (userId) feedbackData.targetUserId = userId;
    if (teamId) feedbackData.targetTeamId = teamId;
    
    try {
        const response = await fetch(`${API_BASE}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(feedbackData)
        });
        
        if (response.ok) {
            showNotification('Feedback inviato con successo!', 'success');
            closeFeedbackModal();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Errore durante l\'invio del feedback', 'error');
        }
    } catch (error) {
        console.error('❌ Errore invio feedback:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// 👑 PANNELLO ADMIN
// ============================================

/**
 * 📊 Carica pannello admin
 */
async function loadAdminPanel() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/admin?action=stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            displayAdminStats(stats);
        }
    } catch (error) {
        console.error('❌ Errore caricamento pannello admin:', error);
        showNotification('Errore nel caricamento del pannello admin', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🖼️ Mostra statistiche admin
 */
function displayAdminStats(stats) {
    const totalUsersEl = document.getElementById('totalUsers');
    const totalTeamsEl = document.getElementById('totalTeams');
    const inactiveUsersEl = document.getElementById('inactiveUsers');
    const pendingRequestsEl = document.getElementById('pendingRequests');
    
    if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers || 0;
    if (totalTeamsEl) totalTeamsEl.textContent = stats.totalTeams || 0;
    if (inactiveUsersEl) inactiveUsersEl.textContent = stats.inactiveUsers || 0;
    if (pendingRequestsEl) pendingRequestsEl.textContent = stats.pendingRequests || 0;
}

/**
 * 👥 Carica tutti gli utenti (admin)
 */
async function loadAllUsers() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/admin?action=users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            displayAllUsers(users);
        }
    } catch (error) {
        console.error('❌ Errore caricamento utenti admin:', error);
    } finally {
        hideLoading();
    }
}

/**
 * 🖼️ Mostra tutti gli utenti (admin)
 */
function displayAllUsers(users) {
    const container = document.getElementById('adminUsersContainer');
    if (!container || !users || users.length === 0) return;
    
    container.innerHTML = users.map(user => `
        <div class="admin-user-card">
            <h4>${escapeHtml(user.username)}</h4>
            <p>Email: ${escapeHtml(user.email)}</p>
            <p>Ruolo: ${user.role || 'user'}</p>
            <p>Registrato: ${new Date(user.createdAt).toLocaleDateString()}</p>
            <div class="admin-actions">
                ${user.suspended ? `
                    <button onclick="unsuspendUser('${user._id}')" class="btn btn-success">
                        <i class="fas fa-check"></i> Riabilita
                    </button>
                ` : `
                    <button onclick="suspendUser('${user._id}')" class="btn btn-warning">
                        <i class="fas fa-ban"></i> Sospendi
                    </button>
                `}
                <button onclick="deleteUser('${user._id}', '${escapeHtml(user.username)}')" class="btn btn-danger">
                    <i class="fas fa-trash"></i> Elimina
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * 🚫 Sospendi utente
 */
async function suspendUser(userId) {
    if (!confirm('Vuoi sospendere questo utente?')) return;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}/suspend`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            showNotification('Utente sospeso con successo', 'success');
            loadAllUsers();
        } else {
            showNotification('Errore durante la sospensione', 'error');
        }
    } catch (error) {
        console.error('❌ Errore sospensione utente:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * ✅ Riabilita utente
 */
async function unsuspendUser(userId) {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}/unsuspend`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            showNotification('Utente riabilitato con successo', 'success');
            loadAllUsers();
        } else {
            showNotification('Errore durante la riabilitazione', 'error');
        }
    } catch (error) {
        console.error('❌ Errore riabilitazione utente:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🗑️ Elimina utente
 */
async function deleteUser(userId, username) {
    if (!confirm(`Sei sicuro di voler eliminare l'utente ${username}? Questa azione è irreversibile!`)) return;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            showNotification('Utente eliminato con successo', 'success');
            loadAllUsers();
            loadAdminPanel();
        } else {
            showNotification('Errore durante l\'eliminazione', 'error');
        }
    } catch (error) {
        console.error('❌ Errore eliminazione utente:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// 🎧 SETUP EVENT LISTENERS
// ============================================

/**
 * ⚙️ Configura tutti gli event listeners
 */
function setupEventListeners() {
    console.log('🎧 Setup event listeners...');
    
    // Bottoni hero
    const heroLoginBtn = document.getElementById('heroLoginBtn');
    const heroRegisterBtn = document.getElementById('heroRegisterBtn');
    
    if (heroLoginBtn) heroLoginBtn.addEventListener('click', showLoginModal);
    if (heroRegisterBtn) heroRegisterBtn.addEventListener('click', showRegisterModal);
    
    // Auth modal - form switching
    const showRegisterFormBtn = document.getElementById('showRegisterForm');
    const showLoginFormBtn = document.getElementById('showLoginForm');
    const showForgotPasswordBtn = document.getElementById('showForgotPassword');
    const backToLoginBtn = document.getElementById('backToLogin');
    const closeAuthModalBtn = document.getElementById('closeAuthModal');
    
    if (showRegisterFormBtn) {
        showRegisterFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthForm('register');
        });
    }
    if (showLoginFormBtn) {
        showLoginFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthForm('login');
        });
    }
    if (showForgotPasswordBtn) {
        showForgotPasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthForm('forgot');
        });
    }
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthForm('login');
        });
    }
    if (closeAuthModalBtn) {
        closeAuthModalBtn.addEventListener('click', closeAuthModal);
    }
    
    // Form submissions
    const loginFormElement = document.getElementById('loginFormElement');
    const registerFormElement = document.getElementById('registerFormElement');
    const forgotPasswordFormElement = document.getElementById('forgotPasswordFormElement');
    
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', handleLogin);
    }
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', handleRegister);
    }
    if (forgotPasswordFormElement) {
        forgotPasswordFormElement.addEventListener('submit', handleForgotPassword);
    }
    
    // Profilo
    const editProfileBtn = document.getElementById('editProfileBtn');
    const closeEditModalBtn = document.getElementById('closeEditModal');
    const editProfileForm = document.getElementById('editProfileForm');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    const shareProfileBtn = document.getElementById('shareProfileBtn');
    
    if (editProfileBtn) editProfileBtn.addEventListener('click', openEditProfileModal);
    if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditProfileModal);
    if (editProfileForm) editProfileForm.addEventListener('submit', handleEditProfile);
    if (resetPasswordBtn) resetPasswordBtn.addEventListener('click', handleResetPassword);
    if (shareProfileBtn) shareProfileBtn.addEventListener('click', copyShareLink);
    
    // Squadre
    const createTeamBtn = document.getElementById('createTeamBtn');
    const closeCreateTeamModalBtn = document.getElementById('closeCreateTeamModal');
    const createTeamForm = document.getElementById('createTeamForm');
    
    if (createTeamBtn) createTeamBtn.addEventListener('click', openCreateTeamModal);
    if (closeCreateTeamModalBtn) closeCreateTeamModalBtn.addEventListener('click', closeCreateTeamModal);
    if (createTeamForm) createTeamForm.addEventListener('submit', handleCreateTeam);
    
    // Filtri giocatori
    const searchPlayersInput = document.getElementById('searchPlayersInput');
    const filterRole = document.getElementById('filterRole');
    const filterPlatform = document.getElementById('filterPlatform');
    const filterNationality = document.getElementById('filterNationality');
    const filterMinLevel = document.getElementById('filterMinLevel');
    const filterMaxLevel = document.getElementById('filterMaxLevel');
    const resetPlayerFiltersBtn = document.getElementById('resetPlayerFilters');
    
    if (searchPlayersInput) searchPlayersInput.addEventListener('input', filterPlayers);
    if (filterRole) filterRole.addEventListener('change', filterPlayers);
    if (filterPlatform) filterPlatform.addEventListener('change', filterPlayers);
    if (filterNationality) filterNationality.addEventListener('input', filterPlayers);
    if (filterMinLevel) filterMinLevel.addEventListener('input', filterPlayers);
    if (filterMaxLevel) filterMaxLevel.addEventListener('input', filterPlayers);
    if (resetPlayerFiltersBtn) resetPlayerFiltersBtn.addEventListener('click', resetPlayerFilters);
    
    // Filtri squadre
    const searchTeamsInput = document.getElementById('searchTeamsInput');
    const filterTeamPlatform = document.getElementById('filterTeamPlatform');
    const filterTeamNationality = document.getElementById('filterTeamNationality');
    const filterLookingOnly = document.getElementById('filterLookingOnly');
    const resetTeamFiltersBtn = document.getElementById('resetTeamFilters');
    
    if (searchTeamsInput) searchTeamsInput.addEventListener('input', filterTeams);
    if (filterTeamPlatform) filterTeamPlatform.addEventListener('change', filterTeams);
    if (filterTeamNationality) filterTeamNationality.addEventListener('input', filterTeams);
    if (filterLookingOnly) filterLookingOnly.addEventListener('change', filterTeams);
    if (resetTeamFiltersBtn) resetTeamFiltersBtn.addEventListener('click', resetTeamFilters);
    
    // Modal close
    const closePlayerDetailModalBtn = document.getElementById('closePlayerDetailModal');
    const closeTeamDetailModalBtn = document.getElementById('closeTeamDetailModal');
    const closeFeedbackModalBtn = document.getElementById('closeFeedbackModal');
    
    if (closePlayerDetailModalBtn) closePlayerDetailModalBtn.addEventListener('click', closePlayerDetailModal);
    if (closeTeamDetailModalBtn) closeTeamDetailModalBtn.addEventListener('click', closeTeamDetailModal);
    if (closeFeedbackModalBtn) closeFeedbackModalBtn.addEventListener('click', closeFeedbackModal);
    
    // Feedback
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) feedbackForm.addEventListener('submit', handleFeedbackSubmit);
    
    // Richieste tabs
    const requestTabs = document.querySelectorAll('.tab-btn');
    requestTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.dataset.tab;
            switchRequestsTab(tabType);
        });
    });
    
    // Navigazione
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-page');
            if (page) navigateTo(page);
        });
    });
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    console.log('✅ Event listeners configurati');
}

// ============================================
// 🚀 INIZIALIZZAZIONE APP
// ============================================

/**
 * 🚀 Inizializza applicazione
 */
async function initApp() {
    console.log('🚀 Inizializzazione Pro Club Hub v2.0...');
    
    setupEventListeners();
    
    const isAuthenticated = await checkAuth();
    
    const urlParams = new URLSearchParams(window.location.search);
    const shareType = urlParams.get('type');
    const shareId = urlParams.get('id');
    
    if (shareType && shareId) {
        if (shareType === 'player') {
            viewPlayerDetail(shareId);
        } else if (shareType === 'team') {
            viewTeamDetail(shareId);
        }
    }
    
    navigateTo('home');
    
    console.log('✅ App inizializzata', {
        autenticato: isAuthenticated,
        utente: currentUser?.username
    });
}

// ============================================
// 🎬 AVVIO APPLICAZIONE
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

console.log('📦 Pro Club Hub App.js v2.0 - COMPLETO caricato');
