// ============================================
// SHARE.JS - Script per pagina condivisione profili
// VERSIONE CORRETTA con API_BASE relativo
// ============================================

const API_BASE = '/api'; // IMPORTANTE: Uguale a app.js

// Al caricamento della pagina
document.addEventListener('DOMContentLoaded', () => {
    loadSharedProfile();
});

/**
 * Carica il profilo condiviso dai parametri URL
 */
async function loadSharedProfile() {
    try {
        // Estrai parametri dall'URL
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        const id = urlParams.get('id');

        console.log('Loading share profile:', { type, id });

        // Validazione parametri
        if (!type || !id) {
            showError(
                'Link non valido',
                'Il link di condivisione non contiene i parametri necessari.'
            );
            return;
        }

        // Validazione tipo
        if (type !== 'player' && type !== 'team') {
            showError(
                'Tipo non valido',
                'Il tipo di profilo deve essere "player" o "team".'
            );
            return;
        }

        // Chiamata API per ottenere dati profilo
        const response = await fetch(`${API_BASE}/share?type=${type}&id=${id}`);
        
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Errore nel caricamento del profilo');
        }

        const data = await response.json();
        console.log('Profile data loaded:', data);

        // Renderizza il profilo in base al tipo
        if (type === 'player') {
            renderPlayerProfile(data);
        } else {
            renderTeamProfile(data);
        }

    } catch (error) {
        console.error('Error loading profile:', error);
        showError(
            'Profilo non trovato',
            error.message || 'Impossibile caricare il profilo richiesto.'
        );
    }
}

/**
 * Renderizza profilo giocatore
 */
