
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export const ROLES = [
  'Portiere (GK)',
  'Difensore (CB/LB/RB)',
  'Centrocampista (CM/CDM/CAM)',
  'Ala (LW/RW/LM/RM)',
  'Attaccante (ST/CF)'
];

export const PLATFORMS = ['PlayStation', 'Xbox', 'PC'];

export class UserModel {
  constructor(db) {
    this.collection = db.collection('users');
    this.createIndexes();
  }

  async createIndexes() {
    try {
      await this.collection.createIndex({ email: 1 }, { unique: true });
      await this.collection.createIndex({ username: 1 }, { unique: true });
      await this.collection.createIndex({ level: -1 });
      await this.collection.createIndex({ createdAt: -1 });
    } catch (error) {
      console.error('Error creating indexes:', error);
    }
  }

  async create(userData) {
    const { username, email, password, primaryRole, platform, level = 1 } = userData;

    const existingUser = await this.collection.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      throw new Error('Email o username già in uso');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = {
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      primaryRole,
      secondaryRoles: [],
      platform,
      level: Math.min(Math.max(1, level), 150),
      instagram: '',
      tiktok: '',
      bio: '',
      team: null,
      feedbackCount: 0,
      averageRating: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  async findById(userId) {
    if (!ObjectId.isValid(userId)) return null;
    return await this.collection.findOne({ _id: new ObjectId(userId) });
  }

  async findByEmail(email) {
    return await this.collection.findOne({ email: email.toLowerCase() });
  }

  async findByUsername(username) {
    return await this.collection.findOne({ username });
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async update(userId, updateData) {
    if (!ObjectId.isValid(userId)) throw new Error('ID utente non valido');

    const allowedFields = [
      'username', 'email', 'primaryRole', 'secondaryRoles',
      'platform', 'level', 'instagram', 'tiktok', 'bio'
    ];

    const filteredData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    if (filteredData.email) {
      filteredData.email = filteredData.email.toLowerCase();
    }

    if (filteredData.level !== undefined) {
      filteredData.level = Math.min(Math.max(1, filteredData.level), 150);
    }

    if (updateData.password) {
      filteredData.password = await bcrypt.hash(updateData.password, 12);
    }

    filteredData.updatedAt = new Date();

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: filteredData },
      { returnDocument: 'after' }
    );

    return result;
  }

  async updateFeedbackStats(userId, averageRating, feedbackCount) {
    if (!ObjectId.isValid(userId)) return false;

    await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          averageRating: Math.round(averageRating * 10) / 10,
          feedbackCount,
          updatedAt: new Date()
        }
      }
    );
    return true;
  }

  async search(filters = {}) {
    const query = {};

    if (filters.role) {
      query.$or = [
        { primaryRole: filters.role },
        { secondaryRoles: filters.role }
      ];
    }

    if (filters.platform) {
      query.platform = filters.platform;
    }

    if (filters.minLevel) {
      query.level = { $gte: parseInt(filters.minLevel) };
    }

    if (filters.maxLevel) {
      query.level = query.level || {};
      query.level.$lte = parseInt(filters.maxLevel);
    }

    if (filters.search) {
      query.$or = [
        { username: { $regex: filters.search, $options: 'i' } },
        { bio: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const users = await this.collection
      .find(query)
      .project({ password: 0 })
      .sort({ averageRating: -1, level: -1 })
      .limit(50)
      .toArray();

    return users;
  }

  async setTeam(userId, teamId) {
    if (!ObjectId.isValid(userId)) return false;

    await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { team: teamId ? new ObjectId(teamId) : null, updatedAt: new Date() } }
    );
    return true;
  }

  sanitizeUser(user) {
    if (!user) return null;
    const { password, ...sanitized } = user;
    return sanitized;
  }
}