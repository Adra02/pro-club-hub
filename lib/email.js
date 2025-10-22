// ============================================
// EMAIL SERVICE - VERSIONE MIGLIORATA
// Con logging avanzato e gestione errori
// ============================================

import nodemailer from 'nodemailer';

const APP_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:3000';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  // ⚠️ CONTROLLO CRITICO: Verifica che le variabili d'ambiente esistano
  if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_KEY) {
    console.error('❌ ERRORE CONFIGURAZIONE EMAIL:');
    console.error('Le variabili d\'ambiente BREVO_SMTP_USER e BREVO_SMTP_KEY non sono configurate!');
    console.error('\n📝 Configura queste variabili in Vercel:');
    console.error('- BREVO_SMTP_USER = 99c7af001@smtp-brevo.com');
    console.error('- BREVO_SMTP_KEY = V31WMRUqTXLH85sD');
    return null;
  }

  console.log('📧 Inizializzazione transporter email...');
  console.log('✓ BREVO_SMTP_USER:', process.env.BREVO_SMTP_USER);
  console.log('✓ BREVO_SMTP_KEY:', process.env.BREVO_SMTP_KEY ? '***configurata***' : 'MANCANTE');

  try {
    transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // STARTTLS
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY,
      },
      // Opzioni aggiuntive per debugging
      logger: false, // Disabilita in produzione per non inquinare i log
      debug: false,  // Abilita solo se serve debugging
      // Timeout più generosi
      connectionTimeout: 10000, // 10 secondi
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    console.log('✅ Transporter email creato con successo');
    return transporter;
  } catch (error) {
    console.error('❌ Errore creazione transporter:', error);
    return null;
  }
}

// ============================================
// FUNZIONI HELPER
// ============================================

async function sendEmail(mailOptions) {
  const transport = getTransporter();
  if (!transport) {
    console.error('❌ Impossibile inviare email: transporter non disponibile');
    return false;
  }

  try {
    const info = await transport.sendMail(mailOptions);
    console.log('✅ Email inviata con successo:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Errore invio email:');
    console.error('  Tipo:', error.name);
    console.error('  Messaggio:', error.message);
    if (error.code) console.error('  Codice:', error.code);
    if (error.response) console.error('  Response:', error.response);
    return false;
  }
}

// ============================================
// WELCOME EMAIL
// ============================================

export async function sendWelcomeEmail(email, name) {
  console.log(`📧 Invio email di benvenuto a: ${email}`);
  
  const success = await sendEmail({
    from: `"Pro Club Hub" <${process.env.BREVO_SMTP_USER}>`,
    to: email,
    subject: '⚽ Benvenuto su Pro Club Hub!',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0f1e; color: #f1f5f9; border-radius: 20px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 900;">⚽ Pro Club Hub</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #3b82f6; margin-top: 0;">Ciao ${name}! 👋</h2>
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.8;">
            Benvenuto nella <strong>community definitiva per i giocatori di Pro Club</strong>!
          </p>
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.8;">
            Il tuo account è stato creato con successo. Ora puoi:
          </p>
          <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 8px;">
            <p style="color: #f1f5f9; margin: 0; font-size: 15px; line-height: 1.6;">
              🔹 Completare il tuo profilo (1+ ruolo secondario + Instagram O TikTok)<br>
              🔹 Cercare giocatori per la tua squadra<br>
              🔹 Creare o unirti a team competitivi<br>
              🔹 Lasciare e ricevere feedback<br>
              🔹 Guardare le live delle squadre
            </p>
          </div>
          <p style="color: #fbbf24; font-size: 14px; line-height: 1.6; background: rgba(251, 191, 36, 0.1); padding: 15px; border-radius: 8px;">
            ⚠️ <strong>IMPORTANTE:</strong> Per cercare squadre o creare una squadra devi completare il profilo aggiungendo almeno 1 ruolo secondario e almeno 1 social (Instagram O TikTok).
          </p>
          <div style="text-align: center; margin-top: 40px;">
            <a href="${APP_URL}" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 16px; font-weight: 700; display: inline-block; font-size: 16px;">
              Completa il Tuo Profilo →
            </a>
          </div>
        </div>
        <div style="text-align: center; padding: 30px; background: rgba(15, 23, 42, 0.5); color: #64748b; font-size: 14px;">
          <p style="margin: 0;">Pro Club Hub - La tua community Pro Club</p>
          <p style="margin: 5px 0 0 0; font-size: 12px;">Hai domande? Contatta: proclubhub672@gmail.com</p>
        </div>
      </div>
    `,
  });

  if (success) {
    console.log(`✅ Email benvenuto inviata a ${email}`);
  } else {
    console.error(`❌ Impossibile inviare email benvenuto a ${email}`);
  }

  return success;
}

// ============================================
// PASSWORD RESET EMAIL
// ============================================

export async function sendPasswordResetEmail(email, name, resetToken) {
  const resetLink = `${APP_URL}?reset=${resetToken}`;
  
  console.log(`📧 Invio email reset password a: ${email}`);
  console.log(`🔗 Link reset: ${resetLink}`);

  const success = await sendEmail({
    from: `"Pro Club Hub" <${process.env.BREVO_SMTP_USER}>`,
    to: email,
    subject: '🔐 Reimposta la tua Password - Pro Club Hub',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0f1e; color: #f1f5f9; border-radius: 20px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 900;">🔐 Reimposta Password</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #3b82f6; margin-top: 0;">Ciao ${name}!</h2>
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.8;">
            Hai richiesto di reimpostare la tua password per Pro Club Hub.
          </p>
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.8;">
            Clicca sul pulsante qui sotto per procedere:
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetLink}" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 16px; font-weight: 700; display: inline-block; font-size: 16px;">
              Reimposta Password →
            </a>
          </div>
          <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 20px; margin: 30px 0; border-radius: 8px;">
            <p style="color: #fca5a5; margin: 0; font-size: 14px; line-height: 1.6;">
              ⚠️ Se non hai richiesto questo reset, ignora questa email. Il link scadrà tra 1 ora.
            </p>
          </div>
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            Se il pulsante non funziona, copia e incolla questo link:<br>
            <a href="${resetLink}" style="color: #3b82f6; word-break: break-all;">${resetLink}</a>
          </p>
        </div>
        <div style="text-align: center; padding: 30px; background: rgba(15, 23, 42, 0.5); color: #64748b; font-size: 14px;">
          <p style="margin: 0;">Pro Club Hub</p>
        </div>
      </div>
    `,
  });

  if (success) {
    console.log(`✅ Email reset password inviata a ${email}`);
  } else {
    console.error(`❌ Impossibile inviare email reset a ${email}`);
  }

  return success;
}

