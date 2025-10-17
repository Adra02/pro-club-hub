import { ObjectId } from 'mongodb';

export const FEEDBACK_TAGS = [
  'Serio',
  'Comunicativo',
  'Divertente',
  'Tossico',
  'Giocatore di squadra',
  'Leader',
  'Affidabile',
  'Puntuale',
  'Tecnico',
  'Tattico'
];

export class FeedbackModel {
  constructor(db) {
    this.collection = db.collection('feedback');
    this.createIndexes();
  }

  async createIndexes() {
    try {
      await this.collection.createIndex({ targetUser: 1, createdAt: -1 });
      await this.collection.createIndex({ targetTeam: 1, createdAt: -1 });
      await this.collection.createIndex({ fromUser: 1 });
      await this.collection.createIndex({ createdAt: -1 });
    } catch (error) {
      console.error('Error creating feedback indexes:', error);
    }
  }

  async create(feedbackData) {
    const { fromUserId, targetUserId, targetTeamId, rating, comment, tags } = feedbackData;

    if (!rating || rating < 1 || rating > 5) {
      throw new Error('Rating deve essere tra 1 e 5');
    }

    if (!targetUserId && !targetTeamId) {
      throw new Error('Devi specificare un target (utente o team)');
    }

    const query = { fromUser: new ObjectId(fromUserId) };
    if (targetUserId) {
      query.targetUser = new ObjectId(targetUserId);
      if (fromUserId === targetUserId) {
        throw new Error('Non puoi lasciare feedback a te stesso');
      }
    }
    if (targetTeamId) {
      query.targetTeam = new ObjectId(targetTeamId);
    }

    const existingFeedback = await this.collection.findOne(query);
    if (existingFeedback) {
      throw new Error('Hai già lasciato un feedback per questo target');
    }

    const feedback = {
      fromUser: new ObjectId(fromUserId),
      targetUser: targetUserId ? new ObjectId(targetUserId) : null,
      targetTeam: targetTeamId ? new ObjectId(targetTeamId) : null,
      rating: parseInt(rating),
      comment: comment || '',
      tags: tags || [],
      createdAt: new Date()
    };

    const result = await this.collection.insertOne(feedback);
    return { ...feedback, _id: result.insertedId };
  }

  async getFeedbackForUser(userId) {
    if (!ObjectId.isValid(userId)) return [];

    const feedback = await this.collection
      .find({ targetUser: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return feedback;
  }

  async getFeedbackForTeam(teamId) {
    if (!ObjectId.isValid(teamId)) return [];

    const feedback = await this.collection
      .find({ targetTeam: new ObjectId(teamId) })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return feedback;
  }

  async calculateUserStats(userId) {
    if (!ObjectId.isValid(userId)) return { average: 0, count: 0 };

    const feedback = await this.getFeedbackForUser(userId);
    if (feedback.length === 0) {
      return { average: 0, count: 0 };
    }

    const sum = feedback.reduce((acc, f) => acc + f.rating, 0);
    const average = sum / feedback.length;

    return {
      average: Math.round(average * 10) / 10,
      count: feedback.length
    };
  }

  async calculateTeamStats(teamId) {
    if (!ObjectId.isValid(teamId)) return { average: 0, count: 0 };

    const feedback = await this.getFeedbackForTeam(teamId);
    if (feedback.length === 0) {
      return { average: 0, count: 0 };
    }

    const sum = feedback.reduce((acc, f) => acc + f.rating, 0);
    const average = sum / feedback.length;

    return {
      average: Math.round(average * 10) / 10,
      count: feedback.length
    };
  }

  async delete(feedbackId, userId) {
    if (!ObjectId.isValid(feedbackId)) throw new Error('ID feedback non valido');

    const feedback = await this.collection.findOne({ _id: new ObjectId(feedbackId) });
    if (!feedback) throw new Error('Feedback non trovato');

    if (feedback.fromUser.toString() !== userId) {
      throw new Error('Puoi eliminare solo i tuoi feedback');
    }

    await this.collection.deleteOne({ _id: new ObjectId(feedbackId) });
    return true;
  }
}
