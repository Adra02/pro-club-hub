// ============================================
// SHARE.JS - Endpoint API per condivisione profili
// Endpoint serverless per recuperare dati profili pubblici
// ============================================

import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { TeamModel } from '../models/Team.js';
import { FeedbackModel } from '../models/Feedback.js';
import { ObjectId } from 'mongodb';

/**
 * API /api/share
 * 
 * Endpoint PUBBLICO (non richiede autenticazione) per visualizzare profili condivisi
 * 
 * GET /api/share?type=player&id=XXX - Ottieni profilo giocatore
 * GET /api/share?type=team&id=XXX   - Ottieni profilo squadra
 */

export default async function handler(req, res) {
  try {
    // Solo metodo GET
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Metodo non consentito' });
    }

    const { type, id } = req.query;

    // Validazione parametri
    if (!type || !id) {
      return res.status(400).json({ 
        error: 'Parametri type e id sono obbligatori' 
      });
    }

    // Validazione tipo
    if (type !== 'player' && type !== 'team') {
      return res.status(400).json({ 
        error: 'Il tipo deve essere "player" o "team"' 
      });
    }

    // Validazione ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: 'ID non valido' 
      });
    }

    const { db } = await connectToDatabase();
    const userModel = new UserModel(db);
    const teamModel = new TeamModel(db);
    const feedbackModel = new FeedbackModel(db);

    // === PROFILO GIOCATORE ===
    if (type === 'player') {
      const player = await userModel.findById(id);
      
      if (!player) {
        return res.status(404).json({ 
          error: 'Giocatore non trovato' 
        });
      }

      // Sanitizza dati giocatore (rimuovi dati sensibili)
      const sanitizedPlayer = userModel.sanitizeUser(player);

      // Recupera squadra se presente
      let team = null;
      if (player.team) {
        team = await teamModel.findById(player.team.toString());
      }

      // Recupera feedback
      const feedbacks = await feedbackModel.getFeedbackForUser(id);
      
      // Popola i nomi degli autori dei feedback
      const feedbacksWithAuthors = await Promise.all(
        feedbacks.map(async (fb) => {
          const author = await userModel.findById(fb.fromUser.toString());
          return {
            ...fb,
            fromUsername: author ? author.username : 'Utente Eliminato'
          };
        })
      );

      // Calcola statistiche feedback
      const stats = await feedbackModel.calculateUserStats(id);

      // Conta tag più usati
      const tagCounts = {};
      feedbacksWithAuthors.forEach(fb => {
        fb.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));

      return res.status(200).json({
        data: sanitizedPlayer,
        team: team ? {
          _id: team._id,
          name: team.name,
          platform: team.platform
        } : null,
        feedbacks: feedbacksWithAuthors,
        stats: {
          totalFeedbacks: stats.count,
          averageRating: stats.average,
          topTags
        }
      });
    }

    // === PROFILO SQUADRA ===
    if (type === 'team') {
      const team = await teamModel.findById(id);
      
      if (!team) {
        return res.status(404).json({ 
          error: 'Squadra non trovata' 
        });
      }

      // Recupera dettagli membri
      const members = await Promise.all(
        team.members.map(async (memberId) => {
          const member = await userModel.findById(memberId.toString());
          if (!member) return null;
          
          return {
            _id: member._id,
            username: member.username,
            primaryRole: member.primaryRole,
            level: member.level,
            isCaptain: team.captain.toString() === memberId.toString(),
            isViceCaptain: team.viceCaptain ? 
              team.viceCaptain.toString() === memberId.toString() : false
          };
        })
      );

      // Recupera feedback
      const feedbacks = await feedbackModel.getFeedbackForTeam(id);
      
      // Popola i nomi degli autori dei feedback
      const feedbacksWithAuthors = await Promise.all(
        feedbacks.map(async (fb) => {
          const author = await userModel.findById(fb.fromUser.toString());
          return {
            ...fb,
            fromUsername: author ? author.username : 'Utente Eliminato'
          };
        })
      );

      // Calcola statistiche feedback
      const stats = await feedbackModel.calculateTeamStats(id);

      // Conta tag più usati
      const tagCounts = {};
      feedbacksWithAuthors.forEach(fb => {
        fb.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));

      return res.status(200).json({
        data: {
          ...team,
          membersCount: members.filter(m => m !== null).length
        },
        members: members.filter(m => m !== null),
        feedbacks: feedbacksWithAuthors,
        stats: {
          totalFeedbacks: stats.count,
          averageRating: stats.average,
          topTags
        }
      });
    }

  } catch (error) {
    console.error('Share endpoint error:', error);
    return res.status(500).json({ 
      error: 'Errore durante il caricamento del profilo' 
    });
  }
}
