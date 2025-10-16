
import { connectToDatabase } from '../../lib/mongodb.js';
import { UserModel, ROLES, PLATFORMS } from '../../models/User.js';
import { generateToken } from '../../lib/auth.js';
import { sendWelcomeEmail } from '../../lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, email, password, primaryRole, platform, level } = req.body;

    if (!username || !email || !password || !primaryRole || !platform) {
      return res.status(400).json({ 
        error: 'Tutti i campi sono obbligatori' 
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ 
        error: 'Username deve essere tra 3 e 20 caratteri' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password deve essere almeno 6 caratteri' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Email non valida' 
      });
    }

    if (!ROLES.includes(primaryRole)) {
      return res.status(400).json({ 
        error: 'Ruolo non valido' 
      });
    }

    if (!PLATFORMS.includes(platform)) {
      return res.status(400).json({ 
        error: 'Piattaforma non valida' 
      });
    }

    const { db } = await connectToDatabase();
    const userModel = new UserModel(db);

    const user = await userModel.create({
      username,
      email,
      password,
      primaryRole,
      platform,
      level: level || 1
    });

    const token = generateToken(user._id.toString());

    sendWelcomeEmail(user.email, user.username).catch(err => 
      console.error('Email sending failed:', err)
    );

    const sanitizedUser = userModel.sanitizeUser(user);

    return res.status(201).json({
      message: 'Registrazione completata con successo',
      token,
      user: sanitizedUser
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message.includes('già in uso')) {
      return res.status(409).json({ error: error.message });
    }

    return res.status(500).json({ 
      error: 'Errore durante la registrazione. Riprova.' 
    });
  }
}
