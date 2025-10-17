import { connectToDatabase } from '../lib/mongodb.js';
import { TeamModel } from '../models/Team.js';
import { UserModel } from '../models/User.js';
import { authenticateRequest } from '../lib/auth.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    const userId = await authenticateRequest(req);
    if (!userId) {
      return res.status(401).json({ error: 'Non autenticato' });
    }

    const { db } = await connectToDatabase();
    const teamModel = new TeamModel(db);
    const userModel = new UserModel(db);

    // GET TEAMS
    if (req.method === 'GET') {
      const { id, platform, search } = req.query;

      // Get specific team
      if (id) {
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'ID non valido' });
        }

        const team = await teamModel.findById(id);
        if (!team) {
          return res.status(404).json({ error: 'Squadra non trovata' });
        }

        // Get member details
        const memberDetails = await Promise.all(
          team.members.map(async (memberId) => {
            const user = await userModel.findById(memberId.toString());
            return user ? userModel.sanitizeUser(user) : null;
          })
        );

        return res.status(200).json({ 
          team: {
            ...team,
            memberDetails: memberDetails.filter(m => m !== null)
          }
        });
      }

      // Search teams
      const filters = {};
      if (platform) filters.platform = platform;
      if (search) filters.search = search;

      const teams = await teamModel.search(filters);
      return res.status(200).json({ 
        teams,
        count: teams.length 
      });
    }

    // CREATE TEAM
    if (req.method === 'POST') {
      const { name, description, platform, instagram, tiktok, liveLink } = req.body;

      if (!name || !platform) {
        return res.status(400).json({ error: 'Nome e piattaforma sono obbligatori' });
      }

      if (name.length < 3 || name.length > 30) {
        return res.status(400).json({ error: 'Nome deve essere tra 3 e 30 caratteri' });
      }

      const currentUser = await userModel.findById(userId);
      if (currentUser.team) {
        return res.status(400).json({ 
          error: 'Sei già in una squadra. Lasciala prima di crearne una nuova.' 
        });
      }

      const team = await teamModel.create(
        { name, description, platform, instagram, tiktok, liveLink },
        userId
      );

      await userModel.setTeam(userId, team._id.toString());

      return res.status(201).json({
        message: 'Squadra creata con successo',
        team
      });
    }

    // UPDATE TEAM
    if (req.method === 'PUT') {
      const { teamId, action, targetUserId, ...updateData } = req.body;

      if (!teamId) {
        return res.status(400).json({ error: 'ID squadra richiesto' });
      }

      // Leave team
      if (action === 'leave') {
        await teamModel.removeMember(teamId, userId, userId);
        await userModel.setTeam(userId, null);
        await userModel.update(userId, { lookingForTeam: true });

        return res.status(200).json({ message: 'Hai lasciato la squadra' });
      }

      // Remove member
      if (action === 'removeMember') {
        if (!targetUserId) {
          return res.status(400).json({ error: 'ID utente richiesto' });
        }

        await teamModel.removeMember(teamId, targetUserId, userId);
        await userModel.setTeam(targetUserId, null);
        await userModel.update(targetUserId, { lookingForTeam: true });

        return res.status(200).json({ message: 'Membro rimosso con successo' });
      }

      // Set vice captain
      if (action === 'setViceCaptain') {
        if (!targetUserId) {
          return res.status(400).json({ error: 'ID utente richiesto' });
        }

        await teamModel.setViceCaptain(teamId, targetUserId, userId);

        return res.status(200).json({ message: 'Vice capitano nominato con successo' });
      }

      // Update team info
      const updatedTeam = await teamModel.update(teamId, updateData, userId);
      return res.status(200).json({
        message: 'Squadra aggiornata con successo',
        team: updatedTeam
      });
    }

    // DELETE TEAM
    if (req.method === 'DELETE') {
      const { teamId } = req.body;

      if (!teamId) {
        return res.status(400).json({ error: 'ID squadra richiesto' });
      }

      const team = await teamModel.findById(teamId);
      if (!team) {
        return res.status(404).json({ error: 'Squadra non trovata' });
      }

      // Update all members
      for (const memberId of team.members) {
        await userModel.setTeam(memberId.toString(), null);
        await userModel.update(memberId.toString(), { lookingForTeam: true });
      }

      await teamModel.delete(teamId, userId);
      return res.status(200).json({ message: 'Squadra eliminata con successo' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Teams endpoint error:', error);
    return res.status(500).json({ 
      error: error.message || 'Errore durante l\'operazione' 
    });
  }
}
