const API_BASE = '/api';

let currentUser = null;
let selectedTags = [];
let selectedRating = 0;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    checkAuth();
    setupEventListeners();
    navigateTo('home');
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
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUIForUser();
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
    document.getElementById('profileNavBtn').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'flex';
    document.getElementById('heroActions').style.display = 'none';
    document.getElementById('heroUserInfo').style.display = 'block';
    document.getElementById('createTeamBtn').style.display = currentUser.team ? 'none' : 'flex';

    document.getElementById('heroUsername').textContent = currentUser.username;
    document.getElementById('heroLevel').textContent = currentUser.level;
    const levelPercent = (currentUser.level / 150) * 100;
    document.getElementById('heroLevelProgress').style.width = `${levelPercent}%`;
    document.getElementById('heroRating').textContent = currentUser.averageRating.toFixed(1);
    document.getElementById('heroRatingCount').textContent = currentUser.feedbackCount;
}

function updateUIForGuest() {
    document.getElementById('profileNavBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('heroActions').style.display = 'flex';
    document.getElementById('heroUserInfo').style.display = 'none';
    document.getElementById('createTeamBtn').style.display = 'none';
}

function setupEventListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = e.currentTarget.dataset.page;
            navigateTo(page);
        });
    });

    document.getElementById('heroLoginBtn')?.addEventListener('click', () => openAuthModal('login'));
    document.getElementById('heroRegisterBtn')?.addEventListener('click', () => openAuthModal('register'));
    document.getElementById('logoutBtn')?.addEventListener('click', logout);

    document.getElementById('showRegisterForm')?.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('register');
    });

    document.getElementById('showLoginForm')?.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('login');
    });

    document.getElementById('closeAuthModal')?.addEventListener('click', closeAuthModal);
    document.getElementById('loginFormElement')?.addEventListener('submit', handleLogin);
    document.getElementById('registerFormElement')?.addEventListener('submit', handleRegister);

    document.getElementById('editProfileBtn')?.addEventListener('click', openEditProfileModal);
    document.getElementById('closeEditModal')?.addEventListener('click', closeEditProfileModal);
    document.getElementById('editProfileForm')?.addEventListener('submit', handleEditProfile);

    document.getElementById('createTeamBtn')?.addEventListener('click', openCreateTeamModal);
    document.getElementById('closeCreateTeamModal')?.addEventListener('click', closeCreateTeamModal);
    document.getElementById('createTeamForm')?.addEventListener('submit', handleCreateTeam);

    document.getElementById('searchPlayersBtn')?.addEventListener('click', searchPlayers);
    document.getElementById('searchTeamsBtn')?.addEventListener('click', searchTeams);

    document.getElementById('closeFeedbackModal')?.addEventListener('click', closeFeedbackModal);
    document.getElementById('feedbackForm')?.addEventListener('submit', handleSubmitFeedback);

    document.getElementById('closePlayerDetailModal')?.addEventListener('click', closePlayerDetailModal);
    document.getElementById('closeTeamDetailModal')?.addEventListener('click', closeTeamDetailModal);

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
}

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
    }
}

function openAuthModal(form) {
    document.getElementById('loginForm').style.display = form === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = form === 'register' ? 'block' : 'none';
    document.getElementById('authModal').classList.add('active');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
    document.getElementById('loginFormElement').reset();
    document.getElementById('registerFormElement').reset();
}

