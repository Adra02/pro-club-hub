// ==================== GLOBAL VARIABLES ====================
let currentUser = null;
let selectedTags = [];
let selectedRating = 0;
let currentTeam = null;
let GLOBAL_MIN_LEVEL = 1;
let GLOBAL_MAX_LEVEL = 999;
let userFavorites = { giocatori: [], squadre: [] };
const API_BASE = '/api';

const NATIONALITIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
    "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
    "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
    "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
    "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador",
    "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
    "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
    "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo",
    "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
    "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
    "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
    "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
    "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
    "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
    "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
    "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland",
    "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
    "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu",
    "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
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

// ==================== AUTHENTICATION ====================
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        await fetchCurrentUser();
    } else {
        updateUIForGuest();
    }
}

async function fetchCurrentUser() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            updateUIForUser();
            await loadUserFavorites();
        } else {
            logout();
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        logout();
    }
}

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
            await fetchCurrentUser();
            document.getElementById('loginModal').style.display = 'none';
            showNotification('Login effettuato con successo!', 'success');
            navigateTo('players');
        } else {
            showNotification(data.error || 'Errore durante il login', 'error');
        }
    } catch (error) {
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function handleRegister(e) {
    e.preventDefault();
    showLoading();

    const formData = {
        username: document.getElementById('registerUsername').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        gamertag: document.getElementById('registerGamertag').value,
        platform: document.getElementById('registerPlatform').value,
        role: document.getElementById('registerRole').value,
        nationality: document.getElementById('registerNationality').value,
        level: parseInt(document.getElementById('registerLevel').value) || 1,
        bio: document.getElementById('registerBio').value
    };

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            await fetchCurrentUser();
            document.getElementById('registerModal').style.display = 'none';
            showNotification('Registrazione completata con successo!', 'success');
            navigateTo('players');
        } else {
            showNotification(data.error || 'Errore durante la registrazione', 'error');
        }
    } catch (error) {
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    showLoading();

    const email = document.getElementById('forgotEmail').value;

    try {
        const response = await fetch(`${API_BASE}/auth/request-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Email di reset inviata! Controlla la tua casella.', 'success');
            document.getElementById('forgotPasswordModal').style.display = 'none';
        } else {
            showNotification(data.error || 'Errore durante la richiesta', 'error');
        }
    } catch (error) {
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    userFavorites = { giocatori: [], squadre: [] };
    updateUIForGuest();
    navigateTo('home');
    showNotification('Logout effettuato', 'success');
}

function checkResetToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('reset_token');
    
    if (token) {
        document.getElementById('resetPasswordModal').style.display = 'flex';
        document.getElementById('resetToken').value = token;
    }
}

async function handleResetPassword(e) {
    e.preventDefault();
    showLoading();

    const token = document.getElementById('resetToken').value;
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showNotification('Le password non corrispondono', 'error');
        hideLoading();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword: password })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Password reimpostata con successo!', 'success');
            document.getElementById('resetPasswordModal').style.display = 'none';
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            showNotification(data.error || 'Errore durante il reset', 'error');
        }
    } catch (error) {
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

// ==================== FAVORITES SYSTEM ====================
async function loadUserFavorites() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE}/preferiti`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            userFavorites = data;
            updateFavoriteIcons();
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

async function toggleFavorite(targetId, type) {
    if (!currentUser) {
        showNotification('Devi effettuare il login per aggiungere preferiti', 'error');
        return;
    }

    const listKey = type === 'player' ? 'giocatori' : 'squadre';
    const isFavorite = userFavorites[listKey].includes(targetId);
    
    showLoading();

    try {
        let response;
        
        if (isFavorite) {
            response = await fetch(`${API_BASE}/preferiti?action=remove`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ targetId, type })
            });
        } else {
            response = await fetch(`${API_BASE}/preferiti?action=add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ targetId, type })
            });
        }

        if (response.ok) {
            if (isFavorite) {
                userFavorites[listKey] = userFavorites[listKey].filter(id => id !== targetId);
                showNotification('Rimosso dai preferiti', 'success');
            } else {
                userFavorites[listKey].push(targetId);
                showNotification('Aggiunto ai preferiti', 'success');
            }
            
            updateFavoriteIcon(targetId, !isFavorite);
        } else {
            const data = await response.json();
            showNotification(data.error || 'Errore durante l\'operazione', 'error');
        }
    } catch (error) {
        showNotification('Errore di connessione', 'error');
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
    document.querySelectorAll('[data-favorite-id]').forEach(icon => {
        const targetId = icon.getAttribute('data-favorite-id');
        const isFavoritePlayer = userFavorites.giocatori.includes(targetId);
        const isFavoriteTeam = userFavorites.squadre.includes(targetId);
        const isFavorite = isFavoritePlayer || isFavoriteTeam;
        
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

async function loadFavoritesPage() {
    if (!currentUser) {
        showNotification('Devi effettuare il login', 'error');
        navigateTo('home');
        return;
    }

    showLoading();
    try {
        await loadUserFavorites();
        switchFavoritesTab('players');
    } catch (error) {
        showNotification('Errore nel caricamento dei preferiti', 'error');
    } finally {
        hideLoading();
    }
}

function switchFavoritesTab(tab) {
    document.querySelectorAll('.favorites-tab').forEach(t => t.classList.remove('active'));
    
    if (tab === 'players') {
        document.getElementById('favPlayersTab').classList.add('active');
        document.getElementById('favoritePlayersContent').style.display = 'block';
        document.getElementById('favoriteTeamsContent').style.display = 'none';
        renderFavoritePlayers();
    } else {
        document.getElementById('favTeamsTab').classList.add('active');
        document.getElementById('favoritePlayersContent').style.display = 'none';
        document.getElementById('favoriteTeamsContent').style.display = 'block';
        renderFavoriteTeams();
    }
}

async function renderFavoritePlayers() {
    const container = document.getElementById('favoritePlayersList');
    
    if (userFavorites.giocatori.length === 0) {
        container.innerHTML = '<p class="no-results">Nessun giocatore nei preferiti</p>';
        return;
    }

    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const users = await response.json();
            const favoritePlayers = users.filter(u => userFavorites.giocatori.includes(u._id));
            
            if (favoritePlayers.length === 0) {
                container.innerHTML = '<p class="no-results">Nessun giocatore nei preferiti</p>';
                return;
            }

            container.innerHTML = favoritePlayers.map(player => {
                const levelPercentage = calculateLevelPercentage(player.level || 1);
                return `
                    <div class="player-card" onclick="showPlayerDetail('${player._id}')">
                        <div class="player-card-header">
                            <div class="player-info">
                                <h3>${player.gamertag || player.username}</h3>
                                <p class="player-role">${player.role || 'N/A'}</p>
                            </div>
                            <div class="player-actions">
                                <button class="icon-btn" onclick="event.stopPropagation(); shareProfile('player', '${player._id}', '${player.gamertag || player.username}');">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                                <button class="icon-btn favorite-btn" onclick="event.stopPropagation(); toggleFavorite('${player._id}', 'player');">
                                    <i class="fas fa-heart" data-favorite-id="${player._id}" style="color: #ef4444;"></i>
                                </button>
                            </div>
                        </div>
                        <div class="player-stats">
                            <div class="stat">
                                <i class="fas fa-gamepad"></i>
                                <span>${player.platform || 'N/A'}</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-flag"></i>
                                <span>${player.nationality || 'N/A'}</span>
                            </div>
                        </div>
                        <div class="level-indicator">
                            <div class="level-bar">
                                <div class="level-fill" style="width: ${levelPercentage}%"></div>
                            </div>
                            <span class="level-text">Livello ${player.level || 1}</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            updateFavoriteIcons();
        }
    } catch (error) {
        container.innerHTML = '<p class="no-results">Errore nel caricamento</p>';
    } finally {
        hideLoading();
    }
}

async function renderFavoriteTeams() {
    const container = document.getElementById('favoriteTeamsList');
    
    if (userFavorites.squadre.length === 0) {
        container.innerHTML = '<p class="no-results">Nessuna squadra nei preferiti</p>';
        return;
    }

    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/teams`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const teams = await response.json();
            const favoriteTeams = teams.filter(t => userFavorites.squadre.includes(t._id));
            
            if (favoriteTeams.length === 0) {
                container.innerHTML = '<p class="no-results">Nessuna squadra nei preferiti</p>';
                return;
            }

            container.innerHTML = favoriteTeams.map(team => `
                <div class="team-card" onclick="showTeamDetail('${team._id}')">
                    <div class="team-card-header">
                        <div class="team-info">
                            <h3>${team.name}</h3>
                            <p class="team-platform">${team.platform || 'N/A'}</p>
                        </div>
                        <div class="team-actions">
                            <button class="icon-btn" onclick="event.stopPropagation(); shareProfile('team', '${team._id}', '${team.name}');">
                                <i class="fas fa-share-alt"></i>
                            </button>
                            <button class="icon-btn favorite-btn" onclick="event.stopPropagation(); toggleFavorite('${team._id}', 'team');">
                                <i class="fas fa-heart" data-favorite-id="${team._id}" style="color: #ef4444;"></i>
                            </button>
                        </div>
                    </div>
                    <div class="team-stats">
                        <div class="stat">
                            <i class="fas fa-users"></i>
                            <span>${team.members?.length || 0} membri</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-flag"></i>
                            <span>${team.nationality || 'N/A'}</span>
                        </div>
                    </div>
                    ${team.description ? `<p class="team-description">${team.description}</p>` : ''}
                </div>
            `).join('');
            
            updateFavoriteIcons();
        }
    } catch (error) {
        container.innerHTML = '<p class="no-results">Errore nel caricamento</p>';
    } finally {
        hideLoading();
    }
}

// ==================== SHARE SYSTEM ====================
async function shareProfile(type, id, name) {
    const shareUrl = `https://proclubhub.vercel.app/api/share?type=${type}&id=${id}`;
    const shareText = `Guarda il profilo di ${name} su Pro Club Hub!`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Pro Club Hub',
                text: shareText,
                url: shareUrl
            });
            showNotification('Condiviso con successo!', 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                copyToClipboard(shareUrl);
            }
        }
    } else {
        copyToClipboard(shareUrl);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Link copiato negli appunti!', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Link copiato negli appunti!', 'success');
    } catch (err) {
        showNotification('Impossibile copiare il link', 'error');
    }
    
    document.body.removeChild(textArea);
}

