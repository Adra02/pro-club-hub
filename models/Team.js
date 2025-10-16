import { ObjectId } from 'mongodb';

export class TeamModel {
  constructor(db) {
    this.collection = db.collection('teams');
    this.createIndexes();
  }

  async createIndexes() {
    try {
      await this.collection.createIndex({ name: 1 }, { unique: true });
      await this.collection.createIndex({ createdAt: -1 });
      await this.collection.createIndex({ captain: 1 });
    } catch (error) {
      console.error('Error creating team indexes:', error);
    }
  }

  async create(teamData, captainId) {
    const { name, description, platform, instagram, tiktok } = teamData;

    const existingTeam = await this.collection.findOne({ name });
    if (existingTeam) {
      throw new Error('Nome squadra già in uso');
    }

    const team = {
      name,
      description: description || '',
      platform,
      instagram: instagram || '',
      tiktok: tiktok || '',
      captain: new ObjectId(captainId),
      members: [new ObjectId(captainId)],
      feedbackCount: 0,
      averageRating: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(team);
    return { ...team, _id: result.insertedId };
  }

  async findById(teamId) {
    if (!ObjectId.isValid(teamId)) return null;
    return await this.collection.findOne({ _id: new ObjectId(teamId) });
  }

  async findByName(name) {
    return await this.collection.findOne({ name });
  }

  async update(teamId, updateData, userId) {
    if (!ObjectId.isValid(teamId)) throw new Error('ID squadra non valido');

    const team = await this.findById(teamId);
    if (!team) throw new Error('Squadra non trovata');

    if (team.captain.toString() !== userId) {
      throw new Error('Solo il capitano può modificare la squadra');
    }

    const allowedFields = ['name', 'description', 'platform', 'instagram', 'tiktok'];
    const filteredData = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    filteredData.updatedAt = new Date();

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(teamId) },
      { $set: filteredData },
      { returnDocument: 'after' }
    );

    return result;
  }

  async addMember(teamId, userId, requesterId) {
    if (!ObjectId.isValid(teamId) || !ObjectId.isValid(userId)) {
      throw new Error('ID non valido');
    }

    const team = await this.findById(teamId);
    if (!team) throw new Error('Squadra non trovata');

    if (team.captain.toString() !== requesterId) {
      throw new Error('Solo il capitano può aggiungere membri');
    }

    const userObjectId = new ObjectId(userId);
    if (team.members.some(m => m.toString() === userId)) {
      throw new Error('Utente già nella squadra');
    }

    await this.collection.updateOne(
      { _id: new ObjectId(teamId) },
      {
        $push: { members: userObjectId },
        $set: { updatedAt: new Date() }
      }
    );

    return true;
  }

  async removeMember(teamId, userId, requesterId) {
    if (!ObjectId.isValid(teamId) || !ObjectId.isValid(userId)) {
      throw new Error('ID non valido');
    }

    const team = await this.findById(teamId);
    if (!team) throw new Error('Squadra non trovata');

    if (team.captain.toString() !== requesterId && requesterId !== userId) {
      throw new Error('Non hai i permessi per rimuovere questo membro');
    }

    if (team.captain.toString() === userId) {
      throw new Error('Il capitano non può lasciare la squadra. Trasferisci la leadership prima.');
    }

    await this.collection.updateOne(
      { _id: new ObjectId(teamId) },
      {
        $pull: { members: new ObjectId(userId) },
        $set: { updatedAt: new Date() }
      }
    );

    return true;
  }

  async search(filters = {}) {
    const query = {};

    if (filters.platform) {
      query.platform = filters.platform;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const teams = await this.collection
      .find(query)
      .sort({ averageRating: -1, createdAt: -1 })
      .limit(50)
      .toArray();

    return teams;
  }

  async updateFeedbackStats(teamId, averageRating, feedbackCount) {
    if (!ObjectId.isValid(teamId)) return false;

    await this.collection.updateOne(
      { _id: new ObjectId(teamId) },
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

  async delete(teamId, userId) {
    if (!ObjectId.isValid(teamId)) throw new Error('ID squadra non valido');

    const team = await this.findById(teamId);
    if (!team) throw new Error('Squadra non trovata');

    if (team.captain.toString() !== userId) {
      throw new Error('Solo il capitano può eliminare la squadra');
    }

    await this.collection.deleteOne({ _id: new ObjectId(teamId) });
    return true;
  }
}