// ============================================
// MODELS /models/Feedback.js - COMPLETO ✅
// ============================================

import { ObjectId } from 'mongodb';

export const FEEDBACK_TAGS = [
  'Ottimo giocatore',
  'Comunicativo',
  'Affidabile',
  'Tecnico',
  'Leader',
  'Fair play',
  'Puntuale',
  'Team player',
  'Strategico',
  'Positivo'
];

export class FeedbackModel {
  constructor(db) {
    this.collection = db.collection('feedbacks');
    this.createIndexes();
  }

  async createIndexes() {
    try {
      await this.collection.createIndex({ targetUserId: 1, createdAt: -1 });
      await this.collection.createIndex({ targetTeamId: 1, createdAt: -1 });
      await this.collection.createIndex({ fromUserId: 1 });
      await this.collection.createIndex({ rating: 1 });
    } catch (error) {
      console.error('Error creating feedback indexes:', error);
    }
  }

  async create(feedbackData) {
    const { fromUserId, targetUserId, targetTeamId, rating, comment, tags } = feedbackData;

    if (!ObjectId.isValid(fromUserId)) {
      throw new Error('ID utente non valido');
    }

    if (targetUserId && !ObjectId.isValid(targetUserId)) {
      throw new Error('ID utente target non valido');
    }

    if (targetTeamId && !ObjectId.isValid(targetTeamId)) {
      throw new Error('ID squadra target non valido');
    }

    if (!targetUserId && !targetTeamId) {
      throw new Error('Devi specificare un utente o una squadra');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating deve essere tra 1 e 5');
    }

    // Verifica che non stia lasciando feedback a se stesso
    if (targetUserId && fromUserId === targetUserId) {
      throw new Error('Non puoi lasciare feedback a te stesso');
    }

    const feedback = {
      fromUserId: new ObjectId(fromUserId),
      targetUserId: targetUserId ? new ObjectId(targetUserId) : null,
      targetTeamId: targetTeamId ? new ObjectId(targetTeamId) : null,
      rating: parseInt(rating),
      comment: comment || '',
      tags: tags || [],
      createdAt: new Date()
    };

    const result = await this.collection.insertOne(feedback);
    return { ...feedback, _id: result.insertedId };
  }

  async getUserFeedbacks(userId) {
    if (!ObjectId.isValid(userId)) return [];

    return await this.collection
      .find({ targetUserId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getTeamFeedbacks(teamId) {
    if (!ObjectId.isValid(teamId)) return [];

    return await this.collection
      .find({ targetTeamId: new ObjectId(teamId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async calculateUserStats(userId) {
    if (!ObjectId.isValid(userId)) {
      return { average: 0, count: 0 };
    }

    const feedbacks = await this.getUserFeedbacks(userId);
    
    if (feedbacks.length === 0) {
      return { average: 0, count: 0 };
    }

    const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
    const average = totalRating / feedbacks.length;

    return {
      average: parseFloat(average.toFixed(1)),
      count: feedbacks.length
    };
  }

  async calculateTeamStats(teamId) {
    if (!ObjectId.isValid(teamId)) {
      return { average: 0, count: 0 };
    }

    const feedbacks = await this.getTeamFeedbacks(teamId);
    
    if (feedbacks.length === 0) {
      return { average: 0, count: 0 };
    }

    const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
    const average = totalRating / feedbacks.length;

    return {
      average: parseFloat(average.toFixed(1)),
      count: feedbacks.length
    };
  }

  async delete(feedbackId, userId) {
    if (!ObjectId.isValid(feedbackId)) {
      throw new Error('ID feedback non valido');
    }

    const feedback = await this.collection.findOne({ _id: new ObjectId(feedbackId) });
    
    if (!feedback) {
      throw new Error('Feedback non trovato');
    }

    // Solo il creatore può eliminare il feedback
    if (feedback.fromUserId.toString() !== userId) {
      throw new Error('Non puoi eliminare questo feedback');
    }

    await this.collection.deleteOne({ _id: new ObjectId(feedbackId) });
    return true;
  }
}
