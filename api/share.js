// ============================================
// API ENDPOINT: /api/share.js
// Endpoint serverless per condivisione profili pubblici
// ============================================

import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { TeamModel } from '../models/Team.js';
import { FeedbackModel } from '../models/Feedback.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  try {
    const { type, id } = req.query;

    console.log('[SHARE API] Request received:', { type, id });

    // Validazione parametri
    if (!type || !id) {
      return res.status(400).json({ 
        error: 'Parametri type e id sono obbligatori' 
      });
    }

    if (type !== 'player' && type !== 'team') {
      return res.status(400).json({ 
        error: 'Il tipo deve essere "player" o "team"' 
      });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: 'ID non valido' 
      });
    }

    const { db } = await connectToDatabase();
    const userModel = new UserModel(db);
    const teamModel = new TeamModel(db);
    const feedbackModel = new FeedbackModel(db);

    // === GESTIONE PROFILO GIOCATORE ===
    if (type === 'player') {
      console.log('[SHARE API] Fetching player:', id);
      
      const player = await userModel.findById(id);
      
      if (!player) {
        console.log('[SHARE API] Player not found:', id);
        return res.status(404).json({ 
          error: 'Giocatore non trovato' 
        });
      }

      console.log('[SHARE API] Player found:', player.username);

      // Sanitizza dati
      const sanitizedPlayer = userModel.sanitizeUser(player);

      // Recupera squadra se presente
      let team = null;
      if (player.team) {
        team = await teamModel.findById(player.team.toString());
      }

      // Recupera feedback
      const feedbacks = await feedbackModel.getFeedbackForUser(id);
      
      // Popola autori feedback
      const feedbacksWithAuthors = await Promise.all(
        feedbacks.map(async (fb) => {
          const author = await userModel.findById(fb.fromUser.toString());
          return {
            _id: fb._id,
            rating: fb.rating,
            comment: fb.comment,
            tags: fb.tags,
            createdAt: fb.createdAt,
            fromUsername: author ? author.username : 'Utente Eliminato'
          };
        })
      );

      // Calcola statistiche
      const stats = await feedbackModel.calculateUserStats(id);

      // Top tags
      const tagCounts = {};
      feedbacksWithAuthors.forEach(fb => {
        if (fb.tags) {
          fb.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));

      console.log('[SHARE API] Sending player response');

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

    // === GESTIONE PROFILO SQUADRA ===
    if (type === 'team') {
      console.log('[SHARE API] Fetching team:', id);
      
      const team = await teamModel.findById(id);
      
      if (!team) {
        console.log('[SHARE API] Team not found:', id);
        return res.status(404).json({ 
          error: 'Squadra non trovata' 
        });
      }

      console.log('[SHARE API] Team found:', team.name);

      // Recupera membri
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
      
      // Popola autori feedback
      const feedbacksWithAuthors = await Promise.all(
        feedbacks.map(async (fb) => {
          const author = await userModel.findById(fb.fromUser.toString());
          return {
            _id: fb._id,
            rating: fb.rating,
            comment: fb.comment,
            tags: fb.tags,
            createdAt: fb.createdAt,
            fromUsername: author ? author.username : 'Utente Eliminato'
          };
        })
      );

      // Calcola statistiche
      const stats = await feedbackModel.calculateTeamStats(id);

      // Top tags
      const tagCounts = {};
      feedbacksWithAuthors.forEach(fb => {
        if (fb.tags) {
          fb.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));

      console.log('[SHARE API] Sending team response');

      return res.status(200).json({
        data: {
          _id: team._id,
          name: team.name,
          description: team.description,
          platform: team.platform,
          nationality: team.nationality,
          lookingForPlayers: team.lookingForPlayers,
          instagram: team.instagram,
          tiktok: team.tiktok,
          liveLink: team.liveLink,
          averageRating: team.averageRating,
          feedbackCount: team.feedbackCount,
          createdAt: team.createdAt,
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
    console.error('[SHARE API] Error:', error);
    return res.status(500).json({ 
      error: 'Errore durante il caricamento del profilo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
