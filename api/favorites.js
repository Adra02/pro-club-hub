// ============================================
// API /api/favorites.js - COMPLETO ✅
// ============================================

import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { TeamModel } from '../models/Team.js';
import { authenticateRequest } from '../lib/auth.js';

/**
 * API /api/favorites
 * 
 * GET    /api/favorites              - Ottieni preferiti utente
 * POST   /api/favorites/add          - Aggiungi ai preferiti
 * POST   /api/favorites/remove       - Rimuovi dai preferiti
 */

export default async function handler(req, res) {
  try {
    const userId = await authenticateRequest(req);
    if (!userId) {
      return res.status(401).json({ error: 'Non autenticato' });
    }

    const { db } = await connectToDatabase();
    const userModel = new UserModel(db);
    const teamModel = new TeamModel(db);

    // ============================================
    // GET - Ottieni preferiti
    // ============================================
    if (req.method === 'GET') {
      try {
        const user = await userModel.findById(userId);
        
        if (!user) {
          return res.status(404).json({ error: 'Utente non trovato' });
        }

        const favorites = {
          players: [],
          teams: []
        };

        // Carica giocatori preferiti
        if (user.favoritePlayers && user.favoritePlayers.length > 0) {
          favorites.players = await Promise.all(
            user.favoritePlayers.map(async (playerId) => {
              const player = await userModel.findById(playerId.toString());
              return player ? userModel.sanitizeUser(player) : null;
            })
          );
          favorites.players = favorites.players.filter(p => p !== null);
        }

        // Carica squadre preferite
        if (user.favoriteTeams && user.favoriteTeams.length > 0) {
          favorites.teams = await Promise.all(
            user.favoriteTeams.map(async (teamId) => {
              return await teamModel.findById(teamId.toString());
            })
          );
          favorites.teams = favorites.teams.filter(t => t !== null);
        }

        return res.status(200).json(favorites);

      } catch (error) {
        console.error('Get favorites error:', error);
        return res.status(500).json({ 
          error: 'Errore nel recupero dei preferiti',
          details: error.message 
        });
      }
    }

    // ============================================
    // POST - Aggiungi ai preferiti
    // ============================================
    if (req.method === 'POST' && req.url.includes('/add')) {
      try {
        const { targetId, targetType } = req.body;

        if (!targetId || !targetType) {
          return res.status(400).json({ 
            error: 'targetId e targetType sono richiesti' 
          });
        }

        if (targetType !== 'players' && targetType !== 'teams') {
          return res.status(400).json({ 
            error: 'targetType deve essere "players" o "teams"' 
          });
        }

        // Verifica che il target esista
        if (targetType === 'players') {
          const player = await userModel.findById(targetId);
          if (!player) {
            return res.status(404).json({ error: 'Giocatore non trovato' });
          }
          
          // Non puoi aggiungere te stesso
          if (targetId === userId) {
            return res.status(400).json({ error: 'Non puoi aggiungere te stesso ai preferiti' });
          }
        } else {
          const team = await teamModel.findById(targetId);
          if (!team) {
            return res.status(404).json({ error: 'Squadra non trovata' });
          }
        }

        await userModel.addFavorite(userId, targetId, targetType);

        // Ritorna l'utente aggiornato
        const updatedUser = await userModel.findById(userId);

        return res.status(200).json({
          message: 'Aggiunto ai preferiti',
          user: userModel.sanitizeUser(updatedUser)
        });

      } catch (error) {
        console.error('Add favorite error:', error);
        
        if (error.message.includes('già nei preferiti')) {
          return res.status(400).json({ error: error.message });
        }
        
        return res.status(500).json({ 
          error: 'Errore nell\'aggiunta ai preferiti',
          details: error.message 
        });
      }
    }

    // ============================================
    // POST - Rimuovi dai preferiti
    // ============================================
    if (req.method === 'POST' && req.url.includes('/remove')) {
      try {
        const { targetId, targetType } = req.body;

        if (!targetId || !targetType) {
          return res.status(400).json({ 
            error: 'targetId e targetType sono richiesti' 
          });
        }

        if (targetType !== 'players' && targetType !== 'teams') {
          return res.status(400).json({ 
            error: 'targetType deve essere "players" o "teams"' 
          });
        }

        await userModel.removeFavorite(userId, targetId, targetType);

        // Ritorna l'utente aggiornato
        const updatedUser = await userModel.findById(userId);

        return res.status(200).json({
          message: 'Rimosso dai preferiti',
          user: userModel.sanitizeUser(updatedUser)
        });

      } catch (error) {
        console.error('Remove favorite error:', error);
        return res.status(500).json({ 
          error: 'Errore nella rimozione dai preferiti',
          details: error.message 
        });
      }
    }

    return res.status(404).json({ error: 'Endpoint non trovato' });

  } catch (error) {
    console.error('❌ Favorites API error:', error);
    return res.status(500).json({ 
      error: 'Errore del server',
      details: error.message 
    });
  }
}
