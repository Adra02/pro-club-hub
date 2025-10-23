// ============================================
// PRO CLUB HUB - MAIN APPLICATION - VERSIONE COMPLETA
// Con: Preferiti, Condivisione, Notifiche, Anti-Spam
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
let userFavorites = { giocatori: [], squadre: [] }; // NUOVO: Preferiti


// ========================================
// 🔗 SISTEMA DI CONDIVISIONE PROFILI
// ========================================

/**
 * Legge i query parameters dall'URL
 */
function getURLParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        profile: params.get('profile'),
        id: params.get('id')
    };
}

/**
 * Carica un profilo giocatore condiviso
 */
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

        // Usa la tua funzione esistente showPlayerDetail
        await showPlayerDetail(playerId);

        addBackToHomeButton('playerDetailModal');

    } catch (error) {
        console.error('Errore caricamento profilo condiviso:', error);
        showNotification(error.message || 'Profilo non trovato', 'error');
        showProfileNotFoundPage('giocatore');
    }
}

/**
 * Carica un profilo squadra condiviso
 */
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

        // Usa la tua funzione esistente showTeamDetail
        await showTeamDetail(teamId);

        addBackToHomeButton('teamDetailModal');

    } catch (error) {
        console.error('Errore caricamento squadra condivisa:', error);
        showNotification(error.message || 'Squadra non trovata', 'error');
        showProfileNotFoundPage('squadra');
    }
}

/**
 * Nascondi homepage per profili condivisi
 */
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

/**
 * Mostra homepage
 */
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

/**
 * Aggiunge pulsante "Torna alla Home"
 */
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
        modal.style.display = 'none';
        window.history.pushState({}, '', window.location.pathname);
        showHomepage();
        window.location.reload();
    });

    modalContent.appendChild(backBtn);
}

/**
 * Pagina errore "Profilo non trovato"
 */
function showProfileNotFoundPage(type) {
    hideHomepageForSharedProfile();

    const errorPage = document.createElement('div');
    errorPage.id = 'profileNotFoundPage';
    errorPage.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        text-align: center;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
    `;

    errorPage.innerHTML = `
        <div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px); max-width: 500px;">
            <h1 style="font-size: 72px; margin: 0;">😕</h1>
            <h2 style="margin: 20px 0;">Profilo Non Trovato</h2>
            <p style="margin: 10px 0; opacity: 0.9;">
                Il ${type} che stai cercando non esiste o è stato rimosso.
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

    document.body.appendChild(errorPage);
}

/**
 * Gestione back button browser
 */
window.addEventListener('popstate', (event) => {
    const urlParams = getURLParams();
    
    if (!urlParams.profile && !urlParams.id) {
        showHomepage();
        window.location.reload();
    }
});


// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM caricato, inizializzazione app...');

    // ✅ NUOVO: Controlla se è un link condiviso
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
            
            // NUOVO: Carica preferiti
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
// SISTEMA PREFERITI - IMPLEMENTAZIONE COMPLETA
// ============================================

/**
 * Carica i preferiti dell'utente dal server
 */
