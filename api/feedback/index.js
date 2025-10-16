import { connectToDatabase } from '../../lib/mongodb.js';
import { FeedbackModel, FEEDBACK_TAGS } from '../../models/Feedback.js';
import { UserModel } from '../../models/User.js';
import { TeamModel } from '../../models/Team.js';
import { authenticateRequest } from '../../lib/auth.js';
import { sendFeedbackNotification } from '../../lib/email.js';

export default async function handler(req, res) {
  try {
    const userId = await authenticateRequest(req);
    if (!userId) {
      return res.status(401).json({ error: 'Non autenticato' });
    }

    const { db } = await connectToDatabase();
    const feedbackModel = new FeedbackModel(db);
    const userModel = new UserModel(db);
    const teamModel = new TeamModel(db);

    if (req.method === 'POST') {
      const { targetUserId, targetTeamId, rating, comment, tags } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ 
          error: 'Rating deve essere tra 1 e 5' 
        });
      }

      if (!targetUserId && !targetTeamId) {
        return res.status(400).json({ 
          error: 'Devi specificare un utente o una squadra' 
        });
      }

      if (tags && tags.length > 0) {
        const invalidTags = tags.filter(tag => !FEEDBACK_TAGS.includes(tag));
        if (invalidTags.length > 0) {
          return res.status(400).json({ 
            error: 'Tag non validi: ' + invalidTags.join(', ') 
          });
        }
      }

      const feedback = await feedbackModel.create({
        fromUserId: userId,
        targetUserId,
        targetTeamId,
        rating: parseInt(rating),
        comment,
        tags: tags || []
      });

      if (targetUserId) {
        const stats = await feedbackModel.calculateUserStats(targetUserId);
        await userModel.updateFeedbackStats(targetUserId, stats.average, stats.count);

        const targetUser = await userModel.findById(targetUserId);
        const fromUser = await userModel.findById(userId);
        
        if (targetUser && fromUser) {
          sendFeedbackNotification(
            targetUser.email,
            targetUser.username,
            fromUser.username,
            rating,
            tags || []
          ).catch(err => console.error('Email notification failed:', err));
        }
      }

      if (targetTeamId) {
        const stats = await feedbackModel.calculateTeamStats(targetTeamId);
        await teamModel.updateFeedbackStats(targetTeamId, stats.average, stats.count);
      }

      return res.status(201).json({
        message: 'Feedback inviato con successo',
        feedback
      });
    }

    if (req.method === 'GET') {
      const { userId: targetUserId, teamId } = req.query;

      if (targetUserId) {
        const feedback = await feedbackModel.getFeedbackForUser(targetUserId);
        const stats = await feedbackModel.calculateUserStats(targetUserId);

        const feedbackWithUsers = await Promise.all(
          feedback.map(async (fb) => {
            const fromUser = await userModel.findById(fb.fromUser.toString());
            return {
              ...fb,
              fromUser: fromUser ? userModel.sanitizeUser(fromUser) : null
            };
          })
        );

        return res.status(200).json({ 
          feedback: feedbackWithUsers.filter(f => f.fromUser !== null),
          stats
        });
      }

      if (teamId) {
        const feedback = await feedbackModel.getFeedbackForTeam(teamId);
        const stats = await feedbackModel.calculateTeamStats(teamId);

        const feedbackWithUsers = await Promise.all(
          feedback.map(async (fb) => {
            const fromUser = await userModel.findById(fb.fromUser.toString());
            return {
              ...fb,
              fromUser: fromUser ? userModel.sanitizeUser(fromUser) : null
            };
          })
        );

        return res.status(200).json({ 
          feedback: feedbackWithUsers.filter(f => f.fromUser !== null),
          stats
        });
      }

      return res.status(400).json({ 
        error: 'Specifica userId o teamId' 
      });
    }

    if (req.method === 'DELETE') {
      const { feedbackId } = req.body;

      if (!feedbackId) {
        return res.status(400).json({ error: 'ID feedback richiesto' });
      }

      await feedbackModel.delete(feedbackId, userId);
      return res.status(200).json({ 
        message: 'Feedback eliminato con successo' 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Feedback endpoint error:', error);
    return res.status(500).json({ 
      error: error.message || 'Errore durante l\'operazione' 
    });
  }
}