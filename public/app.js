// ============================================
// 🎮 PRO CLUB HUB - APP.JS COMPLETO v2.1
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

/**
 * ❤️ Controlla se è nei preferiti
 */
function isFavorite(targetId, type) {
    if (!currentUser) return false;
    const favorites = type === 'players' ? currentUser.favoritePlayers : currentUser.favoriteTeams;
    return favorites && favorites.some(fav => fav._id === targetId || fav === targetId);
}

// ============================================
// 🔐 AUTENTICAZIONE
// ============================================

/**
 * 📝 Mostra modal login
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
 * 📝 Mostra modal registrazione
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
 * ❌ Chiudi modal auth
 */
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * 🔄 Switcha tra i form del modal auth
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
            showNotification(data.error || 'Errore durante il recupero', 'error');
        }
    } catch (error) {
        console.error('❌ Errore recupero password:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🚪 Logout
 */
function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    updateUIForGuest();
    navigateTo('home');
    showNotification('Logout effettuato con successo', 'success');
}

/**
 * 🎨 Aggiorna UI per utente guest
 */
function updateUIForGuest() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const createTeamBtn = document.getElementById('createTeamBtn');
    
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (createTeamBtn) createTeamBtn.style.display = 'none';
    
    // Nascondi nav items per utenti non autenticati
    const navItems = ['favoritesNav', 'requestsNav', 'profileNav', 'adminNav'];
    navItems.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

/**
 * 🎨 Aggiorna UI per utente autenticato
 */
function updateUIForAuthenticatedUser() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const createTeamBtn = document.getElementById('createTeamBtn');
    
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'block';
    if (usernameDisplay) usernameDisplay.textContent = currentUser.username;
    
    // Mostra/nascondi bottone crea squadra
    if (createTeamBtn) {
        createTeamBtn.style.display = currentUser.profileCompleted && !currentUser.team ? 'block' : 'none';
    }
    
    // Mostra nav items appropriati
    const showItems = ['favoritesNav', 'requestsNav', 'profileNav'];
    showItems.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'block';
    });
    
    // Mostra admin nav se è admin
    const adminNav = document.getElementById('adminNav');
    if (adminNav && currentUser.isAdmin) {
        adminNav.style.display = 'block';
    }
}

// ============================================
// 🧭 NAVIGAZIONE
// ============================================

/**
 * 🧭 Naviga verso una pagina
 */
function navigateTo(page) {
    console.log('🧭 Navigazione verso:', page);
    currentPage = page;
    
    // Nascondi tutte le pagine
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    
    // Rimuovi active da tutti i nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Mostra la pagina richiesta
    const pageElement = document.getElementById(`${page}Page`);
    if (pageElement) {
        pageElement.style.display = 'block';
        
        // Attiva il nav button corrispondente
        const navBtn = document.getElementById(`${page}Nav`);
        if (navBtn) navBtn.classList.add('active');
        
        // Carica i dati specifici della pagina
        switch(page) {
            case 'players':
                loadPlayers();
                break;
            case 'teams':
                loadTeams();
                break;
            case 'favorites':
                if (currentUser) loadFavorites();
                break;
            case 'requests':
                if (currentUser) loadRequests();
                break;
            case 'profile':
                if (currentUser) loadProfile();
                break;
            case 'admin':
                if (currentUser && currentUser.isAdmin) loadAdminPanel();
                break;
        }
    }
}

// ============================================
// 👥 GIOCATORI
// ============================================

/**
 * 📥 Carica lista giocatori
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
                <button onclick="showPlayerDetail('${player._id}')" class="btn btn-primary">
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
 * 👁️ Mostra dettaglio giocatore - NOME CORRETTO
 */
