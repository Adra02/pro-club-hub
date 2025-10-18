import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel, ROLES, PLATFORMS } from '../models/User.js';
import { generateToken, authenticateRequest, generateResetToken } from '../lib/auth.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../lib/email.js';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const userModel = new UserModel(db);

  // REGISTER
  if (req.method === 'POST' && req.url === '/api/auth?action=register') {
    try {
      const { username, email, password, primaryRole, platform, level, nationality } = req.body;

      if (!username || !email || !password || !primaryRole || !platform || !nationality) {
        return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
      }

      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ error: 'Username deve essere tra 3 e 20 caratteri' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password deve essere almeno 6 caratteri' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Email non valida' });
      }

      if (!ROLES.includes(primaryRole)) {
        return res.status(400).json({ error: 'Ruolo non valido' });
      }

      if (!PLATFORMS.includes(platform)) {
        return res.status(400).json({ error: 'Piattaforma non valida' });
      }

      const user = await userModel.create({
        username,
        email,
        password,
        primaryRole,
        platform,
        nationality,
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

      return res.status(500).json({ error: 'Errore durante la registrazione. Riprova.' });
    }
  }

  // LOGIN
  if (req.method === 'POST' && req.url === '/api/auth?action=login') {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e password sono obbligatori' });
      }

      // CHECK ADMIN
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (email === adminEmail && password === adminPassword) {
        const adminUser = {
          _id: 'admin',
          username: 'Admin',
          email: adminEmail,
          isAdmin: true,
          level: 999,
          platform: 'All',
          nationality: 'Global',
          primaryRole: 'Admin',
          secondaryRoles: [],
          averageRating: 5,
          feedbackCount: 0,
          team: null,
          lookingForTeam: false,
          profileCompleted: true
        };

        const token = generateToken('admin');
        return res.status(200).json({
          message: 'Login Admin effettuato',
          token,
          user: adminUser
        });
      }

      const user = await userModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Email o password non corretti' });
      }

      const isValidPassword = await userModel.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Email o password non corretti' });
      }

      await userModel.updateLastActive(user._id.toString());

      const token = generateToken(user._id.toString());
      const sanitizedUser = userModel.sanitizeUser(user);

      return res.status(200).json({
        message: 'Login effettuato con successo',
        token,
        user: sanitizedUser
      });

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Errore durante il login. Riprova.' });
    }
  }

  // GET ME
  if (req.method === 'GET' && req.url === '/api/auth?action=me') {
    try {
      const userId = await authenticateRequest(req);
      if (!userId) {
        return res.status(401).json({ error: 'Non autenticato' });
      }

      if (userId === 'admin') {
        const adminUser = {
          _id: 'admin',
          username: 'Admin',
          email: process.env.ADMIN_EMAIL,
          isAdmin: true,
          level: 999,
          platform: 'All',
          nationality: 'Global',
          primaryRole: 'Admin',
          secondaryRoles: [],
          averageRating: 5,
          feedbackCount: 0,
          team: null,
          lookingForTeam: false,
          profileCompleted: true
        };
        return res.status(200).json({ user: adminUser });
      }

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }

      await userModel.updateLastActive(userId);

      const sanitizedUser = userModel.sanitizeUser(user);
      return res.status(200).json({ user: sanitizedUser });

    } catch (error) {
      console.error('Get me error:', error);
      return res.status(500).json({ error: 'Errore durante il recupero del profilo' });
    }
  }

  // UPDATE ME
  if (req.method === 'PUT' && req.url === '/api/auth?action=me') {
    try {
      const userId = await authenticateRequest(req);
      if (!userId) {
        return res.status(401).json({ error: 'Non autenticato' });
      }

      if (userId === 'admin') {
        return res.status(403).json({ error: 'Admin non può modificare il profilo' });
      }

      const updates = req.body;

      if (updates.level !== undefined) {
        const level = parseInt(updates.level);
        if (isNaN(level) || level < 1) {
          return res.status(400).json({ error: 'Livello deve essere almeno 1' });
        }
        updates.level = level;
      }

      if (updates.secondaryRoles) {
        if (!Array.isArray(updates.secondaryRoles)) {
          return res.status(400).json({ error: 'Ruoli secondari deve essere un array' });
        }
        if (updates.secondaryRoles.length < 1) {
          return res.status(400).json({ error: 'Almeno 1 ruolo secondario richiesto' });
        }
        if (updates.secondaryRoles.length > 2) {
          return res.status(400).json({ error: 'Massimo 2 ruoli secondari' });
        }
      }

      // Check profile completion
      const user = await userModel.findById(userId);
      const hasSecondaryRoles = updates.secondaryRoles?.length >= 1 || user.secondaryRoles?.length >= 1;
      const hasContact = updates.instagram || updates.tiktok || user.instagram || user.tiktok;

      if (hasSecondaryRoles && hasContact) {
        updates.profileCompleted = true;
      } else {
        updates.profileCompleted = false;
        updates.lookingForTeam = false;
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

    } catch (error) {
      console.error('Update me error:', error);
      
      if (error.message.includes('già in uso')) {
        return res.status(409).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Errore durante l\'aggiornamento. Riprova.' });
    }
  }

  // REQUEST PASSWORD RESET
  if (req.method === 'POST' && req.url === '/api/auth?action=request-reset') {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email richiesta' });
      }

      const user = await userModel.findByEmail(email);
      if (!user) {
        return res.status(200).json({ 
          message: 'Se l\'email esiste, riceverai un link per il reset' 
        });
      }

      const resetToken = generateResetToken();
      const expiryDate = new Date(Date.now() + 3600000);

      await userModel.setResetToken(user._id.toString(), resetToken, expiryDate);

      sendPasswordResetEmail(user.email, user.username, resetToken).catch(err =>
        console.error('Reset email failed:', err)
      );

      return res.status(200).json({ 
        message: 'Se l\'email esiste, riceverai un link per il reset' 
      });

    } catch (error) {
      console.error('Request reset error:', error);
      return res.status(500).json({ error: 'Errore durante la richiesta. Riprova.' });
    }
  }

  // RESET PASSWORD
  if (req.method === 'POST' && req.url === '/api/auth?action=reset-password') {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token e nuova password richiesti' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password deve essere almeno 6 caratteri' });
      }

      const user = await userModel.findByResetToken(token);
      if (!user) {
        return res.status(400).json({ error: 'Token non valido o scaduto' });
      }

      await userModel.update(user._id.toString(), { password: newPassword });
      await userModel.clearResetToken(user._id.toString());

      return res.status(200).json({ 
        message: 'Password reimpostata con successo' 
      });

    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({ error: 'Errore durante il reset. Riprova.' });
    }
  }

  return res.status(404).json({ error: 'Endpoint non trovato' });
}
