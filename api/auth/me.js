import { connectToDatabase } from '../../lib/mongodb.js';
import { UserModel } from '../../models/User.js';
import { authenticateRequest } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
      const userId = await authenticateRequest(req);
    if (!userId) {
      return res.status(401).json({ error: 'Non autenticato' });
    }

    const { db } = await connectToDatabase();
    const userModel = new UserModel(db);

    if (req.method === 'GET') {
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }

      const sanitizedUser = userModel.sanitizeUser(user);
      return res.status(200).json({ user: sanitizedUser });
    }

    if (req.method === 'PUT') {
      const updates = req.body;

      if (updates.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updates.email)) {
          return res.status(400).json({ error: 'Email non valida' });
        }
      }

      if (updates.password && updates.password.length < 6) {
        return res.status(400).json({ 
          error: 'Password deve essere almeno 6 caratteri' 
        });
      }

      if (updates.level !== undefined) {
        const level = parseInt(updates.level);
        if (isNaN(level) || level < 1 || level > 150) {
          return res.status(400).json({ 
            error: 'Livello deve essere tra 1 e 150' 
          });
        }
        updates.level = level;
      }

      if (updates.secondaryRoles && updates.secondaryRoles.length > 2) {
        return res.status(400).json({ 
          error: 'Massimo 2 ruoli secondari' 
        });
      }

      const updatedUser = await userModel.update(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }

      const sanitizedUser = userModel.sanitizeUser(updatedUser);
      return res.status(200).json({
        message: 'Profilo aggiornato con successo',
        user: sanitizedUser
      });
    }

  } catch (error) {
    console.error('Me endpoint error:', error);
    
    if (error.message.includes('già in uso')) {
      return res.status(409).json({ error: error.message });
    }

    return res.status(500).json({ 
      error: 'Errore durante l\'operazione. Riprova.' 
    });
  }
}