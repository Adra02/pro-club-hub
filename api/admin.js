import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { TeamModel } from '../models/Team.js';
import { TeamRequestModel } from '../models/TeamRequest.js';
import { authenticateRequest } from '../lib/auth.js';
import { sendNewsletterEmail } from '../lib/email.js';

export default async function handler(req, res) {
  try {
    const userId = await authenticateRequest(req);
    
    if (!userId || userId !== 'admin') {
      return res.status(403).json({ error: 'Accesso negato' });
    }

    const { db } = await connectToDatabase();
    const userModel = new UserModel(db);
    const teamModel = new TeamModel(db);
    const requestModel = new TeamRequestModel(db);
    const settingsCollection = db.collection('settings');

    // GET STATS
    if (req.method === 'GET' && req.url.includes('action=stats')) {
      const totalUsers = await userModel.countAll();
      const totalTeams = await teamModel.countAll();
      const inactiveUsers = await userModel.countInactive();
      const pendingRequests = await requestModel.countPending();

      return res.status(200).json({
        totalUsers,
        totalTeams,
        inactiveUsers,
        pendingRequests
      });
    }

    // GET USERS LIST
    if (req.method === 'GET' && req.url.includes('action=users')) {
      const users = await userModel.getAllUsers();
      return res.status(200).json({ users });
    }

    // GET LEVEL SETTINGS
    if (req.method === 'GET' && req.url.includes('action=level-settings')) {
      const settings = await settingsCollection.findOne({ _id: 'level_limits' });
      return res.status(200).json({
        minLevel: settings?.minLevel || 1,
        maxLevel: settings?.maxLevel || 999
      });
    }

    // UPDATE LEVEL SETTINGS
    if (req.method === 'POST' && req.url.includes('action=level-settings')) {
      const { minLevel, maxLevel } = req.body;

      if (!minLevel || !maxLevel) {
        return res.status(400).json({ error: 'Livello minimo e massimo richiesti' });
      }

      const min = parseInt(minLevel);
      const max = parseInt(maxLevel);

      if (isNaN(min) || isNaN(max)) {
        return res.status(400).json({ error: 'I livelli devono essere numeri validi' });
      }

      if (min < 1) {
        return res.status(400).json({ error: 'Il livello minimo deve essere almeno 1' });
      }

      if (max < min) {
        return res.status(400).json({ error: 'Il livello massimo deve essere maggiore o uguale al minimo' });
      }

      if (max > 9999) {
        return res.status(400).json({ error: 'Il livello massimo non può superare 9999' });
      }

      // Salva i nuovi limiti
      await settingsCollection.updateOne(
        { _id: 'level_limits' },
        { 
          $set: { 
            minLevel: min, 
            maxLevel: max, 
            updatedAt: new Date() 
          } 
        },
        { upsert: true }
      );

      // CRITICAL FIX: Aggiorna automaticamente tutti gli utenti fuori range
      // Porta gli utenti sotto il minimo al nuovo minimo
      await db.collection('users').updateMany(
        { level: { $lt: min } },
        { $set: { level: min, updatedAt: new Date() } }
      );

      // Porta gli utenti sopra il massimo al nuovo massimo
      await db.collection('users').updateMany(
        { level: { $gt: max } },
        { $set: { level: max, updatedAt: new Date() } }
      );

      return res.status(200).json({
        message: 'Limiti livello aggiornati con successo. Utenti aggiornati automaticamente.',
        minLevel: min,
        maxLevel: max
      });
    }

    // SUSPEND USER
    if (req.method === 'POST' && req.url.includes('action=suspend')) {
      const { userId: targetUserId } = req.body;
      await userModel.suspendUser(targetUserId, true);
      return res.status(200).json({ message: 'Utente sospeso' });
    }

    // UNSUSPEND USER
    if (req.method === 'POST' && req.url.includes('action=unsuspend')) {
      const { userId: targetUserId } = req.body;
      await userModel.suspendUser(targetUserId, false);
      return res.status(200).json({ message: 'Utente riabilitato' });
    }

    // DELETE USER
    if (req.method === 'DELETE' && req.url.includes('action=user')) {
      const { userId: targetUserId } = req.body;
      await userModel.deleteUser(targetUserId);
      return res.status(200).json({ message: 'Utente eliminato' });
    }

    // DELETE ALL TEAMS
    if (req.method === 'DELETE' && req.url.includes('action=teams')) {
      const count = await teamModel.deleteAll();
      
      // Reset team field for all users
      await db.collection('users').updateMany(
        {},
        { $set: { team: null, lookingForTeam: false } }
      );

      return res.status(200).json({
        message: 'Tutte le squadre eliminate',
        count
      });
    }

    // RESET PROFILES
    if (req.method === 'POST' && req.url.includes('action=reset-profiles')) {
      await db.collection('users').updateMany(
        {},
        {
          $set: {
            level: 1,
            secondaryRoles: [],
            bio: '',
            lookingForTeam: false,
            profileCompleted: false,
            team: null,
            averageRating: 0,
            feedbackCount: 0,
            updatedAt: new Date()
          }
        }
      );

      // Delete all feedback
      await db.collection('feedback').deleteMany({});

      return res.status(200).json({ message: 'Profili resettati con successo' });
    }

    // SEND NEWSLETTER
    if (req.method === 'POST' && req.url.includes('action=newsletter')) {
      const { subject, message } = req.body;

      if (!subject || !message) {
        return res.status(400).json({ error: 'Oggetto e messaggio richiesti' });
      }

      const users = await userModel.getAllUsers();
      let sent = 0;

      for (const user of users) {
        try {
          await sendNewsletterEmail(user.email, user.username, subject, message);
          sent++;
        } catch (error) {
          console.error(`Failed to send to ${user.email}:`, error);
        }
      }

      return res.status(200).json({
        message: 'Newsletter inviata',
        sent
      });
    }

    return res.status(404).json({ error: 'Endpoint non trovato' });

  } catch (error) {
    console.error('Admin endpoint error:', error);
    return res.status(500).json({ error: 'Errore del server' });
  }
}