// ==================== PLAYERS SEARCH ====================
async function searchPlayers() {
    showLoading();
    
    const role = document.getElementById('playerRole').value;
    const platform = document.getElementById('playerPlatform').value;
    const nationality = document.getElementById('playerNationality').value;
    const minLevel = document.getElementById('playerMinLevel').value;
    const maxLevel = document.getElementById('playerMaxLevel').value;

    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (platform) params.append('platform', platform);
    if (nationality) params.append('nationality', nationality);
    if (minLevel) params.append('minLevel', minLevel);
    if (maxLevel) params.append('maxLevel', maxLevel);

    try {
        const response = await fetch(`${API_BASE}/users?${params.toString()}`, {
            headers: currentUser ? {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            } : {}
        });

        if (response.ok) {
            const players = await response.json();
            renderPlayers(players);
        } else {
            showNotification('Errore nella ricerca giocatori', 'error');
        }
    } catch (error) {
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function renderPlayers(players) {
    const container = document.getElementById('playersList');
    
    if (players.length === 0) {
        container.innerHTML = '<p class="no-results">Nessun giocatore trovato</p>';
        return;
    }

    container.innerHTML = players.map(player => {
        const levelPercentage = calculateLevelPercentage(player.level || 1);
        const isFavorite = userFavorites.giocatori.includes(player._id);
        const heartClass = isFavorite ? 'fas' : 'far';
        const heartColor = isFavorite ? '#ef4444' : '#94a3b8';
        
        return `
            <div class="player-card" onclick="showPlayerDetail('${player._id}')">
                <div class="player-card-header">
                    <div class="player-info">
                        <h3>${player.gamertag || player.username}</h3>
                        <p class="player-role">${player.role || 'N/A'}</p>
                    </div>
                    <div class="player-actions">
                        <button class="icon-btn" onclick="event.stopPropagation(); shareProfile('player', '${player._id}', '${player.gamertag || player.username}');">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        ${currentUser ? `
                            <button class="icon-btn favorite-btn" onclick="event.stopPropagation(); toggleFavorite('${player._id}', 'player');">
                                <i class="${heartClass} fa-heart" data-favorite-id="${player._id}" style="color: ${heartColor};"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="player-stats">
                    <div class="stat">
                        <i class="fas fa-gamepad"></i>
                        <span>${player.platform || 'N/A'}</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-flag"></i>
                        <span>${player.nationality || 'N/A'}</span>
                    </div>
                </div>
                <div class="level-indicator">
                    <div class="level-bar">
                        <div class="level-fill" style="width: ${levelPercentage}%"></div>
                    </div>
                    <span class="level-text">Livello ${player.level || 1}</span>
                </div>
            </div>
        `;
    }).join('');
    
    updateFavoriteIcons();
}

async function showPlayerDetail(playerId) {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/users?_id=${playerId}`, {
            headers: currentUser ? {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            } : {}
        });

        if (response.ok) {
            const players = await response.json();
            if (players.length > 0) {
                const player = players[0];
                
                const feedbackResponse = await fetch(`${API_BASE}/feedback?targetId=${playerId}`, {
                    headers: currentUser ? {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    } : {}
                });
                
                let feedback = [];
                if (feedbackResponse.ok) {
                    feedback = await feedbackResponse.json();
                }
                
                renderPlayerDetail(player, feedback);
                document.getElementById('playerDetailModal').style.display = 'flex';
            }
        }
    } catch (error) {
        showNotification('Errore nel caricamento del dettaglio', 'error');
    } finally {
        hideLoading();
    }
}

function renderPlayerDetail(player, feedback) {
    const levelPercentage = calculateLevelPercentage(player.level || 1);
    const isFavorite = userFavorites.giocatori.includes(player._id);
    const heartClass = isFavorite ? 'fas' : 'far';
    const heartColor = isFavorite ? '#ef4444' : '#94a3b8';
    
    const averageRating = feedback.length > 0 
        ? (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length).toFixed(1)
        : 'N/A';

    const detailContent = document.getElementById('playerDetailContent');
    detailContent.innerHTML = `
        <div class="detail-header">
            <div>
                <h2>${player.gamertag || player.username}</h2>
                <p class="detail-role">${player.role || 'N/A'}</p>
            </div>
            <div class="detail-actions">
                <button class="icon-btn" onclick="shareProfile('player', '${player._id}', '${player.gamertag || player.username}');">
                    <i class="fas fa-share-alt"></i>
                </button>
                ${currentUser ? `
                    <button class="icon-btn favorite-btn" onclick="toggleFavorite('${player._id}', 'player');">
                        <i class="${heartClass} fa-heart" data-favorite-id="${player._id}" style="color: ${heartColor};"></i>
                    </button>
                ` : ''}
            </div>
        </div>

        <div class="detail-stats">
            <div class="stat-item">
                <i class="fas fa-gamepad"></i>
                <div>
                    <span class="stat-label">Piattaforma</span>
                    <span class="stat-value">${player.platform || 'N/A'}</span>
                </div>
            </div>
            <div class="stat-item">
                <i class="fas fa-flag"></i>
                <div>
                    <span class="stat-label">Nazionalità</span>
                    <span class="stat-value">${player.nationality || 'N/A'}</span>
                </div>
            </div>
            <div class="stat-item">
                <i class="fas fa-star"></i>
                <div>
                    <span class="stat-label">Valutazione</span>
                    <span class="stat-value">${averageRating}</span>
                </div>
            </div>
        </div>

        <div class="level-section">
            <h3>Livello</h3>
            <div class="level-indicator">
                <div class="level-bar">
                    <div class="level-fill" style="width: ${levelPercentage}%"></div>
                </div>
                <span class="level-text">Livello ${player.level || 1}</span>
            </div>
        </div>

        ${player.bio ? `
            <div class="bio-section">
                <h3>Bio</h3>
                <p>${player.bio}</p>
            </div>
        ` : ''}

        ${currentUser && currentUser._id !== player._id ? `
            <div class="feedback-section">
                <h3>Lascia un Feedback</h3>
                <form id="feedbackForm" onsubmit="handleFeedbackSubmit(event, '${player._id}')">
                    <div class="rating-input">
                        <label>Valutazione:</label>
                        <div class="stars">
                            ${[1,2,3,4,5].map(i => `
                                <i class="far fa-star" data-rating="${i}" onclick="setRating(${i})"></i>
                            `).join('')}
                        </div>
                    </div>
                    <textarea id="feedbackComment" placeholder="Commento (opzionale)" rows="3"></textarea>
                    <button type="submit" class="btn btn-primary">Invia Feedback</button>
                </form>
            </div>
        ` : ''}

        ${feedback.length > 0 ? `
            <div class="feedback-list">
                <h3>Feedback Ricevuti</h3>
                ${feedback.map(f => `
                    <div class="feedback-item">
                        <div class="feedback-header">
                            <span class="feedback-author">${f.fromUser?.username || 'Anonimo'}</span>
                            <div class="feedback-rating">
                                ${[1,2,3,4,5].map(i => `
                                    <i class="fas fa-star" style="color: ${i <= (f.rating || 0) ? '#fbbf24' : '#e5e7eb'}"></i>
                                `).join('')}
                            </div>
                        </div>
                        ${f.comment ? `<p class="feedback-comment">${f.comment}</p>` : ''}
                        <span class="feedback-date">${new Date(f.createdAt).toLocaleDateString()}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
    
    updateFavoriteIcons();
}

function setRating(rating) {
    selectedRating = rating;
    document.querySelectorAll('.stars i').forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('far');
            star.classList.add('fas');
            star.style.color = '#fbbf24';
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
            star.style.color = '#94a3b8';
        }
    });
}

async function handleFeedbackSubmit(e, targetId) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Devi effettuare il login', 'error');
        return;
    }

    if (selectedRating === 0) {
        showNotification('Seleziona una valutazione', 'error');
        return;
    }

    showLoading();

    const comment = document.getElementById('feedbackComment').value;

    try {
        const response = await fetch(`${API_BASE}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                targetId,
                targetType: 'player',
                rating: selectedRating,
                comment
            })
        });

        if (response.ok) {
            showNotification('Feedback inviato con successo!', 'success');
            selectedRating = 0;
            showPlayerDetail(targetId);
        } else {
            const data = await response.json();
            showNotification(data.error || 'Errore nell\'invio del feedback', 'error');
        }
    } catch (error) {
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function closePlayerDetailModalFn() {
    document.getElementById('playerDetailModal').style.display = 'none';
    selectedRating = 0;
}

// ==================== TEAMS SEARCH ====================
async function searchTeams() {
    showLoading();
    
    const platform = document.getElementById('teamPlatform').value;
    const nationality = document.getElementById('teamNationality').value;

    const params = new URLSearchParams();
    if (platform) params.append('platform', platform);
    if (nationality) params.append('nationality', nationality);

    try {
        const response = await fetch(`${API_BASE}/teams?${params.toString()}`, {
            headers: currentUser ? {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            } : {}
        });

        if (response.ok) {
            const teams = await response.json();
            renderTeams(teams);
        } else {
            showNotification('Errore nella ricerca squadre', 'error');
        }
    } catch (error) {
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function renderTeams(teams) {
    const container = document.getElementById('teamsList');
    
    if (teams.length === 0) {
        container.innerHTML = '<p class="no-results">Nessuna squadra trovata</p>';
        return;
    }

    container.innerHTML = teams.map(team => {
        const isFavorite = userFavorites.squadre.includes(team._id);
        const heartClass = isFavorite ? 'fas' : 'far';
        const heartColor = isFavorite ? '#ef4444' : '#94a3b8';
        
        return `
            <div class="team-card" onclick="showTeamDetail('${team._id}')">
                <div class="team-card-header">
                    <div class="team-info">
                        <h3>${team.name}</h3>
                        <p class="team-platform">${team.platform || 'N/A'}</p>
                    </div>
                    <div class="team-actions">
                        <button class="icon-btn" onclick="event.stopPropagation(); shareProfile('team', '${team._id}', '${team.name}');">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        ${currentUser ? `
                            <button class="icon-btn favorite-btn" onclick="event.stopPropagation(); toggleFavorite('${team._id}', 'team');">
                                <i class="${heartClass} fa-heart" data-favorite-id="${team._id}" style="color: ${heartColor};"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="team-stats">
                    <div class="stat">
                        <i class="fas fa-users"></i>
                        <span>${team.members?.length || 0} membri</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-flag"></i>
                        <span>${team.nationality || 'N/A'}</span>
                    </div>
                </div>
                ${team.description ? `<p class="team-description">${team.description}</p>` : ''}
            </div>
        `;
    }).join('');
    
    updateFavoriteIcons();
}

async function showTeamDetail(teamId) {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/teams?_id=${teamId}`, {
            headers: currentUser ? {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            } : {}
        });

        if (response.ok) {
            const teams = await response.json();
            if (teams.length > 0) {
                const team = teams[0];
                renderTeamDetailContent(team);
                document.getElementById('teamDetailModal').style.display = 'flex';
            }
        }
    } catch (error) {
        showNotification('Errore nel caricamento del dettaglio', 'error');
    } finally {
        hideLoading();
    }
}

function renderTeamDetailContent(team) {
    const isFavorite = userFavorites.squadre.includes(team._id);
    const heartClass = isFavorite ? 'fas' : 'far';
    const heartColor = isFavorite ? '#ef4444' : '#94a3b8';
    
    const isOwner = currentUser && currentUser._id === team.owner;
    const isMember = currentUser && team.members?.some(m => m._id === currentUser._id);

    const detailContent = document.getElementById('teamDetailContent');
    detailContent.innerHTML = `
        <div class="detail-header">
            <div>
                <h2>${team.name}</h2>
                <p class="detail-role">${team.platform || 'N/A'}</p>
            </div>
            <div class="detail-actions">
                <button class="icon-btn" onclick="shareProfile('team', '${team._id}', '${team.name}');">
                    <i class="fas fa-share-alt"></i>
                </button>
                ${currentUser ? `
                    <button class="icon-btn favorite-btn" onclick="toggleFavorite('${team._id}', 'team');">
                        <i class="${heartClass} fa-heart" data-favorite-id="${team._id}" style="color: ${heartColor};"></i>
                    </button>
                ` : ''}
            </div>
        </div>

        <div class="detail-stats">
            <div class="stat-item">
                <i class="fas fa-users"></i>
                <div>
                    <span class="stat-label">Membri</span>
                    <span class="stat-value">${team.members?.length || 0}</span>
                </div>
            </div>
            <div class="stat-item">
                <i class="fas fa-flag"></i>
                <div>
                    <span class="stat-label">Nazionalità</span>
                    <span class="stat-value">${team.nationality || 'N/A'}</span>
                </div>
            </div>
            <div class="stat-item">
                <i class="fas fa-gamepad"></i>
                <div>
                    <span class="stat-label">Piattaforma</span>
                    <span class="stat-value">${team.platform || 'N/A'}</span>
                </div>
            </div>
        </div>

        ${team.description ? `
            <div class="bio-section">
                <h3>Descrizione</h3>
                <p>${team.description}</p>
            </div>
        ` : ''}

        ${team.members && team.members.length > 0 ? `
            <div class="members-section">
                <h3>Membri</h3>
                <div class="members-list">
                    ${team.members.map(member => `
                        <div class="member-item">
                            <span class="member-name">${member.gamertag || member.username}</span>
                            <span class="member-role">${member.role || 'N/A'}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        ${currentUser && !isMember && !isOwner ? `
            <button class="btn btn-primary" onclick="requestJoinTeam('${team._id}')">
                <i class="fas fa-user-plus"></i> Richiedi di Entrare
            </button>
        ` : ''}
    `;
    
    updateFavoriteIcons();
}

async function requestJoinTeam(teamId) {
    if (!currentUser) {
        showNotification('Devi effettuare il login', 'error');
        return;
    }

    showLoading();

    try {
        const response = await fetch(`${API_BASE}/requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ teamId })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Richiesta inviata con successo!', 'success');
        } else {
            showNotification(data.error || 'Errore nell\'invio della richiesta', 'error');
        }
    } catch (error) {
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function closeTeamDetailModalFn() {
    document.getElementById('teamDetailModal').style.display = 'none';
}

// ==================== PROFILE ====================
async function loadProfile() {
    if (!currentUser) {
        showNotification('Devi effettuare il login', 'error');
        navigateTo('home');
        return;
    }

    const levelPercentage = calculateLevelPercentage(currentUser.level || 1);

    document.getElementById('profileContent').innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="profile-info">
                <h2>${currentUser.gamertag || currentUser.username}</h2>
                <p class="profile-email">${currentUser.email}</p>
            </div>
            <button class="btn btn-secondary" onclick="openEditProfileModal()">
                <i class="fas fa-edit"></i> Modifica Profilo
            </button>
        </div>

        <div class="profile-stats">
            <div class="stat-card">
                <i class="fas fa-gamepad"></i>
                <div>
                    <span class="stat-label">Piattaforma</span>
                    <span class="stat-value">${currentUser.platform || 'N/A'}</span>
                </div>
            </div>
            <div class="stat-card">
                <i class="fas fa-futbol"></i>
                <div>
                    <span class="stat-label">Ruolo</span>
                    <span class="stat-value">${currentUser.role || 'N/A'}</span>
                </div>
            </div>
            <div class="stat-card">
                <i class="fas fa-flag"></i>
                <div>
                    <span class="stat-label">Nazionalità</span>
                    <span class="stat-value">${currentUser.nationality || 'N/A'}</span>
                </div>
            </div>
        </div>

        <div class="level-section">
            <h3>Livello</h3>
            <div class="level-indicator">
                <div class="level-bar">
                    <div class="level-fill" style="width: ${levelPercentage}%"></div>
                </div>
                <span class="level-text">Livello ${currentUser.level || 1}</span>
            </div>
        </div>

        ${currentUser.bio ? `
            <div class="bio-section">
                <h3>Bio</h3>
                <p>${currentUser.bio}</p>
            </div>
        ` : ''}
    `;
}

function openEditProfileModal() {
    document.getElementById('editGamertag').value = currentUser.gamertag || '';
    document.getElementById('editPlatform').value = currentUser.platform || '';
    document.getElementById('editRole').value = currentUser.role || '';
    document.getElementById('editNationality').value = currentUser.nationality || '';
    document.getElementById('editLevel').value = currentUser.level || 1;
    document.getElementById('editBio').value = currentUser.bio || '';
    
    document.getElementById('editProfileModal').style.display = 'flex';
}

async function handleEditProfile(e) {
    e.preventDefault();
    showLoading();

    const updates = {
        gamertag: document.getElementById('editGamertag').value,
        platform: document.getElementById('editPlatform').value,
        role: document.getElementById('editRole').value,
        nationality: document.getElementById('editNationality').value,
        level: parseInt(document.getElementById('editLevel').value),
        bio: document.getElementById('editBio').value
    };

    try {
        const response = await fetch(`${API_BASE}/users`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(updates)
        });

        if (response.ok) {
            await fetchCurrentUser();
            document.getElementById('editProfileModal').style.display = 'none';
            showNotification('Profilo aggiornato con successo!', 'success');
            loadProfile();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Errore nell\'aggiornamento', 'error');
        }
    } catch (error) {
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

// ==================== NAVIGATION ====================
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const pageElement = document.getElementById(`${page}Page`);
    if (pageElement) {
        pageElement.classList.add('active');
    }

    const navBtn = document.querySelector(`[data-page="${page}"]`);
    if (navBtn) {
        navBtn.classList.add('active');
    }

    if (page === 'players') {
        searchPlayers();
    } else if (page === 'teams') {
        searchTeams();
    } else if (page === 'profile' && currentUser) {
        loadProfile();
    } else if (page === 'favorites' && currentUser) {
        loadFavoritesPage();
    }
}

// ==================== UI UPDATES ====================
function updateUIForUser() {
    document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'none');
    
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = currentUser.gamertag || currentUser.username;
    }
}

function updateUIForGuest() {
    document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'block');
}

function calculateLevelPercentage(level) {
    const range = GLOBAL_MAX_LEVEL - GLOBAL_MIN_LEVEL;
    const position = level - GLOBAL_MIN_LEVEL;
    return Math.min(100, Math.max(0, (position / range) * 100));
}

// ==================== UTILITY FUNCTIONS ====================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function showLoading() {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
        loading.style.display = 'flex';
    }
}

function hideLoading() {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
        loading.style.display = 'none';
    }
}

