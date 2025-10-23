cat > /mnt/user-data/outputs/app.js << 'EOFALL'
// ============================================
// PRO CLUB HUB - APP.JS COMPLETO E FUNZIONANTE
// Con: Preferiti, Condivisione, Ricerca, Profili, Team, Feedback, Admin
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

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App inizializzata');
    initApp();
    checkResetToken();
});

async function initApp() {
    populateNationalities();
    setupLanguageSelector();
    updatePageLanguage();
    await loadGlobalLevelLimits();
    checkAuth();
    setupEventListeners();
    navigateTo('home');
}

async function loadGlobalLevelLimits() {
    try {
        const response = await fetch(`${API_BASE}/admin?action=level-settings`);
        if (response.ok) {
            const data = await response.json();
            GLOBAL_MIN_LEVEL = data.minLevel;
            GLOBAL_MAX_LEVEL = data.maxLevel;
            updateLevelInputLimits(data.minLevel, data.maxLevel);
        }
    } catch (error) {
        console.error('Failed to load level limits:', error);
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
}

function calculateLevelPercentage(level) {
    if (GLOBAL_MAX_LEVEL === GLOBAL_MIN_LEVEL) return 100;
    const percentage = ((level - GLOBAL_MIN_LEVEL) / (GLOBAL_MAX_LEVEL - GLOBAL_MIN_LEVEL)) * 100;
    return Math.min(Math.max(percentage, 0), 100);
}

function populateNationalities() {
    const lists = ['nationalitiesList', 'registerNationalitiesList', 'editNationalitiesList', 'teamNationalitiesList', 'teamCreateNationalitiesList'];
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
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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

// ============================================
// PREFERITI - FUNZIONI COMPLETE
// ============================================

async function loadUserFavorites() {
    if (!currentUser) {
        userFavorites = { giocatori: [], squadre: [] };
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/preferiti`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            userFavorites = data.preferiti || { giocatori: [], squadre: [] };
            updateFavoriteIcons();
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

    const favorites = type === 'giocatori' ? userFavorites.giocatori : userFavorites.squadre;
    const isFavorite = favorites.some(item => item._id === targetId);

    try {
        showLoading();

        if (isFavorite) {
            const response = await fetch(`${API_BASE}/preferiti?action=remove`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ targetId, type })
            });

            if (response.ok) {
                if (type === 'giocatori') {
                    userFavorites.giocatori = userFavorites.giocatori.filter(g => g._id !== targetId);
                } else {
                    userFavorites.squadre = userFavorites.squadre.filter(s => s._id !== targetId);
                }
                showNotification('💔 Rimosso dai preferiti', 'success');
                updateFavoriteIcon(targetId, false);
                
                const currentPage = document.querySelector('.page.active');
                if (currentPage && currentPage.id === 'favoritesPage') {
                    if (type === 'giocatori') {
                        renderFavoritePlayers();
                    } else {
                        renderFavoriteTeams();
                    }
                }
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

            if (response.ok) {
                await loadUserFavorites();
                showNotification('❤️ Aggiunto ai preferiti', 'success');
                updateFavoriteIcon(targetId, true);
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
    if (activeBtn) activeBtn.classList.add('active');

    const playersContainer = document.getElementById('favoritePlayersContainer');
    const teamsContainer = document.getElementById('favoriteTeamsContainer');
    
    if (tab === 'favorite-players') {
        playersContainer.style.display = 'grid';
        teamsContainer.style.display = 'none';
        renderFavoritePlayers();
    } else {
        playersContainer.style.display = 'none';
        teamsContainer.style.display = 'grid';
        renderFavoriteTeams();
    }
}

function renderFavoritePlayers() {
    const container = document.getElementById('favoritePlayersContainer');
    if (!userFavorites.giocatori || userFavorites.giocatori.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart-broken"></i>
                <p>Nessun giocatore nei preferiti</p>
            </div>`;
        return;
    }
    container.innerHTML = userFavorites.giocatori.map(player => `
        <div class="player-card" onclick="showPlayerDetail('${player._id}')">
            <div class="player-card-header">
                <div class="player-avatar"><i class="fas fa-user-circle"></i></div>
                <div class="player-info">
                    <h3>
                        ${player.username}
                        <i class="fas fa-heart" style="color: #ef4444; cursor: pointer; margin-left: 0.5rem;" 
                           data-favorite-id="${player._id}"
                           onclick="event.stopPropagation(); toggleFavorite('${player._id}', 'giocatori');"></i>
                    </h3>
                    <p class="player-role">${player.primaryRole}</p>
                </div>
            </div>
            <div class="player-stats">
                <span class="stat"><i class="fas fa-trophy"></i> ${player.level}</span>
                <span class="stat"><i class="fas fa-gamepad"></i> ${player.platform}</span>
                <span class="stat star"><i class="fas fa-star"></i> ${player.averageRating.toFixed(1)}</span>
            </div>
        </div>
    `).join('');
}

function renderFavoriteTeams() {
    const container = document.getElementById('favoriteTeamsContainer');
    if (!userFavorites.squadre || userFavorites.squadre.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart-broken"></i>
                <p>Nessuna squadra nei preferiti</p>
            </div>`;
        return;
    }
    container.innerHTML = userFavorites.squadre.map(team => `
        <div class="team-card" onclick="showTeamDetail('${team._id}')">
            <div class="team-card-header">
                <div class="team-avatar"><i class="fas fa-shield-alt"></i></div>
                <div class="team-info">
                    <h3>
                        ${team.name}
                        <i class="fas fa-heart" style="color: #ef4444; cursor: pointer; margin-left: 0.5rem;" 
                           data-favorite-id="${team._id}"
                           onclick="event.stopPropagation(); toggleFavorite('${team._id}', 'squadre');"></i>
                    </h3>
                    <p class="team-platform">${team.platform}</p>
                </div>
            </div>
            <div class="team-stats">
                <span class="stat"><i class="fas fa-users"></i> ${team.members.length} membri</span>
                <span class="stat"><i class="fas fa-flag"></i> ${team.nationality || 'N/A'}</span>
                <span class="stat star"><i class="fas fa-star"></i> ${team.averageRating.toFixed(1)}</span>
            </div>
        </div>
    `).join('');
}

// ============================================
// CONDIVISIONE
// ============================================

async function shareProfile(type, id, name) {
    const shareData = {
        title: `${name} - Pro Club Hub`,
        text: type === 'player' 
            ? `Guarda il profilo di ${name} su Pro Club Hub!`
            : `Scopri la squadra ${name} su Pro Club Hub!`,
        url: `https://proclubhub.vercel.app/api/share?type=${type}&id=${id}`
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            showNotification('✅ Condiviso con successo!', 'success');
        } else {
            await navigator.clipboard.writeText(shareData.url);
            showNotification('📋 Link copiato negli appunti!', 'success');
        }
    } catch (error) {
        const input = document.createElement('input');
        input.value = shareData.url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showNotification('📋 Link copiato negli appunti!', 'success');
    }
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

    if (page === 'profile') {
        loadProfile();
    } else if (page === 'players') {
        if (!currentUser) {
            showNotification('⚠️ Devi effettuare il login', 'error');
            openAuthModal('login');
            return;
        }
        searchPlayers();
    } else if (page === 'teams') {
        if (!currentUser) {
            showNotification('⚠️ Devi effettuare il login', 'error');
            openAuthModal('login');
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
    switchAuthForm(form);
    document.getElementById('authModal').classList.add('active');
}

function closeAuthModalFn() {
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.remove('active');
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
            showNotification('✅ Login effettuato!', 'success');
            navigateTo('home');
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
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

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/auth?action=register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, primaryRole, platform, nationality, level })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            closeAuthModalFn();
            updateUIForUser();
            showNotification('🎉 Registrazione completata!', 'success');
            navigateTo('profile');
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();

    if (!email) {
        showNotification('⚠️ Inserisci un\'email', 'error');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/auth?action=request-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (response.ok) {
            closeAuthModalFn();
            showNotification('📧 Email inviata!', 'success');
        }
    } catch (error) {
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
// UI UPDATES
// ============================================

function updateUIForUser() {
    document.getElementById('profileNavBtn').style.display = 'flex';
    document.getElementById('logoutBtn').style.display = 'flex';
    document.getElementById('favoritesNavBtn').style.display = 'flex';
    document.getElementById('heroActions').style.display = 'none';
    document.getElementById('heroUserInfo').style.display = 'block';

    document.getElementById('heroUsername').textContent = currentUser.username;
    document.getElementById('heroLevel').textContent = currentUser.level;
    document.getElementById('heroLevelProgress').style.width = `${calculateLevelPercentage(currentUser.level)}%`;
    document.getElementById('heroRating').textContent = currentUser.averageRating.toFixed(1);
    document.getElementById('heroRatingCount').textContent = currentUser.feedbackCount;

    if (currentUser.profileCompleted) {
        document.getElementById('createTeamBtn').style.display = 'flex';
    }

    if (currentUser.isAdmin) {
        document.getElementById('adminNavBtn').style.display = 'flex';
    }
}

function updateUIForGuest() {
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
        }
    } catch (error) {
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function renderPlayers(players) {
    const container = document.getElementById('playersResults');
    if (!players || players.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-user-slash"></i><p>Nessun giocatore trovato</p></div>';
        return;
    }

    container.innerHTML = players.map(player => {
        const isFavorite = userFavorites.giocatori.some(g => g._id === player._id);
        return `
            <div class="player-card" onclick="showPlayerDetail('${player._id}')">
                <div class="player-card-header">
                    <div class="player-avatar"><i class="fas fa-user-circle"></i></div>
                    <div class="player-info">
                        <h3>
                            ${player.username}
                            ${currentUser && player._id !== currentUser._id ? `
                                <i class="${isFavorite ? 'fas' : 'far'} fa-heart" 
                                   style="color: ${isFavorite ? '#ef4444' : '#94a3b8'}; cursor: pointer; margin-left: 0.5rem;" 
                                   data-favorite-id="${player._id}"
                                   onclick="event.stopPropagation(); toggleFavorite('${player._id}', 'giocatori');"></i>
                            ` : ''}
                        </h3>
                        <p class="player-role">${player.primaryRole}</p>
                    </div>
                </div>
                <div class="player-stats">
                    <span class="stat"><i class="fas fa-trophy"></i> ${player.level}</span>
                    <span class="stat"><i class="fas fa-gamepad"></i> ${player.platform}</span>
                    <span class="stat star"><i class="fas fa-star"></i> ${player.averageRating.toFixed(1)}</span>
                </div>
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
            const player = data.user;

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
            <div class="detail-avatar"><i class="fas fa-user-circle"></i></div>
            <div class="detail-info">
                <h2>
                    ${player.username}
                    ${currentUser && currentUser._id !== player._id ? `
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart" 
                           style="color: ${isFavorite ? '#ef4444' : '#94a3b8'}; cursor: pointer; margin-left: 0.5rem;" 
                           data-favorite-id="${player._id}"
                           onclick="toggleFavorite('${player._id}', 'giocatori');"></i>
                    ` : ''}
                </h2>
                <div class="detail-meta">
                    <span class="meta-item"><i class="fas fa-trophy"></i> ${player.level}</span>
                    <span class="meta-item"><i class="fas fa-gamepad"></i> ${player.platform}</span>
                    <span class="meta-item"><i class="fas fa-flag"></i> ${player.nationality}</span>
                    <span class="meta-item"><i class="fas fa-star"></i> ${player.averageRating.toFixed(1)} (${player.feedbackCount})</span>
                </div>
            </div>
        </div>
        <div class="info-card">
            <h4>Ruolo</h4>
            <p><strong>Principale:</strong> ${player.primaryRole}</p>
            ${player.secondaryRoles && player.secondaryRoles.length > 0 ? `<p><strong>Secondari:</strong> ${player.secondaryRoles.join(', ')}</p>` : ''}
        </div>
        ${player.bio ? `<div class="info-card"><h4>Bio</h4><p>${player.bio}</p></div>` : ''}
        ${player.instagram || player.tiktok ? `
            <div class="info-card">
                <h4>Social</h4>
                <div class="social-links">
                    ${player.instagram ? `<a href="https://instagram.com/${player.instagram}" target="_blank" class="social-link instagram"><i class="fab fa-instagram"></i> @${player.instagram}</a>` : ''}
                    ${player.tiktok ? `<a href="https://tiktok.com/@${player.tiktok}" target="_blank" class="social-link tiktok"><i class="fab fa-tiktok"></i> @${player.tiktok}</a>` : ''}
                </div>
            </div>
        ` : ''}
        ${currentUser && currentUser._id !== player._id ? `
            <div class="detail-actions">
                <button class="btn btn-primary" onclick="openFeedbackModal('user', '${player._id}')"><i class="fas fa-star"></i> Lascia Feedback</button>
                <button class="btn btn-secondary" onclick="shareProfile('player', '${player._id}', '${player.username}')"><i class="fas fa-share-alt"></i> Condividi</button>
            </div>
        ` : ''}
        ${feedback && feedback.length > 0 ? `
            <div class="info-card">
                <h4>Feedback Ricevuti</h4>
                <div class="feedback-list">
                    ${feedback.map(fb => `
                        <div class="feedback-item">
                            <div class="feedback-header">
                                <div class="feedback-author">${fb.fromUser ? fb.fromUser.username : 'Utente'}</div>
                                <div class="feedback-rating">${'<i class="fas fa-star"></i>'.repeat(fb.rating)}${'<i class="far fa-star"></i>'.repeat(5 - fb.rating)}</div>
                            </div>
                            ${fb.tags && fb.tags.length > 0 ? `<div class="feedback-tags">${fb.tags.map(tag => `<span class="feedback-tag">${tag}</span>`).join('')}</div>` : ''}
                            ${fb.comment ? `<p class="feedback-comment">${fb.comment}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

function closePlayerDetailModalFn() {
    document.getElementById('playerDetailModal').classList.remove('active');
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
        }
    } catch (error) {
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function renderTeams(teams) {
    const container = document.getElementById('teamsResults');
    if (!teams || teams.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-shield-alt"></i><p>Nessuna squadra trovata</p></div>';
        return;
    }

    container.innerHTML = teams.map(team => {
        const isFavorite = userFavorites.squadre.some(s => s._id === team._id);
        return `
            <div class="team-card" onclick="showTeamDetail('${team._id}')">
                <div class="team-card-header">
                    <div class="team-avatar"><i class="fas fa-shield-alt"></i></div>
                    <div class="team-info">
                        <h3>
                            ${team.name}
                            ${currentUser ? `
                                <i class="${isFavorite ? 'fas' : 'far'} fa-heart" 
                                   style="color: ${isFavorite ? '#ef4444' : '#94a3b8'}; cursor: pointer; margin-left: 0.5rem;" 
                                   data-favorite-id="${team._id}"
                                   onclick="event.stopPropagation(); toggleFavorite('${team._id}', 'squadre');"></i>
                            ` : ''}
                        </h3>
                        <p class="team-platform">${team.platform}</p>
                    </div>
                </div>
                ${team.description ? `<p class="team-description">${team.description}</p>` : ''}
                <div class="team-stats">
                    <span class="stat"><i class="fas fa-users"></i> ${team.members.length} membri</span>
                    <span class="stat"><i class="fas fa-flag"></i> ${team.nationality || 'N/A'}</span>
                    <span class="stat star"><i class="fas fa-star"></i> ${team.averageRating.toFixed(1)}</span>
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
            renderTeamDetailContent(data.team);
            document.getElementById('teamDetailModal').classList.add('active');
        }
    } catch (error) {
        showNotification('❌ Errore nel caricamento', 'error');
    } finally {
        hideLoading();
    }
}

function renderTeamDetailContent(team) {
    const content = document.getElementById('teamDetailContent');
    const isFavorite = userFavorites.squadre.some(s => s._id === team._id);

    content.innerHTML = `
        <div class="team-detail-header">
            <div class="detail-avatar"><i class="fas fa-shield-alt"></i></div>
            <div class="detail-info">
                <h2>
                    ${team.name}
                    ${currentUser ? `
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart" 
                           style="color: ${isFavorite ? '#ef4444' : '#94a3b8'}; cursor: pointer; margin-left: 0.5rem;" 
                           data-favorite-id="${team._id}"
                           onclick="toggleFavorite('${team._id}', 'squadre');"></i>
                    ` : ''}
                </h2>
                <div class="detail-meta">
                    <span class="meta-item"><i class="fas fa-gamepad"></i> ${team.platform}</span>
                    <span class="meta-item"><i class="fas fa-users"></i> ${team.members.length} membri</span>
                    <span class="meta-item"><i class="fas fa-star"></i> ${team.averageRating.toFixed(1)}</span>
                </div>
            </div>
        </div>
        ${team.description ? `<div class="info-card"><h4>Descrizione</h4><p>${team.description}</p></div>` : ''}
        ${currentUser && currentUser._id !== team.captain.toString() && !team.members.some(m => m.toString() === currentUser._id) ? `
            <div class="detail-actions">
                <button class="btn btn-primary" onclick="requestJoinTeam('${team._id}')"><i class="fas fa-user-plus"></i> Richiedi Ingresso</button>
                <button class="btn btn-secondary" onclick="shareProfile('team', '${team._id}', '${team.name}')"><i class="fas fa-share-alt"></i> Condividi</button>
            </div>
        ` : ''}
    `;
}

function closeTeamDetailModalFn() {
    document.getElementById('teamDetailModal').classList.remove('active');
}

// ============================================
// PROFILE
// ============================================

async function loadProfile() {
    if (!currentUser) return;

    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileLevel').textContent = currentUser.level;
    document.getElementById('profileLevelProgress').style.width = `${calculateLevelPercentage(currentUser.level)}%`;
    document.getElementById('profileRating').textContent = currentUser.averageRating.toFixed(1);
    document.getElementById('profileRatingCount').textContent = currentUser.feedbackCount;
    document.getElementById('profilePlatform').textContent = currentUser.platform;
    document.getElementById('profileNationality').textContent = currentUser.nationality || 'Non specificata';
    document.getElementById('profilePrimaryRole').textContent = currentUser.primaryRole;
    document.getElementById('profileSecondaryRoles').textContent = currentUser.secondaryRoles && currentUser.secondaryRoles.length > 0 ? currentUser.secondaryRoles.join(', ') : 'Nessuno';
    document.getElementById('profileBio').textContent = currentUser.bio || 'Nessuna bio';
    document.getElementById('profileLookingForTeam').textContent = currentUser.lookingForTeam ? 'Sì' : 'No';
}

function openEditProfileModal() {
    document.getElementById('editProfileModal').classList.add('active');
    document.getElementById('editPlatform').value = currentUser.platform;
    document.getElementById('editNationality').value = currentUser.nationality;
    document.getElementById('editPrimaryRole').value = currentUser.primaryRole;
    document.getElementById('editLevel').value = currentUser.level;
    document.getElementById('editBio').value = currentUser.bio || '';
    document.getElementById('editLookingForTeam').checked = currentUser.lookingForTeam;
    document.getElementById('editInstagram').value = currentUser.instagram || '';
    document.getElementById('editTiktok').value = currentUser.tiktok || '';
}

async function handleEditProfile(e) {
    e.preventDefault();

    const updates = {
        platform: document.getElementById('editPlatform').value,
        nationality: document.getElementById('editNationality').value.trim(),
        primaryRole: document.getElementById('editPrimaryRole').value,
        level: parseInt(document.getElementById('editLevel').value),
        bio: document.getElementById('editBio').value.trim(),
        lookingForTeam: document.getElementById('editLookingForTeam').checked,
        instagram: document.getElementById('editInstagram').value.trim(),
        tiktok: document.getElementById('editTiktok').value.trim()
    };

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/users?action=update`, {
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
            document.getElementById('editProfileModal').classList.remove('active');
            loadProfile();
            updateUIForUser();
            showNotification('✅ Profilo aggiornato!', 'success');
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
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
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // NAVIGATION
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo(this.getAttribute('data-page'));
        });
    });

    // AUTH BUTTONS
    const heroLoginBtn = document.getElementById('heroLoginBtn');
    if (heroLoginBtn) heroLoginBtn.addEventListener('click', () => openAuthModal('login'));

    const heroRegisterBtn = document.getElementById('heroRegisterBtn');
    if (heroRegisterBtn) heroRegisterBtn.addEventListener('click', () => openAuthModal('register'));

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // MODAL CLOSES
    const closeAuthModal = document.getElementById('closeAuthModal');
    if (closeAuthModal) closeAuthModal.addEventListener('click', closeAuthModalFn);

    const closePlayerDetailModal = document.getElementById('closePlayerDetailModal');
    if (closePlayerDetailModal) closePlayerDetailModal.addEventListener('click', closePlayerDetailModalFn);

    const closeTeamDetailModal = document.getElementById('closeTeamDetailModal');
    if (closeTeamDetailModal) closeTeamDetailModal.addEventListener('click', closeTeamDetailModalFn);

    // FORMS
    const loginFormElement = document.getElementById('loginFormElement');
    if (loginFormElement) loginFormElement.addEventListener('submit', handleLogin);

    const registerFormElement = document.getElementById('registerFormElement');
    if (registerFormElement) registerFormElement.addEventListener('submit', handleRegister);

    const forgotPasswordFormElement = document.getElementById('forgotPasswordFormElement');
    if (forgotPasswordFormElement) forgotPasswordFormElement.addEventListener('submit', handleForgotPassword);

    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) editProfileForm.addEventListener('submit', handleEditProfile);

    // SEARCH BUTTONS
    const searchPlayersBtn = document.getElementById('searchPlayersBtn');
    if (searchPlayersBtn) searchPlayersBtn.addEventListener('click', searchPlayers);

    const searchTeamsBtn = document.getElementById('searchTeamsBtn');
    if (searchTeamsBtn) searchTeamsBtn.addEventListener('click', searchTeams);

    // TAB SWITCHES
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            if (tab === 'favorite-players' || tab === 'favorite-teams') {
                switchFavoritesTab(tab);
            }
        });
    });

    // MODAL BACKGROUNDS
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// ============================================
// GLOBAL FUNCTIONS FOR ONCLICK
// ============================================
window.showPlayerDetail = showPlayerDetail;
window.showTeamDetail = showTeamDetail;
window.toggleFavorite = toggleFavorite;
window.shareProfile = shareProfile;
window.loadFavoritesPage = loadFavoritesPage;
window.openEditProfileModal = openEditProfileModal;
EOFALL
