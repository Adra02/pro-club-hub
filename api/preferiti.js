// ============================================
// API /api/notifications - VERSIONE FINALE CORRETTA
// ============================================

import { connectToDatabase } from '../lib/mongodb.js';
import { NotificationModel, NOTIFICATION_TYPES } from '../models/Notification.js';
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

    // ============================================
    // GET - Ottieni notifiche
    // ============================================
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

    // ============================================
    // POST - Crea notifica (interno - usato da altri endpoint)
    // ============================================
    if (req.method === 'POST' && req.url.includes('action=create')) {
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

    // ============================================
    // POST - Registra FCM Token
    // ============================================
    if (req.method === 'POST' && req.url.includes('action=register-fcm')) {
      const { fcmToken } = req.body;

      if (!fcmToken) {
        return res.status(400).json({ error: 'FCM Token richiesto' });
      }

      await userModel.updateFCMToken(userId, fcmToken);

      return res.status(200).json({
        message: 'FCM Token registrato con successo'
      });
    }

    // ============================================
    // PATCH - Segna come letta
    // ============================================
    if (req.method === 'PATCH' && req.url.includes('action=read')) {
      const { notificationId } = req.body;

      if (!notificationId) {
        return res.status(400).json({ error: 'notificationId richiesto' });
      }

      await notificationModel.markAsRead(notificationId, userId);

      return res.status(200).json({
        message: 'Notifica segnata come letta'
      });
    }

    // ============================================
    // PATCH - Segna tutte come lette
    // ============================================
    if (req.method === 'PATCH' && req.url.includes('action=read-all')) {
      await notificationModel.markAllAsRead(userId);

      return res.status(200).json({
        message: 'Tutte le notifiche segnate come lette'
      });
    }

    // ============================================
    // DELETE - Elimina notifica
    // ============================================
    if (req.method === 'DELETE' && req.url.includes('action=delete')) {
      const { notificationId } = req.body;

      if (!notificationId) {
        return res.status(400).json({ error: 'notificationId richiesto' });
      }

      await notificationModel.delete(notificationId, userId);

      return res.status(200).json({
        message: 'Notifica eliminata'
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
 */
async function sendPushNotification(toUserId, notification, userModel) {
  try {
    const user = await userModel.findById(toUserId);
    
    if (!user || !user.fcmToken) {
      console.log('User has no FCM token, skipping push notification');
      return;
    }

    // TODO: Implementare invio FCM quando il servizio è configurato
    console.log('Push notification would be sent to:', user.fcmToken);
    
    // Esempio di payload FCM:
    // const message = {
    //   token: user.fcmToken,
    //   notification: {
    //     title: '🔔 Pro Club Hub',
    //     body: notification.message
    //   },
    //   data: {
    //     notificationId: notification._id.toString(),
    //     type: notification.type,
    //     ...notification.data
    //   }
    // };
    // await admin.messaging().send(message);

  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