function switchAuthForm(form) {
    document.getElementById('loginForm').style.display = form === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = form === 'register' ? 'block' : 'none';
}

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            closeAuthModal();
            updateUIForUser();
            showNotification('Login effettuato con successo!', 'success');
            navigateTo('home');
        } else {
            showNotification(data.error || 'Errore durante il login', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const primaryRole = document.getElementById('registerRole').value;
    const platform = document.getElementById('registerPlatform').value;
    const level = parseInt(document.getElementById('registerLevel').value);

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, primaryRole, platform, level })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            closeAuthModal();
            updateUIForUser();
            showNotification('Registrazione completata! Benvenuto!', 'success');
            navigateTo('home');
        } else {
            showNotification(data.error || 'Errore durante la registrazione', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    updateUIForGuest();
    showNotification('Logout effettuato', 'info');
    navigateTo('home');
}

async function searchPlayers() {
    if (!currentUser) {
        showNotification('Devi effettuare il login per cercare giocatori', 'error');
        openAuthModal('login');
        return;
    }

    const search = document.getElementById('playerSearchInput').value;
    const role = document.getElementById('roleFilter').value;
    const platform = document.getElementById('platformFilter').value;
    const minLevel = document.getElementById('minLevelFilter').value;
    const maxLevel = document.getElementById('maxLevelFilter').value;

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (platform) params.append('platform', platform);
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
            showNotification(data.error || 'Errore nel caricamento giocatori', 'error');
        }
    } catch (error) {
        console.error('Search players error:', error);
        showNotification('Errore di connessione', 'error');
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
        const levelPercent = (player.level / 150) * 100;
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
            showNotification(data.error || 'Errore nel caricamento del profilo', 'error');
        }
    } catch (error) {
        console.error('Show player detail error:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function displayPlayerDetailModal(player, feedbackData) {
    const levelPercent = (player.level / 150) * 100;
    const isOwnProfile = currentUser && currentUser._id === player._id;

    const secondaryRoles = player.secondaryRoles && player.secondaryRoles.length > 0
        ? player.secondaryRoles.map(r => `<span class="role-badge">${r}</span>`).join('')
        : '<p>Nessuno</p>';

    const socialLinks = [];
    if (player.instagram) {
        socialLinks.push(`<a href="https://instagram.com/${player.instagram}" target="_blank" class="social-link instagram"><i class="fab fa-instagram"></i> ${player.instagram}</a>`);
    }
    if (player.tiktok) {
        socialLinks.push(`<a href="https://tiktok.com/@${player.tiktok}" target="_blank" class="social-link tiktok"><i class="fab fa-tiktok"></i> ${player.tiktok}</a>`);
    }

    const feedbackList = feedbackData.feedback && feedbackData.feedback.length > 0
        ? feedbackData.feedback.map(fb => {
            const stars = '<i class="fas fa-star"></i>'.repeat(fb.rating);
            const tags = fb.tags && fb.tags.length > 0
                ? `<div class="feedback-tags">${fb.tags.map(tag => `<span class="feedback-tag"><i class="fas fa-tag"></i> ${tag}</span>`).join('')}</div>`
                : '';
            const comment = fb.comment ? `<p class="feedback-comment">${fb.comment}</p>` : '';
            const date = new Date(fb.createdAt).toLocaleDateString('it-IT');
            
            return `
                <div class="feedback-item">
                    <div class="feedback-header">
                        <div class="feedback-user">
                            <i class="fas fa-user-circle"></i>
                            <span>${fb.fromUser.username}</span>
                        </div>
                        <div class="feedback-rating">${stars}</div>
                    </div>
                    ${tags}
                    ${comment}
                    <p class="feedback-date">${date}</p>
                </div>
            `;
        }).join('')
        : '<div class="empty-state"><i class="fas fa-star"></i><p>Nessun feedback ancora</p></div>';

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
                        <span>Livello ${player.level}/150</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-gamepad"></i>
                        <span>${player.platform}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-star"></i>
                        <span>${player.averageRating.toFixed(1)} (${player.feedbackCount} feedback)</span>
                    </div>
                </div>
                <div class="level-bar level-bar-large" style="margin-top: 1rem;">
                    <div class="level-progress" style="width: ${levelPercent}%"></div>
                </div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <h4><i class="fas fa-envelope"></i> Email</h4>
                <p>${player.email}</p>
            </div>
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
                <button class="btn btn-primary" onclick="openFeedbackModalForUser('${player._id}')">
                    <i class="fas fa-star"></i>
                    Lascia Feedback
                </button>
            </div>
        ` : ''}

        <div class="feedback-section">
            <h3><i class="fas fa-star"></i> Feedback Ricevuti</h3>
            ${feedbackList}
        </div>
    `;

    document.getElementById('playerDetailContent').innerHTML = content;
    document.getElementById('playerDetailModal').classList.add('active');
}

function closePlayerDetailModal() {
    document.getElementById('playerDetailModal').classList.remove('active');
}

async function searchTeams() {
    if (!currentUser) {
        showNotification('Devi effettuare il login per cercare squadre', 'error');
        openAuthModal('login');
        return;
    }

    const search = document.getElementById('teamSearchInput').value;
    const platform = document.getElementById('teamPlatformFilter').value;

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (platform) params.append('platform', platform);

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
            showNotification(data.error || 'Errore nel caricamento squadre', 'error');
        }
    } catch (error) {
        console.error('Search teams error:', error);
        showNotification('Errore di connessione', 'error');
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
                    <p class="team-platform">${team.platform}</p>
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
            </div>
        </div>
    `).join('');
}

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
            showNotification(data.error || 'Errore nel caricamento della squadra', 'error');
        }
    } catch (error) {
        console.error('Show team detail error:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function displayTeamDetailModal(team, feedbackData) {
    const isCaptain = currentUser && team.captain.toString() === currentUser._id;
    const isMember = currentUser && team.members.some(m => m.toString() === currentUser._id);

    const socialLinks = [];
    if (team.instagram) {
        socialLinks.push(`<a href="https://instagram.com/${team.instagram}" target="_blank" class="social-link instagram"><i class="fab fa-instagram"></i> ${team.instagram}</a>`);
    }
    if (team.tiktok) {
        socialLinks.push(`<a href="https://tiktok.com/@${team.tiktok}" target="_blank" class="social-link tiktok"><i class="fab fa-tiktok"></i> ${team.tiktok}</a>`);
    }

    const membersList = team.memberDetails && team.memberDetails.length > 0
        ? team.memberDetails.map(member => {
            const isCaptainBadge = member._id === team.captain.toString() 
                ? '<span class="captain-badge"><i class="fas fa-crown"></i> Capitano</span>' 
                : '';
            return `
                <div class="member-item">
                    <div class="member-info">
                        <div class="member-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="member-details">
                            <h5>${member.username} ${isCaptainBadge}</h5>
                            <p class="member-role">${member.primaryRole} - Liv. ${member.level}</p>
                        </div>
                    </div>
                    <button class="btn btn-small btn-primary" onclick="showPlayerDetail('${member._id}')">
                        <i class="fas fa-eye"></i>
                        Vedi
                    </button>
                </div>
            `;
        }).join('')
        : '<p>Nessun membro</p>';

    const feedbackList = feedbackData.feedback && feedbackData.feedback.length > 0
        ? feedbackData.feedback.map(fb => {
            const stars = '<i class="fas fa-star"></i>'.repeat(fb.rating);
            const tags = fb.tags && fb.tags.length > 0
                ? `<div class="feedback-tags">${fb.tags.map(tag => `<span class="feedback-tag"><i class="fas fa-tag"></i> ${tag}</span>`).join('')}</div>`
                : '';
            const comment = fb.comment ? `<p class="feedback-comment">${fb.comment}</p>` : '';
            const date = new Date(fb.createdAt).toLocaleDateString('it-IT');
            
            return `
                <div class="feedback-item">
                    <div class="feedback-header">
                        <div class="feedback-user">
                            <i class="fas fa-user-circle"></i>
                            <span>${fb.fromUser.username}</span>
                        </div>
                        <div class="feedback-rating">${stars}</div>
                    </div>
                    ${tags}
                    ${comment}
                    <p class="feedback-date">${date}</p>
                </div>
            `;
        }).join('')
        : '<div class="empty-state"><i class="fas fa-star"></i><p>Nessun feedback ancora</p></div>';

    const actionButtons = [];
    if (!isMember && currentUser && !currentUser.team) {
        actionButtons.push(`
            <button class="btn btn-success" onclick="joinTeam('${team._id}')">
                <i class="fas fa-user-plus"></i>
                Unisciti alla Squadra
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
            <button class="btn btn-primary" onclick="openFeedbackModalForTeam('${team._id}')">
                <i class="fas fa-star"></i>
                Lascia Feedback
            </button>
        `);
    }

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
                        <i class="fas fa-users"></i>
                        <span>${team.members.length} membri</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-star"></i>
                        <span>${team.averageRating.toFixed(1)} (${team.feedbackCount} feedback)</span>
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
                    <h4><i class="fas fa-share-alt"></i> Social</h4>
                    <div class="social-links">${socialLinks.join('')}</div>
                </div>
            ` : ''}
        </div>

        ${actionButtons.length > 0 ? `
            <div class="detail-actions">
                ${actionButtons.join('')}
            </div>
        ` : ''}

        <div class="team-members">
            <h4><i class="fas fa-users"></i> Membri della Squadra</h4>
            <div class="member-list">
                ${membersList}
            </div>
        </div>

        <div class="feedback-section">
            <h3><i class="fas fa-star"></i> Feedback Ricevuti</h3>
            ${feedbackList}
        </div>
    `;

    document.getElementById('teamDetailContent').innerHTML = content;
    document.getElementById('teamDetailModal').classList.add('active');
}

function closeTeamDetailModal() {
    document.getElementById('teamDetailModal').classList.remove('active');
}

async function joinTeam(teamId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ teamId, action: 'join' })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Ti sei unito alla squadra!', 'success');
            closeTeamDetailModal();
            await fetchCurrentUser();
            searchTeams();
        } else {
            showNotification(data.error || 'Errore durante l\'operazione', 'error');
        }
    } catch (error) {
        console.error('Join team error:', error);
        showNotification('Errore di connessione', 'error');
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
            showNotification('Hai lasciato la squadra', 'info');
            closeTeamDetailModal();
            await fetchCurrentUser();
            searchTeams();
        } else {
            showNotification(data.error || 'Errore durante l\'operazione', 'error');
        }
    } catch (error) {
        console.error('Leave team error:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function openCreateTeamModal() {
    if (!currentUser) {
        showNotification('Devi effettuare il login', 'error');
        return;
    }

    if (currentUser.team) {
        showNotification('Sei già in una squadra', 'error');
        return;
    }

    document.getElementById('createTeamModal').classList.add('active');
}

function closeCreateTeamModal() {
    document.getElementById('createTeamModal').classList.remove('active');
    document.getElementById('createTeamForm').reset();
}

async function handleCreateTeam(e) {
    e.preventDefault();

    const name = document.getElementById('teamName').value;
    const description = document.getElementById('teamDescription').value;
    const platform = document.getElementById('teamPlatform').value;
    const instagram = document.getElementById('teamInstagram').value;
    const tiktok = document.getElementById('teamTiktok').value;

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/teams`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, description, platform, instagram, tiktok })
        });

        const data = await response.json();

        if (response.ok) {
            closeCreateTeamModal();
            showNotification('Squadra creata con successo!', 'success');
            await fetchCurrentUser();
            navigateTo('teams');
        } else {
            showNotification(data.error || 'Errore durante la creazione', 'error');
        }
    } catch (error) {
        console.error('Create team error:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

async function loadProfile() {
    if (!currentUser) return;

    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profilePlatform').textContent = currentUser.platform;
    document.getElementById('profilePrimaryRole').textContent = currentUser.primaryRole;
    document.getElementById('profileLevel').textContent = currentUser.level;
    
    const levelPercent = (currentUser.level / 150) * 100;
    document.getElementById('profileLevelProgress').style.width = `${levelPercent}%`;
    
    document.getElementById('profileRating').textContent = currentUser.averageRating.toFixed(1);
    document.getElementById('profileRatingCount').textContent = currentUser.feedbackCount;

    const secondaryRoles = currentUser.secondaryRoles && currentUser.secondaryRoles.length > 0
        ? currentUser.secondaryRoles.join(', ')
        : 'Nessuno';
    document.getElementById('profileSecondaryRoles').textContent = secondaryRoles;

    document.getElementById('profileBio').textContent = currentUser.bio || 'Nessuna bio';

    const socialLinks = [];
    if (currentUser.instagram) {
        socialLinks.push(`<a href="https://instagram.com/${currentUser.instagram}" target="_blank" class="social-link instagram"><i class="fab fa-instagram"></i> ${currentUser.instagram}</a>`);
    }
    if (currentUser.tiktok) {
        socialLinks.push(`<a href="https://tiktok.com/@${currentUser.tiktok}" target="_blank" class="social-link tiktok"><i class="fab fa-tiktok"></i> ${currentUser.tiktok}</a>`);
    }

    if (socialLinks.length > 0) {
        document.getElementById('profileSocialLinks').innerHTML = socialLinks.join('');
        document.getElementById('profileSocialCard').style.display = 'block';
    } else {
        document.getElementById('profileSocialCard').style.display = 'none';
    }

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
        const stars = '<i class="fas fa-star"></i>'.repeat(fb.rating);
        const tags = fb.tags && fb.tags.length > 0
            ? `<div class="feedback-tags">${fb.tags.map(tag => `<span class="feedback-tag"><i class="fas fa-tag"></i> ${tag}</span>`).join('')}</div>`
            : '';
        const comment = fb.comment ? `<p class="feedback-comment">${fb.comment}</p>` : '';
        const date = new Date(fb.createdAt).toLocaleDateString('it-IT');
        
        return `
            <div class="feedback-item">
                <div class="feedback-header">
                    <div class="feedback-user">
                        <i class="fas fa-user-circle"></i>
                        <span>${fb.fromUser.username}</span>
                    </div>
                    <div class="feedback-rating">${stars}</div>
                </div>
                ${tags}
                ${comment}
                <p class="feedback-date">${date}</p>
            </div>
        `;
    }).join('');
}