function populateNationalities() {
    const selects = [
        'registerNationality',
        'editNationality',
        'playerNationality',
        'teamNationality'
    ];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select && select.tagName === 'SELECT') {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Tutte le nazionalità</option>';
            NATIONALITIES.forEach(nat => {
                const option = document.createElement('option');
                option.value = nat;
                option.textContent = nat;
                select.appendChild(option);
            });
            if (currentValue) {
                select.value = currentValue;
            }
        }
    });

    const datalists = document.querySelectorAll('datalist[id$="Nationalities"]');
    datalists.forEach(datalist => {
        datalist.innerHTML = '';
        NATIONALITIES.forEach(nat => {
            const option = document.createElement('option');
            option.value = nat;
            datalist.appendChild(option);
        });
    });
}

async function loadGlobalLevelLimits() {
    GLOBAL_MIN_LEVEL = 1;
    GLOBAL_MAX_LEVEL = 999;
}

function setupLanguageSelector() {
    const langSelector = document.getElementById('languageSelector');
    if (langSelector) {
        langSelector.addEventListener('change', (e) => {
            const lang = e.target.value;
            localStorage.setItem('language', lang);
            updatePageLanguage();
        });
        
        const savedLang = localStorage.getItem('language') || 'it';
        langSelector.value = savedLang;
    }
}

