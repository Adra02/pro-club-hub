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
 * ⏳ Mostra loader
 */
function showLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) loader.style.display = 'flex';
}

/**
 * ✅ Nascondi loader
 */
function hideLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) loader.style.display = 'none';
}

/**
 * 🔐 Verifica se l'utente è autenticato
 */
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        currentUser = null;
        updateUIForGuest();
        return false;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            console.log('✅ Utente autenticato:', currentUser);
            updateUIForAuthenticatedUser();
            
            // Carica badge richieste se utente ha squadra
            if (currentUser.team) {
                loadRequestsBadge();
            }
            
            return true;
        } else {
            localStorage.removeItem('token');
            currentUser = null;
            updateUIForGuest();
            return false;
        }
    } catch (error) {
        console.error('❌ Errore verifica autenticazione:', error);
        return false;
    }
}

/**
 * 🎨 Aggiorna UI per utente ospite
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
        document.getElementById('heroUsername').textContent = currentUser.username;
        document.getElementById('heroLevel').textContent = currentUser.level || 'N/A';
    }
    
    // Mostra nav per utenti autenticati
    document.getElementById('favoritesNavBtn').style.display = 'block';
    document.getElementById('requestsNavBtn').style.display = 'block';
    document.getElementById('profileNavBtn').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'block';
    
    // Mostra admin nav solo per admin
    if (currentUser.role === 'admin') {
        document.getElementById('adminNavBtn').style.display = 'block';
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
// 🔐 AUTENTICAZIONE
// ============================================

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
            closeLoginModal();
            navigateTo('profile');
        } else {
            showNotification(data.message || 'Errore durante il login', 'error');
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
            showNotification('Registrazione completata! Completa il tuo profilo.', 'success');
            updateUIForAuthenticatedUser();
            closeRegisterModal();
            navigateTo('profile');
        } else {
            showNotification(data.message || 'Errore durante la registrazione', 'error');
        }
    } catch (error) {
        console.error('❌ Errore registrazione:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🔑 Mostra modal recupero password
 */
function showRecoverPasswordModal() {
    closeLoginModal();
    document.getElementById('recoverPasswordModal').classList.add('active');
}

/**
 * ❌ Chiudi modal recupero password
 */
function closeRecoverPasswordModal() {
    document.getElementById('recoverPasswordModal').classList.remove('active');
}

/**
 * 📧 Gestione recupero password
 */
async function handleRecoverPassword(e) {
    e.preventDefault();
    showLoading();
    
    const email = document.getElementById('recoverEmail').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Email di reset inviata! Controlla la tua casella.', 'success');
            closeRecoverPasswordModal();
        } else {
            showNotification(data.message || 'Errore durante il reset', 'error');
        }
    } catch (error) {
        console.error('❌ Errore reset password:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 📝 Mostra modal login
 */
function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}

/**
 * ❌ Chiudi modal login
 */
function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
}

/**
 * 📝 Mostra modal registrazione
 */
function showRegisterModal() {
    document.getElementById('registerModal').classList.add('active');
}

/**
 * ❌ Chiudi modal registrazione
 */
function closeRegisterModal() {
    document.getElementById('registerModal').classList.remove('active');
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
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profilePrimaryRole').textContent = user.primaryRole || 'Non specificato';
    document.getElementById('profilePlatform').textContent = user.platform || 'Non specificata';
    document.getElementById('profileNationality').textContent = user.nationality || 'Non specificata';
    document.getElementById('profileLevel').textContent = user.level || 'Non specificato';
    
    const secondaryRoles = user.secondaryRoles && user.secondaryRoles.length > 0 
        ? user.secondaryRoles.join(', ') 
        : 'Nessuno';
    document.getElementById('profileSecondaryRoles').textContent = secondaryRoles;
    
    document.getElementById('profileBio').textContent = user.bio || 'Nessuna descrizione';
    document.getElementById('profileLookingForTeam').textContent = user.lookingForTeam ? '✅ Sì' : '❌ No';
    
    const instagram = user.instagram 
        ? `<a href="https://instagram.com/${user.instagram}" target="_blank">@${user.instagram}</a>` 
        : 'Non aggiunto';
    const tiktok = user.tiktok 
        ? `<a href="https://tiktok.com/@${user.tiktok}" target="_blank">@${user.tiktok}</a>` 
        : 'Non aggiunto';
    
    document.getElementById('profileInstagram').innerHTML = instagram;
    document.getElementById('profileTiktok').innerHTML = tiktok;
    
    loadProfileFeedback(user._id);
    checkProfileCompletionAlert();
}