async function showPlayerDetail(playerId) {
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
                    <span>Piattaforma: ${player.platform}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-trophy"></i>
                    <span>Livello: ${player.level}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-flag"></i>
                    <span>Nazionalità: ${player.nationality}</span>
                </div>
                ${team ? `
                    <div class="info-item">
                        <i class="fas fa-shield-alt"></i>
                        <span>Squadra: ${escapeHtml(team.name)}</span>
                    </div>
                ` : ''}
                ${player.bio ? `
                    <div class="info-item">
                        <i class="fas fa-info-circle"></i>
                        <span>${escapeHtml(player.bio)}</span>
                    </div>
                ` : ''}
                ${player.instagram ? `
                    <div class="info-item">
                        <i class="fab fa-instagram"></i>
                        <a href="https://instagram.com/${player.instagram}" target="_blank">@${player.instagram}</a>
                    </div>
                ` : ''}
                ${player.tiktok ? `
                    <div class="info-item">
                        <i class="fab fa-tiktok"></i>
                        <a href="https://tiktok.com/@${player.tiktok}" target="_blank">@${player.tiktok}</a>
                    </div>
                ` : ''}
            </div>
            
            ${feedbacks && feedbacks.length > 0 ? `
                <div class="detail-feedbacks">
                    <h3><i class="fas fa-star"></i> Feedback (${feedbacks.length})</h3>
                    ${feedbacks.map(fb => `
                        <div class="feedback-item">
                            <div class="feedback-header">
                                <span class="feedback-author">${escapeHtml(fb.fromUsername || 'Anonimo')}</span>
                                <span class="feedback-rating">${'⭐'.repeat(fb.rating)}</span>
                            </div>
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

// ============================================
// 🏆 SQUADRE
// ============================================

/**
 * 📥 Carica lista squadre
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
                <p><i class="fas fa-users"></i> Membri: ${team.members?.length || 0}/${team.maxMembers || 11}</p>
                <p><i class="fas fa-flag"></i> ${team.nationality || 'Internazionale'}</p>
                ${team.lookingForPlayers ? '<p class="looking-team"><i class="fas fa-search"></i> Cerca giocatori</p>' : ''}
            </div>
            ${team.description ? `<p class="team-bio">${escapeHtml(team.description)}</p>` : ''}
            <div class="team-actions">
                <button onclick="showTeamDetail('${team._id}')" class="btn btn-primary">
                    <i class="fas fa-eye"></i> Vedi Squadra
                </button>
                ${currentUser && currentUser._id !== team.captain?._id && !currentUser.team ? `
                    <button onclick="requestJoinTeam('${team._id}')" class="btn btn-secondary">
                        <i class="fas fa-user-plus"></i> Richiedi
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

/**
 * 👁️ Mostra dettaglio squadra - NOME CORRETTO
 */
async function showTeamDetail(teamId) {
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
                    <i class="fas fa-flag"></i>
                    <span>Nazionalità: ${team.nationality}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-users"></i>
                    <span>Membri: ${members?.length || 0}/${team.maxMembers || 11}</span>
                </div>
                ${team.description ? `
                    <div class="info-item">
                        <i class="fas fa-info-circle"></i>
                        <span>${escapeHtml(team.description)}</span>
                    </div>
                ` : ''}
                ${team.instagram ? `
                    <div class="info-item">
                        <i class="fab fa-instagram"></i>
                        <a href="https://instagram.com/${team.instagram}" target="_blank">@${team.instagram}</a>
                    </div>
                ` : ''}
                ${team.tiktok ? `
                    <div class="info-item">
                        <i class="fab fa-tiktok"></i>
                        <a href="https://tiktok.com/@${team.tiktok}" target="_blank">@${team.tiktok}</a>
                    </div>
                ` : ''}
                ${team.liveLink ? `
                    <div class="info-item">
                        <i class="fas fa-video"></i>
                        <a href="${team.liveLink}" target="_blank">Live Stream</a>
                    </div>
                ` : ''}
            </div>
            
            ${members && members.length > 0 ? `
                <div class="detail-members">
                    <h3><i class="fas fa-users"></i> Membri (${members.length})</h3>
                    <div class="members-grid">
                        ${members.map(member => `
                            <div class="member-item">
                                <i class="fas fa-user-circle"></i>
                                <span>${escapeHtml(member.username)}</span>
                                <span class="member-role">${member.primaryRole}</span>
                            </div>
                        `).join('')}
                    </div>
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
 * 🔍 Filtra squadre
 */
function filterTeams() {
    const searchQuery = document.getElementById('searchTeamsInput')?.value.toLowerCase() || '';
    const platformFilter = document.getElementById('filterTeamPlatform')?.value;
    const nationalityFilter = document.getElementById('filterTeamNationality')?.value;
    const lookingOnlyCheckbox = document.getElementById('filterLookingOnly');
    
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
 * 📨 Richiedi di entrare in squadra
 */
async function requestJoinTeam(teamId) {
    if (!currentUser) {
        showNotification('Devi essere autenticato', 'error');
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
            loadTeams();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Errore durante l\'invio della richiesta', 'error');
        }
    } catch (error) {
        console.error('❌ Errore richiesta ingresso:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// ❤️ PREFERITI
// ============================================

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
            const data = await response.json();
            displayFavorites(data.favorites);
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
                    <button onclick="showPlayerDetail('${player._id}')" class="btn btn-primary">
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
                    <button onclick="showTeamDetail('${team._id}')" class="btn btn-primary">
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

/**
 * ❤️ Aggiungi/Rimuovi dai preferiti
 */
async function toggleFavorite(targetId, type) {
    if (!currentUser) {
        showNotification('Devi essere autenticato', 'error');
        return;
    }
    
    const isFav = isFavorite(targetId, type);
    const endpoint = isFav ? '/favorites/remove' : '/favorites/add';
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ targetId, targetType: type })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showNotification(isFav ? 'Rimosso dai preferiti' : 'Aggiunto ai preferiti', 'success');
            
            // Aggiorna UI
            if (currentPage === 'players') loadPlayers();
            else if (currentPage === 'teams') loadTeams();
            else if (currentPage === 'favorites') loadFavorites();
        }
    } catch (error) {
        console.error('❌ Errore toggle preferiti:', error);
        showNotification('Errore di connessione', 'error');
    }
}

// ============================================
// 📬 RICHIESTE
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
                <p>${req.playerDetails?.primaryRole || ''} - Lvl ${req.playerDetails?.level || 0}</p>
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
                <p>${req.teamDetails?.platform || ''}</p>
                <p class="request-status">${req.status}</p>
                ${req.status === 'pending' ? `
                    <button onclick="cancelRequest('${req._id}')" class="btn btn-danger">
                        <i class="fas fa-times"></i> Annulla
                    </button>
                ` : ''}
            </div>
        `).join('');
    }
}

/**
 * 📊 Carica badge richieste
 */
async function loadRequestsBadge() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE}/team-requests/count`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const badge = document.getElementById('requestsBadge');
            if (badge && data.count > 0) {
                badge.textContent = data.count;
                badge.style.display = 'block';
            } else if (badge) {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('❌ Errore caricamento badge richieste:', error);
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
// 👤 PROFILO
// ============================================

/**
 * 📥 Carica profilo
 */
async function loadProfile() {
    if (!currentUser) return;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayProfile(data.user, data.team, data.feedbacks);
        }
    } catch (error) {
        console.error('❌ Errore caricamento profilo:', error);
        showNotification('Errore nel caricamento del profilo', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🖼️ Mostra profilo
 */
function displayProfile(user, team, feedbacks) {
    const container = document.getElementById('profileContent');
    if (!container) return;
    
    container.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div>
                <h2>${escapeHtml(user.username)}</h2>
                <p>${user.primaryRole} - ${user.platform}</p>
                ${user.averageRating > 0 ? `<p>⭐ ${user.averageRating.toFixed(1)} (${user.feedbackCount} feedback)</p>` : ''}
            </div>
        </div>
        
        <div class="profile-info">
            <p><i class="fas fa-envelope"></i> ${user.email}</p>
            <p><i class="fas fa-trophy"></i> Livello ${user.level}</p>
            <p><i class="fas fa-flag"></i> ${user.nationality}</p>
            ${team ? `<p><i class="fas fa-shield-alt"></i> Squadra: ${escapeHtml(team.name)}</p>` : ''}
            ${user.bio ? `<p><i class="fas fa-info-circle"></i> ${escapeHtml(user.bio)}</p>` : ''}
        </div>
        
        <div class="profile-actions">
            <button onclick="openEditProfileModal()" class="btn btn-primary">
                <i class="fas fa-edit"></i> Modifica Profilo
            </button>
            <button onclick="shareProfile()" class="btn btn-secondary">
                <i class="fas fa-share-alt"></i> Condividi
            </button>
        </div>
    `;
}

