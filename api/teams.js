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
      const { id, platform, search, nationality } = req.query;

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
      if (nationality) filters.nationality = nationality;

      const teams = await teamModel.search(filters);
      return res.status(200).json({ 
        teams,
        count: teams.length 
      });
    }

    // CREATE TEAM
    if (req.method === 'POST') {
      const { name, description, platform, instagram, tiktok, liveLink, nationality } = req.body;

      // Check profile completed
      const user = await userModel.findById(userId);
      if (!user.profileCompleted) {
        return res.status(400).json({ error: 'Devi completare il profilo prima di creare una squadra' });
      }

      if (!name || !platform) {
        return res.status(400).json({ error: 'Nome e piattaforma sono obbligatori' });
      }

      if (name.length < 3 || name.length > 30) {
        return res.status(400).json({ error: 'Nome deve essere tra 3 e 30 caratteri' });
      }

      const team = await teamModel.create(
        { name, description, platform, instagram, tiktok, liveLink, nationality },
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

      const team = await teamModel.findById(teamId);
      if (!team) {
        return res.status(404).json({ error: 'Squadra non trovata' });
      }

      const isCaptain = team.captain.toString() === userId;
      const isViceCaptain = team.viceCaptain && team.viceCaptain.toString() === userId;

      // Leave team
      if (action === 'leave') {
        await teamModel.removeMember(teamId, userId, userId);
        await userModel.setTeam(userId, null);
        await userModel.update(userId, { lookingForTeam: true });

        return res.status(200).json({ message: 'Hai lasciato la squadra' });
      }

      // Remove member (ONLY CAPTAIN)
      if (action === 'removeMember') {
        if (!isCaptain) {
          return res.status(403).json({ error: 'Solo il capitano può espellere membri' });
        }

        if (!targetUserId) {
          return res.status(400).json({ error: 'ID utente richiesto' });
        }

        await teamModel.removeMember(teamId, targetUserId, userId);
        await userModel.setTeam(targetUserId, null);
        await userModel.update(targetUserId, { lookingForTeam: true });

        return res.status(200).json({ message: 'Membro rimosso con successo' });
      }

      // Set vice captain (ONLY CAPTAIN)
      if (action === 'setViceCaptain') {
        if (!isCaptain) {
          return res.status(403).json({ error: 'Solo il capitano può nominare il vice capitano' });
        }

        if (!targetUserId) {
          return res.status(400).json({ error: 'ID utente richiesto' });
        }

        await teamModel.setViceCaptain(teamId, targetUserId, userId);

        return res.status(200).json({ message: 'Vice capitano nominato con successo' });
      }

      // Update team info (Captain or Vice Captain)
      if (!isCaptain && !isViceCaptain) {
        return res.status(403).json({ error: 'Solo capitano e vice capitano possono modificare la squadra' });
      }

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