// ============================================
// TEAM REQUEST NOTIFICATION
// ============================================

export async function sendTeamRequestNotification(email, playerName, teamName) {
  console.log(`📧 Invio notifica richiesta team a: ${email}`);

  return await sendEmail({
    from: `"Pro Club Hub" <${process.env.BREVO_SMTP_USER}>`,
    to: email,
    subject: `🎮 Nuova Richiesta per ${teamName}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0f1e; color: #f1f5f9; border-radius: 20px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900;">🎮 Nuova Richiesta!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.8;">
            <strong style="color: #3b82f6;">${playerName}</strong> ha richiesto di unirsi a <strong style="color: #8b5cf6;">${teamName}</strong>!
          </p>
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.8;">
            Accedi al pannello richieste per gestire questa richiesta.
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${APP_URL}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 16px; font-weight: 700; display: inline-block; font-size: 16px;">
              Gestisci Richieste →
            </a>
          </div>
        </div>
      </div>
    `,
  });
}

// ============================================
// FEEDBACK NOTIFICATION
// ============================================

export async function sendFeedbackNotification(email, name, fromName, rating, tags) {
  console.log(`📧 Invio notifica feedback a: ${email}`);

  const stars = '⭐'.repeat(rating);
  const tagsList = tags.join(', ');

  return await sendEmail({
    from: `"Pro Club Hub" <${process.env.BREVO_SMTP_USER}>`,
    to: email,
    subject: `${stars} Hai ricevuto un nuovo Feedback!`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0f1e; color: #f1f5f9; border-radius: 20px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 900;">⭐ Nuovo Feedback!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #3b82f6; margin-top: 0;">Ciao ${name}!</h2>
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.8;">
            <strong style="color: #8b5cf6;">${fromName}</strong> ti ha lasciato un feedback:
          </p>
          <div style="background: rgba(251, 191, 36, 0.1); border-left: 4px solid #fbbf24; padding: 25px; margin: 30px 0; border-radius: 12px; text-align: center;">
            <p style="font-size: 32px; margin: 0 0 15px 0;">${stars}</p>
            <p style="color: #f1f5f9; margin: 10px 0; font-size: 18px;"><strong>Valutazione:</strong> ${rating}/5</p>
            ${tagsList ? `<p style="color: #cbd5e1; margin: 10px 0;"><strong>Tag:</strong> ${tagsList}</p>` : ''}
          </div>
          <div style="text-align: center; margin-top: 40px;">
            <a href="${APP_URL}" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 16px; font-weight: 700; display: inline-block; font-size: 16px;">
              Vedi il Tuo Profilo →
            </a>
          </div>
        </div>
      </div>
    `,
  });
}

// ============================================
// NEWSLETTER
// ============================================

export async function sendNewsletterEmail(email, name, subject, message) {
  console.log(`📧 Invio newsletter a: ${email}`);

  return await sendEmail({
    from: `"Pro Club Hub" <${process.env.BREVO_SMTP_USER}>`,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0f1e; color: #f1f5f9; border-radius: 20px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 900;">⚽ Pro Club Hub</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #3b82f6; margin-top: 0;">Ciao ${name}!</h2>
          <div style="color: #cbd5e1; font-size: 16px; line-height: 1.8;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <div style="text-align: center; margin-top: 40px;">
            <a href="${APP_URL}" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 16px; font-weight: 700; display: inline-block; font-size: 16px;">
              Visita Pro Club Hub →
            </a>
          </div>
        </div>
        <div style="text-align: center; padding: 30px; background: rgba(15, 23, 42, 0.5); color: #64748b; font-size: 14px;">
          <p style="margin: 0;">Pro Club Hub - La tua community Pro Club</p>
        </div>
      </div>
    `,
  });
}
