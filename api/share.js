import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { TeamModel } from '../models/Team.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // CRITICAL: Permetti GET senza autenticazione
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // CRITICAL FIX: Estrai parametri da URL
    const url = new URL(req.url, `https://${req.headers.host}`);
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');

    console.log('📍 Share request:', { type, id, fullUrl: req.url });

    if (!type || !id) {
      return renderNotFound(res, 'Parametri mancanti. Usa: /api/share?type=player&id=xxx');
    }

    // CRITICAL FIX: Verifica che l'ID sia valido
    if (!ObjectId.isValid(id)) {
      console.error('❌ Invalid ObjectId:', id);
      return renderNotFound(res, 'ID non valido');
    }

    const { db } = await connectToDatabase();
    const userModel = new UserModel(db);
    const teamModel = new TeamModel(db);

    // Condivisione giocatore
    if (type === 'player') {
      const user = await userModel.findById(id);

      if (!user) {
        console.error('❌ Player not found:', id);
        return renderNotFound(res, 'Giocatore non trovato');
      }

      const sanitized = userModel.sanitizeUser(user);
      return renderPlayerPreview(res, sanitized, req);
    }

    // Condivisione squadra
    if (type === 'team') {
      const team = await teamModel.findById(id);

      if (!team) {
        console.error('❌ Team not found:', id);
        return renderNotFound(res, 'Squadra non trovata');
      }

      return renderTeamPreview(res, team, req);
    }

    return renderNotFound(res, 'Type deve essere "player" o "team"');

  } catch (error) {
    console.error('❌ Share endpoint error:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Errore - Pro Club Hub</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #0a0f1e;
            color: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 2rem;
          }
          .error-box {
            background: #1e293b;
            border: 2px solid #ef4444;
            border-radius: 16px;
            padding: 2rem;
            max-width: 500px;
            text-align: center;
          }
          h1 { color: #ef4444; margin-bottom: 1rem; }
          p { color: #cbd5e1; margin-bottom: 0.5rem; }
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>⚠️ Errore del server</h1>
          <p>${error.message}</p>
        </div>
      </body>
      </html>
    `);
  }
}

function getBaseUrl(req) {
  const host = req.headers.host || 'proclubhub.vercel.app';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${host}`;
}

function renderPlayerPreview(res, user, req) {
  const baseUrl = getBaseUrl(req);
  const userId = user._id.toString();
  const shareUrl = `${baseUrl}/api/share?type=player&id=${userId}`;

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${user.username} - Pro Club Hub</title>
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${user.username} - Pro Club Hub">
    <meta property="og:description" content="${user.primaryRole} • Livello ${user.level} • ${user.platform} • ⭐ ${user.averageRating.toFixed(1)}">
    <meta property="og:type" content="profile">
    <meta property="og:url" content="${shareUrl}">
    <meta property="og:site_name" content="Pro Club Hub">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${user.username} - Pro Club Hub">
    <meta name="twitter:description" content="${user.primaryRole} • Livello ${user.level}">
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #f1f5f9;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        .container {
            background: rgba(30, 41, 59, 0.95);
            border-radius: 24px;
            border: 2px solid rgba(59, 130, 246, 0.3);
            padding: 3rem;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
        }
        .header {
            text-align: center;
            margin-bottom: 2rem;
        }
        .logo {
            font-size: 2rem;
            font-weight: 900;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }
        .subtitle {
            color: #94a3b8;
            font-size: 0.95rem;
        }
        .player-card {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 20px;
            padding: 2rem;
            border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .player-header {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            flex-shrink: 0;
        }
        .player-info h1 {
            font-size: 1.75rem;
            margin-bottom: 0.5rem;
            color: #f1f5f9;
        }
        .player-role {
            color: #3b82f6;
            font-weight: 600;
            font-size: 1.1rem;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-top: 1.5rem;
        }
        .stat-box {
            background: rgba(15, 23, 42, 0.7);
            padding: 1rem;
            border-radius: 12px;
            border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .stat-label {
            color: #94a3b8;
            font-size: 0.85rem;
            margin-bottom: 0.3rem;
        }
        .stat-value {
            color: #f1f5f9;
            font-size: 1.2rem;
            font-weight: 700;
        }
        .rating {
            color: #fbbf24;
        }
        .btn {
            display: block;
            width: 100%;
            padding: 1rem;
            margin-top: 2rem;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
            text-align: center;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
        }
        .footer {
            text-align: center;
            margin-top: 2rem;
            color: #64748b;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">⚽ PRO CLUB HUB</div>
            <div class="subtitle">Profilo Giocatore</div>
        </div>
        
        <div class="player-card">
            <div class="player-header">
                <div class="avatar">👤</div>
                <div class="player-info">
                    <h1>${user.username}</h1>
                    <div class="player-role">${user.primaryRole}</div>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-label">🏆 Livello</div>
                    <div class="stat-value">${user.level}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">🎮 Piattaforma</div>
                    <div class="stat-value">${user.platform}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">⭐ Rating</div>
                    <div class="stat-value rating">${user.averageRating.toFixed(1)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">💬 Feedback</div>
                    <div class="stat-value">${user.feedbackCount}</div>
                </div>
            </div>
        </div>
        
        <a href="${baseUrl}" class="btn">
            🚀 Apri Pro Club Hub
        </a>
        
        <div class="footer">
            Scopri la community per i giocatori di Pro Club
        </div>
    </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
}

function renderTeamPreview(res, team, req) {
  const baseUrl = getBaseUrl(req);
  const teamId = team._id.toString();
  const shareUrl = `${baseUrl}/api/share?type=team&id=${teamId}`;

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${team.name} - Pro Club Hub</title>
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${team.name} - Pro Club Hub">
    <meta property="og:description" content="${team.platform} • ${team.members.length} membri • ⭐ ${team.averageRating.toFixed(1)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${shareUrl}">
    <meta property="og:site_name" content="Pro Club Hub">
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #f1f5f9;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        .container {
            background: rgba(30, 41, 59, 0.95);
            border-radius: 24px;
            border: 2px solid rgba(59, 130, 246, 0.3);
            padding: 3rem;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
        }
        .header {
            text-align: center;
            margin-bottom: 2rem;
        }
        .logo {
            font-size: 2rem;
            font-weight: 900;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }
        .subtitle {
            color: #94a3b8;
            font-size: 0.95rem;
        }
        .team-card {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 20px;
            padding: 2rem;
            border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .team-header {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            flex-shrink: 0;
        }
        .team-info h1 {
            font-size: 1.75rem;
            margin-bottom: 0.5rem;
            color: #f1f5f9;
        }
        .team-platform {
            color: #3b82f6;
            font-weight: 600;
            font-size: 1.1rem;
        }
        .description {
            color: #cbd5e1;
            line-height: 1.6;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: rgba(15, 23, 42, 0.5);
            border-radius: 12px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-top: 1.5rem;
        }
        .stat-box {
            background: rgba(15, 23, 42, 0.7);
            padding: 1rem;
            border-radius: 12px;
            border: 1px solid rgba(59, 130, 246, 0.2);
            text-align: center;
        }
        .stat-label {
            color: #94a3b8;
            font-size: 0.85rem;
            margin-bottom: 0.3rem;
        }
        .stat-value {
            color: #f1f5f9;
            font-size: 1.2rem;
            font-weight: 700;
        }
        .rating {
            color: #fbbf24;
        }
        .btn {
            display: block;
            width: 100%;
            padding: 1rem;
            margin-top: 2rem;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
            text-align: center;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
        }
        .footer {
            text-align: center;
            margin-top: 2rem;
            color: #64748b;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">⚽ PRO CLUB HUB</div>
            <div class="subtitle">Profilo Squadra</div>
        </div>
        
        <div class="team-card">
            <div class="team-header">
                <div class="avatar">🛡️</div>
                <div class="team-info">
                    <h1>${team.name}</h1>
                    <div class="team-platform">${team.platform}</div>
                </div>
            </div>
            
            ${team.description ? `<div class="description">${team.description}</div>` : ''}
            
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-label">👥 Membri</div>
                    <div class="stat-value">${team.members.length}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">⭐ Rating</div>
                    <div class="stat-value rating">${team.averageRating.toFixed(1)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">💬 Feedback</div>
                    <div class="stat-value">${team.feedbackCount}</div>
                </div>
            </div>
        </div>
        
        <a href="${baseUrl}" class="btn">
            🚀 Apri Pro Club Hub
        </a>
        
        <div class="footer">
            Scopri la community per i giocatori di Pro Club
        </div>
    </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
}

function renderNotFound(res, message) {
  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Non Trovato - Pro Club Hub</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: #0a0f1e;
            color: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
        }
        .error-box {
            background: #1e293b;
            border: 2px solid #ef4444;
            border-radius: 16px;
            padding: 3rem;
            max-width: 500px;
            text-align: center;
        }
        h1 {
            font-size: 4rem;
            color: #ef4444;
            margin-bottom: 1rem;
        }
        h2 {
            color: #f1f5f9;
            margin-bottom: 1rem;
        }
        p {
            color: #cbd5e1;
            line-height: 1.6;
        }
        .btn {
            display: inline-block;
            margin-top: 2rem;
            padding: 1rem 2rem;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
        }
    </style>
</head>
<body>
    <div class="error-box">
        <h1>404</h1>
        <h2>Non Trovato</h2>
        <p>${message}</p>
        <a href="https://proclubhub.vercel.app" class="btn">Torna alla Home</a>
    </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  return res.status(404).send(html);
}
