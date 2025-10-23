// ============================================
// API /api/share
// Endpoint unificato per condivisione profili pubblici
// ============================================

import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { TeamModel } from '../models/Team.js';
import { FeedbackModel } from '../models/Feedback.js';
import { ObjectId } from 'mongodb';

/**
 * GET /api/share?type=player&id=XXX  - Ottieni dati profilo giocatore
 * GET /api/share?type=team&id=XXX    - Ottieni dati profilo squadra
 * 
 * NOTA: Questo endpoint è PUBBLICO (non richiede autenticazione)
 * per permettere la condivisione dei profili anche a utenti non loggati
 */
export default async function handler(req, res) {
  // Solo metodo GET consentito
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  try {
    const { type, id } = req.query;

    // Validazione parametri
    if (!type || !id) {
      return res.status(400).json({ 
        error: 'Parametri mancanti',
        details: 'Usa ?type=player&id=XXX oppure ?type=team&id=XXX'
      });
    }

    // Validazione tipo
    if (type !== 'player' && type !== 'team') {
      return res.status(400).json({ 
        error: 'Tipo non valido',
        details: 'Il tipo deve essere "player" o "team"'
      });
    }

    // Validazione ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: 'ID non valido',
        details: 'L\'ID fornito non è un ObjectId valido'
      });
    }

    const { db } = await connectToDatabase();

    // === CONDIVISIONE PROFILO GIOCATORE ===
    if (type === 'player') {
      const userModel = new UserModel(db);
      const feedbackModel = new FeedbackModel(db);

      // Cerca il giocatore
      const player = await userModel.findById(id);

      if (!player) {
        return res.status(404).json({ 
          error: 'Profilo non trovato',
          details: 'Il giocatore con questo ID non esiste'
        });
      }

      // Verifica che il profilo sia completo (requisito per condivisione)
      if (!player.profileCompleted) {
        return res.status(403).json({ 
          error: 'Profilo non disponibile',
          details: 'Questo profilo non è ancora completo e non può essere condiviso'
        });
      }

      // Ottieni feedback del giocatore
      const feedbacks = await feedbackModel.getUserFeedback(id);

      // Calcola statistiche feedback
      const feedbackStats = calculateFeedbackStats(feedbacks);

      // Sanifica i dati del giocatore (rimuovi dati sensibili)
      const publicPlayer = {
        _id: player._id.toString(),
        username: player.username,
        email: player.email, // Visibile pubblicamente per contatto
        primaryRole: player.primaryRole,
        secondaryRoles: player.secondaryRoles || [],
        level: player.level,
        platform: player.platform,
        nationality: player.nationality || 'Non specificata',
        bio: player.bio || '',
        instagram: player.instagram || '',
        tiktok: player.tiktok || '',
        lookingForTeam: player.lookingForTeam || false,
        feedbackCount: player.feedbackCount || 0,
        averageRating: player.averageRating || 0,
        teamId: player.teamId ? player.teamId.toString() : null,
        createdAt: player.createdAt
      };

      // Se il giocatore è in una squadra, aggiungi info squadra
      let teamInfo = null;
      if (player.teamId) {
        const teamModel = new TeamModel(db);
        const team = await teamModel.findById(player.teamId.toString());
        if (team) {
          teamInfo = {
            _id: team._id.toString(),
            name: team.name,
            platform: team.platform
          };
        }
      }

      return res.status(200).json({
        type: 'player',
        data: publicPlayer,
        team: teamInfo,
        feedbacks: feedbacks.map(f => ({
          _id: f._id.toString(),
          rating: f.rating,
          tags: f.tags || [],
          comment: f.comment || '',
          fromUsername: f.fromUser ? f.fromUser.username : 'Anonimo',
          createdAt: f.createdAt
        })),
        stats: feedbackStats
      });
    }

    // === CONDIVISIONE PROFILO SQUADRA ===
    if (type === 'team') {
      const teamModel = new TeamModel(db);
      const userModel = new UserModel(db);
      const feedbackModel = new FeedbackModel(db);

      // Cerca la squadra
      const team = await teamModel.findById(id);

      if (!team) {
        return res.status(404).json({ 
          error: 'Squadra non trovata',
          details: 'La squadra con questo ID non esiste'
        });
      }

      // Ottieni dettagli membri
      const memberDetails = await Promise.all(
        team.members.map(async (memberId) => {
          const user = await userModel.findById(memberId.toString());
          if (!user) return null;
          
          return {
            _id: user._id.toString(),
            username: user.username,
            primaryRole: user.primaryRole,
            level: user.level,
            isCaptain: user._id.toString() === team.captain.toString(),
            isViceCaptain: team.viceCaptain && user._id.toString() === team.viceCaptain.toString()
          };
        })
      );

      // Ottieni feedback della squadra
      const feedbacks = await feedbackModel.getTeamFeedback(id);
      const feedbackStats = calculateFeedbackStats(feedbacks);

      // Dati pubblici della squadra
      const publicTeam = {
        _id: team._id.toString(),
        name: team.name,
        description: team.description || '',
        platform: team.platform,
        nationality: team.nationality || 'Non specificata',
        instagram: team.instagram || '',
        tiktok: team.tiktok || '',
        liveLink: team.liveLink || '',
        lookingForPlayers: team.lookingForPlayers || false,
        feedbackCount: team.feedbackCount || 0,
        averageRating: team.averageRating || 0,
        membersCount: team.members.length,
        createdAt: team.createdAt
      };

      return res.status(200).json({
        type: 'team',
        data: publicTeam,
        members: memberDetails.filter(m => m !== null),
        feedbacks: feedbacks.map(f => ({
          _id: f._id.toString(),
          rating: f.rating,
          tags: f.tags || [],
          comment: f.comment || '',
          fromUsername: f.fromUser ? f.fromUser.username : 'Anonimo',
          createdAt: f.createdAt
        })),
        stats: feedbackStats
      });
    }

  } catch (error) {
    console.error('Share API error:', error);
    return res.status(500).json({ 
      error: 'Errore del server',
      details: error.message 
    });
  }
}

/**
 * Calcola statistiche aggregate dai feedback
 */
function calculateFeedbackStats(feedbacks) {
  if (!feedbacks || feedbacks.length === 0) {
    return {
      totalFeedbacks: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      topTags: []
    };
  }

  // Distribuzione rating
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;

  // Conteggio tag
  const tagCount = {};

  feedbacks.forEach(f => {
    // Rating
    const rating = Math.round(f.rating);
    ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    totalRating += f.rating;

    // Tags
    if (f.tags && Array.isArray(f.tags)) {
      f.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    }
  });

  // Top 5 tag più usati
  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  return {
    totalFeedbacks: feedbacks.length,
    averageRating: (totalRating / feedbacks.length).toFixed(1),
    ratingDistribution,
    topTags
  };
}
