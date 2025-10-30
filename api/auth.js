// ============================================
// API /api/auth - Autenticazione Completa
// ============================================

import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { authenticateRequest, generateToken } from '../lib/auth.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../lib/email.js';
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
    if (req.method === 'POST' && req.url.includes('/register')) {
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

        // Invia email di benvenuto (opzionale)
        try {
          await sendWelcomeEmail(email, username);
        } catch (emailError) {
          console.error('Email error:', emailError);
        }

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
        
        return res.status(500).json({ error: 'Errore durante la registrazione' });
      }
    }

    // ============================================
    // LOGIN (CON ADMIN HARDCODED)
    // ============================================
    if (req.method === 'POST' && req.url.includes('/login')) {
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
          
          const adminToken = generateToken('admin');
          
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
            nationality: 'Italia',
            secondaryRoles: [],
            favoriteTeams: [],
            favoritePlayers: []
          };

          return res.status(200).json({
            message: 'Login admin effettuato con successo',
            token: adminToken,
            user: adminUser
          });
        }

        // Login normale per utenti
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

        // Aggiorna lastActive
        await userModel.collection.updateOne(
          { _id: user._id },
          { $set: { lastActive: new Date() } }
        );

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
    // VERIFY TOKEN
    // ============================================
    if (req.method === 'GET' && req.url.includes('/verify')) {
      try {
        const userId = await authenticateRequest(req);
        
        if (!userId) {
          return res.status(401).json({ error: 'Non autenticato' });
        }

        // ✅ CONTROLLO ADMIN SPECIALE
        if (userId === 'admin') {
          const adminUser = {
            _id: 'admin',
            username: 'Admin',
            email: process.env.ADMIN_EMAIL,
            isAdmin: true,
            profileCompleted: true,
            platform: 'PC',
            primaryRole: 'Admin',
            level: 50,
            averageRating: 5,
            feedbackCount: 0,
            lookingForTeam: false,
            nationality: 'Italia',
            secondaryRoles: [],
            favoriteTeams: [],
            favoritePlayers: []
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

        return res.status(200).json({
          user: userModel.sanitizeUser(user)
        });

      } catch (error) {
        console.error('Verify error:', error);
        return res.status(401).json({ error: 'Token non valido' });
      }
    }

    // ============================================
    // RECOVER PASSWORD
    // ============================================
    if (req.method === 'POST' && req.url.includes('/recover')) {
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
        const resetExpires = new Date(Date.now() + 3600000); // 1 ora

        await userModel.collection.updateOne(
          { _id: user._id },
          { 
            $set: { 
              resetPasswordToken: resetToken,
              resetPasswordExpires: resetExpires 
            } 
          }
        );

        // Invia email
        try {
          await sendPasswordResetEmail(email, resetToken);
        } catch (emailError) {
          console.error('Email error:', emailError);
        }

        return res.status(200).json({
          message: 'Email di reset inviata con successo'
        });

      } catch (error) {
        console.error('Recover error:', error);
        return res.status(500).json({ error: 'Errore durante il recupero password' });
      }
    }

    // ============================================
    // RESET PASSWORD
    // ============================================
    if (req.method === 'POST' && req.url.includes('/reset')) {
      try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
          return res.status(400).json({ error: 'Token e nuova password richiesti' });
        }

        const user = await userModel.collection.findOne({
          resetPasswordToken: token,
          resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
          return res.status(400).json({ error: 'Token non valido o scaduto' });
        }

        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await userModel.collection.updateOne(
          { _id: user._id },
          { 
            $set: { password: hashedPassword },
            $unset: { resetPasswordToken: '', resetPasswordExpires: '' }
          }
        );

        return res.status(200).json({
          message: 'Password reimpostata con successo'
        });

      } catch (error) {
        console.error('Reset error:', error);
        return res.status(500).json({ error: 'Errore durante il reset password' });
      }
    }

    return res.status(404).json({ error: 'Endpoint non trovato' });

  } catch (error) {
    console.error('Auth endpoint error:', error);
    return res.status(500).json({ 
      error: 'Errore del server',
      details: error.message 
    });
  }
}