function updatePageLanguage() {
    const lang = localStorage.getItem('language') || 'it';
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-page');
            navigateTo(page);
        });
    });

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            document.getElementById('loginModal').style.display = 'flex';
        });
    }

    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            document.getElementById('registerModal').style.display = 'flex';
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }

    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPassword);
    }

    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleEditProfile);
    }

    const searchPlayersBtn = document.getElementById('searchPlayersBtn');
    if (searchPlayersBtn) {
        searchPlayersBtn.addEventListener('click', searchPlayers);
    }

    const searchTeamsBtn = document.getElementById('searchTeamsBtn');
    if (searchTeamsBtn) {
        searchTeamsBtn.addEventListener('click', searchTeams);
    }

    const showForgotPassword = document.getElementById('showForgotPassword');
    if (showForgotPassword) {
        showForgotPassword.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('loginModal').style.display = 'none';
            document.getElementById('forgotPasswordModal').style.display = 'flex';
        });
    }

    const showRegister = document.getElementById('showRegister');
    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('loginModal').style.display = 'none';
            document.getElementById('registerModal').style.display = 'flex';
        });
    }

    const showLogin = document.getElementById('showLogin');
    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('registerModal').style.display = 'none';
            document.getElementById('loginModal').style.display = 'flex';
        });
    }

    const favPlayersTab = document.getElementById('favPlayersTab');
    if (favPlayersTab) {
        favPlayersTab.addEventListener('click', () => switchFavoritesTab('players'));
    }

    const favTeamsTab = document.getElementById('favTeamsTab');
    if (favTeamsTab) {
        favTeamsTab.addEventListener('click', () => switchFavoritesTab('teams'));
    }
}

// ==================== GLOBAL WINDOW FUNCTIONS ====================
window.showPlayerDetail = showPlayerDetail;
window.showTeamDetail = showTeamDetail;
window.toggleFavorite = toggleFavorite;
window.shareProfile = shareProfile;
window.loadFavoritesPage = loadFavoritesPage;
window.openEditProfileModal = openEditProfileModal;
window.closePlayerDetailModalFn = closePlayerDetailModalFn;
window.closeTeamDetailModalFn = closeTeamDetailModalFn;
window.setRating = setRating;
window.handleFeedbackSubmit = handleFeedbackSubmit;
window.requestJoinTeam = requestJoinTeam;
