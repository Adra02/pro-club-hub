// ============================================
// API /api/admin - VERSIONE CORRETTA ✅
// ============================================

import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { TeamModel } from '../models/Team.js';
import { TeamRequestModel } from '../models/TeamRequest.js';
import { authenticateRequest } from '../lib/auth.js';
import { sendNewsletterEmail } from '../lib/email.js';

/**
 * API /api/admin
 * 
 * GET    /api/admin?action=stats          - Statistiche dashboard
 * GET    /api/admin?action=users          - Lista tutti gli utenti
 * GET    /api/admin?action=level-settings - Ottieni limiti livello
 * POST   /api/admin?action=level-settings - Aggiorna limiti livello
 * POST   /api/admin?action=suspend        - Sospendi utente
 * POST   /api/admin?action=unsuspend      - Riabilita utente
 * DELETE /api/admin?action=user           - Elimina utente
 * DELETE /api/admin?action=teams          - Elimina tutte le squadre
 * POST   /api/admin?action=reset-profiles - Reset tutti i profili
 * POST   /api/admin?action=newsletter     - Invia newsletter
 */

export default async function handler(req, res) {
  try {
    const userId = await authenticateRequest(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'Non autenticato' });
    }

    const { db } = await connectToDatabase();
    const userModel = new UserModel(db);
    
    // ✅ CORREZIONE: Controlla isAdmin nel database
    const user = await userModel.findById(userId);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Accesso negato - Solo admin' });
    }

    const teamModel = new TeamModel(db);
    const requestModel = new TeamRequestModel(db);

    // ============================================
    // GET STATS
    // ============================================
    if (req.method === 'GET' && req.query.action === 'stats') {
      const totalUsers = await userModel.countAll();
      const totalTeams = await teamModel.countAll();
      const inactiveUsers = await userModel.countInactive();
      const pendingRequests = await requestModel.countPending();

      return res.status(200).json({
        stats: {
          totalUsers,
          totalTeams,
          inactiveUsers,
          pendingRequests
        }
      });
    }

    // ============================================
    // GET USERS
    // ============================================
    if (req.method === 'GET' && req.query.action === 'users') {
      const users = await userModel.getAllUsers();
      return res.status(200).json({ users });
    }

    // ============================================
    // GET LEVEL SETTINGS
    // ============================================
    if (req.method === 'GET' && req.query.action === 'level-settings') {
      const limits = await userModel.getLevelLimits();
      return res.status(200).json(limits);
    }

    // ============================================
    // UPDATE LEVEL SETTINGS
    // ============================================
    if (req.method === 'POST' && req.query.action === 'level-settings') {
      const { minLevel, maxLevel } = req.body;

      if (!minLevel || !maxLevel) {
        return res.status(400).json({ error: 'minLevel e maxLevel richiesti' });
      }

      await userModel.updateLevelLimits(parseInt(minLevel), parseInt(maxLevel));

      return res.status(200).json({
        message: 'Limiti livello aggiornati',
        minLevel: parseInt(minLevel),
        maxLevel: parseInt(maxLevel)
      });
    }

    // ============================================
    // SUSPEND USER
    // ============================================
    if (req.method === 'POST' && req.query.action === 'suspend') {
      const { userId: targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ error: 'userId richiesto' });
      }

      await userModel.suspendUser(targetUserId, true);

      return res.status(200).json({
        message: 'Utente sospeso con successo'
      });
    }

    // ============================================
    // UNSUSPEND USER
    // ============================================
    if (req.method === 'POST' && req.query.action === 'unsuspend') {
      const { userId: targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ error: 'userId richiesto' });
      }

      await userModel.suspendUser(targetUserId, false);

      return res.status(200).json({
        message: 'Utente riabilitato con successo'
      });
    }

    // ============================================
    // DELETE USER
    // ============================================
    if (req.method === 'DELETE' && req.query.action === 'user') {
      const { userId: targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ error: 'userId richiesto' });
      }

      await userModel.deleteUser(targetUserId);

      return res.status(200).json({
        message: 'Utente eliminato con successo'
      });
    }

    // ============================================
    // DELETE ALL TEAMS
    // ============================================
    if (req.method === 'DELETE' && req.query.action === 'teams') {
      const count = await teamModel.deleteAll();

      return res.status(200).json({
        message: `${count} squadre eliminate`,
        count
      });
    }

    // ============================================
    // RESET PROFILES
    // ============================================
    if (req.method === 'POST' && req.query.action === 'reset-profiles') {
      const count = await userModel.resetInactiveUsers();

      return res.status(200).json({
        message: `${count} profili resettati`,
        count
      });
    }

    // ============================================
    // SEND NEWSLETTER
    // ============================================
    if (req.method === 'POST' && req.query.action === 'newsletter') {
      const { subject, message } = req.body;

      if (!subject || !message) {
        return res.status(400).json({ error: 'Subject e message richiesti' });
      }

      const users = await userModel.getAllUsers();
      let sent = 0;
      let failed = 0;

      for (const user of users) {
        try {
          await sendNewsletterEmail(user.email, user.username, subject, message);
          sent++;
        } catch (error) {
          console.error(`Failed to send to ${user.email}:`, error);
          failed++;
        }
      }

      return res.status(200).json({
        message: `Newsletter inviata a ${sent} utenti`,
        sent,
        failed
      });
    }

    return res.status(404).json({ error: 'Azione non trovata' });

  } catch (error) {
    console.error('❌ Admin API error:', error);
    return res.status(500).json({
      error: 'Errore del server',
      details: error.message
    });
  }
}
