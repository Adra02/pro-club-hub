import { connectToDatabase } from '../../lib/mongodb.js';
import { FeedbackModel } from '../../models/Feedback.js';
import { UserModel } from '../../models/User.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user: userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID richiesto' });
    }

    const { db } = await connectToDatabase();
    const feedbackModel = new FeedbackModel(db);
    const userModel = new UserModel(db);

    const feedback = await feedbackModel.getFeedbackForUser(userId);
    const stats = await feedbackModel.calculateUserStats(userId);

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

  } catch (error) {
    console.error('User feedback endpoint error:', error);
    return res.status(500).json({ 
      error: 'Errore durante il recupero dei feedback' 
    });
  }
}