/**
 * 📤 Condividi profilo
 */
function shareProfile() {
    if (!currentUser) return;
    
    const shareUrl = `${window.location.origin}/?type=player&id=${currentUser._id}`;
    
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

/**
 * 🔓 Apri modal modifica profilo
 */
function openEditProfileModal() {
    // Implementazione semplificata
    showNotification('Funzione in sviluppo', 'info');
}

/**
 * ⭐ Apri modal feedback
 */
function openFeedbackModal(playerId, teamId) {
    // Implementazione semplificata
    showNotification('Funzione in sviluppo', 'info');
}

// ============================================
// 👔 ADMIN
// ============================================

/**
 * 📥 Carica pannello admin
 */
async function loadAdminPanel() {
    if (!currentUser || !currentUser.isAdmin) return;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/admin?action=stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayAdminPanel(data.stats);
        }
    } catch (error) {
        console.error('❌ Errore caricamento pannello admin:', error);
        showNotification('Errore nel caricamento del pannello admin', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 🖼️ Mostra pannello admin
 */
function displayAdminPanel(stats) {
    const container = document.getElementById('adminContent');
    if (!container) return;
    
    container.innerHTML = `
        <div class="admin-stats">
            <div class="stat-card">
                <i class="fas fa-users"></i>
                <h3>${stats.totalUsers || 0}</h3>
                <p>Utenti Totali</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-shield-alt"></i>
                <h3>${stats.totalTeams || 0}</h3>
                <p>Squadre Totali</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-clock"></i>
                <h3>${stats.inactiveUsers || 0}</h3>
                <p>Utenti Inattivi</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-envelope"></i>
                <h3>${stats.pendingRequests || 0}</h3>
                <p>Richieste Pending</p>
            </div>
        </div>
    `;
}

/**
 * 🚫 Sospendi utente
 */
async function suspendUser(userId) {
    // Implementazione semplificata
    showNotification('Funzione in sviluppo', 'info');
}

/**
 * ✅ Riabilita utente
 */
async function unsuspendUser(userId) {
    // Implementazione semplificata
    showNotification('Funzione in sviluppo', 'info');
}

/**
 * 🗑️ Elimina utente
 */
async function deleteUser(userId) {
    // Implementazione semplificata
    showNotification('Funzione in sviluppo', 'info');
}

/**
 * 🚪 Lascia squadra
 */
async function leaveTeam() {
    // Implementazione semplificata
    showNotification('Funzione in sviluppo', 'info');
}

/**
 * 👥 Rimuovi membro
 */
async function removeMember(memberId) {
    // Implementazione semplificata
    showNotification('Funzione in sviluppo', 'info');
}

/**
 * 🎖️ Nomina vice capitano
 */
async function setViceCaptain(memberId) {
    // Implementazione semplificata
    showNotification('Funzione in sviluppo', 'info');
}

// ============================================
// 🎧 EVENT LISTENERS
// ============================================

/**
 * ⚙️ Configura tutti gli event listeners
 */
function setupEventListeners() {
    console.log('🎧 Setup event listeners...');
    
    // Hero buttons
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
    
    if (closePlayerDetailModalBtn) closePlayerDetailModalBtn.addEventListener('click', closePlayerDetailModal);
    if (closeTeamDetailModalBtn) closeTeamDetailModalBtn.addEventListener('click', closeTeamDetailModal);
    
    // Richieste tabs
    const requestTabs = document.querySelectorAll('.tab-btn');
    requestTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.dataset.tab;
            switchRequestsTab(tabType);
        });
    });
    
    console.log('✅ Event listeners configurati');
}

// ============================================
// 🚀 INIZIALIZZAZIONE APP
// ============================================

/**
 * 🚀 Inizializza applicazione
 */
async function initApp() {
    console.log('🚀 Inizializzazione Pro Club Hub v2.1...');
    
    setupEventListeners();
    
    const isAuthenticated = await checkAuth();
    
    const urlParams = new URLSearchParams(window.location.search);
    const shareType = urlParams.get('type');
    const shareId = urlParams.get('id');
    
    if (shareType && shareId) {
        if (shareType === 'player') {
            showPlayerDetail(shareId);
        } else if (shareType === 'team') {
            showTeamDetail(shareId);
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

// ============================================
// 🌐 ESPORTA FUNZIONI GLOBALI PER ONCLICK
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
window.closePlayerDetailModal = closePlayerDetailModal;
window.closeTeamDetailModal = closeTeamDetailModal;
window.openEditProfileModal = openEditProfileModal;

console.log('📦 Pro Club Hub App.js v2.1 COMPLETO caricato');