function renderPlayerProfile(data) {
    const { data: player, team, feedbacks, stats } = data;

    // Aggiorna meta tags per SEO
    updateMetaTags(
        `${player.username} - Pro Club Hub`,
        `Profilo di ${player.username} • ${player.primaryRole} • Livello ${player.level}`
    );

    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <!-- Card Profilo Principale -->
        <div class="profile-card">
            <div class="profile-header">
                <div class="profile-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="profile-info">
                    <h2 class="profile-name">${escapeHtml(player.username)}</h2>
                    <div class="profile-stats">
                        <div class="stat-item">
                            <i class="fas fa-futbol"></i>
                            <span>${escapeHtml(player.primaryRole)}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-signal"></i>
                            <span>Livello ${player.level}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-gamepad"></i>
                            <span>${escapeHtml(player.platform)}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-flag"></i>
                            <span>${escapeHtml(player.nationality)}</span>
                        </div>
                    </div>
                    ${player.averageRating > 0 ? `
                        <div class="rating-display">
                            <i class="fas fa-star"></i>
                            <strong>${player.averageRating.toFixed(1)}</strong>
                            <span style="color: #94a3b8;">(${player.feedbackCount} recensioni)</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Informazioni Dettagliate -->
            <div class="profile-section">
                <div class="info-grid">
                    ${player.secondaryRoles && player.secondaryRoles.length > 0 ? `
                        <div class="info-item">
                            <div class="info-label">Ruoli Secondari</div>
                            <div class="info-value">${player.secondaryRoles.map(r => escapeHtml(r)).join(', ')}</div>
                        </div>
                    ` : ''}
                    
                    <div class="info-item">
                        <div class="info-label">Email di Contatto</div>
                        <div class="info-value">${escapeHtml(player.email)}</div>
                    </div>

                    ${team ? `
                        <div class="info-item">
                            <div class="info-label">Squadra Attuale</div>
                            <div class="info-value">
                                <i class="fas fa-shield-alt" style="color: #3b82f6;"></i>
                                ${escapeHtml(team.name)}
                            </div>
                        </div>
                    ` : ''}

                    <div class="info-item">
                        <div class="info-label">Cerca Squadra</div>
                        <div class="info-value">
                            ${player.lookingForTeam 
                                ? '<span style="color: #10b981;"><i class="fas fa-check-circle"></i> Sì</span>' 
                                : '<span style="color: #64748b;"><i class="fas fa-times-circle"></i> No</span>'}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bio -->
            ${player.bio ? `
                <div class="profile-section">
                    <h3 class="section-title">
                        <i class="fas fa-quote-left"></i>
                        Bio
                    </h3>
                    <p style="color: #cbd5e1; line-height: 1.6;">${escapeHtml(player.bio)}</p>
                </div>
            ` : ''}

            <!-- Link Social -->
            ${player.instagram || player.tiktok ? `
                <div class="profile-section">
                    <h3 class="section-title">
                        <i class="fas fa-share-alt"></i>
                        Social
                    </h3>
                    <div class="social-links">
                        ${player.instagram ? `
                            <a href="https://instagram.com/${player.instagram}" target="_blank" class="social-link">
                                <i class="fab fa-instagram"></i>
                                @${escapeHtml(player.instagram)}
                            </a>
                        ` : ''}
                        ${player.tiktok ? `
                            <a href="https://tiktok.com/@${player.tiktok}" target="_blank" class="social-link">
                                <i class="fab fa-tiktok"></i>
                                @${escapeHtml(player.tiktok)}
                            </a>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
        </div>

        <!-- Statistiche Feedback -->
        ${stats && stats.totalFeedbacks > 0 ? `
            <div class="profile-card">
                <h3 class="section-title">
                    <i class="fas fa-chart-bar"></i>
                    Statistiche Feedback
                </h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Totale Recensioni</div>
                        <div class="info-value">${stats.totalFeedbacks}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Valutazione Media</div>
                        <div class="info-value">
                            <i class="fas fa-star" style="color: #fbbf24;"></i>
                            ${stats.averageRating}/5
                        </div>
                    </div>
                </div>

                ${stats.topTags && stats.topTags.length > 0 ? `
                    <div class="profile-section">
                        <h4 class="section-title" style="font-size: 1rem;">
                            <i class="fas fa-tags"></i>
                            Tag Più Usati
                        </h4>
                        <div class="tags-container">
                            ${stats.topTags.map(t => `
                                <div class="tag">
                                    ${escapeHtml(t.tag)} (${t.count})
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        ` : ''}

        <!-- Lista Feedback -->
        ${feedbacks && feedbacks.length > 0 ? `
            <div class="profile-card">
                <h3 class="section-title">
                    <i class="fas fa-comments"></i>
                    Feedback Ricevuti (${feedbacks.length})
                </h3>
                <div class="feedback-list">
                    ${feedbacks.slice(0, 10).map(f => `
                        <div class="feedback-item">
                            <div class="feedback-header">
                                <span class="feedback-author">
                                    <i class="fas fa-user-circle"></i>
                                    ${escapeHtml(f.fromUsername)}
                                </span>
                                <div class="rating-display" style="font-size: 1rem;">
                                    ${'<i class="fas fa-star"></i>'.repeat(Math.round(f.rating))}
                                    ${'<i class="far fa-star"></i>'.repeat(5 - Math.round(f.rating))}
                                </div>
                            </div>
                            ${f.tags && f.tags.length > 0 ? `
                                <div class="tags-container" style="margin: 10px 0;">
                                    ${f.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                                </div>
                            ` : ''}
                            ${f.comment ? `
                                <p class="feedback-comment">${escapeHtml(f.comment)}</p>
                            ` : ''}
                            <div class="feedback-date">
                                ${formatDate(f.createdAt)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        <!-- Azioni Condivisione -->
        <div class="share-actions">
            <button class="btn-share" onclick="copyShareLink()">
                <i class="fas fa-copy"></i>
                Copia Link
            </button>
            <a href="/" class="btn-share">
                <i class="fas fa-home"></i>
                Vai alla Piattaforma
            </a>
        </div>
    `;
}

/**
 * Renderizza profilo squadra
 */
function renderTeamProfile(data) {
    const { data: team, members, feedbacks, stats } = data;

    // Aggiorna meta tags per SEO
    updateMetaTags(
        `${team.name} - Pro Club Hub`,
        `Squadra ${team.name} • ${team.platform} • ${team.membersCount} membri`
    );

    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <!-- Card Squadra Principale -->
        <div class="profile-card">
            <div class="profile-header">
                <div class="profile-avatar">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div class="profile-info">
                    <h2 class="profile-name">${escapeHtml(team.name)}</h2>
                    <div class="profile-stats">
                        <div class="stat-item">
                            <i class="fas fa-users"></i>
                            <span>${team.membersCount} membri</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-gamepad"></i>
                            <span>${escapeHtml(team.platform)}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-flag"></i>
                            <span>${escapeHtml(team.nationality)}</span>
                        </div>
                    </div>
                    ${team.averageRating > 0 ? `
                        <div class="rating-display">
                            <i class="fas fa-star"></i>
                            <strong>${team.averageRating.toFixed(1)}</strong>
                            <span style="color: #94a3b8;">(${team.feedbackCount} recensioni)</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Descrizione -->
            ${team.description ? `
                <div class="profile-section">
                    <h3 class="section-title">
                        <i class="fas fa-info-circle"></i>
                        Descrizione
                    </h3>
                    <p style="color: #cbd5e1; line-height: 1.6;">${escapeHtml(team.description)}</p>
                </div>
            ` : ''}

            <!-- Informazioni -->
            <div class="profile-section">
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Cerca Giocatori</div>
                        <div class="info-value">
                            ${team.lookingForPlayers 
                                ? '<span style="color: #10b981;"><i class="fas fa-check-circle"></i> Sì</span>' 
                                : '<span style="color: #64748b;"><i class="fas fa-times-circle"></i> No</span>'}
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Data Creazione</div>
                        <div class="info-value">${formatDate(team.createdAt)}</div>
                    </div>
                </div>
            </div>

            <!-- Link Social -->
            ${team.instagram || team.tiktok || team.liveLink ? `
                <div class="profile-section">
                    <h3 class="section-title">
                        <i class="fas fa-share-alt"></i>
                        Social & Live
                    </h3>
                    <div class="social-links">
                        ${team.instagram ? `
                            <a href="https://instagram.com/${team.instagram}" target="_blank" class="social-link">
                                <i class="fab fa-instagram"></i>
                                @${escapeHtml(team.instagram)}
                            </a>
                        ` : ''}
                        ${team.tiktok ? `
                            <a href="https://tiktok.com/@${team.tiktok}" target="_blank" class="social-link">
                                <i class="fab fa-tiktok"></i>
                                @${escapeHtml(team.tiktok)}
                            </a>
                        ` : ''}
                        ${team.liveLink ? `
                            <a href="${team.liveLink}" target="_blank" class="social-link">
                                <i class="fas fa-video"></i>
                                Guarda Live
                            </a>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
        </div>

        <!-- Membri Squadra -->
        ${members && members.length > 0 ? `
            <div class="profile-card">
                <h3 class="section-title">
                    <i class="fas fa-users"></i>
                    Membri (${members.length})
                </h3>
                <div class="members-grid">
                    ${members.map(m => `
                        <div class="member-card ${m.isCaptain ? 'captain' : ''}">
                            <div class="member-name">${escapeHtml(m.username)}</div>
                            <div class="member-role">${escapeHtml(m.primaryRole)}</div>
                            <div class="member-role">Livello ${m.level}</div>
                            ${m.isCaptain ? '<div class="captain-badge">⭐ CAPITANO</div>' : ''}
                            ${m.isViceCaptain ? '<div class="captain-badge" style="background: #8b5cf6;">VICE</div>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        <!-- Lista Feedback (primi 10) -->
        ${feedbacks && feedbacks.length > 0 ? `
            <div class="profile-card">
                <h3 class="section-title">
                    <i class="fas fa-comments"></i>
                    Feedback Ricevuti (${feedbacks.length})
                </h3>
                <div class="feedback-list">
                    ${feedbacks.slice(0, 10).map(f => `
                        <div class="feedback-item">
                            <div class="feedback-header">
                                <span class="feedback-author">
                                    <i class="fas fa-user-circle"></i>
                                    ${escapeHtml(f.fromUsername)}
                                </span>
                                <div class="rating-display" style="font-size: 1rem;">
                                    ${'<i class="fas fa-star"></i>'.repeat(Math.round(f.rating))}
                                    ${'<i class="far fa-star"></i>'.repeat(5 - Math.round(f.rating))}
                                </div>
                            </div>
                            ${f.tags && f.tags.length > 0 ? `
                                <div class="tags-container" style="margin: 10px 0;">
                                    ${f.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                                </div>
                            ` : ''}
                            ${f.comment ? `
                                <p class="feedback-comment">${escapeHtml(f.comment)}</p>
                            ` : ''}
                            <div class="feedback-date">
                                ${formatDate(f.createdAt)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        <!-- Azioni Condivisione -->
        <div class="share-actions">
            <button class="btn-share" onclick="copyShareLink()">
                <i class="fas fa-copy"></i>
                Copia Link
            </button>
            <a href="/" class="btn-share">
                <i class="fas fa-home"></i>
                Vai alla Piattaforma
            </a>
        </div>
    `;
}

/**
 * Mostra errore quando il profilo non è trovato
 */
function showError(title, message) {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="error-container">
            <div class="error-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h2 class="error-title">${escapeHtml(title)}</h2>
            <p class="error-message">${escapeHtml(message)}</p>
            <a href="/" class="btn-home">
                <i class="fas fa-home"></i>
                Torna alla Home
            </a>
        </div>
    `;
}

/**
 * Copia il link di condivisione negli appunti
 */
function copyShareLink() {
    const link = window.location.href;
    
    navigator.clipboard.writeText(link).then(() => {
        // Feedback visivo
        const btn = event.target.closest('.btn-share');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Link Copiato!';
        btn.style.background = 'rgba(16, 185, 129, 0.2)';
        btn.style.color = '#10b981';
        btn.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
            btn.style.color = '';
            btn.style.borderColor = '';
        }, 2000);
    }).catch(err => {
        console.error('Error copying link:', err);
        alert('Errore nella copia del link. Copia manualmente l\'URL dalla barra degli indirizzi.');
    });
}

/**
 * Aggiorna i meta tag per SEO e social sharing
 */
function updateMetaTags(title, description) {
    document.title = title;
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.content = description;
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = title;
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = description;
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = window.location.href;
}

/**
 * Formatta una data in formato leggibile
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    };
    return date.toLocaleDateString('it-IT', options);
}

/**
 * Escapa caratteri HTML per prevenire XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}
