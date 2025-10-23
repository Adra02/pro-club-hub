import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { TeamModel } from '../models/Team.js';
import { authenticateRequest } from '../lib/auth.js';
import { ObjectId } from 'mongodb';

/**
 * API /api/preferiti
 * 
 * Gestisce il sistema preferiti per giocatori e squadre
 * Un unico endpoint per risparmiare funzioni Vercel
 * 
 * GET    /api/preferiti                  - Ottieni preferiti dell'utente
 * POST   /api/preferiti?action=add       - Aggiungi a preferiti
 * DELETE /api/preferiti?action=remove    - Rimuovi da preferiti
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

    // GET - Ottieni preferiti
    if (req.method === 'GET') {
      const preferiti = await userModel.getPreferiti(userId);

      // CRITICAL FIX: Converti ObjectId in stringhe e popola i dettagli
      const giocatoriIds = (preferiti.giocatori || []).map(id => 
        id instanceof ObjectId ? id.toString() : id.toString()
      );
      const squadreIds = (preferiti.squadre || []).map(id => 
        id instanceof ObjectId ? id.toString() : id.toString()
      );

      // Popola i dettagli dei giocatori
      const giocatoriDetails = await Promise.all(
        giocatoriIds.map(async (id) => {
          try {
            const user = await userModel.findById(id);
            if (!user) return null;
            const sanitized = userModel.sanitizeUser(user);
            // CRITICAL FIX: Assicurati che _id sia una stringa
            return {
              ...sanitized,
              _id: sanitized._id.toString()
            };
          } catch (error) {
            console.error(`Error loading player ${id}:`, error);
            return null;
          }
        })
      );

      // Popola i dettagli delle squadre
      const squadreDetails = await Promise.all(
        squadreIds.map(async (id) => {
          try {
            const team = await teamModel.findById(id);
            if (!team) return null;
            // CRITICAL FIX: Converti ObjectId in stringhe
            return {
              ...team,
              _id: team._id.toString(),
              captain: team.captain.toString(),
              viceCaptain: team.viceCaptain ? team.viceCaptain.toString() : null,
              members: team.members.map(m => m.toString())
            };
          } catch (error) {
            console.error(`Error loading team ${id}:`, error);
            return null;
          }
        })
      );

      return res.status(200).json({
        preferiti: {
          giocatori: giocatoriDetails.filter(g => g !== null),
          squadre: squadreDetails.filter(s => s !== null)
        }
      });
    }

    // POST - Aggiungi a preferiti
    if (req.method === 'POST' && req.query.action === 'add') {
      const { targetId, type } = req.body;

      if (!targetId || !type) {
        return res.status(400).json({ error: 'targetId e type sono richiesti' });
      }

      if (type !== 'giocatori' && type !== 'squadre') {
        return res.status(400).json({ error: 'type deve essere "giocatori" o "squadre"' });
      }

      // CRITICAL FIX: Valida ObjectId
      if (!ObjectId.isValid(targetId)) {
        return res.status(400).json({ error: 'ID non valido' });
      }

      // Verifica che il target esista
      if (type === 'giocatori') {
        const target = await userModel.findById(targetId);
        if (!target) {
          return res.status(404).json({ error: 'Giocatore non trovato' });
        }
      } else {
        const target = await teamModel.findById(targetId);
        if (!target) {
          return res.status(404).json({ error: 'Squadra non trovata' });
        }
      }

      await userModel.addPreferito(userId, targetId, type);

      return res.status(200).json({
        message: 'Aggiunto ai preferiti',
        success: true
      });
    }

    // DELETE - Rimuovi da preferiti
    if (req.method === 'DELETE' && req.query.action === 'remove') {
      const { targetId, type } = req.body;

      if (!targetId || !type) {
        return res.status(400).json({ error: 'targetId e type sono richiesti' });
      }

      if (type !== 'giocatori' && type !== 'squadre') {
        return res.status(400).json({ error: 'type deve essere "giocatori" o "squadre"' });
      }

      // CRITICAL FIX: Valida ObjectId
      if (!ObjectId.isValid(targetId)) {
        return res.status(400).json({ error: 'ID non valido' });
      }

      await userModel.removePreferito(userId, targetId, type);

      return res.status(200).json({
        message: 'Rimosso dai preferiti',
        success: true
      });
    }

    return res.status(404).json({ error: 'Endpoint non trovato' });

  } catch (error) {
    console.error('Preferiti endpoint error:', error);
    return res.status(500).json({
      error: error.message || 'Errore durante l\'operazione'
    });
  }
}