/**
 * ⚠️ Controlla e mostra alert profilo incompleto
 */
function checkProfileCompletionAlert() {
    const isComplete = isProfileComplete();
    const alert = document.getElementById('profileIncompleteAlert');
    
    if (alert) {
        alert.style.display = isComplete ? 'none' : 'block';
    }
}

/**
 * ✅ Verifica se il profilo è completo
 */
function isProfileComplete() {
    if (!currentUser) return false;
    
    const hasSecondaryRole = currentUser.secondaryRoles && currentUser.secondaryRoles.length > 0;
    const hasSocial = currentUser.instagram || currentUser.tiktok;
    
    return hasSecondaryRole && hasSocial;
}

/**
 * 📊 Carica feedback profilo
 */
async function loadProfileFeedback(userId) {
    try {
        const response = await fetch(`${API_BASE}/feedback?userId=${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayProfileFeedback(data.feedback);
        }
    } catch (error) {
        console.error('❌ Errore caricamento feedback:', error);
    }
}

/**
 * 🖼️ Mostra feedback profilo
 */
function displayProfileFeedback(feedback) {
    const container = document.getElementById('profileFeedbackList');
    if (!container) return;
    
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

/**
 * 📝 Mostra modal modifica profilo
 */
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
    
    document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]').forEach(cb => {
        cb.checked = currentUser.secondaryRoles && currentUser.secondaryRoles.includes(cb.value);
    });
    
    document.getElementById('editProfileModal').classList.add('active');
}

/**
 * ❌ Chiudi modal modifica profilo
 */
function closeEditProfileModal() {
    document.getElementById('editProfileModal').classList.remove('active');
}

/**
 * 🔄 Gestione selezione ruoli secondari (max 2)
 */
function handleSecondaryRoleChange(event) {
    const checkboxes = document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]:checked');
    
    if (checkboxes.length > 2) {
        event.target.checked = false;
        showNotification('Puoi selezionare massimo 2 ruoli secondari', 'warning');
    }
}

/**
 * 💾 Salva modifiche profilo
 */
async function handleEditProfile(e) {
    e.preventDefault();
    showLoading();
    
    const secondaryRoles = [];
    document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]:checked').forEach(cb => {
        secondaryRoles.push(cb.value);
    });
    
    const profileData = {
        username: document.getElementById('editUsername').value,
        primaryRole: document.getElementById('editPrimaryRole').value,
        platform: document.getElementById('editPlatform').value,
        nationality: document.getElementById('editNationality').value,
        level: parseInt(document.getElementById('editLevel').value),
        secondaryRoles: secondaryRoles,
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
            currentUser = { ...currentUser, ...updatedUser };
            showNotification('Profilo aggiornato con successo!', 'success');
            closeEditProfileModal();
            loadUserProfile();
        } else {
            const data = await response.json();
            showNotification(data.message || 'Errore durante l\'aggiornamento', 'error');
        }
    } catch (error) {
        console.error('❌ Errore aggiornamento profilo:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🔗 Condividi profilo
 */
function shareProfile(type, id, name) {
    const shareUrl = `${window.location.origin}/share.html?type=${type}&id=${id}`;
    
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
            allPlayers = await response.json();
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
    
    if (players.length === 0) {
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
                    <h3>${player.username}</h3>
                    <p class="player-role">
                        <i class="fas fa-star"></i> ${player.primaryRole}
                        ${player.secondaryRoles && player.secondaryRoles.length > 0 
                            ? ` | ${player.secondaryRoles.join(', ')}` 
                            : ''}
                    </p>
                </div>
                ${currentUser ? `
                    <button onclick="toggleFavorite('${player._id}', 'player')" class="btn-favorite ${isFavorite(player._id, 'player') ? 'active' : ''}">
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
            ${player.bio ? `<p class="player-bio">${player.bio}</p>` : ''}
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
    document.getElementById('searchPlayersInput').value = '';
    document.getElementById('filterRole').value = '';
    document.getElementById('filterPlatform').value = '';
    document.getElementById('filterNationality').value = '';
    document.getElementById('filterMinLevel').value = GLOBAL_MIN_LEVEL;
    document.getElementById('filterMaxLevel').value = GLOBAL_MAX_LEVEL;
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
                    <h2>${player.username}</h2>
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
            
            ${player.bio ? `<div class="detail-bio"><p>${player.bio}</p></div>` : ''}
            
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
                    <p>${team.name} - ${team.platform}</p>
                </div>
            ` : ''}
            
            ${stats && stats.totalFeedbacks > 0 ? `
                <div class="detail-stats">
                    <h4><i class="fas fa-star"></i> Statistiche Feedback</h4>
                    <p>Media: ${stats.averageRating.toFixed(1)}/5 (${stats.totalFeedbacks} feedback)</p>
                    ${stats.topTags && stats.topTags.length > 0 ? `
                        <div class="stats-tags">
                            ${stats.topTags.map(t => `<span class="tag">${t.tag} (${t.count})</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
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
            
            ${feedbacks && feedbacks.length > 0 ? `
                <div class="detail-feedback">
                    <h4><i class="fas fa-comments"></i> Feedback Ricevuti (${feedbacks.length})</h4>
                    ${feedbacks.map(fb => `
                        <div class="feedback-item">
                            <div class="feedback-header">
                                <span><i class="fas fa-user-circle"></i> ${fb.fromUsername}</span>
                                <div class="feedback-rating">
                                    ${'<i class="fas fa-star"></i>'.repeat(fb.rating)}
                                    ${'<i class="far fa-star"></i>'.repeat(5 - fb.rating)}
                                </div>
                            </div>
                            ${fb.tags && fb.tags.length > 0 ? `
                                <div class="feedback-tags">
                                    ${fb.tags.map(tag => `<span class="feedback-tag">${tag}</span>`).join('')}
                                </div>
                            ` : ''}
                            ${fb.comment ? `<p class="feedback-comment">${fb.comment}</p>` : ''}
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
            allTeams = await response.json();
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
    
    if (teams.length === 0) {
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
                    <h3>${team.name}</h3>
                    <p class="team-platform"><i class="fas fa-gamepad"></i> ${team.platform}</p>
                </div>
                ${currentUser ? `
                    <button onclick="toggleFavorite('${team._id}', 'team')" class="btn-favorite ${isFavorite(team._id, 'team') ? 'active' : ''}">
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
            ${team.description ? `<p class="team-description">${team.description}</p>` : ''}
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
    document.getElementById('searchTeamsInput').value = '';
    document.getElementById('filterTeamPlatform').value = '';
    document.getElementById('filterTeamNationality').value = '';
    const lookingOnlyCheckbox = document.getElementById('filterLookingOnly');
    if (lookingOnlyCheckbox) lookingOnlyCheckbox.checked = false;
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
                    <h2>${team.name}</h2>
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
                    <span>${team.membersCount}/${team.maxMembers || 11} membri</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-flag"></i>
                    <span>${team.nationality || 'Internazionale'}</span>
                </div>
                ${team.lookingForPlayers ? '<div class="info-item looking-players"><i class="fas fa-search"></i><span>Cercano giocatori</span></div>' : ''}
            </div>
            
            ${team.description ? `<div class="detail-bio"><p>${team.description}</p></div>` : ''}
            
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
                                <span>${m.username}</span>
                                <span class="member-role">${m.primaryRole}</span>
                                ${m.isCaptain ? '<span class="member-badge captain">👑</span>' : ''}
                                ${m.isViceCaptain ? '<span class="member-badge vice">⭐</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${stats && stats.totalFeedbacks > 0 ? `
                <div class="detail-stats">
                    <h4><i class="fas fa-star"></i> Statistiche Feedback</h4>
                    <p>Media: ${stats.averageRating.toFixed(1)}/5 (${stats.totalFeedbacks} feedback)</p>
                    ${stats.topTags && stats.topTags.length > 0 ? `
                        <div class="stats-tags">
                            ${stats.topTags.map(t => `<span class="tag">${t.tag} (${t.count})</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            ${currentUser ? `
                <div class="detail-actions">
                    ${!userInTeam(team._id) && canRequestJoin() ? `
                        <button class="btn btn-primary" onclick="requestJoinTeam('${team._id}'); closeTeamDetailModal();">
                            <i class="fas fa-paper-plane"></i> Richiedi Accesso
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="openFeedbackModal(null, '${team._id}')">
                        <i class="fas fa-star"></i> Lascia Feedback
                    </button>
                    <button class="btn btn-secondary" onclick="shareProfile('team', '${team._id}', '${team.name}')">
                        <i class="fas fa-share-alt"></i> Condividi
                    </button>
                </div>
            ` : ''}
            
            ${feedbacks && feedbacks.length > 0 ? `
                <div class="detail-feedback">
                    <h4><i class="fas fa-comments"></i> Feedback Ricevuti (${feedbacks.length})</h4>
                    ${feedbacks.map(fb => `
                        <div class="feedback-item">
                            <div class="feedback-header">
                                <span><i class="fas fa-user-circle"></i> ${fb.fromUsername}</span>
                                <div class="feedback-rating">
                                    ${'<i class="fas fa-star"></i>'.repeat(fb.rating)}
                                    ${'<i class="far fa-star"></i>'.repeat(5 - fb.rating)}
                                </div>
                            </div>
                            ${fb.tags && fb.tags.length > 0 ? `
                                <div class="feedback-tags">
                                    ${fb.tags.map(tag => `<span class="feedback-tag">${tag}</span>`).join('')}
                                </div>
                            ` : ''}
                            ${fb.comment ? `<p class="feedback-comment">${fb.comment}</p>` : ''}
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
 * 📝 Mostra modal crea squadra
 */
function showCreateTeamModal() {
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
    
    document.getElementById('createTeamModal').classList.add('active');
}

/**
 * ❌ Chiudi modal crea squadra
 */
function closeCreateTeamModal() {
    document.getElementById('createTeamModal').classList.remove('active');
}

/**
 * 💾 Crea squadra
 */
async function handleCreateTeam(e) {
    e.preventDefault();
    showLoading();
    
    const teamData = {
        name: document.getElementById('createTeamName').value,
        platform: document.getElementById('createTeamPlatform').value,
        nationality: document.getElementById('createTeamNationality').value,
        description: document.getElementById('createTeamDescription').value,
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
            const newTeam = await response.json();
            currentUser.team = newTeam._id;
            showNotification('Squadra creata con successo!', 'success');
            closeCreateTeamModal();
            navigateTo('teams');
            loadTeams();
        } else {
            const data = await response.json();
            showNotification(data.message || 'Errore durante la creazione della squadra', 'error');
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
        const response = await fetch(`${API_BASE}/teams/${teamId}/request`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            showNotification('Richiesta inviata con successo!', 'success');
        } else {
            const data = await response.json();
            showNotification(data.message || 'Errore durante l\'invio della richiesta', 'error');
        }
    } catch (error) {
        console.error('❌ Errore invio richiesta:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}


// ============================================
// ⭐ SISTEMA FEEDBACK
// ============================================

/**
 * 📝 Mostra modal feedback
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
    document.getElementById('feedbackComment').value = '';
    
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
        };
    });
}

/**
 * 🏷️ Setup sistema selezione tag
 */
function setupTagSelection() {
    const tagContainer = document.getElementById('tagSelector');
    if (!tagContainer) return;
    
    const tagButtons = tagContainer.querySelectorAll('.tag-btn');
    
    tagButtons.forEach(btn => {
        btn.classList.remove('active');
        
        btn.onclick = () => {
            const tag = btn.getAttribute('data-tag');
            
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                selectedFeedbackTags = selectedFeedbackTags.filter(t => t !== tag);
            } else {
                btn.classList.add('active');
                selectedFeedbackTags.push(tag);
            }
        };
    });
}

/**
 * 💾 Invia feedback
 */
async function handleSubmitFeedback(e) {
    e.preventDefault();
    showLoading();
    
    const userId = document.getElementById('feedbackTargetUserId').value;
    const teamId = document.getElementById('feedbackTargetTeamId').value;
    const comment = document.getElementById('feedbackComment').value;
    
    if (!userId && !teamId) {
        showNotification('Errore: target non specificato', 'error');
        hideLoading();
        return;
    }
    
    const feedbackData = {
        targetType: userId ? 'player' : 'team',
        targetId: userId || teamId,
        rating: feedbackRating,
        tags: selectedFeedbackTags,
        comment: comment
    };
    
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
            showNotification(data.message || 'Errore durante l\'invio del feedback', 'error');
        }
    } catch (error) {
        console.error('❌ Errore invio feedback:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
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
        const receivedResponse = await fetch(`${API_BASE}/teams/requests/received`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (receivedResponse.ok) {
            const receivedRequests = await receivedResponse.json();
            displayReceivedRequests(receivedRequests);
        }
        
        const sentResponse = await fetch(`${API_BASE}/teams/requests/sent`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (sentResponse.ok) {
            const sentRequests = await sentResponse.json();
            displaySentRequests(sentRequests);
        }
        
        loadRequestsBadge();
        
    } catch (error) {
        console.error('❌ Errore caricamento richieste:', error);
        showNotification('Errore nel caricamento delle richieste', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 📊 Mostra richieste ricevute
 */
function displayReceivedRequests(requests) {
    const container = document.getElementById('receivedRequestsContainer');
    if (!container) return;
    
    if (requests.length === 0) {
        container.innerHTML = '<p class="no-results">Nessuna richiesta ricevuta</p>';
        return;
    }
    
    container.innerHTML = requests.map(req => `
        <div class="request-card ${req.status}">
            <div class="request-header">
                <div class="request-user">
                    <i class="fas fa-user-circle"></i>
                    <strong>${req.user?.username || 'Utente'}</strong>
                </div>
                <span class="request-status status-${req.status}">${getStatusLabel(req.status)}</span>
            </div>
            <div class="request-info">
                <p><i class="fas fa-shield-alt"></i> ${req.team?.name || 'Squadra'}</p>
                <p class="request-date"><i class="fas fa-calendar"></i> ${new Date(req.createdAt).toLocaleDateString()}</p>
            </div>
            ${req.status === 'pending' ? `
                <div class="request-actions">
                    <button onclick="handleRequestAction('${req._id}', 'approve')" class="btn btn-success">
                        <i class="fas fa-check"></i> Approva
                    </button>
                    <button onclick="handleRequestAction('${req._id}', 'reject')" class="btn btn-danger">
                        <i class="fas fa-times"></i> Rifiuta
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

/**
 * 📊 Mostra richieste inviate
 */
function displaySentRequests(requests) {
    const container = document.getElementById('sentRequestsContainer');
    if (!container) return;
    
    if (requests.length === 0) {
        container.innerHTML = '<p class="no-results">Nessuna richiesta inviata</p>';
        return;
    }
    
    container.innerHTML = requests.map(req => `
        <div class="request-card ${req.status}">
            <div class="request-header">
                <div class="request-team">
                    <i class="fas fa-shield-alt"></i>
                    <strong>${req.team?.name || 'Squadra'}</strong>
                </div>
                <span class="request-status status-${req.status}">${getStatusLabel(req.status)}</span>
            </div>
            <div class="request-info">
                <p class="request-date"><i class="fas fa-calendar"></i> ${new Date(req.createdAt).toLocaleDateString()}</p>
            </div>
        </div>
    `).join('');
}

/**
 * 🏷️ Ottieni label stato richiesta
 */
function getStatusLabel(status) {
    const labels = {
        'pending': '⏳ In attesa',
        'approved': '✅ Approvata',
        'rejected': '❌ Rifiutata'
    };
    return labels[status] || status;
}

/**
 * ✅ Gestione azione richiesta
 */
async function handleRequestAction(requestId, action) {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/teams/requests/${requestId}/${action}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            showNotification(
                action === 'approve' ? 'Richiesta approvata!' : 'Richiesta rifiutata',
                'success'
            );
            loadRequests();
        } else {
            const data = await response.json();
            showNotification(data.message || `Errore durante ${action}`, 'error');
        }
    } catch (error) {
        console.error(`❌ Errore ${action} richiesta:`, error);
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
            const updatedUser = await response.json();
            currentUser = updatedUser;
            showNotification(
                isFav ? 'Rimosso dai preferiti' : 'Aggiunto ai preferiti',
                'success'
            );
            
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
    if (!currentUser || !currentUser.favorites) return false;
    return currentUser.favorites.some(
        fav => fav.targetId === targetId && fav.targetType === targetType
    );
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
    
    const favoritePlayers = favorites.filter(f => f.targetType === 'player');
    const favoriteTeams = favorites.filter(f => f.targetType === 'team');
    
    if (favoritePlayers.length === 0) {
        playersContainer.innerHTML = '<p class="no-results">Nessun giocatore nei preferiti</p>';
    } else {
        playersContainer.innerHTML = favoritePlayers.map(fav => `
            <div class="favorite-card">
                <div class="favorite-header">
                    <i class="fas fa-user-circle"></i>
                    <h4>${fav.details?.username || 'Giocatore'}</h4>
                </div>
                <p>${fav.details?.primaryRole || ''} - ${fav.details?.platform || ''}</p>
                <div class="favorite-actions">
                    <button onclick="viewPlayerDetail('${fav.targetId}')" class="btn btn-primary">
                        <i class="fas fa-eye"></i> Vedi
                    </button>
                    <button onclick="toggleFavorite('${fav.targetId}', 'player')" class="btn btn-danger">
                        <i class="fas fa-heart-broken"></i> Rimuovi
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    if (favoriteTeams.length === 0) {
        teamsContainer.innerHTML = '<p class="no-results">Nessuna squadra nei preferiti</p>';
    } else {
        teamsContainer.innerHTML = favoriteTeams.map(fav => `
            <div class="favorite-card">
                <div class="favorite-header">
                    <i class="fas fa-shield-alt"></i>
                    <h4>${fav.details?.name || 'Squadra'}</h4>
                </div>
                <p>${fav.details?.platform || ''}</p>
                <div class="favorite-actions">
                    <button onclick="viewTeamDetail('${fav.targetId}')" class="btn btn-primary">
                        <i class="fas fa-eye"></i> Vedi
                    </button>
                    <button onclick="toggleFavorite('${fav.targetId}', 'team')" class="btn btn-danger">
                        <i class="fas fa-heart-broken"></i> Rimuovi
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// ============================================
// 👑 PANNELLO ADMIN
// ============================================

/**
 * 📊 Carica pannello admin
 */
async function loadAdminPanel() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Accesso negato', 'error');
        navigateTo('home');
        return;
    }
    
    console.log('🔧 Caricamento pannello admin...');
    showLoading();
    
    try {
        const statsResponse = await fetch(`${API_BASE}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            displayAdminStats(stats);
        }
        
        await loadAllUsers();
        
    } catch (error) {
        console.error('❌ Errore caricamento pannello admin:', error);
        showNotification('Errore nel caricamento del pannello admin', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 📊 Mostra statistiche admin
 */
function displayAdminStats(stats) {
    const container = document.getElementById('adminStats');
    if (!container) return;
    
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-users"></i></div>
            <div class="stat-info">
                <h3>${stats.totalUsers || 0}</h3>
                <p>Utenti Totali</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-user-check"></i></div>
            <div class="stat-info">
                <h3>${stats.activeUsers || 0}</h3>
                <p>Utenti Attivi</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-shield-alt"></i></div>
            <div class="stat-info">
                <h3>${stats.totalTeams || 0}</h3>
                <p>Squadre Totali</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-star"></i></div>
            <div class="stat-info">
                <h3>${stats.totalFeedbacks || 0}</h3>
                <p>Feedback Totali</p>
            </div>
        </div>
    `;
}

/**
 * 👥 Carica tutti gli utenti (admin)
 */
async function loadAllUsers() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            renderUsersList(users);
        }
    } catch (error) {
        console.error('❌ Errore caricamento utenti:', error);
        showNotification('Errore nel caricamento degli utenti', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🖼️ Mostra lista utenti (admin)
 */
function renderUsersList(users) {
    const container = document.getElementById('adminUsersList');
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = '<p class="no-results">Nessun utente trovato</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="users-table-container">
            <table class="users-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Ruolo</th>
                        <th>Stato</th>
                        <th>Data Registrazione</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.username}</td>
                            <td>${user.email}</td>
                            <td>${user.primaryRole || 'N/A'}</td>
                            <td>
                                <span class="status-badge ${user.suspended ? 'suspended' : 'active'}">
                                    ${user.suspended ? '🚫 Sospeso' : '✅ Attivo'}
                                </span>
                            </td>
                            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                            <td class="actions-cell">
                                ${!user.suspended ? `
                                    <button onclick="suspendUser('${user._id}')" class="btn btn-sm btn-warning" title="Sospendi">
                                        <i class="fas fa-ban"></i>
                                    </button>
                                ` : `
                                    <button onclick="unsuspendUser('${user._id}')" class="btn btn-sm btn-success" title="Riabilita">
                                        <i class="fas fa-check"></i>
                                    </button>
                                `}
                                <button onclick="deleteUser('${user._id}', '${user.username}')" class="btn btn-sm btn-danger" title="Elimina">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * 🚫 Sospendi utente
 */
async function suspendUser(userId) {
    if (!confirm('Sei sicuro di voler sospendere questo utente?')) return;
    
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
            const data = await response.json();
            showNotification(data.message || 'Errore durante la sospensione', 'error');
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
            const data = await response.json();
            showNotification(data.message || 'Errore durante la riabilitazione', 'error');
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
            const data = await response.json();
            showNotification(data.message || 'Errore durante l\'eliminazione', 'error');
        }
    } catch (error) {
        console.error('❌ Errore eliminazione utente:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🗑️ Elimina tutte le squadre
 */
async function handleDeleteAllTeams() {
    if (!confirm('⚠️ ATTENZIONE! Questa azione eliminerà TUTTE le squadre. Sei sicuro?')) return;
    if (!confirm('Confermi di voler eliminare TUTTE le squadre? Questa azione è IRREVERSIBILE!')) return;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/admin/delete-teams`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            showNotification(data.message || 'Tutte le squadre sono state eliminate', 'success');
            loadAdminPanel();
        } else {
            const data = await response.json();
            showNotification(data.message || 'Errore durante l\'eliminazione', 'error');
        }
    } catch (error) {
        console.error('❌ Errore eliminazione squadre:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🔄 Reset profili inattivi
 */
async function handleResetProfiles() {
    if (!confirm('Questa azione resetterà i profili degli utenti inattivi. Continuare?')) return;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/admin/reset-profiles`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            showNotification(data.message || 'Profili resetati con successo', 'success');
            loadAllUsers();
        } else {
            const data = await response.json();
            showNotification(data.message || 'Errore durante il reset', 'error');
        }
    } catch (error) {
        console.error('❌ Errore reset profili:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 📧 Invia newsletter
 */
async function handleNewsletterSubmit(e) {
    e.preventDefault();
    showLoading();
    
    const subject = document.getElementById('newsletterSubject').value;
    const message = document.getElementById('newsletterMessage').value;
    
    try {
        const response = await fetch(`${API_BASE}/admin/newsletter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ subject, message })
        });
        
        if (response.ok) {
            const data = await response.json();
            showNotification(data.message || 'Newsletter inviata con successo!', 'success');
            document.getElementById('newsletterForm').reset();
        } else {
            const data = await response.json();
            showNotification(data.message || 'Errore durante l\'invio', 'error');
        }
    } catch (error) {
        console.error('❌ Errore invio newsletter:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// 🎯 EVENT LISTENERS
// ============================================

/**
 * 🎧 Setup event listeners
 */
function setupEventListeners() {
    console.log('🎧 Setup event listeners...');
    
    // Hero buttons
    const heroLoginBtn = document.getElementById('heroLoginBtn');
    const heroRegisterBtn = document.getElementById('heroRegisterBtn');
    if (heroLoginBtn) heroLoginBtn.addEventListener('click', showLoginModal);
    if (heroRegisterBtn) heroRegisterBtn.addEventListener('click', showRegisterModal);
    
    // Auth forms
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const recoverPasswordForm = document.getElementById('recoverPasswordForm');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (recoverPasswordForm) recoverPasswordForm.addEventListener('submit', handleRecoverPassword);
    
    // Modal buttons
    const closeLoginModalBtn = document.getElementById('closeLoginModal');
    const closeRegisterModalBtn = document.getElementById('closeRegisterModal');
    const closeRecoverModalBtn = document.getElementById('closeRecoverPasswordModal');
    const showRecoverBtn = document.getElementById('showRecoverPassword');
    
    if (closeLoginModalBtn) closeLoginModalBtn.addEventListener('click', closeLoginModal);
    if (closeRegisterModalBtn) closeRegisterModalBtn.addEventListener('click', closeRegisterModal);
    if (closeRecoverModalBtn) closeRecoverModalBtn.addEventListener('click', closeRecoverPasswordModal);
    if (showRecoverBtn) showRecoverBtn.addEventListener('click', showRecoverPasswordModal);
    
    // Profile
    const editProfileBtn = document.getElementById('editProfileBtn');
    const closeEditProfileBtn = document.getElementById('closeEditProfileModal');
    const editProfileForm = document.getElementById('editProfileForm');
    
    if (editProfileBtn) editProfileBtn.addEventListener('click', openEditProfileModal);
    if (closeEditProfileBtn) closeEditProfileBtn.addEventListener('click', closeEditProfileModal);
    if (editProfileForm) editProfileForm.addEventListener('submit', handleEditProfile);
    
    document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', handleSecondaryRoleChange);
    });
    
    // Teams
    const createTeamBtn = document.getElementById('createTeamBtn');
    const closeCreateTeamBtn = document.getElementById('closeCreateTeamModal');
    const createTeamForm = document.getElementById('createTeamForm');
    
    if (createTeamBtn) createTeamBtn.addEventListener('click', showCreateTeamModal);
    if (closeCreateTeamBtn) closeCreateTeamBtn.addEventListener('click', closeCreateTeamModal);
    if (createTeamForm) createTeamForm.addEventListener('submit', handleCreateTeam);
    
    // Feedback
    const closeFeedbackBtn = document.getElementById('closeFeedbackModal');
    const feedbackForm = document.getElementById('feedbackForm');
    
    if (closeFeedbackBtn) closeFeedbackBtn.addEventListener('click', closeFeedbackModal);
    if (feedbackForm) feedbackForm.addEventListener('submit', handleSubmitFeedback);
    
    // Detail modals
    const closePlayerDetailBtn = document.getElementById('closePlayerDetailModal');
    const closeTeamDetailBtn = document.getElementById('closeTeamDetailModal');
    
    if (closePlayerDetailBtn) closePlayerDetailBtn.addEventListener('click', closePlayerDetailModal);
    if (closeTeamDetailBtn) closeTeamDetailBtn.addEventListener('click', closeTeamDetailModal);
    
    // Filters
    const filterPlayerBtn = document.getElementById('filterPlayerBtn');
    const resetPlayerFiltersBtn = document.getElementById('resetPlayerFiltersBtn');
    const filterTeamBtn = document.getElementById('filterTeamBtn');
    const resetTeamFiltersBtn = document.getElementById('resetTeamFiltersBtn');
    
    if (filterPlayerBtn) filterPlayerBtn.addEventListener('click', filterPlayers);
    if (resetPlayerFiltersBtn) resetPlayerFiltersBtn.addEventListener('click', resetPlayerFilters);
    if (filterTeamBtn) filterTeamBtn.addEventListener('click', filterTeams);
    if (resetTeamFiltersBtn) resetTeamFiltersBtn.addEventListener('click', resetTeamFilters);
    
    // Real-time search
    const searchPlayersInput = document.getElementById('searchPlayersInput');
    const searchTeamsInput = document.getElementById('searchTeamsInput');
    
    if (searchPlayersInput) searchPlayersInput.addEventListener('input', filterPlayers);
    if (searchTeamsInput) searchTeamsInput.addEventListener('input', filterTeams);
    
    // Admin
    const deleteAllTeamsBtn = document.getElementById('deleteAllTeamsBtn');
    const resetProfilesBtn = document.getElementById('resetProfilesBtn');
    const newsletterForm = document.getElementById('newsletterForm');
    
    if (deleteAllTeamsBtn) deleteAllTeamsBtn.addEventListener('click', handleDeleteAllTeams);
    if (resetProfilesBtn) resetProfilesBtn.addEventListener('click', handleResetProfiles);
    if (newsletterForm) newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    
    // Navigation
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
