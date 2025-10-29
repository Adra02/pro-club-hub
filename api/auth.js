// ============================================
// API /api/auth - VERSIONE COMPLETA CORRETTA
// ============================================

import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { authenticateRequest, generateToken } from '../lib/auth.js';
import { sendResetEmail } from '../lib/email.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const userModel = new UserModel(db);

  // REGISTER
  if (req.method === 'POST' && req.url === '/api/auth?action=register') {
    try {
      const { username, email, password, primaryRole, platform, level, nationality } = req.body;

      if (!username || !email || !password || !primaryRole || !platform) {
        return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
      }

      const user = await userModel.create({
        username,
        email,
        password,
        primaryRole,
        platform,
        level: level || 1,
        nationality: nationality || 'Italia'
      });

      const token = generateToken(user._id.toString());
      const sanitizedUser = userModel.sanitizeUser(user);

      return res.status(201).json({
        message: 'Registrazione completata con successo',
        token,
        user: sanitizedUser
      });

    } catch (error) {
      console.error('Register error:', error);
      
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

      // ✅ CHECK ADMIN - LIVELLO 1 FISSO
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (email === adminEmail && password === adminPassword) {
        const adminUser = {
          _id: 'admin',
          username: 'Admin',
          email: adminEmail,
          isAdmin: true,
          level: 1, // ✅ ADMIN LIVELLO 1
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

      // ✅ ADMIN LIVELLO 1
      if (userId === 'admin') {
        const adminUser = {
          _id: 'admin',
          username: 'Admin',
          email: process.env.ADMIN_EMAIL,
          isAdmin: true,
          level: 1, // ✅ LIVELLO 1
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

      // Validazione livello con auto-aggiustamento
      if (updates.level !== undefined) {
        const levelNum = parseInt(updates.level);
        
        if (isNaN(levelNum)) {
          return res.status(400).json({ error: 'Il livello deve essere un numero' });
        }

        const limits = await userModel.getLevelLimits();
        
        if (levelNum < limits.minLevel) {
          updates.level = limits.minLevel;
        } else if (levelNum > limits.maxLevel) {
          updates.level = limits.maxLevel;
        } else {
          updates.level = levelNum;
        }
      }

      // Validazione ruoli secondari
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
      
      const secondaryRoles = updates.secondaryRoles || user.secondaryRoles || [];
      const hasSecondaryRoles = secondaryRoles.length >= 1;
      
      const instagram = updates.instagram !== undefined ? updates.instagram : user.instagram;
      const tiktok = updates.tiktok !== undefined ? updates.tiktok : user.tiktok;
      const hasContact = (instagram && instagram.trim() !== '') || (tiktok && tiktok.trim() !== '');
      
      const isProfileCompleted = hasSecondaryRoles && hasContact;
      
      updates.profileCompleted = isProfileCompleted;
      
      if (!isProfileCompleted) {
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

  // FORGOT PASSWORD
  if (req.method === 'POST' && req.url === '/api/auth?action=forgot-password') {
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

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000);

      await userModel.update(user._id.toString(), {
        resetToken,
        resetTokenExpiry
      });

      await sendResetEmail(email, resetToken);

      return res.status(200).json({
        message: 'Email di reset inviata con successo'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({ error: 'Errore durante l\'invio dell\'email' });
    }
  }

  // RESET PASSWORD
  if (req.method === 'POST' && req.url === '/api/auth?action=reset-password') {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: 'Token e password richiesti' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password deve essere almeno 6 caratteri' });
      }

      const user = await userModel.findByResetToken(token);

      if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
        return res.status(400).json({ error: 'Token non valido o scaduto' });
      }

      await userModel.updatePassword(user._id.toString(), password);
      
      await userModel.update(user._id.toString(), {
        resetToken: null,
        resetTokenExpiry: null
      });

      return res.status(200).json({
        message: 'Password aggiornata con successo'
      });

    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({ error: 'Errore durante il reset della password' });
    }
  }

  return res.status(404).json({ error: 'Endpoint non trovato' });
}
