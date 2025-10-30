// ============================================
// API /api/teams - Gestione Squadre
// ============================================

import { connectToDatabase } from '../lib/mongodb.js';
import { TeamModel } from '../models/Team.js';
import { UserModel } from '../models/User.js';
import { authenticateRequest } from '../lib/auth.js';

export default async function handler(req, res) {
  // Gestisci CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    const teamModel = new TeamModel(db);
    const userModel = new UserModel(db);

    // ============================================
    // GET ALL TEAMS (PUBLIC)
    // ============================================
    if (req.method === 'GET' && !req.url.includes('/my-team')) {
      try {
        const teams = await teamModel.collection.find({}).toArray();
        
        // Popola i dettagli dei membri
        const teamsWithDetails = await Promise.all(
          teams.map(async (team) => {
            const membersDetails = await Promise.all(
              team.members.map(async (memberId) => {
                const member = await userModel.findById(memberId.toString());
                return member ? userModel.sanitizeUser(member) : null;
              })
            );

            return {
              ...team,
              membersDetails: membersDetails.filter(m => m !== null)
            };
          })
        );

        return res.status(200).json({
          teams: teamsWithDetails,
          count: teamsWithDetails.length
        });
      } catch (error) {
        console.error('Get teams error:', error);
        return res.status(500).json({ 
          error: 'Errore nel recupero delle squadre',
          details: error.message 
        });
      }
    }

    // ============================================
    // GET MY TEAM
    // ============================================
    if (req.method === 'GET' && req.url.includes('/my-team')) {
      const userId = await authenticateRequest(req);
      
      if (!userId) {
        return res.status(401).json({ error: 'Non autenticato' });
      }

      if (userId === 'admin') {
        return res.status(200).json({ team: null });
      }

      const user = await userModel.findById(userId);
      
      if (!user || !user.team) {
        return res.status(200).json({ team: null });
      }

      const team = await teamModel.findById(user.team.toString());
      
      if (!team) {
        return res.status(404).json({ error: 'Squadra non trovata' });
      }

      // Popola i dettagli dei membri
      const membersDetails = await Promise.all(
        team.members.map(async (memberId) => {
          const member = await userModel.findById(memberId.toString());
          return member ? userModel.sanitizeUser(member) : null;
        })
      );

      return res.status(200).json({
        team: {
          ...team,
          membersDetails: membersDetails.filter(m => m !== null)
        }
      });
    }

    // ============================================
    // CREATE TEAM
    // ============================================
    if (req.method === 'POST' && !req.url.includes('/search')) {
      const userId = await authenticateRequest(req);
      
      if (!userId) {
        return res.status(401).json({ error: 'Non autenticato' });
      }

      if (userId === 'admin') {
        return res.status(403).json({ error: 'Admin non può creare squadre' });
      }

      const user = await userModel.findById(userId);
      
      if (user.team) {
        return res.status(400).json({ error: 'Sei già in una squadra' });
      }

      if (!user.profileCompleted) {
        return res.status(400).json({ 
          error: 'Completa il tuo profilo prima di creare una squadra' 
        });
      }

      const { name, platform, nationality, description, requirementLevel } = req.body;

      if (!name || !platform || !nationality) {
        return res.status(400).json({ 
          error: 'Nome, piattaforma e nazionalità sono obbligatori' 
        });
      }

      const team = await teamModel.create({
        name,
        platform,
        nationality,
        description: description || '',
        requirementLevel: requirementLevel || 1,
        captain: userId
      });

      // Aggiungi il capitano come membro
      await teamModel.addMember(team._id.toString(), userId);
      await userModel.setTeam(userId, team._id.toString());
      await userModel.update(userId, { lookingForTeam: false });

      return res.status(201).json({
        message: 'Squadra creata con successo',
        team
      });
    }

    // ============================================
    // SEARCH TEAMS
    // ============================================
    if (req.method === 'POST' && req.url.includes('/search')) {
      const userId = await authenticateRequest(req);
      
      if (!userId) {
        return res.status(401).json({ error: 'Non autenticato' });
      }

      const { platform, nationality, search } = req.body;

      const filters = {};
      if (platform) filters.platform = platform;
      if (nationality) filters.nationality = nationality;
      if (search) filters.search = search;

      const teams = await teamModel.search(filters);

      // Popola i dettagli dei membri
      const teamsWithDetails = await Promise.all(
        teams.map(async (team) => {
          const membersDetails = await Promise.all(
            team.members.map(async (memberId) => {
              const member = await userModel.findById(memberId.toString());
              return member ? userModel.sanitizeUser(member) : null;
            })
          );

          return {
            ...team,
            membersDetails: membersDetails.filter(m => m !== null)
          };
        })
      );

      return res.status(200).json({
        teams: teamsWithDetails,
        count: teamsWithDetails.length
      });
    }

    // ============================================
    // UPDATE TEAM
    // ============================================
    if (req.method === 'PUT') {
      const userId = await authenticateRequest(req);
      
      if (!userId) {
        return res.status(401).json({ error: 'Non autenticato' });
      }

      const { teamId, ...updateData } = req.body;

      if (!teamId) {
        return res.status(400).json({ error: 'ID squadra richiesto' });
      }

      const team = await teamModel.findById(teamId);
      
      if (!team) {
        return res.status(404).json({ error: 'Squadra non trovata' });
      }

      const isCaptain = team.captain.toString() === userId;
      const isViceCaptain = team.viceCaptain && team.viceCaptain.toString() === userId;

      // Vice capitano
      if (updateData.action === 'set-vice-captain') {
        if (!isCaptain) {
          return res.status(403).json({ error: 'Solo il capitano può nominare il vice' });
        }

        const { targetUserId } = updateData;
        
        if (!targetUserId) {
          return res.status(400).json({ error: 'ID utente richiesto' });
        }

        await teamModel.setViceCaptain(teamId, targetUserId, userId);
        return res.status(200).json({ message: 'Vice capitano nominato con successo' });
      }

      // Update team info (Captain or Vice Captain)
      if (!isCaptain && !isViceCaptain) {
        return res.status(403).json({ 
          error: 'Solo capitano e vice capitano possono modificare la squadra' 
        });
      }

      const updatedTeam = await teamModel.update(teamId, updateData, userId);
      
      return res.status(200).json({
        message: 'Squadra aggiornata con successo',
        team: updatedTeam
      });
    }

    // ============================================
    // DELETE TEAM
    // ============================================
    if (req.method === 'DELETE') {
      const userId = await authenticateRequest(req);
      
      if (!userId) {
        return res.status(401).json({ error: 'Non autenticato' });
      }

      const { teamId } = req.body;

      if (!teamId) {
        return res.status(400).json({ error: 'ID squadra richiesto' });
      }

      const team = await teamModel.findById(teamId);
      
      if (!team) {
        return res.status(404).json({ error: 'Squadra non trovata' });
      }

      if (team.captain.toString() !== userId) {
        return res.status(403).json({ error: 'Solo il capitano può eliminare la squadra' });
      }

      // Aggiorna tutti i membri
      for (const memberId of team.members) {
        await userModel.setTeam(memberId.toString(), null);
        await userModel.update(memberId.toString(), { lookingForTeam: true });
      }

      await teamModel.delete(teamId, userId);
      
      return res.status(200).json({ message: 'Squadra eliminata con successo' });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });

  } catch (error) {
    console.error('Teams endpoint error:', error);
    return res.status(500).json({ 
      error: 'Errore del server',
      details: error.message 
    });
  }
}