function openEditProfileModal() {
    if (!currentUser) return;

    document.getElementById('editUsername').value = currentUser.username;
    document.getElementById('editEmail').value = currentUser.email;
    document.getElementById('editPrimaryRole').value = currentUser.primaryRole;
    document.getElementById('editPlatform').value = currentUser.platform;
    document.getElementById('editLevel').value = currentUser.level;
    document.getElementById('editInstagram').value = currentUser.instagram || '';
    document.getElementById('editTiktok').value = currentUser.tiktok || '';
    document.getElementById('editBio').value = currentUser.bio || '';

    const checkboxes = document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = currentUser.secondaryRoles && currentUser.secondaryRoles.includes(cb.value);
    });

    document.getElementById('editProfileModal').classList.add('active');
}

function closeEditProfileModal() {
    document.getElementById('editProfileModal').classList.remove('active');
    document.getElementById('editProfileForm').reset();
}

async function handleEditProfile(e) {
    e.preventDefault();

    const username = document.getElementById('editUsername').value;
    const email = document.getElementById('editEmail').value;
    const password = document.getElementById('editPassword').value;
    const primaryRole = document.getElementById('editPrimaryRole').value;
    const platform = document.getElementById('editPlatform').value;
    const level = parseInt(document.getElementById('editLevel').value);
    const instagram = document.getElementById('editInstagram').value;
    const tiktok = document.getElementById('editTiktok').value;
    const bio = document.getElementById('editBio').value;

    const secondaryRoles = Array.from(document.querySelectorAll('#secondaryRolesCheckboxes input[type="checkbox"]:checked'))
        .map(cb => cb.value);

    const updates = {
        username,
        email,
        primaryRole,
        secondaryRoles,
        platform,
        level,
        instagram,
        tiktok,
        bio
    };

    if (password) {
        updates.password = password;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE}/auth/me`, {
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
            showNotification('Profilo aggiornato con successo!', 'success');
            loadProfile();
            updateUIForUser();
        } else {
            showNotification(data.error || 'Errore durante l\'aggiornamento', 'error');
        }
    } catch (error) {
        console.error('Edit profile error:', error);
        showNotification('Errore di connessione', 'error');
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

function openFeedbackModalForUser(userId) {
    selectedTags = [];
    selectedRating = 0;
    
    document.getElementById('feedbackTargetUserId').value = userId;
    document.getElementById('feedbackTargetTeamId').value = '';
    document.getElementById('feedbackRating').value = '';
    document.getElementById('feedbackComment').value = '';
    
    document.querySelectorAll('.star-rating i').forEach(star => star.classList.remove('active'));
    document.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById('feedbackModal').classList.add('active');
}

function openFeedbackModalForTeam(teamId) {
    selectedTags = [];
    selectedRating = 0;
    
    document.getElementById('feedbackTargetUserId').value = '';
    document.getElementById('feedbackTargetTeamId').value = teamId;
    document.getElementById('feedbackRating').value = '';
    document.getElementById('feedbackComment').value = '';
    
    document.querySelectorAll('.star-rating i').forEach(star => star.classList.remove('active'));
    document.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById('feedbackModal').classList.add('active');
}

function closeFeedbackModal() {
    document.getElementById('feedbackModal').classList.remove('active');
    document.getElementById('feedbackForm').reset();
    selectedTags = [];
    selectedRating = 0;
}

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
        btn.addEventListener('click', () => {
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

async function handleSubmitFeedback(e) {
    e.preventDefault();

    const targetUserId = document.getElementById('feedbackTargetUserId').value;
    const targetTeamId = document.getElementById('feedbackTargetTeamId').value;
    const rating = parseInt(document.getElementById('feedbackRating').value);
    const comment = document.getElementById('feedbackComment').value;

    if (!rating) {
        showNotification('Seleziona una valutazione', 'error');
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
                rating,
                comment,
                tags: selectedTags
            })
        });

        const data = await response.json();

        if (response.ok) {
            closeFeedbackModal();
            showNotification('Feedback inviato con successo!', 'success');
            
            if (targetUserId) {
                closePlayerDetailModal();
            } else if (targetTeamId) {
                closeTeamDetailModal();
            }
        } else {
            showNotification(data.error || 'Errore durante l\'invio del feedback', 'error');
        }
    } catch (error) {
        console.error('Submit feedback error:', error);
        showNotification('Errore di connessione', 'error');
    } finally {
        hideLoading();
    }
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 4000);
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}
```

---

## 🎉 Applicazione Completata!

Hai ora tutti i **18 file** completi per la tua web app **Pro Club Hub**. Ecco come procedere:

### 📋 Checklist Deploy:

1. **Crea il progetto su Vercel**:
   - Vai su [vercel.com](https://vercel.com)
   - Collega il tuo repository GitHub
   - Importa il progetto

2. **Configura MongoDB Atlas**:
   - Crea un cluster su [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Ottieni la connection string

3. **Imposta le variabili d'ambiente su Vercel**:
```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/proclubhub
   JWT_SECRET=tuo-segreto-super-sicuro-cambialo
   GMAIL_EMAIL=tua-email@gmail.com
   GMAIL_APP_PASSWORD=password-app-gmail