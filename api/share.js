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
    const { type, id } = req.query;

    console.log('Share request:', { type, id, query: req.query, url: req.url });

    if (!type || !id) {
      return renderNotFound(res, 'Parametri mancanti. Usa: /api/share?type=player&id=xxx');
    }

    // CRITICAL FIX: Verifica che l'ID sia valido
    if (!ObjectId.isValid(id)) {
      console.error('Invalid ObjectId:', id);
      return renderNotFound(res, 'ID non valido');
    }

    const { db } = await connectToDatabase();
    const userModel = new UserModel(db);
    const teamModel = new TeamModel(db);

    // Condivisione giocatore
    if (type === 'player') {
      const user = await userModel.findById(id);

      if (!user) {
        console.error('Player not found:', id);
        return renderNotFound(res, 'Giocatore non trovato');
      }

      const sanitized = userModel.sanitizeUser(user);
      return renderPlayerPreview(res, sanitized, req);
    }

    // Condivisione squadra
    if (type === 'team') {
      const team = await teamModel.findById(id);

      if (!team) {
        console.error('Team not found:', id);
        return renderNotFound(res, 'Squadra non trovata');
      }

      return renderTeamPreview(res, team, req);
    }

    return renderNotFound(res, 'Type deve essere "player" o "team"');

  } catch (error) {
    console.error('Share endpoint error:', error);
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
          code { background: #0f172a; padding: 0.5rem; border-radius: 8px; display: block; margin: 1rem 0; }
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>⚠️ Errore del server</h1>
          <p>${error.message}</p>
          <code>${error.stack?.split('\n')[0] || 'No stack trace'}</code>
        </div>
      </body>
      </html>
    `);
  }
}

function getBaseUrl(req) {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (req.headers.host) {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    return `${protocol}://${req.headers.host}`;
  }
  return 'https://proclubhub.vercel.app';
}

function renderPlayerPreview(res, user, req) {
  const baseUrl = getBaseUrl(req);
  // CRITICAL FIX: Converti ObjectId in stringa
  const userId = user._id instanceof ObjectId ? user._id.toString() : user._id;
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
            border: 2px solid rgba(59, 130, 246, 0.3);
            border-radius: 24px;
            padding: 3rem;
            max-width: 600px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }
        .icon {
            font-size: 5rem;
            margin-bottom: 1.5rem;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .role {
            font-size: 1.2rem;
            color: #94a3b8;
            margin-bottom: 2rem;
        }
        .stats {
            display: flex;
            gap: 1.5rem;
            justify-content: center;
            margin: 2rem 0;
            flex-wrap: wrap;
        }
        .stat {
            background: rgba(59, 130, 246, 0.1);
            border: 2px solid rgba(59, 130, 246, 0.3);
            border-radius: 12px;
            padding: 1rem 1.5rem;
        }
        .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.25rem;
        }
        .stat-label {
            font-size: 0.9rem;
            color: #94a3b8;
        }
        .btn {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 1rem 2rem;
            border-radius: 12px;
            text-decoration: none;
            display: inline-block;
            font-weight: 700;
            font-size: 1.1rem;
            margin-top: 2rem;
            transition: transform 0.3s;
        }
        .btn:hover {
            transform: translateY(-3px);
        }
        .redirect-msg {
            margin-top: 2rem;
            font-size: 0.9rem;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">⚽</div>
        <h1>${user.username}</h1>
        <div class="role">${user.primaryRole}</div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">${user.level}</div>
                <div class="stat-label">Livello</div>
            </div>
            <div class="stat">
                <div class="stat-value">${user.platform}</div>
                <div class="stat-label">Piattaforma</div>
            </div>
            <div class="stat">
                <div class="stat-value">⭐ ${user.averageRating.toFixed(1)}</div>
                <div class="stat-label">${user.feedbackCount} feedback</div>
            </div>
        </div>
        
        <a href="${baseUrl}" class="btn">
            Apri Pro Club Hub
        </a>
        
        <div class="redirect-msg">
            Clicca il pulsante per visitare Pro Club Hub
        </div>
    </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}

function renderTeamPreview(res, team, req) {
  const baseUrl = getBaseUrl(req);
  // CRITICAL FIX: Converti ObjectId in stringa
  const teamId = team._id instanceof ObjectId ? team._id.toString() : team._id;
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
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${team.name} - Pro Club Hub">
    <meta name="twitter:description" content="${team.platform} • ${team.members.length} membri">
    
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
            border: 2px solid rgba(59, 130, 246, 0.3);
            border-radius: 24px;
            padding: 3rem;
            max-width: 600px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }
        .icon {
            font-size: 5rem;
            margin-bottom: 1.5rem;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .description {
            font-size: 1.1rem;
            color: #cbd5e1;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        .stats {
            display: flex;
            gap: 1.5rem;
            justify-content: center;
            margin: 2rem 0;
            flex-wrap: wrap;
        }
        .stat {
            background: rgba(59, 130, 246, 0.1);
            border: 2px solid rgba(59, 130, 246, 0.3);
            border-radius: 12px;
            padding: 1rem 1.5rem;
        }
        .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.25rem;
        }
        .stat-label {
            font-size: 0.9rem;
            color: #94a3b8;
        }
        .btn {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 1rem 2rem;
            border-radius: 12px;
            text-decoration: none;
            display: inline-block;
            font-weight: 700;
            font-size: 1.1rem;
            margin-top: 2rem;
            transition: transform 0.3s;
        }
        .btn:hover {
            transform: translateY(-3px);
        }
        .redirect-msg {
            margin-top: 2rem;
            font-size: 0.9rem;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🛡️</div>
        <h1>${team.name}</h1>
        ${team.description ? `<div class="description">${team.description}</div>` : ''}
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">${team.members.length}</div>
                <div class="stat-label">Membri</div>
            </div>
            <div class="stat">
                <div class="stat-value">${team.platform}</div>
                <div class="stat-label">Piattaforma</div>
            </div>
            <div class="stat">
                <div class="stat-value">⭐ ${team.averageRating.toFixed(1)}</div>
                <div class="stat-label">${team.feedbackCount} feedback</div>
            </div>
        </div>
        
        <a href="${baseUrl}" class="btn">
            Apri Pro Club Hub
        </a>
        
        <div class="redirect-msg">
            Clicca il pulsante per visitare Pro Club Hub
        </div>
    </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}

function renderNotFound(res, message) {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://proclubhub.vercel.app';

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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #f1f5f9;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 2rem;
        }
        .container {
            max-width: 500px;
        }
        h1 { 
            font-size: 3rem; 
            margin-bottom: 1rem;
            color: #ef4444;
        }
        p { 
            font-size: 1.2rem; 
            color: #94a3b8; 
            margin-bottom: 2rem; 
        }
        a {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 1rem 2rem;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 700;
            display: inline-block;
        }
        a:hover {
            transform: translateY(-3px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>❌ ${message}</h1>
        <p>Il contenuto che stai cercando non esiste o è stato rimosso.</p>
        <a href="${baseUrl}">Torna a Pro Club Hub</a>
    </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(404).send(html);
}
