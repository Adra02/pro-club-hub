import { connectToDatabase } from '../lib/mongodb.js';
import { TeamRequestModel } from '../models/TeamRequest.js';
import { TeamModel } from '../models/Team.js';
import { UserModel } from '../models/User.js';
import { NotificationModel, NOTIFICATION_TYPES } from '../models/Notification.js';
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
    const notificationModel = new NotificationModel(db);

    // CREATE REQUEST con ANTI-SPAM
    if (req.method === 'POST' && req.query.action === 'create') {
      const { teamId } = req.body;

      if (!teamId) {
        return res.status(400).json({ error: 'ID squadra richiesto' });
      }

      // NUOVO: Controllo anti-spam (max 15 richieste ogni 10 minuti)
      try {
        await userModel.checkRateLimit(userId);
      } catch (error) {
        return res.status(429).json({ error: error.message });
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

      // Send email notification to captain
      const captain = await userModel.findById(team.captain.toString());
      if (captain) {
        sendTeamRequestNotification(
          captain.email,
          currentUser.username,
          team.name
        ).catch(err => console.error('Email notification failed:', err));
      }

      // NUOVO: Invia notifica push al capitano
      try {
        await notificationModel.create({
          toUserId: team.captain.toString(),
          fromUserId: userId,
          type: NOTIFICATION_TYPES.CLUB_REQUEST,
          message: `${currentUser.username} ha richiesto di unirsi a ${team.name}`,
          data: {
            teamId: teamId,
            requestId: request._id.toString()
          }
        });

        // Invia push notification tramite FCM se il capitano ha il token
        if (captain?.fcmToken) {
          await sendFCMNotification(captain.fcmToken, {
            title: '🎮 Nuova Richiesta al Club',
            body: `${currentUser.username} vuole unirsi a ${team.name}`,
            data: {
              type: 'club_request',
              teamId: teamId,
              requestId: request._id.toString()
            }
          });
        }
      } catch (notifError) {
        console.error('Notification error:', notifError);
        // Non blocchiamo la richiesta se la notifica fallisce
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

    // APPROVE REQUEST con NOTIFICA
    if (req.method === 'POST' && req.query.action === 'approve') {
      const { requestId } = req.body;

      if (!requestId) {
        return res.status(400).json({ error: 'ID richiesta richiesto' });
      }

      await requestModel.approve(requestId, userId, teamModel, userModel);

      // NUOVO: Invia notifica al giocatore che la richiesta è stata approvata
      try {
        const request = await requestModel.collection.findOne({ _id: new ObjectId(requestId) });
        if (request) {
          const team = await teamModel.findById(request.team.toString());
          
          await notificationModel.create({
            toUserId: request.player.toString(),
            fromUserId: userId,
            type: NOTIFICATION_TYPES.REQUEST_APPROVED,
            message: `La tua richiesta per ${team?.name || 'la squadra'} è stata approvata!`,
            data: {
              teamId: request.team.toString()
            }
          });

          // Push notification
          const player = await userModel.findById(request.player.toString());
          if (player?.fcmToken) {
            await sendFCMNotification(player.fcmToken, {
              title: '✅ Richiesta Approvata',
              body: `Sei entrato in ${team?.name || 'la squadra'}!`,
              data: {
                type: 'request_approved',
                teamId: request.team.toString()
              }
            });
          }
        }
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }

      return res.status(200).json({ 
        message: 'Richiesta approvata con successo' 
      });
    }

    // REJECT REQUEST con NOTIFICA
    if (req.method === 'POST' && req.query.action === 'reject') {
      const { requestId } = req.body;

      if (!requestId) {
        return res.status(400).json({ error: 'ID richiesta richiesto' });
      }

      // Prima di rifiutare, prendiamo i dati per la notifica
      const request = await requestModel.collection.findOne({ _id: new ObjectId(requestId) });
      const team = request ? await teamModel.findById(request.team.toString()) : null;

      await requestModel.reject(requestId, userId);

      // NUOVO: Invia notifica al giocatore
      try {
        if (request) {
          await notificationModel.create({
            toUserId: request.player.toString(),
            fromUserId: userId,
            type: NOTIFICATION_TYPES.REQUEST_REJECTED,
            message: `La tua richiesta per ${team?.name || 'la squadra'} è stata rifiutata`,
            data: {
              teamId: request.team.toString()
            }
          });

          // Push notification
          const player = await userModel.findById(request.player.toString());
          if (player?.fcmToken) {
            await sendFCMNotification(player.fcmToken, {
              title: '❌ Richiesta Rifiutata',
              body: `La tua richiesta per ${team?.name || 'la squadra'} è stata rifiutata`,
              data: {
                type: 'request_rejected',
                teamId: request.team.toString()
              }
            });
          }
        }
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }

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

/**
 * Invia notifica push tramite Firebase Cloud Messaging
 */
async function sendFCMNotification(fcmToken, payload) {
  if (!process.env.FIREBASE_SERVER_KEY) {
    console.log('⚠️ FIREBASE_SERVER_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${process.env.FIREBASE_SERVER_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
          sound: 'default',
          badge: '1'
        },
        data: payload.data,
        priority: 'high'
      })
    });

    return response.ok;
  } catch (error) {
    console.error('FCM send error:', error);
    return false;
  }
}
