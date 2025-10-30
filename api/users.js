// ============================================
// API /api/users - Gestione Utenti/Giocatori
// ============================================

import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { TeamModel } from '../models/Team.js';
import { FeedbackModel } from '../models/Feedback.js';
import { authenticateRequest } from '../lib/auth.js';

export default async function handler(req, res) {
  // Gestisci CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    const userModel = new UserModel(db);
    const teamModel = new TeamModel(db);
    const feedbackModel = new FeedbackModel(db);

    // ============================================
    // GET ALL USERS (PUBLIC - NO AUTH)
    // ============================================
    if (req.method === 'GET' && !req.url.includes('/profile')) {
      try {
        const users = await userModel.collection.find({}).toArray();
        
        // Sanitizza tutti gli utenti
        const sanitizedUsers = users.map(user => userModel.sanitizeUser(user));

        return res.status(200).json({
          users: sanitizedUsers,
          count: sanitizedUsers.length
        });
      } catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ 
          error: 'Errore nel recupero degli utenti',
          details: error.message 
        });
      }
    }

    // ============================================
    // GET USER PROFILE
    // ============================================
    if (req.method === 'GET' && req.url.includes('/profile')) {
      const userId = await authenticateRequest(req);
      
      if (!userId) {
        return res.status(401).json({ error: 'Non autenticato' });
      }

      // Admin speciale
      if (userId === 'admin') {
        const adminUser = {
          _id: 'admin',
          username: 'Admin',
          email: process.env.ADMIN_EMAIL,
          isAdmin: true,
          profileCompleted: true,
          platform: 'PC',
          primaryRole: 'Admin',
          level: 50,
          averageRating: 5,
          feedbackCount: 0,
          lookingForTeam: false,
          nationality: 'Italia',
          secondaryRoles: [],
          favoriteTeams: [],
          favoritePlayers: []
        };
        return res.status(200).json({ user: adminUser });
      }

      const user = await userModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }

      let team = null;
      if (user.team) {
        team = await teamModel.findById(user.team.toString());
      }

      const feedbacks = await feedbackModel.getFeedbackForUser(userId);
      const feedbacksWithAuthors = await Promise.all(
        feedbacks.map(async (fb) => {
          const author = await userModel.findById(fb.fromUser.toString());
          return {
            ...fb,
            fromUsername: author ? author.username : 'Utente Eliminato'
          };
        })
      );

      return res.status(200).json({
        user: userModel.sanitizeUser(user),
        team,
        feedbacks: feedbacksWithAuthors
      });
    }

    // ============================================
    // UPDATE USER PROFILE
    // ============================================
    if (req.method === 'PUT') {
      const userId = await authenticateRequest(req);
      
      if (!userId) {
        return res.status(401).json({ error: 'Non autenticato' });
      }

      if (userId === 'admin') {
        return res.status(403).json({ error: 'Admin non può modificare il profilo' });
      }

      const updateData = req.body;
      
      // Validazione livello se presente
      if (updateData.level) {
        const isValid = await userModel.validateLevel(updateData.level);
        if (!isValid) {
          const limits = await userModel.getLevelLimits();
          return res.status(400).json({ 
            error: `Il livello deve essere tra ${limits.minLevel} e ${limits.maxLevel}` 
          });
        }
      }

      const updatedUser = await userModel.update(userId, updateData);
      
      return res.status(200).json({
        message: 'Profilo aggiornato con successo',
        user: userModel.sanitizeUser(updatedUser)
      });
    }

    // ============================================
    // SEARCH USERS WITH FILTERS
    // ============================================
    if (req.method === 'POST' && req.url.includes('/search')) {
      const userId = await authenticateRequest(req);
      
      if (!userId) {
        return res.status(401).json({ error: 'Non autenticato' });
      }

      const { role, platform, nationality, minLevel, maxLevel, search } = req.body;

      // Costruisci i filtri
      const filters = {};
      
      if (role) filters.role = role;
      if (platform) filters.platform = platform;
      if (nationality) filters.nationality = nationality;
      if (minLevel || maxLevel) {
        if (minLevel) filters.minLevel = minLevel;
        if (maxLevel) filters.maxLevel = maxLevel;
      }
      if (search) filters.search = search;

      const players = await userModel.search(filters);
      const sanitizedPlayers = players.map(player => userModel.sanitizeUser(player));

      return res.status(200).json({
        users: sanitizedPlayers,
        count: sanitizedPlayers.length
      });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });

  } catch (error) {
    console.error('❌ Users endpoint error:', error);
    return res.status(500).json({ 
      error: 'Errore del server',
      details: error.message 
    });
  }
}
