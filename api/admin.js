import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { TeamModel } from '../models/Team.js';
import { TeamRequestModel } from '../models/TeamRequest.js';
import { authenticateRequest } from '../lib/auth.js';
import { sendNewsletterEmail } from '../lib/email.js';

async function isAdmin(req) {
  const userId = await authenticateRequest(req);
  if (!userId) return false;

  const { db } = await connectToDatabase();
  const userModel = new UserModel(db);
  const user = await userModel.findById(userId);

  if (!user) return false;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  return user.email === adminEmail;
}

export default async function handler(req, res) {
  try {
    const isAdminUser = await isAdmin(req);
    
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Accesso negato' });
    }

    const { db } = await connectToDatabase();
    const userModel = new UserModel(db);
    const teamModel = new TeamModel(db);
    const requestModel = new TeamRequestModel(db);

    // GET STATS
    if (req.method === 'GET' && req.query.action === 'stats') {
      const totalUsers = await userModel.countAll();
      const totalTeams = await teamModel.countAll();
      const inactiveUsers = await userModel.countInactive();
      const pendingRequests = (await requestModel.getTeamRequests('')).filter(r => r.status === 'pending').length;

      return res.status(200).json({
        totalUsers,
        totalTeams,
        inactiveUsers,
        pendingRequests
      });
    }

    // GET ALL USERS
    if (req.method === 'GET' && req.query.action === 'users') {
      const users = await userModel.getAllUsers();
      return res.status(200).json({ users });
    }

    // SUSPEND USER
    if (req.method === 'POST' && req.query.action === 'suspend') {
      const { userId } = req.body;
      await userModel.suspendUser(userId, true);
      return res.status(200).json({ message: 'Utente sospeso' });
    }

    // UNSUSPEND USER
    if (req.method === 'POST' && req.query.action === 'unsuspend') {
      const { userId } = req.body;
      await userModel.suspendUser(userId, false);
      return res.status(200).json({ message: 'Utente riabilitato' });
    }

    // DELETE USER
    if (req.method === 'DELETE' && req.query.action === 'user') {
      const { userId } = req.body;
      await userModel.deleteUser(userId);
      return res.status(200).json({ message: 'Utente eliminato' });
    }

    // DELETE ALL TEAMS
    if (req.method === 'DELETE' && req.query.action === 'teams') {
      const count = await teamModel.deleteAll();
      
      // Reset all users teams
      await db.collection('users').updateMany(
        {},
        { $set: { team: null, lookingForTeam: true } }
      );

      return res.status(200).json({ message: `${count} squadre eliminate`, count });
    }

    // RESET PLAYER PROFILES
    if (req.method === 'POST' && req.query.action === 'reset-profiles') {
      await db.collection('users').updateMany(
        {},
        {
          $set: {
            level: 1,
            primaryRole: 'Centrocampista (CC)',
            secondaryRoles: [],
            bio: '',
            instagram: '',
            tiktok: '',
            team: null,
            lookingForTeam: true,
            feedbackCount: 0,
            averageRating: 0
          }
        }
      );

      return res.status(200).json({ message: 'Profili resettati con successo' });
    }

    // SEND NEWSLETTER
    if (req.method === 'POST' && req.query.action === 'newsletter') {
      const { subject, message } = req.body;
      
      if (!subject || !message) {
        return res.status(400).json({ error: 'Subject e message richiesti' });
      }

      const users = await userModel.getAllUsers();
      let sent = 0;
      let failed = 0;

      for (const user of users) {
        const success = await sendNewsletterEmail(user.email, user.username, subject, message);
        if (success) sent++;
        else failed++;
      }

      return res.status(200).json({ 
        message: `Newsletter inviata a ${sent} utenti`,
        sent,
        failed
      });
    }

    return res.status(404).json({ error: 'Endpoint non trovato' });

  } catch (error) {
    console.error('Admin endpoint error:', error);
    return res.status(500).json({ 
      error: error.message || 'Errore durante l\'operazione' 
    });
  }
}