async function loadUserFavorites() {
    if (!currentUser) {
        let userFavorites = { giocatori: [], squadre: [] };
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
            
            // Aggiorna le icone dei preferiti nella UI
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

/**
 * Aggiunge o rimuove un elemento dai preferiti
 * @param {string} targetId - ID del giocatore o squadra
 * @param {string} type - 'giocatori' o 'squadre'
 */
async function toggleFavorite(targetId, type) {
    if (!currentUser) {
        showNotification('⚠️ Devi effettuare il login', 'error');
        return;
    }

    console.log('🔄 Toggle favorite:', { targetId, type });

    // Controlla se è già nei preferiti
    const favorites = type === 'giocatori' ? userFavorites.giocatori : userFavorites.squadre;
    const isFavorite = favorites.some(item => item._id === targetId);

    try {
        showLoading();

        if (isFavorite) {
            // Rimuovi dai preferiti
            const response = await fetch(`${API_BASE}/preferiti?action=remove`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ targetId, type })
            });

            const data = await response.json();

            if (response.ok) {
                // Aggiorna la cache locale
                if (type === 'giocatori') {
                    userFavorites.giocatori = userFavorites.giocatori.filter(g => g._id !== targetId);
                } else {
                    userFavorites.squadre = userFavorites.squadre.filter(s => s._id !== targetId);
                }

                showNotification('💔 Rimosso dai preferiti', 'success');
                console.log('✅ Rimosso dai preferiti');
                
                // Aggiorna l'icona
                updateFavoriteIcon(targetId, false);
                
                // Se siamo nella pagina preferiti, ricarica la vista
                const currentPage = document.querySelector('.page.active');
                if (currentPage && currentPage.id === 'favoritesPage') {
                    if (type === 'giocatori') {
                        renderFavoritePlayers();
                    } else {
                        renderFavoriteTeams();
                    }
                }
            } else {
                showNotification('❌ ' + (data.error || 'Errore'), 'error');
            }
        } else {
            // Aggiungi ai preferiti
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
                // Ricarica i preferiti per ottenere i dettagli completi
                await loadUserFavorites();
                
                showNotification('❤️ Aggiunto ai preferiti', 'success');
                console.log('✅ Aggiunto ai preferiti');
                
                // Aggiorna l'icona
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

/**
 * Aggiorna l'icona di un singolo preferito
 */
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

/**
 * Aggiorna tutte le icone dei preferiti nella UI
 */
function updateFavoriteIcons() {
    // Aggiorna le icone dei giocatori
    userFavorites.giocatori.forEach(player => {
        updateFavoriteIcon(player._id, true);
    });

    // Aggiorna le icone delle squadre
    userFavorites.squadre.forEach(team => {
        updateFavoriteIcon(team._id, true);
    });
}

/**
 * Carica la pagina dei preferiti
 */
async function loadFavoritesPage() {
    if (!currentUser) {
        showNotification('⚠️ Devi effettuare il login', 'error');
        navigateTo('home');
        return;
    }
    
    await loadUserFavorites();
    switchFavoritesTab('favorite-players');
}

/**
 * Cambia tab nella pagina preferiti
 */
function switchFavoritesTab(tab) {
    // Aggiorna i bottoni tab
    document.querySelectorAll('.requests-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // Mostra/nascondi i container
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

/**
 * Renderizza i giocatori preferiti
 */
function renderFavoritePlayers() {
    const container = document.getElementById('favoritePlayersContainer');
    
    if (!userFavorites.giocatori || userFavorites.giocatori.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart-broken"></i>
                <p>Nessun giocatore nei preferiti</p>
                <p style="color: #64748b; font-size: 0.9rem; margin-top: 0.5rem;">
                    Aggiungi giocatori ai preferiti cliccando sul cuore ❤️
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = userFavorites.giocatori.map(player => {
        return `
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
                        <i class="fas fa-trophy"></i> ${player.level}
                    </span>
                    <span class="stat">
                        <i class="fas fa-gamepad"></i> ${player.platform}
                    </span>
                    <span class="stat star">
                        <i class="fas fa-star"></i> ${player.averageRating.toFixed(1)} (${player.feedbackCount})
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Renderizza le squadre preferite
 */
function renderFavoriteTeams() {
    const container = document.getElementById('favoriteTeamsContainer');
    
    if (!userFavorites.squadre || userFavorites.squadre.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart-broken"></i>
                <p>Nessuna squadra nei preferiti</p>
                <p style="color: #64748b; font-size: 0.9rem; margin-top: 0.5rem;">
                    Aggiungi squadre ai preferiti cliccando sul cuore ❤️
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = userFavorites.squadre.map(team => {
        return `
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
        `;
    }).join('');
}

// ============================================
// FINE FUNZIONI PREFERITI
// ============================================

// IMPORTANTE: Assicurati che nel tuo file app.js esista anche:
// 1. La variabile globale: let userFavorites = { giocatori: [], squadre: [] };
// 2. La chiamata a loadUserFavorites() nella funzione fetchCurrentUser()
// 3. Le funzioni globali alla fine del file:
//    window.toggleFavorite = toggleFavorite;
//    window.loadFavoritesPage = loadFavoritesPage;


// ============================================
// GESTIONE ERRORI ANTI-SPAM
// ============================================

function handleRateLimitError(errorMessage) {
    // Estrai il numero di minuti dal messaggio di errore
    const match = errorMessage.match(/(\d+) minut/);
    const minutes = match ? match[1] : '10';
    
    showNotification(
        `🚫 ${errorMessage}`,
        'error'
    );
    
    // Mostra un messaggio più dettagliato
    setTimeout(() => {
        showNotification(
            ⏱️ Puoi inviare massimo 15 richieste ogni 10 minuti. Attendi ${minutes} minuti.`,
            'info'
        );
    }, 3000);
}

// ============================================
// CURRENT TEAM & REQUESTS
// ============================================

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
    
    // NUOVO: Mostra tab preferiti
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
    console.log('🔧 Setting up event listeners...');
    
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
            const tab = e.currentTarget.dataset.tab;
            if (tab === 'favorite-players' || tab === 'favorite-teams') {
                switchFavoritesTab(tab);
            } else {
                switchRequestsTab(tab);
            }
        });
    });

    // ADMIN
    const deleteAllTeamsBtn = document.getElementById('deleteAllTeamsBtn');
    if (deleteAllTeamsBtn) deleteAllTeamsBtn.addEventListener('click', handleDeleteAllTeams);

    const resetProfilesBtn = document.getElementById('resetProfilesBtn');
    if (resetProfilesBtn) resetProfilesBtn.addEventListener('click', handleResetProfiles);

    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) newsletterForm.addEventListener('submit', handleSendNewsletter);

    const levelSettingsForm = document.getElementById('levelSettingsForm');
    if (levelSettingsForm) levelSettingsForm.addEventListener('submit', handleLevelSettingsUpdate);

    // INTERACTIVE
    setupStarRating();
    setupTagSelector();
    setupSecondaryRolesLimit();

    // MODAL BACKGROUND CLOSE
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // ESC KEY
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
    
    console.log('✅ Event listeners setup complete');
}

