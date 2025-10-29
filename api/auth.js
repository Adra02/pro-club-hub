// ============================================
// API /api/auth - VERSIONE FINALE CORRETTA
// ============================================

import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { generateToken, authenticateRequest } from '../lib/auth.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../lib/email.js';
import crypto from 'crypto';

/**
 * API /api/auth
 * 
 * POST   /api/auth?action=register       - Registra nuovo utente
 * POST   /api/auth?action=login          - Login utente
 * GET    /api/auth?action=me             - Ottieni dati utente corrente
 * PUT    /api/auth?action=me             - Aggiorna profilo utente
 * POST   /api/auth?action=forgot         - Richiedi reset password
 * POST   /api/auth?action=reset          - Reset password con token
 */

export default async function handler(req, res) {
  try {
    const { db } = await connectToDatabase();
    const userModel = new UserModel(db);

    // ============================================
    // REGISTER
    // ============================================
    if (req.method === 'POST' && req.url.includes('action=register')) {
      try {
        const { username, email, password, primaryRole, platform, level, nationality } = req.body;

        if (!username || !email || !password || !primaryRole || !platform) {
          return res.status(400).json({ 
            error: 'Username, email, password, ruolo e piattaforma sono obbligatori' 
          });
        }

        const newUser = await userModel.create({
          username,
          email,
          password,
          primaryRole,
          platform,
          level: level || 1,
          nationality: nationality || 'Italia'
        });

        await sendWelcomeEmail(email, username);

        const token = generateToken(newUser._id.toString());
        const sanitizedUser = userModel.sanitizeUser(newUser);

        return res.status(201).json({
          message: 'Registrazione completata con successo',
          token,
          user: sanitizedUser
        });

      } catch (error) {
        console.error('Registration error:', error);
        return res.status(400).json({ 
          error: error.message || 'Errore durante la registrazione. Riprova.' 
        });
      }
    }

    // ============================================
    // LOGIN
    // ============================================
    if (req.method === 'POST' && req.url.includes('action=login')) {
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
            level: 1,
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

        // NORMAL USER LOGIN
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

    // ============================================
    // GET CURRENT USER
    // ============================================
    if (req.method === 'GET' && req.url.includes('action=me')) {
      try {
        const userId = await authenticateRequest(req);
        
        if (!userId) {
          return res.status(401).json({ error: 'Non autenticato' });
        }

        // ADMIN CHECK
        if (userId === 'admin') {
          const adminEmail = process.env.ADMIN_EMAIL;
          const adminUser = {
            _id: 'admin',
            username: 'Admin',
            email: adminEmail,
            isAdmin: true,
            level: 1,
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
          return res.status(200).json(adminUser);
        }

        const user = await userModel.findById(userId);
        
        if (!user) {
          return res.status(404).json({ error: 'Utente non trovato' });
        }

        const sanitizedUser = userModel.sanitizeUser(user);
        return res.status(200).json(sanitizedUser);

      } catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ error: 'Errore nel recupero dati utente' });
      }
    }

    // ============================================
    // UPDATE PROFILE
    // ============================================
    if (req.method === 'PUT' && req.url.includes('action=me')) {
      try {
        const userId = await authenticateRequest(req);
        
        if (!userId) {
          return res.status(401).json({ error: 'Non autenticato' });
        }

        if (userId === 'admin') {
          return res.status(403).json({ error: 'Admin non può modificare il profilo' });
        }

        const updates = req.body;
        delete updates._id;
        delete updates.email;
        delete updates.password;
        delete updates.isAdmin;

        const updatedUser = await userModel.updateProfile(userId, updates);

        if (!updatedUser) {
          return res.status(404).json({ error: 'Utente non trovato' });
        }

        const sanitizedUser = userModel.sanitizeUser(updatedUser);

        return res.status(200).json({
          message: 'Profilo aggiornato con successo',
          user: sanitizedUser
        });

      } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ 
          error: error.message || 'Errore durante l\'aggiornamento' 
        });
      }
    }

    // ============================================
    // FORGOT PASSWORD
    // ============================================
    if (req.method === 'POST' && req.url.includes('action=forgot')) {
      try {
        const { email } = req.body;

        if (!email) {
          return res.status(400).json({ error: 'Email richiesta' });
        }

        const user = await userModel.findByEmail(email);
        
        if (!user) {
          return res.status(200).json({ 
            message: 'Se l\'email esiste, riceverai le istruzioni per il reset' 
          });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expiry = new Date(Date.now() + 3600000);

        await userModel.setResetToken(user._id.toString(), hashedToken, expiry);
        await sendPasswordResetEmail(user.email, user.username, resetToken);

        return res.status(200).json({ 
          message: 'Se l\'email esiste, riceverai le istruzioni per il reset' 
        });

      } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ error: 'Errore durante il reset password' });
      }
    }

    // ============================================
    // RESET PASSWORD
    // ============================================
    if (req.method === 'POST' && req.url.includes('action=reset')) {
      try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
          return res.status(400).json({ error: 'Token e nuova password richiesti' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const success = await userModel.resetPassword(hashedToken, newPassword);

        if (!success) {
          return res.status(400).json({ error: 'Token non valido o scaduto' });
        }

        return res.status(200).json({ message: 'Password reimpostata con successo' });

      } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ error: 'Errore durante il reset password' });
      }
    }

    return res.status(404).json({ error: 'Endpoint non trovato' });

  } catch (error) {
    console.error('Auth endpoint error:', error);
    return res.status(500).json({ error: 'Errore del server' });
  }
}
