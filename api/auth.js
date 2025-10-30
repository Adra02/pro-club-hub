// ============================================
// API /api/auth - CON LOGIN ADMIN HARDCODED ✅
// ============================================

import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { authenticateRequest, generateToken } from '../lib/auth.js';
import { sendPasswordResetEmail } from '../lib/email.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  // Gestisci CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    // ============================================
    // LOGIN (CON ADMIN HARDCODED) ✅
    // ============================================
    if (req.method === 'POST' && req.url.includes('action=login')) {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({ error: 'Email e password richiesti' });
        }

        // ✅ CONTROLLO ADMIN HARDCODED
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        if (ADMIN_EMAIL && ADMIN_PASSWORD && email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          console.log('✅ Admin login diretto');
          
          // Genera token speciale per admin
          const adminToken = generateToken('admin');
          
          // Crea oggetto admin fittizio
          const adminUser = {
            _id: 'admin',
            username: 'Admin',
            email: ADMIN_EMAIL,
            isAdmin: true,
            profileCompleted: true,
            platform: 'PC',
            primaryRole: 'Admin',
            level: 50,
            averageRating: 5,
            feedbackCount: 0,
            lookingForTeam: false,
            nationality: 'Italia'
          };

          return res.status(200).json({
            message: 'Login admin effettuato con successo',
            token: adminToken,
            user: adminUser
          });
        }

        // Login normale per utenti normali
        const user = await userModel.findByEmail(email);
        
        if (!user) {
          return res.status(401).json({ error: 'Credenziali non valide' });
        }

        if (user.isSuspended) {
          return res.status(403).json({ error: 'Account sospeso. Contatta l\'amministratore.' });
        }

        const isValid = await userModel.verifyPassword(password, user.password);
        
        if (!isValid) {
          return res.status(401).json({ error: 'Credenziali non valide' });
        }

        const token = generateToken(user._id.toString());
        const sanitizedUser = userModel.sanitizeUser(user);

        return res.status(200).json({
          message: 'Login effettuato con successo',
          token,
          user: sanitizedUser
        });

      } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
          error: 'Errore durante il login',
          details: error.message 
        });
      }
    }

    // ============================================
    // ME (Get current user)
    // ============================================
    if (req.method === 'GET' && req.url.includes('action=me')) {
      try {
        const userId = await authenticateRequest(req);
        
        if (!userId) {
          return res.status(401).json({ error: 'Non autenticato' });
        }

        // ✅ CONTROLLO ADMIN SPECIALE
        if (userId === 'admin') {
          const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
          
          const adminUser = {
            _id: 'admin',
            username: 'Admin',
            email: ADMIN_EMAIL || 'admin@proclubhub.com',
            isAdmin: true,
            profileCompleted: true,
            platform: 'PC',
            primaryRole: 'Admin',
            level: 50,
            averageRating: 5,
            feedbackCount: 0,
            lookingForTeam: false,
            nationality: 'Italia'
          };

          return res.status(200).json({ user: adminUser });
        }

        const user = await userModel.findById(userId);
        
        if (!user) {
          return res.status(404).json({ error: 'Utente non trovato' });
        }

        if (user.isSuspended) {
          return res.status(403).json({ error: 'Account sospeso' });
        }

        const sanitizedUser = userModel.sanitizeUser(user);

        return res.status(200).json({ user: sanitizedUser });

      } catch (error) {
        console.error('Get me error:', error);
        return res.status(500).json({ error: 'Errore durante il recupero dei dati utente' });
      }
    }

    // ============================================
    // UPDATE ME (Update current user)
    // ============================================
    if (req.method === 'PUT' && req.url.includes('action=me')) {
      try {
        const userId = await authenticateRequest(req);
        
        if (!userId) {
          return res.status(401).json({ error: 'Non autenticato' });
        }

        // ✅ Admin non può modificare il profilo (è hardcoded)
        if (userId === 'admin') {
          return res.status(400).json({ error: 'L\'admin non può modificare il profilo' });
        }

        const updates = req.body;
        delete updates.password;
        delete updates.email;
        delete updates._id;
        delete updates.role;
        delete updates.suspended;
        delete updates.createdAt;

        const currentUser = await userModel.findById(userId);
        
        if (!currentUser) {
          return res.status(404).json({ error: 'Utente non trovato' });
        }

        if ('instagram' in updates || 'tiktok' in updates) {
          const newInstagram = updates.instagram !== undefined ? updates.instagram : currentUser.instagram;
          const newTiktok = updates.tiktok !== undefined ? updates.tiktok : currentUser.tiktok;

          if (!newInstagram && !newTiktok) {
            return res.status(400).json({ 
              error: 'Devi avere almeno un social (Instagram O TikTok)' 
            });
          }
        }

        const updatedUser = await userModel.update(userId, updates);
        const sanitizedUser = userModel.sanitizeUser(updatedUser);

        return res.status(200).json({
          message: 'Profilo aggiornato con successo',
          user: sanitizedUser
        });

      } catch (error) {
        console.error('Update me error:', error);
        return res.status(500).json({ error: 'Errore durante l\'aggiornamento del profilo' });
      }
    }

    // ============================================
    // FORGOT PASSWORD / REQUEST RESET
    // ============================================
    if (req.method === 'POST' && (req.url.includes('action=forgot-password') || req.url.includes('action=request-reset'))) {
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
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 ora

        await userModel.update(user._id.toString(), {
          resetToken,
          resetTokenExpiry
        });

        await sendPasswordResetEmail(email, user.username, resetToken);

        return res.status(200).json({
          message: 'Email di reset inviata con successo'
        });

      } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ error: 'Errore durante l\'invio dell\'email' });
      }
    }

    // ============================================
    // RESET PASSWORD
    // ============================================
    if (req.method === 'POST' && req.url.includes('action=reset-password')) {
      try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
          return res.status(400).json({ error: 'Token e password richiesti' });
        }

        if (newPassword.length < 6) {
          return res.status(400).json({ error: 'Password deve essere almeno 6 caratteri' });
        }

        const user = await userModel.findByResetToken(token);
        
        if (!user) {
          return res.status(400).json({ error: 'Token non valido o scaduto' });
        }

        await userModel.update(user._id.toString(), {
          password: newPassword,
          resetToken: null,
          resetTokenExpiry: null
        });

        return res.status(200).json({
          message: 'Password reimpostata con successo'
        });

      } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ error: 'Errore durante il reset della password' });
      }
    }

    return res.status(404).json({ error: 'Endpoint non trovato' });

  } catch (error) {
    console.error('❌ Auth API error:', error);
    return res.status(500).json({ 
      error: 'Errore del server',
      details: error.message 
    });
  }
}
