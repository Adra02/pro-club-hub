import { ObjectId } from 'mongodb';

export const NOTIFICATION_TYPES = {
  CLUB_REQUEST: 'club_request',
  PLAYER_REQUEST: 'player_request',
  REQUEST_APPROVED: 'request_approved',
  REQUEST_REJECTED: 'request_rejected'
};

export class NotificationModel {
  constructor(db) {
    this.collection = db.collection('notifications');
    this.createIndexes();
  }

  async createIndexes() {
    try {
      await this.collection.createIndex({ toUserId: 1, createdAt: -1 });
      await this.collection.createIndex({ read: 1 });
      await this.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 giorni
    } catch (error) {
      console.error('Error creating notification indexes:', error);
    }
  }

  async create(notificationData) {
    const { toUserId, fromUserId, type, message, data } = notificationData;

    if (!ObjectId.isValid(toUserId) || !ObjectId.isValid(fromUserId)) {
      throw new Error('ID non valido');
    }

    if (!Object.values(NOTIFICATION_TYPES).includes(type)) {
      throw new Error('Tipo notifica non valido');
    }

    const notification = {
      toUserId: new ObjectId(toUserId),
      fromUserId: new ObjectId(fromUserId),
      type,
      message,
      data: data || {},
      read: false,
      createdAt: new Date()
    };

    const result = await this.collection.insertOne(notification);
    return { ...notification, _id: result.insertedId };
  }

  async getUserNotifications(userId, unreadOnly = false) {
    if (!ObjectId.isValid(userId)) return [];

    const query = { toUserId: new ObjectId(userId) };
    if (unreadOnly) {
      query.read = false;
    }

    return await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
  }

  async markAsRead(notificationId, userId) {
    if (!ObjectId.isValid(notificationId) || !ObjectId.isValid(userId)) {
      throw new Error('ID non valido');
    }

    const result = await this.collection.updateOne(
      { 
        _id: new ObjectId(notificationId),
        toUserId: new ObjectId(userId)
      },
      { $set: { read: true } }
    );

    return result.modifiedCount > 0;
  }

  async markAllAsRead(userId) {
    if (!ObjectId.isValid(userId)) {
      throw new Error('ID utente non valido');
    }

    const result = await this.collection.updateMany(
      { toUserId: new ObjectId(userId), read: false },
      { $set: { read: true } }
    );

    return result.modifiedCount;
  }

  async getUnreadCount(userId) {
    if (!ObjectId.isValid(userId)) return 0;

    return await this.collection.countDocuments({
      toUserId: new ObjectId(userId),
      read: false
    });
  }

  async delete(notificationId, userId) {
    if (!ObjectId.isValid(notificationId) || !ObjectId.isValid(userId)) {
      throw new Error('ID non valido');
    }

    const result = await this.collection.deleteOne({
      _id: new ObjectId(notificationId),
      toUserId: new ObjectId(userId)
    });

    return result.deletedCount > 0;
  }
}
