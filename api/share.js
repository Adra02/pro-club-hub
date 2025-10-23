import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { TeamModel } from '../models/Team.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');

    console.log('Share request:', { type, id });

    if (!type || !id) {
      return res.status(400).send(renderError('Parametri mancanti'));
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).send(renderError('ID non valido'));
    }

    const { db } = await connectToDatabase();
    const userModel = new UserModel(db);
    const teamModel = new TeamModel(db);

    if (type === 'player') {
      const user = await userModel.findById(id);
      if (!user) {
        return res.status(404).send(renderError('Giocatore non trovato'));
      }
      const sanitized = userModel.sanitizeUser(user);
      return res.status(200).send(renderPlayer(sanitized, req));
    }

    if (type === 'team') {
      const team = await teamModel.findById(id);
      if (!team) {
        return res.status(404).send(renderError('Squadra non trovata'));
      }
      return res.status(200).send(renderTeam(team, req));
    }

    return res.status(400).send(renderError('Type deve essere "player" o "team"'));

  } catch (error) {
    console.error('Share error:', error);
    return res.status(500).send(renderError('Errore del server'));
  }
}

function getBaseUrl(req) {
  const host = req.headers.host || 'proclubhub.vercel.app';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${host}`;
}

function renderPlayer(user, req) {
  const baseUrl = getBaseUrl(req);
  return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${user.username} - Pro Club Hub</title>
    <meta property="og:title" content="${user.username} - Pro Club Hub">
    <meta property="og:description" content="${user.primaryRole} • Livello ${user.level} • ${user.platform}">
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
        }
        .logo {
            font-size: 2rem;
            font-weight: 900;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 2rem;
            text-align: center;
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
        h1 {
            font-size: 1.75rem;
            margin-bottom: 0.5rem;
            color: #f1f5f9;
        }
        .role {
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
        .rating { color: #fbbf24; }
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
            text-decoration: none;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">⚽ PRO CLUB HUB</div>
        <div class="player-card">
            <div class="player-header">
                <div class="avatar">👤</div>
                <div>
                    <h1>${user.username}</h1>
                    <div class="role">${user.primaryRole}</div>
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
        <a href="${baseUrl}" class="btn">🚀 Apri Pro Club Hub</a>
    </div>
</body>
</html>`;
}

function renderTeam(team, req) {
  const baseUrl = getBaseUrl(req);
  return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${team.name} - Pro Club Hub</title>
    <meta property="og:title" content="${team.name} - Pro Club Hub">
    <meta property="og:description" content="${team.platform} • ${team.members.length} membri">
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
        }
        .logo {
            font-size: 2rem;
            font-weight: 900;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 2rem;
            text-align: center;
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
        h1 {
            font-size: 1.75rem;
            margin-bottom: 0.5rem;
            color: #f1f5f9;
        }
        .platform {
            color: #3b82f6;
            font-weight: 600;
            font-size: 1.1rem;
        }
        .description {
            color: #cbd5e1;
            line-height: 1.6;
            margin: 1.5rem 0;
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
        .rating { color: #fbbf24; }
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
            text-decoration: none;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">⚽ PRO CLUB HUB</div>
        <div class="team-card">
            <div class="team-header">
                <div class="avatar">🛡️</div>
                <div>
                    <h1>${team.name}</h1>
                    <div class="platform">${team.platform}</div>
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
        <a href="${baseUrl}" class="btn">🚀 Apri Pro Club Hub</a>
    </div>
</body>
</html>`;
}

function renderError(message) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Errore - Pro Club Hub</title>
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
        h1 { font-size: 4rem; color: #ef4444; margin-bottom: 1rem; }
        h2 { color: #f1f5f9; margin-bottom: 1rem; }
        p { color: #cbd5e1; line-height: 1.6; }
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
</html>`;
}
