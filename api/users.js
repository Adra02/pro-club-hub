// ============================================
// API /api/users - VERSIONE COMPLETA E CORRETTA
// ============================================

import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { authenticateRequest } from '../lib/auth.js';
import { ObjectId } from 'mongodb';

/**
 * API /api/users
 * 
 * GET /api/users                        - Lista giocatori con filtri
 * GET /api/users?id=XXX                 - Ottieni singolo giocatore (pubblico per profili condivisi)
 * GET /api/users?action=all             - Tutti gli utenti (admin only)
 */

export default async function handler(req, res) {
  try {
    const { db } = await connectToDatabase();
    const userModel = new UserModel(db);

    // ============================================
    // GET - RECUPERA UTENTI
    // ============================================
    if (req.method === 'GET') {
      const { id, action, role, platform, search, nationality, minLevel, maxLevel } = req.query;

      // === CASO 1: Profilo singolo (PUBBLICO per condivisione) ===
      if (id) {
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'ID non valido' });
        }

        const user = await userModel.findById(id);
        
        if (!user) {
          return res.status(404).json({ error: 'Utente non trovato' });
        }

        // Sanitizza (rimuovi dati sensibili)
        const sanitizedUser = userModel.sanitizeUser(user);
        
        return res.status(200).json(sanitizedUser);
      }

      // === CASO 2: Lista completa (admin only) ===
      if (action === 'all') {
        const userId = await authenticateRequest(req);
        
        if (!userId || userId !== 'admin') {
          return res.status(403).json({ error: 'Accesso negato' });
        }

        const users = await userModel.getAllUsers();
        return res.status(200).json({ 
          users,
          count: users.length 
        });
      }

      // === CASO 3: Ricerca giocatori con filtri (richiede autenticazione) ===
      const userId = await authenticateRequest(req);
      
      if (!userId) {
        return res.status(401).json({ error: 'Non autenticato' });
      }

      // Costruisci i filtri
      const filters = {};
      
      if (role) {
        filters.role = role;
      }
      
      if (platform) {
        filters.platform = platform;
      }
      
      if (search) {
        filters.search = search;
      }
      
      if (nationality) {
        filters.nationality = nationality;
      }
      
      if (minLevel) {
        filters.minLevel = parseInt(minLevel);
      }
      
      if (maxLevel) {
        filters.maxLevel = parseInt(maxLevel);
      }

      // CRITICAL FIX: Usa la funzione searchAll invece di search
      // searchAll non filtra per lookingForTeam
      const users = await userModel.searchAll(filters);
      
      // Rimuovi l'utente corrente dalla lista
      const filteredUsers = users.filter(user => 
        user._id.toString() !== userId
      );

      return res.status(200).json({ 
        users: filteredUsers,
        count: filteredUsers.length 
      });
    }

    // ============================================
    // ALTRI METODI NON SUPPORTATI
    // ============================================
    return res.status(405).json({ error: 'Metodo non consentito' });

  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({ 
      error: 'Errore interno del server',
      message: error.message 
    });
  }
}
