import { ObjectId } from 'mongodb';

export class TeamRequestModel {
  constructor(db) {
    this.collection = db.collection('team_requests');
    this.createIndexes();
  }

  async createIndexes() {
    try {
      await this.collection.createIndex({ team: 1, player: 1 }, { unique: true });
      await this.collection.createIndex({ team: 1, status: 1 });
      await this.collection.createIndex({ player: 1 });
      await this.collection.createIndex({ createdAt: -1 });
    } catch (error) {
      console.error('Error creating team request indexes:', error);
    }
  }

  async create(teamId, playerId) {
    if (!ObjectId.isValid(teamId) || !ObjectId.isValid(playerId)) {
      throw new Error('ID non valido');
    }

    const existingRequest = await this.collection.findOne({
      team: new ObjectId(teamId),
      player: new ObjectId(playerId),
      status: 'pending'
    });

    if (existingRequest) {
      throw new Error('Hai già inviato una richiesta a questa squadra');
    }

    const request = {
      team: new ObjectId(teamId),
      player: new ObjectId(playerId),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(request);
    return { ...request, _id: result.insertedId };
  }

  async getTeamRequests(teamId) {
    if (!ObjectId.isValid(teamId)) return [];

    return await this.collection
      .find({ 
        team: new ObjectId(teamId),
        status: 'pending'
      })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getPlayerRequests(playerId) {
    if (!ObjectId.isValid(playerId)) return [];

    return await this.collection
      .find({ 
        player: new ObjectId(playerId)
      })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async approve(requestId, approverId, teamModel, userModel) {
    if (!ObjectId.isValid(requestId)) throw new Error('ID richiesta non valido');

    const request = await this.collection.findOne({ _id: new ObjectId(requestId) });
    if (!request) throw new Error('Richiesta non trovata');

    if (request.status !== 'pending') {
      throw new Error('Richiesta già processata');
    }

    const team = await teamModel.findById(request.team.toString());
    if (!team) throw new Error('Squadra non trovata');

    const isCaptain = team.captain.toString() === approverId;
    const isViceCaptain = team.viceCaptain && team.viceCaptain.toString() === approverId;

    if (!isCaptain && !isViceCaptain) {
      throw new Error('Solo il capitano o vice capitano possono approvare richieste');
    }

    const player = await userModel.findById(request.player.toString());
    if (player.team) {
      throw new Error('Il giocatore è già in una squadra');
    }

    await teamModel.addMember(request.team.toString(), request.player.toString());
    await userModel.setTeam(request.player.toString(), request.team.toString());

    await this.collection.updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          status: 'approved',
          approvedBy: new ObjectId(approverId),
          updatedAt: new Date()
        }
      }
    );

    await this.collection.updateMany(
      { 
        player: request.player,
        status: 'pending',
        _id: { $ne: new ObjectId(requestId) }
      },
      {
        $set: {
          status: 'cancelled',
          updatedAt: new Date()
        }
      }
    );

    return true;
  }

  async reject(requestId, rejecterId) {
    if (!ObjectId.isValid(requestId)) throw new Error('ID richiesta non valido');

    const request = await this.collection.findOne({ _id: new ObjectId(requestId) });
    if (!request) throw new Error('Richiesta non trovata');

    if (request.status !== 'pending') {
      throw new Error('Richiesta già processata');
    }

    await this.collection.updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          status: 'rejected',
          rejectedBy: new ObjectId(rejecterId),
          updatedAt: new Date()
        }
      }
    );

    return true;
  }

  async cancel(requestId, playerId) {
    if (!ObjectId.isValid(requestId)) throw new Error('ID richiesta non valido');

    const request = await this.collection.findOne({ _id: new ObjectId(requestId) });
    if (!request) throw new Error('Richiesta non trovata');

    if (request.player.toString() !== playerId) {
      throw new Error('Puoi cancellare solo le tue richieste');
    }

    if (request.status !== 'pending') {
      throw new Error('Richiesta già processata');
    }

    await this.collection.updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          status: 'cancelled',
          updatedAt: new Date()
        }
      }
    );

    return true;
  }

  // CRITICAL FIX: Add countPending method
  async countPending() {
    try {
      return await this.collection.countDocuments({ status: 'pending' });
    } catch (error) {
      console.error('Error counting pending requests:', error);
      return 0;
    }
  }
}
