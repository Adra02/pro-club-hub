import { connectToDatabase } from '../../lib/mongodb.js';
import { UserModel } from '../../models/User.js';
import { authenticateRequest } from '../../lib/auth.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await authenticateRequest(req);
    if (!userId) {
      return res.status(401).json({ error: 'Non autenticato' });
    }

    const { db } = await connectToDatabase();
    const userModel = new UserModel(db);

    const { id, role, platform, minLevel, maxLevel, search } = req.query;

    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID non valido' });
      }

      const user = await userModel.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }

      const sanitizedUser = userModel.sanitizeUser(user);
      return res.status(200).json({ user: sanitizedUser });
    }

    const filters = {};
    if (role) filters.role = role;
    if (platform) filters.platform = platform;
    if (minLevel) filters.minLevel = minLevel;
    if (maxLevel) filters.maxLevel = maxLevel;
    if (search) filters.search = search;

    const users = await userModel.search(filters);
    const sanitizedUsers = users.map(u => userModel.sanitizeUser(u));

    return res.status(200).json({ 
      users: sanitizedUsers,
      count: sanitizedUsers.length 
    });

  } catch (error) {
    console.error('Users endpoint error:', error);
    return res.status(500).json({ 
      error: 'Errore durante il recupero degli utenti' 
    });
  }
}
