// ============================================
// API /api/preferiti - GESTIONE PREFERITI ✅
// ============================================

import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { TeamModel } from '../models/Team.js';
import { authenticateRequest } from '../lib/auth.js';

/**
 * API /api/preferiti
 * 
 * GET  /api/preferiti                 - Ottieni preferiti utente
 * POST /api/preferiti?action=add      - Aggiungi ai preferiti
 * POST /api/preferiti?action=remove   - Rimuovi dai preferiti
 */

export default async function handler(req, res) {
  // Gestisci CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
        const preferiti = await userModel.getPreferiti(userId);

        // Popola i dettagli dei giocatori
        const giocatoriDetails = await Promise.all(
          (preferiti.giocatori || []).map(async (gId) => {
            const player = await userModel.findById(gId.toString());
            return player ? userModel.sanitizeUser(player) : null;
          })
        );

        // Popola i dettagli delle squadre
        const squadreDetails = await Promise.all(
          (preferiti.squadre || []).map(async (sId) => {
            const team = await teamModel.findById(sId.toString());
            return team || null;
          })
        );

        return res.status(200).json({
          preferiti: {
            giocatori: giocatoriDetails.filter(p => p !== null),
            squadre: squadreDetails.filter(t => t !== null)
          }
        });

      } catch (error) {
        console.error('Get preferiti error:', error);
        return res.status(500).json({ 
          error: 'Errore nel caricamento dei preferiti',
          details: error.message 
        });
      }
    }

    // ============================================
    // POST - Aggiungi ai preferiti
    // ============================================
    if (req.method === 'POST' && req.url.includes('action=add')) {
      try {
        const { targetId, type } = req.body;

        if (!targetId || !type) {
          return res.status(400).json({ 
            error: 'targetId e type sono richiesti' 
          });
        }

        if (type !== 'giocatori' && type !== 'squadre') {
          return res.status(400).json({ 
            error: 'type deve essere "giocatori" o "squadre"' 
          });
        }

        // Verifica che il target esista
        if (type === 'giocatori') {
          const player = await userModel.findById(targetId);
          if (!player) {
            return res.status(404).json({ error: 'Giocatore non trovato' });
          }
        } else {
          const team = await teamModel.findById(targetId);
          if (!team) {
            return res.status(404).json({ error: 'Squadra non trovata' });
          }
        }

        await userModel.addPreferito(userId, targetId, type);

        return res.status(200).json({
          message: 'Aggiunto ai preferiti',
          success: true
        });

      } catch (error) {
        console.error('Add preferito error:', error);
        
        if (error.message.includes('Non puoi aggiungere te stesso')) {
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
    if (req.method === 'POST' && req.url.includes('action=remove')) {
      try {
        const { targetId, type } = req.body;

        if (!targetId || !type) {
          return res.status(400).json({ 
            error: 'targetId e type sono richiesti' 
          });
        }

        if (type !== 'giocatori' && type !== 'squadre') {
          return res.status(400).json({ 
            error: 'type deve essere "giocatori" o "squadre"' 
          });
        }

        await userModel.removePreferito(userId, targetId, type);

        return res.status(200).json({
          message: 'Rimosso dai preferiti',
          success: true
        });

      } catch (error) {
        console.error('Remove preferito error:', error);
        return res.status(500).json({ 
          error: 'Errore nella rimozione dai preferiti',
          details: error.message 
        });
      }
    }

    return res.status(404).json({ error: 'Endpoint non trovato' });

  } catch (error) {
    console.error('❌ Preferiti API error:', error);
    return res.status(500).json({ 
      error: 'Errore del server',
      details: error.message 
    });
  }
}