function setupStarRating() {
    const stars = document.querySelectorAll('#starRating i');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.getAttribute('data-rating'));
            document.getElementById('feedbackRating').value = selectedRating;
            
            stars.forEach(s => {
                s.classList.remove('fas', 'active');
                s.classList.add('far');
            });
            
            for (let i = 0; i < selectedRating; i++) {
                stars[i].classList.remove('far');
                stars[i].classList.add('fas', 'active');
            }
        });
    });
}

function setupTagSelector() {
    const tagButtons = document.querySelectorAll('#tagSelector .tag-btn');
    tagButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const tag = this.getAttribute('data-tag');
            
            if (selectedTags.includes(tag)) {
                selectedTags = selectedTags.filter(t => t !== tag);
                this.classList.remove('active');
            } else {
                selectedTags.push(tag);
                this.classList.add('active');
            }
        });
    });
}

function setupSecondaryRolesLimit() {
    const checkboxes = document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checked = document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]:checked');
            if (checked.length > 2) {
                this.checked = false;
                showNotification('⚠️ Puoi selezionare massimo 2 ruoli secondari', 'error');
            }
            checkProfileCompletion();
        });
    });
}

function checkProfileCompletion() {
    const instagramInput = document.getElementById('editInstagram');
    const tiktokInput = document.getElementById('editTiktok');
    const lookingForTeamCheckbox = document.getElementById('editLookingForTeam');
    const secondaryRolesCheckboxes = document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]');

    if (!instagramInput || !tiktokInput || !lookingForTeamCheckbox) return;

    const hasSecondaryRole = Array.from(secondaryRolesCheckboxes).some(cb => cb.checked);
    const hasContact = (instagramInput.value.trim() !== '') || (tiktokInput.value.trim() !== '');

    const container = lookingForTeamCheckbox.closest('.form-group');
    let warningText = container.querySelector('.helper-text');

    if (hasSecondaryRole && hasContact) {
        lookingForTeamCheckbox.disabled = false;
        if (warningText) warningText.remove();
    } else {
        lookingForTeamCheckbox.disabled = true;
        lookingForTeamCheckbox.checked = false;
        
        if (!warningText) {
            warningText = document.createElement('p');
            warningText.className = 'helper-text';
            warningText.innerHTML = '⚠️ Per abilitare "Cerco squadra": aggiungi 1+ ruolo secondario + Instagram O TikTok';
            container.appendChild(warningText);
        }
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
// NAVIGATION
// ============================================

function navigateTo(page) {
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
    document.getElementById('profileLookingForTeam').textContent = currentUser.lookingForTeam ? 'Sì' : 'No';

    const socialCard = document.getElementById('profileSocialCard');
    const socialLinks = document.getElementById('profileSocialLinks');
    
    if (currentUser.instagram || currentUser.tiktok) {
        socialCard.style.display = 'block';
        socialLinks.innerHTML = '';
        
        if (currentUser.instagram) {
            socialLinks.innerHTML += `
                <a href="https://instagram.com/${currentUser.instagram}" target="_blank" class="social-link instagram">
                    <i class="fab fa-instagram"></i> @${currentUser.instagram}
                </a>
            `;
        }
        
        if (currentUser.tiktok) {
            socialLinks.innerHTML += `
                <a href="https://tiktok.com/@${currentUser.tiktok}" target="_blank" class="social-link tiktok">
                    <i class="fab fa-tiktok"></i> @${currentUser.tiktok}
                </a>
            `;
        }
    } else {
        socialCard.style.display = 'none';
    }

    try {
        const response = await fetch(`${API_BASE}/feedback?userId=${currentUser._id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            renderFeedbackList(data.feedback);
        }
    } catch (error) {
        console.error('Error loading feedback:', error);
    }
}

function renderFeedbackList(feedbackList) {
    const container = document.getElementById('profileFeedbackList');
    
    if (!feedbackList || feedbackList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Nessun feedback ricevuto ancora</p>
            </div>
        `;
        return;
    }

    container.innerHTML = feedbackList.map(fb => `
        <div class="feedback-item">
            <div class="feedback-header">
                <div class="feedback-user">
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

    const checkboxes = document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = currentUser.secondaryRoles && currentUser.secondaryRoles.includes(checkbox.value);
    });

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
                        <i class="fas fa-trophy"></i> ${player.level}
                    </span>
                    <span class="stat">
                        <i class="fas fa-gamepad"></i> ${player.platform}
                    </span>
                    <span class="stat star">
                        <i class="fas fa-star"></i> ${player.averageRating.toFixed(1)} (${player.feedbackCount})
                    </span>
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
                    ${currentUser && currentUser._id !== player._id ? `
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart" 
                           style="color: ${isFavorite ? '#ef4444' : '#94a3b8'}; cursor: pointer; margin-left: 0.5rem;" 
                           data-favorite-id="${player._id}"
                           onclick="toggleFavorite('${player._id}', 'giocatori');">
                        </i>
                    ` : ''}
                </h2>
                <div class="detail-meta">
                    <span class="meta-item">
                        <i class="fas fa-trophy"></i> Livello ${player.level}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-gamepad"></i> ${player.platform}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-flag"></i> ${player.nationality || 'N/A'}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-star"></i> ${player.averageRating.toFixed(1)} (${player.feedbackCount} feedback)
                    </span>
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
                <div class="roles-list">
                    ${player.secondaryRoles && player.secondaryRoles.length > 0 
                        ? player.secondaryRoles.map(role => `<span class="role-badge">${role}</span>`).join('') 
                        : '<p>Nessuno</p>'
                    }
                </div>
            </div>
            ${player.bio ? `
                <div class="info-card">
                    <h4><i class="fas fa-comment"></i> Bio</h4>
                    <p>${player.bio}</p>
                </div>
            ` : ''}
            ${(player.instagram || player.tiktok) ? `
                <div class="info-card">
                    <h4><i class="fas fa-share-alt"></i> Social</h4>
                    <div class="social-links">
                        ${player.instagram ? `
                            <a href="https://instagram.com/${player.instagram}" target="_blank" class="social-link instagram">
                                <i class="fab fa-instagram"></i> @${player.instagram}
                            </a>
                        ` : ''}
                        ${player.tiktok ? `
                            <a href="https://tiktok.com/@${player.tiktok}" target="_blank" class="social-link tiktok">
                                <i class="fab fa-tiktok"></i> @${player.tiktok}
                            </a>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
        </div>

        ${currentUser && currentUser._id !== player._id ? `
            <div class="detail-actions">
                <button class="btn btn-primary" onclick="openFeedbackModal('${player._id}')">
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
        return `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Nessun feedback ancora</p>
            </div>
        `;
    }

    return feedback.map(fb => `
        <div class="feedback-item">
            <div class="feedback-header">
                <div class="feedback-user">
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
                           style="color: ${isFavorite ? '#ef4444' : '#94a3b8'}; cursor: pointer; margin-left: 0.5rem;" 
                           data-favorite-id="${team._id}"
                           onclick="toggleFavorite('${team._id}', 'squadre');">
                        </i>
                    ` : ''}
                </h2>
                <div class="detail-meta">
                    <span class="meta-item">
                        <i class="fas fa-gamepad"></i> ${team.platform}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-flag"></i> ${team.nationality || 'N/A'}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-users"></i> ${team.members.length} membri
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-star"></i> ${team.averageRating.toFixed(1)} (${team.feedbackCount} feedback)
                    </span>
                </div>
            </div>
        </div>

        ${team.description ? `
            <div class="info-card">
                <h4><i class="fas fa-info-circle"></i> Descrizione</h4>
                <p>${team.description}</p>
            </div>
        ` : ''}

        ${(team.instagram || team.tiktok || team.liveLink) ? `
            <div class="info-card">
                <h4><i class="fas fa-share-alt"></i> Social & Live</h4>
                <div class="social-links">
                    ${team.instagram ? `
                        <a href="https://instagram.com/${team.instagram}" target="_blank" class="social-link instagram">
                            <i class="fab fa-instagram"></i> @${team.instagram}
                        </a>
                    ` : ''}
                    ${team.tiktok ? `
                        <a href="https://tiktok.com/@${team.tiktok}" target="_blank" class="social-link tiktok">
                            <i class="fab fa-tiktok"></i> @${team.tiktok}
                        </a>
                    ` : ''}
                    ${team.liveLink ? `
                        <a href="${team.liveLink}" target="_blank" class="btn btn-live btn-small">
                            <i class="fas fa-video"></i> Guarda Live
                        </a>
                    ` : ''}
                </div>
            </div>
        ` : ''}

        <div class="team-members">
            <h4><i class="fas fa-users"></i> Membri</h4>
            <div class="member-list">
                ${team.memberDetails.map(member => `
                    <div class="member-item">
                        <div class="member-info">
                            <div class="member-avatar">
                                <i class="fas fa-user-circle"></i>
                            </div>
                            <div class="member-details">
                                <h5>
                                    ${member.username}
                                    ${team.captain.toString() === member._id ? '<span class="captain-badge"><i class="fas fa-crown"></i> Capitano</span>' : ''}
                                    ${team.viceCaptain && team.viceCaptain.toString() === member._id ? '<span class="vice-captain-badge"><i class="fas fa-star"></i> Vice</span>' : ''}
                                </h5>
                                <p class="member-role">${member.primaryRole} • Liv. ${member.level}</p>
                            </div>
                        </div>
                        ${isCaptain && member._id !== currentUser._id ? `
                            <div class="member-actions">
                                ${!team.viceCaptain || team.viceCaptain.toString() !== member._id ? `
                                    <button class="btn btn-secondary btn-small" onclick="setViceCaptain('${team._id}', '${member._id}')">
                                        <i class="fas fa-star"></i> Nomina Vice
                                    </button>
                                ` : ''}
                                <button class="btn btn-danger btn-small" onclick="removeMember('${team._id}', '${member._id}')">
                                    <i class="fas fa-user-minus"></i> Espelli
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>

        ${currentUser ? `
            <div class="detail-actions">
                ${!isMember && currentUser._id !== team.captain.toString() ? `
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
            // NUOVO: Gestione errore anti-spam
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
            showNotification('✅ Hai lasciato la squadra', 'success');
            currentUser.team = null;
            currentTeam = null;
            closeTeamDetailModalFn();
            await fetchCurrentUser();
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
    if (!confirm('Sei sicuro di voler espellere questo membro?')) return;

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
            showNotification('✅ Membro rimosso', 'success');
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
    if (!confirm('Nominare questo giocatore come vice capitano?')) return;

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

// ============================================
// FEEDBACK
// ============================================

function openFeedbackModal(userId, teamId) {
    if (!currentUser) {
        showNotification('⚠️ Devi effettuare il login', 'error');
        return;
    }

    document.getElementById('feedbackTargetUserId').value = userId || '';
    document.getElementById('feedbackTargetTeamId').value = teamId || '';
    
    selectedRating = 0;
    selectedTags = [];
    
    document.querySelectorAll('#starRating i').forEach(star => {
        star.classList.remove('fas', 'active');
        star.classList.add('far');
    });
    
    document.querySelectorAll('#tagSelector .tag-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById('feedbackModal').classList.add('active');
}

async function handleSubmitFeedback(e) {
    e.preventDefault();

    const targetUserId = document.getElementById('feedbackTargetUserId').value;
    const targetTeamId = document.getElementById('feedbackTargetTeamId').value;
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
                targetUserId: targetUserId || undefined,
                targetTeamId: targetTeamId || undefined,
                rating: selectedRating,
                comment,
                tags: selectedTags
            })
        });

        const data = await response.json();

        if (response.ok) {
            closeFeedbackModalFn();
            showNotification('✅ Feedback inviato!', 'success');
            closePlayerDetailModalFn();
            closeTeamDetailModalFn();
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
    if (!currentTeam) {
        showNotification('⚠️ Devi essere in una squadra', 'error');
        return;
    }

    switchRequestsTab('received');
}

function switchRequestsTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    if (tab === 'received') {
        document.getElementById('receivedRequests').style.display = 'block';
        document.getElementById('sentRequests').style.display = 'none';
        loadReceivedRequests();
    } else {
        document.getElementById('receivedRequests').style.display = 'none';
        document.getElementById('sentRequests').style.display = 'block';
        loadSentRequests();
    }
}

async function loadReceivedRequests() {
    if (!currentTeam) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/requests?teamId=${currentTeam._id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            renderReceivedRequests(data.requests);
        }
    } catch (error) {
        console.error('Load received requests error:', error);
    } finally {
        hideLoading();
    }
}

function renderReceivedRequests(requests) {
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
                        <i class="fas fa-user-circle"></i>
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
            renderSentRequests(data.requests);
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
                    <button class="btn btn-warning btn-small" onclick="cancelRequest('${req._id}')">
                        <i class="fas fa-times"></i> Annulla
                    </button>
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
            showNotification('✅ Richiesta approvata!', 'success');
            loadReceivedRequests();
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
// ADMIN (mantenuto invariato per brevità)
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

        const levelResponse = await fetch(`${API_BASE}/admin?action=level-settings`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (levelResponse.ok) {
            const levelData = await levelResponse.json();
            document.getElementById('adminMinLevel').value = levelData.minLevel;
            document.getElementById('adminMaxLevel').value = levelData.maxLevel;
        }

        const usersResponse = await fetch(`${API_BASE}/admin?action=users`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            renderUsersList(usersData.users);
        }

    } catch (error) {
        console.error('Load admin dashboard error:', error);
        showNotification('❌ Errore caricamento admin', 'error');
    } finally {
        hideLoading();
    }
}

function renderUsersList(users) {
    const container = document.getElementById('usersList');

    if (!users || users.length === 0) {
        container.innerHTML = '<p>Nessun utente</p>';
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="user-item">
            <div class="user-item-info">
                <h4>${user.username}</h4>
                <p>${user.email} • Liv. ${user.level} • ${user.platform}</p>
            </div>
            <div class="user-item-actions">
                ${user.isSuspended ? `
                    <button class="btn btn-success btn-small" onclick="unsuspendUser('${user._id}')">
                        <i class="fas fa-check"></i> Riabilita
                    </button>
                ` : `
                    <button class="btn btn-warning btn-small" onclick="suspendUser('${user._id}')">
                        <i class="fas fa-ban"></i> Sospendi
                    </button>
                `}
                <button class="btn btn-danger btn-small" onclick="deleteUser('${user._id}')">
                    <i class="fas fa-trash"></i> Elimina
                </button>
            </div>
        </div>
    `).join('');
}

async function handleLevelSettingsUpdate(e) {
    e.preventDefault();

    const minLevel = parseInt(document.getElementById('adminMinLevel').value);
    const maxLevel = parseInt(document.getElementById('adminMaxLevel').value);

    if (isNaN(minLevel) || isNaN(maxLevel)) {
        showNotification('⚠️ Inserisci numeri validi', 'error');
        return;
    }

    if (minLevel < 1) {
        showNotification('⚠️ Minimo deve essere almeno 1', 'error');
        return;
    }

    if (maxLevel < minLevel) {
        showNotification('⚠️ Massimo deve essere >= minimo', 'error');
        return;
    }

    if (maxLevel > 9999) {
        showNotification('⚠️ Massimo non può superare 9999', 'error');
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
            showNotification('✅ Limiti livello aggiornati!', 'success');
            GLOBAL_MIN_LEVEL = minLevel;
            GLOBAL_MAX_LEVEL = maxLevel;
            updateLevelInputLimits(minLevel, maxLevel);
            
            if (currentUser) {
                await fetchCurrentUser();
            }
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Update level settings error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function handleDeleteAllTeams() {
    if (!confirm('ATTENZIONE: Eliminare TUTTE le squadre? Questa azione è irreversibile!')) return;
    if (!confirm('Sei ASSOLUTAMENTE sicuro?')) return;

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
            showNotification(`✅ ${data.count} squadre eliminate`, 'success');
            loadAdminDashboard();
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Delete teams error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function handleResetProfiles() {
    if (!confirm('ATTENZIONE: Resettare tutti i profili? Questa azione è irreversibile!')) return;
    if (!confirm('Sei ASSOLUTAMENTE sicuro?')) return;

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
            showNotification('✅ Profili resettati', 'success');
            loadAdminDashboard();
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
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

    if (!confirm('Inviare newsletter a tutti gli utenti?')) return;

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
            showNotification(`✅ Newsletter inviata a ${data.sent} utenti`, 'success');
            document.getElementById('newsletterForm').reset();
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Send newsletter error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function suspendUser(userId) {
    if (!confirm('Sospendere questo utente?')) return;

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
            showNotification('✅ Utente sospeso', 'success');
            loadAdminDashboard();
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Suspend user error:', error);
        showNotification('❌ Errore di connessione', 'error');
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

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Utente riabilitato', 'success');
            loadAdminDashboard();
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Unsuspend user error:', error);
        showNotification('❌ Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteUser(userId) {
    if (!confirm('ELIMINARE questo utente? Azione irreversibile!')) return;

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
            showNotification('✅ Utente eliminato', 'success');
            loadAdminDashboard();
        } else {
            showNotification('❌ ' + (data.error || 'Errore'), 'error');
        }
    } catch (error) {
        console.error('Delete user error:', error);
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

// ========================================
// 🔗 GESTIONE CHIUSURA MODAL CONDIVISI
// ========================================

// Chiudi modal e pulisci URL quando si clicca sulla X
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('close')) {
        const urlParams = getURLParams();
        
        if (urlParams.profile && urlParams.id) {
            // Chiudi tutti i modal
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
            
            // Rimuovi parametri dall'URL
            window.history.pushState({}, '', window.location.pathname);
            
            // Mostra homepage
            showHomepage();
            
            // Ricarica pagina per stato pulito
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
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








