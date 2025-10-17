import { connectToDatabase } from '../lib/mongodb.js';
import { TeamRequestModel } from '../models/TeamRequest.js';
import { TeamModel } from '../models/Team.js';
import { UserModel } from '../models/User.js';
import { authenticateRequest } from '../lib/auth.js';
import { sendTeamRequestNotification } from '../lib/email.js';

export default async function handler(req, res) {
  try {
    const userId = await authenticateRequest(req);
    if (!userId) {
      return res.status(401).json({ error: 'Non autenticato' });
    }

    const { db } = await connectToDatabase();
    const requestModel = new TeamRequestModel(db);
    const teamModel = new TeamModel(db);
    const userModel = new UserModel(db);

    // CREATE REQUEST
    if (req.method === 'POST' && req.query.action === 'create') {
      const { teamId } = req.body;

      if (!teamId) {
        return res.status(400).json({ error: 'ID squadra richiesto' });
      }

      const currentUser = await userModel.findById(userId);
      if (currentUser.team) {
        return res.status(400).json({ error: 'Sei già in una squadra' });
      }

      const team = await teamModel.findById(teamId);
      if (!team) {
        return res.status(404).json({ error: 'Squadra non trovata' });
      }

      const request = await requestModel.create(teamId, userId);

      // Send notification to captain
      const captain = await userModel.findById(team.captain.toString());
      if (captain) {
        sendTeamRequestNotification(
          captain.email,
          currentUser.username,
          team.name
        ).catch(err => console.error('Email notification failed:', err));
      }

      return res.status(201).json({
        message: 'Richiesta inviata con successo',
        request
      });
    }

    // GET REQUESTS
    if (req.method === 'GET') {
      const { teamId, playerId } = req.query;

      if (teamId) {
        const team = await teamModel.findById(teamId);
        if (!team) {
          return res.status(404).json({ error: 'Squadra non trovata' });
        }

        const isCaptain = team.captain.toString() === userId;
        const isViceCaptain = team.viceCaptain && team.viceCaptain.toString() === userId;

        if (!isCaptain && !isViceCaptain) {
          return res.status(403).json({ 
            error: 'Solo capitano e vice capitano possono vedere le richieste' 
          });
        }

        const requests = await requestModel.getTeamRequests(teamId);

        // Get player details
        const requestsWithDetails = await Promise.all(
          requests.map(async (req) => {
            const player = await userModel.findById(req.player.toString());
            return {
              ...req,
              playerDetails: player ? userModel.sanitizeUser(player) : null
            };
          })
        );

        return res.status(200).json({ 
          requests: requestsWithDetails.filter(r => r.playerDetails !== null)
        });
      }

      if (playerId || !teamId) {
        const requests = await requestModel.getPlayerRequests(playerId || userId);

        // Get team details
        const requestsWithDetails = await Promise.all(
          requests.map(async (req) => {
            const team = await teamModel.findById(req.team.toString());
            return {
              ...req,
              teamDetails: team || null
            };
          })
        );

        return res.status(200).json({ 
          requests: requestsWithDetails.filter(r => r.teamDetails !== null)
        });
      }

      return res.status(400).json({ error: 'teamId o playerId richiesto' });
    }

    // APPROVE REQUEST
    if (req.method === 'POST' && req.query.action === 'approve') {
      const { requestId } = req.body;

      if (!requestId) {
        return res.status(400).json({ error: 'ID richiesta richiesto' });
      }

      await requestModel.approve(requestId, userId, teamModel, userModel);

      return res.status(200).json({ 
        message: 'Richiesta approvata con successo' 
      });
    }

    // REJECT REQUEST
    if (req.method === 'POST' && req.query.action === 'reject') {
      const { requestId } = req.body;

      if (!requestId) {
        return res.status(400).json({ error: 'ID richiesta richiesto' });
      }

      await requestModel.reject(requestId, userId);

      return res.status(200).json({ 
        message: 'Richiesta rifiutata' 
      });
    }

    // CANCEL REQUEST
    if (req.method === 'DELETE') {
      const { requestId } = req.body;

      if (!requestId) {
        return res.status(400).json({ error: 'ID richiesta richiesto' });
      }

      await requestModel.cancel(requestId, userId);

      return res.status(200).json({ 
        message: 'Richiesta cancellata' 
      });
    }

    return res.status(404).json({ error: 'Endpoint non trovato' });

  } catch (error) {
    console.error('Requests endpoint error:', error);
    return res.status(500).json({ 
      error: error.message || 'Errore durante l\'operazione' 
    });
  }
}
