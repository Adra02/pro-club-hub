// ============================================
// API /api/auth - VERSIONE DEFINITIVA CORRETTA ✅✅
// TUTTI I PROBLEMI RISOLTI:
// 1. sendPasswordResetEmail invece di sendResetEmail
// 2. verifyPassword invece di validatePassword
// ============================================

import { connectToDatabase } from '../lib/mongodb.js';
import { UserModel } from '../models/User.js';
import { authenticateRequest, generateToken } from '../lib/auth.js';
import { sendPasswordResetEmail } from '../lib/email.js'; // ✅ CORRETTO!
import crypto from 'crypto';

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
    // LOGIN
    // ============================================
    if (req.method === 'POST' && req.url.includes('action=login')) {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({ error: 'Email e password richiesti' });
        }

        const user = await userModel.findByEmail(email);
        
        if (!user) {
          return res.status(401).json({ error: 'Credenziali non valide' });
        }

        if (user.suspended) {
          return res.status(403).json({ error: 'Account sospeso. Contatta l\'amministratore.' });
        }

        // ✅ CORREZIONE: verifyPassword invece di validatePassword
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
        return res.status(500).json({ error: 'Errore durante il login' });
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

        const user = await userModel.findById(userId);
        
        if (!user) {
          return res.status(404).json({ error: 'Utente non trovato' });
        }

        if (user.suspended) {
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
          // Per sicurezza, restituiamo sempre lo stesso messaggio
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

        // ✅ CORRETTO: sendPasswordResetEmail invece di sendResetEmail
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

    // ============================================
    // 404 - ENDPOINT NON TROVATO
    // ============================================
    return res.status(404).json({ error: 'Endpoint non trovato' });

  } catch (error) {
    // CATCH GLOBALE - cattura errori non gestiti
    console.error('Auth handler error:', error);
    return res.status(500).json({ 
      error: 'Errore interno del server',
      message: error.message 
    });
  }
}
