import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export const ROLES = [
  'Portiere (POR)',
  'Difensore Centrale (DC)',
  'Terzino Destro (TD)',
  'Terzino Sinistro (TS)',
  'Centrocampista Difensivo (CDC)',
  'Centrocampista (CC)',
  'Centrocampista Offensivo (COC)',
  'Esterno Destro (ED)',
  'Esterno Sinistro (ES)',
  'Ala Destra (AD)',
  'Ala Sinistra (AS)',
  'Attaccante (ATT)'
];

// AGGIORNAMENTO: Piattaforme modificate
export const PLATFORMS = ['PlayStation 5', 'Xbox Series X/S', 'PC'];

export const NATIONALITIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua e Barbuda', 'Arabia Saudita', 
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaigian', 'Bahamas', 'Bahrein', 'Bangladesh',
  'Barbados', 'Belgio', 'Belize', 'Benin', 'Bhutan', 'Bielorussia', 'Birmania', 'Bolivia', 
  'Bosnia ed Erzegovina', 'Botswana', 'Brasile', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cambogia', 'Camerun', 'Canada', 'Capo Verde', 'Ciad', 'Cile', 'Cina', 'Cipro', 'Colombia',
  'Comore', 'Corea del Nord', 'Corea del Sud', 'Costa d\'Avorio', 'Costa Rica', 'Croazia', 'Cuba',
  'Danimarca', 'Dominica', 'Ecuador', 'Egitto', 'El Salvador', 'Emirati Arabi Uniti', 'Eritrea',
  'Estonia', 'Etiopia', 'Figi', 'Filippine', 'Finlandia', 'Francia', 'Gabon', 'Gambia', 'Georgia',
  'Germania', 'Ghana', 'Giamaica', 'Giappone', 'Gibuti', 'Giordania', 'Grecia', 'Grenada',
  'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guinea Equatoriale', 'Guyana', 'Haiti', 'Honduras',
  'India', 'Indonesia', 'Iran', 'Iraq', 'Irlanda', 'Islanda', 'Israele', 'Italia', 'Kazakhstan',
  'Kenya', 'Kirghizistan', 'Kiribati', 'Kosovo', 'Kuwait', 'Laos', 'Lesotho', 'Lettonia', 'Libano',
  'Liberia', 'Libia', 'Liechtenstein', 'Lituania', 'Lussemburgo', 'Macedonia del Nord', 'Madagascar',
  'Malawi', 'Malaysia', 'Maldive', 'Mali', 'Malta', 'Marocco', 'Marshall', 'Mauritania', 'Mauritius',
  'Messico', 'Micronesia', 'Moldavia', 'Monaco', 'Mongolia', 'Montenegro', 'Mozambico', 'Namibia',
  'Nauru', 'Nepal', 'Nicaragua', 'Niger', 'Nigeria', 'Norvegia', 'Nuova Zelanda', 'Oman', 'Paesi Bassi',
  'Pakistan', 'Palau', 'Palestina', 'Panama', 'Papua Nuova Guinea', 'Paraguay', 'Perù', 'Polonia',
  'Portogallo', 'Qatar', 'Regno Unito', 'Repubblica Ceca', 'Repubblica Centrafricana', 
  'Repubblica del Congo', 'Repubblica Democratica del Congo', 'Repubblica Dominicana', 'Romania',
  'Ruanda', 'Russia', 'Saint Kitts e Nevis', 'Saint Lucia', 'Saint Vincent e Grenadine', 'Samoa',
  'San Marino', 'Santa Sede', 'São Tomé e Príncipe', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone',
  'Singapore', 'Siria', 'Slovacchia', 'Slovenia', 'Somalia', 'Spagna', 'Sri Lanka', 'Stati Uniti',
  'Sudafrica', 'Sudan', 'Sudan del Sud', 'Suriname', 'Svezia', 'Svizzera', 'Swaziland', 'Tagikistan',
  'Taiwan', 'Tanzania', 'Thailandia', 'Timor Est', 'Togo', 'Tonga', 'Trinidad e Tobago', 'Tunisia',
  'Turchia', 'Turkmenistan', 'Tuvalu', 'Ucraina', 'Uganda', 'Ungheria', 'Uruguay', 'Uzbekistan',
  'Vanuatu', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

