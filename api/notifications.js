// ============================================
// API /api/notifications.js - CORRETTO ✅
// ============================================

import { connectToDatabase } from '../lib/mongodb.js';
import { NotificationModel, NOTIFICATION_TYPES } from '../models/Notifications.js'; // ✅ CORRETTO: Notifications con la S
import { UserModel } from '../models/User.js';
import { authenticateRequest } from '../lib/auth.js';

/**
 * API /api/notifications
 * 
 * Gestisce le notifiche push tramite Firebase Cloud Messaging (FCM)
 * Un unico endpoint per risparmiare funzioni Vercel
 * 
 * GET    /api/notifications                     - Ottieni notifiche utente
 * POST   /api/notifications?action=create       - Crea nuova notifica (interno)
 * PATCH  /api/notifications?action=read         - Segna come letta
 * PATCH  /api/notifications?action=read-all     - Segna tutte come lette
 * DELETE /api/notifications?action=delete       - Elimina notifica
 * POST   /api/notifications?action=register-fcm - Registra FCM token
 */

export default async function handler(req, res) {
  try {
    const userId = await authenticateRequest(req);
    if (!userId) {
      return res.status(401).json({ error: 'Non autenticato' });
    }

    const { db } = await connectToDatabase();
    const notificationModel = new NotificationModel(db);
    const userModel = new UserModel(db);

    // GET - Ottieni notifiche
    if (req.method === 'GET') {
      const { unreadOnly } = req.query;
      
      const notifications = await notificationModel.getUserNotifications(
        userId,
        unreadOnly === 'true'
      );

      // Popola i dettagli dell'utente mittente
      const notificationsWithDetails = await Promise.all(
        notifications.map(async (notif) => {
          const fromUser = await userModel.findById(notif.fromUserId.toString());
          return {
            ...notif,
            fromUser: fromUser ? userModel.sanitizeUser(fromUser) : null
          };
        })
      );

      const unreadCount = await notificationModel.getUnreadCount(userId);

      return res.status(200).json({
        notifications: notificationsWithDetails,
        unreadCount
      });
    }

    // POST - Crea notifica (interno - usato da altri endpoint)
    if (req.method === 'POST' && req.query.action === 'create') {
      const { toUserId, type, message, data } = req.body;

      if (!toUserId || !type || !message) {
        return res.status(400).json({ error: 'toUserId, type e message sono richiesti' });
      }

      const notification = await notificationModel.create({
        toUserId,
        fromUserId: userId,
        type,
        message,
        data: data || {}
      });

      // Invia notifica push tramite FCM
      await sendPushNotification(toUserId, notification, userModel);

      return res.status(201).json({
        message: 'Notifica creata',
        notification
      });
    }

    // POST - Registra FCM Token
    if (req.method === 'POST' && req.query.action === 'register-fcm') {
      const { fcmToken } = req.body;

      if (!fcmToken) {
        return res.status(400).json({ error: 'FCM token richiesto' });
      }

      await userModel.update(userId, { fcmToken });

      return res.status(200).json({
        message: 'FCM token registrato',
        success: true
      });
    }

    // PATCH - Segna come letta
    if (req.method === 'PATCH' && req.query.action === 'read') {
      const { notificationId } = req.body;

      if (!notificationId) {
        return res.status(400).json({ error: 'ID notifica richiesto' });
      }

      const success = await notificationModel.markAsRead(notificationId, userId);

      if (!success) {
        return res.status(404).json({ error: 'Notifica non trovata' });
      }

      return res.status(200).json({
        message: 'Notifica segnata come letta',
        success: true
      });
    }

    // PATCH - Segna tutte come lette
    if (req.method === 'PATCH' && req.query.action === 'read-all') {
      const count = await notificationModel.markAllAsRead(userId);

      return res.status(200).json({
        message: `${count} notifiche segnate come lette`,
        count
      });
    }

    // DELETE - Elimina notifica
    if (req.method === 'DELETE' && req.query.action === 'delete') {
      const { notificationId } = req.body;

      if (!notificationId) {
        return res.status(400).json({ error: 'ID notifica richiesto' });
      }

      const success = await notificationModel.delete(notificationId, userId);

      if (!success) {
        return res.status(404).json({ error: 'Notifica non trovata' });
      }

      return res.status(200).json({
        message: 'Notifica eliminata',
        success: true
      });
    }

    return res.status(404).json({ error: 'Endpoint non trovato' });

  } catch (error) {
    console.error('Notifications endpoint error:', error);
    return res.status(500).json({
      error: error.message || 'Errore durante l\'operazione'
    });
  }
}

/**
 * Invia notifica push tramite Firebase Cloud Messaging
 * 
 * NOTA: Per attivare FCM, l'utente deve:
 * 1. Creare un progetto su Firebase Console
 * 2. Ottenere la chiave server FCM
 * 3. Aggiungere FIREBASE_SERVER_KEY nelle variabili d'ambiente Vercel
 * 4. Nel client React Native, configurare @react-native-firebase/messaging
 */
async function sendPushNotification(toUserId, notification, userModel) {
  try {
    const targetUser = await userModel.findById(toUserId);
    
    if (!targetUser || !targetUser.fcmToken) {
      console.log(`User ${toUserId} has no FCM token registered`);
      return false;
    }

    // Se non è configurata la chiave FCM, salta l'invio
    if (!process.env.FIREBASE_SERVER_KEY) {
      console.log('⚠️ FIREBASE_SERVER_KEY not configured. Skipping push notification.');
      return false;
    }

    const fcmPayload = {
      to: targetUser.fcmToken,
      notification: {
        title: 'Pro Club Hub',
        body: notification.message,
        icon: 'ic_notification',
        sound: 'default'
      },
      data: {
        notificationId: notification._id.toString(),
        type: notification.type,
        ...notification.data
      }
    };

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${process.env.FIREBASE_SERVER_KEY}`
      },
      body: JSON.stringify(fcmPayload)
    });

    if (!response.ok) {
      console.error('FCM Error:', await response.text());
      return false;
    }

    console.log('✅ Push notification sent successfully');
    return true;

  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}