export class UserModel {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('users');
    this.settingsCollection = db.collection('settings');
    this.createIndexes();
  }

  async createIndexes() {
    try {
      await this.collection.createIndex({ email: 1 }, { unique: true });
      await this.collection.createIndex({ username: 1 }, { unique: true });
      await this.collection.createIndex({ level: -1 });
      await this.collection.createIndex({ createdAt: -1 });
      await this.collection.createIndex({ lastActive: -1 });
      await this.collection.createIndex({ lookingForTeam: 1 });
      await this.collection.createIndex({ nationality: 1 });
      await this.collection.createIndex({ profileCompleted: 1 });
    } catch (error) {
      console.error('Error creating indexes:', error);
    }
  }

  async getLevelLimits() {
    try {
      const settings = await this.settingsCollection.findOne({ _id: 'level_limits' });
      return {
        minLevel: settings?.minLevel || 1,
        maxLevel: settings?.maxLevel || 999
      };
    } catch (error) {
      console.error('Error getting level limits:', error);
      return { minLevel: 1, maxLevel: 999 };
    }
  }

  async validateLevel(level) {
    const limits = await this.getLevelLimits();
    const levelNum = parseInt(level);
    
    if (isNaN(levelNum)) {
      throw new Error('Il livello deve essere un numero');
    }
    
    if (levelNum < limits.minLevel) {
      throw new Error(`Il livello minimo è ${limits.minLevel}`);
    }
    
    if (levelNum > limits.maxLevel) {
      throw new Error(`Il livello massimo è ${limits.maxLevel}`);
    }
    
    return levelNum;
  }

  async create(userData) {
    const { username, email, password, primaryRole, platform, level = 1, nationality = 'Italia', fcmToken } = userData;

    const existingUser = await this.collection.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      throw new Error('Email o username già in uso');
    }

    const validatedLevel = await this.validateLevel(level);
    const hashedPassword = await bcrypt.hash(password, 12);

    // NUOVO: Aggiungi campo preferiti
    const user = {
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      primaryRole,
      secondaryRoles: [],
      platform,
      nationality,
      level: validatedLevel,
      instagram: '',
      tiktok: '',
      bio: '',
      team: null,
      feedbackCount: 0,
      averageRating: 0,
      lookingForTeam: false,
      profileCompleted: false,
      // NUOVO: Sistema preferiti
      preferiti: {
        giocatori: [],
        squadre: []
      },
      // NUOVO: FCM Token per notifiche push
      fcmToken: fcmToken || null,
      // NUOVO: Sistema anti-spam
      lastRequestTimestamp: null,
      requestCount: 0,
      resetToken: null,
      resetTokenExpiry: null,
      isAdmin: false,
      isSuspended: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActive: new Date()
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

  async findByResetToken(token) {
    return await this.collection.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async update(userId, updateData) {
    if (!ObjectId.isValid(userId)) throw new Error('ID utente non valido');

    const allowedFields = [
      'username', 'primaryRole', 'secondaryRoles',
      'platform', 'level', 'instagram', 'tiktok', 'bio', 'lookingForTeam', 
      'nationality', 'profileCompleted', 'fcmToken'
    ];

    const filteredData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    if (filteredData.level !== undefined) {
      const levelNum = parseInt(filteredData.level);
      
      if (isNaN(levelNum)) {
        throw new Error('Il livello deve essere un numero');
      }
      
      const limits = await this.getLevelLimits();
      
      if (levelNum < limits.minLevel) {
        filteredData.level = limits.minLevel;
      } else if (levelNum > limits.maxLevel) {
        filteredData.level = limits.maxLevel;
      } else {
        filteredData.level = levelNum;
      }
    }

    if (updateData.password) {
      filteredData.password = await bcrypt.hash(updateData.password, 12);
    }

    filteredData.updatedAt = new Date();
    filteredData.lastActive = new Date();

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: filteredData },
      { returnDocument: 'after' }
    );

    return result;
  }

  // NUOVO: Metodi per gestire preferiti
  async addPreferito(userId, targetId, type) {
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(targetId)) {
      throw new Error('ID non valido');
    }

    if (userId === targetId && type === 'giocatori') {
      throw new Error('Non puoi aggiungere te stesso ai preferiti');
    }

    const field = type === 'giocatori' ? 'preferiti.giocatori' : 'preferiti.squadre';
    
    const result = await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $addToSet: { [field]: new ObjectId(targetId) },
        $set: { updatedAt: new Date() }
      }
    );

    return result.modifiedCount > 0;
  }

  async removePreferito(userId, targetId, type) {
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(targetId)) {
      throw new Error('ID non valido');
    }

    const field = type === 'giocatori' ? 'preferiti.giocatori' : 'preferiti.squadre';
    
    const result = await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $pull: { [field]: new ObjectId(targetId) },
        $set: { updatedAt: new Date() }
      }
    );

    return result.modifiedCount > 0;
  }

  async getPreferiti(userId) {
    if (!ObjectId.isValid(userId)) return { giocatori: [], squadre: [] };

    const user = await this.findById(userId);
    return user?.preferiti || { giocatori: [], squadre: [] };
  }

  // NUOVO: Sistema anti-spam
  async checkRateLimit(userId) {
    if (!ObjectId.isValid(userId)) throw new Error('ID non valido');

    const user = await this.findById(userId);
    if (!user) throw new Error('Utente non trovato');

    const now = Date.now();
    const tenMinutesAgo = now - (10 * 60 * 1000);

    // Reset se sono passati 10 minuti
    if (!user.lastRequestTimestamp || user.lastRequestTimestamp < tenMinutesAgo) {
      await this.collection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            lastRequestTimestamp: now,
            requestCount: 1,
            updatedAt: new Date()
          }
        }
      );
      return { allowed: true, remaining: 14 };
    }

    // Controlla se ha superato il limite
    if (user.requestCount >= 15) {
      const timeRemaining = Math.ceil((tenMinutesAgo + (10 * 60 * 1000) - now) / 1000 / 60);
      throw new Error(`Hai raggiunto il limite massimo di 15 richieste ogni 10 minuti. Riprova tra ${timeRemaining} minuti.`);
    }

    // Incrementa il contatore
    await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $inc: { requestCount: 1 },
        $set: { updatedAt: new Date() }
      }
    );

    return { allowed: true, remaining: 15 - user.requestCount - 1 };
  }

  async setResetToken(userId, token, expiryDate) {
    if (!ObjectId.isValid(userId)) return false;

    await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          resetToken: token,
          resetTokenExpiry: expiryDate,
          updatedAt: new Date()
        }
      }
    );
    return true;
  }

  async clearResetToken(userId) {
    if (!ObjectId.isValid(userId)) return false;

    await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          resetToken: null,
          resetTokenExpiry: null,
          updatedAt: new Date()
        }
      }
    );
    return true;
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

  async updateLastActive(userId) {
    if (!ObjectId.isValid(userId)) return false;

    await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          lastActive: new Date(),
          updatedAt: new Date()
        }
      }
    );
    return true;
  }

  async search(filters = {}) {
    const query = { 
      lookingForTeam: true, 
      profileCompleted: true,
      isSuspended: { $ne: true } 
    };

    if (filters.role) {
      query.$or = [
        { primaryRole: filters.role },
        { secondaryRoles: filters.role }
      ];
    }

    if (filters.platform) {
      query.platform = filters.platform;
    }

    if (filters.nationality) {
      query.nationality = filters.nationality;
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

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    query.lastActive = { $gte: oneYearAgo };

    const users = await this.collection
      .find(query)
      .project({ password: 0, resetToken: 0, resetTokenExpiry: 0, email: 0 })
      .sort({ averageRating: -1, level: -1 })
      .limit(50)
      .toArray();

    return users;
  }

  async setTeam(userId, teamId) {
    if (!ObjectId.isValid(userId)) return false;

    await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          team: teamId ? new ObjectId(teamId) : null, 
          lookingForTeam: false,
          updatedAt: new Date() 
        } 
      }
    );
    return true;
  }

  async resetInactiveUsers() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const result = await this.collection.updateMany(
      { lastActive: { $lt: oneYearAgo } },
      {
        $set: {
          level: 1,
          lookingForTeam: false,
          updatedAt: new Date()
        }
      }
    );

    return result.modifiedCount;
  }

  async suspendUser(userId, suspend = true) {
    if (!ObjectId.isValid(userId)) return false;

    await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          isSuspended: suspend,
          updatedAt: new Date()
        }
      }
    );
    return true;
  }

  async deleteUser(userId) {
    if (!ObjectId.isValid(userId)) return false;
    await this.collection.deleteOne({ _id: new ObjectId(userId) });
    return true;
  }

  async getAllUsers() {
    try {
      const users = await this.collection
        .find({})
        .project({ 
          password: 0, 
          resetToken: 0, 
          resetTokenExpiry: 0 
        })
        .sort({ createdAt: -1 })
        .toArray();
      
      console.log(`✅ getAllUsers returned ${users.length} users`);
      return users;
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }
  }

  async countAll() {
    return await this.collection.countDocuments();
  }

  async countInactive() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return await this.collection.countDocuments({ lastActive: { $lt: oneYearAgo } });
  }

  sanitizeUser(user) {
    if (!user) return null;
    const { password, resetToken, resetTokenExpiry, ...sanitized } = user;
    return sanitized;
  }
}
