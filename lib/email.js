import nodemailer from 'nodemailer';

// URL dell'applicazione (si auto-configura)
const APP_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : process.env.NODE_ENV === 'production'
    ? 'https://tuo-dominio-vercel.vercel.app'
    : 'http://localhost:3000';

// ============================================
// CONFIGURAZIONE BREVO (Sendinblue)
// ============================================
// Questo transporter gestisce l'invio di tutte le email
// tramite il servizio SMTP di Brevo
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',  // Server SMTP di Brevo
  port: 587,                      // Porta standard SMTP
  secure: false,                  // TLS attivato automaticamente
  auth: {
    user: process.env.BREVO_SMTP_USER,  // Tua email Brevo
    pass: process.env.BREVO_SMTP_KEY    // Chiave API SMTP
  }
});

// ============================================
// EMAIL DI BENVENUTO
// ============================================
// Inviata automaticamente dopo la registrazione
export async function sendWelcomeEmail(email, name) {
  try {
    await transporter.sendMail({
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
            <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 8px;">
              <p style="color: #f1f5f9; margin: 0; font-size: 15px; line-height: 1.6;">
                🔹 Cerca giocatori per la tua squadra<br>
                🔹 Crea o unisciti a team competitivi<br>
                🔹 Lascia e ricevi feedback<br>
                🔹 Guarda le live delle squadre<br>
                🔹 Connettiti con la community
              </p>
            </div>
            <p style="color: #cbd5e1; font-size: 16px; line-height: 1.8;">
              <strong>Completa il tuo profilo</strong> per iniziare a cercare squadre e giocatori!
            </p>
            <div style="text-align: center; margin-top: 40px;">
              <a href="${APP_URL}" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 16px; font-weight: 700; display: inline-block; font-size: 16px;">
                Inizia Ora →
              </a>
            </div>
          </div>
          <div style="text-align: center; padding: 30px; background: rgba(15, 23, 42, 0.5); color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Pro Club Hub - La tua community Pro Club</p>
          </div>
        </div>
      `,
    });
    
    console.log('✅ Welcome email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return false;
  }
}

// ============================================
// EMAIL RESET PASSWORD
// ============================================
// Inviata quando l'utente richiede di cambiare password
export async function sendPasswordResetEmail(email, name, resetToken) {
  const resetLink = `${APP_URL}?reset=${resetToken}`;
  
  try {
    await transporter.sendMail({
      from: `"Pro Club Hub" <${process.env.BREVO_SMTP_USER}>`,
      to: email,
      subject: '🔐 Reimposta la tua Password - Pro Club Hub',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0f1e; color: #f1f5f9; border-radius: 20px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 900;">🔐 Reset Password</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #3b82f6; margin-top: 0;">Ciao ${name}!</h2>
            <p style="color: #cbd5e1; font-size: 16px; line-height: 1.8;">
              Hai richiesto di <strong>reimpostare la tua password</strong>. Clicca sul pulsante qui sotto per procedere:
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
    
    console.log('✅ Reset email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending reset email:', error);
    return false;
  }
}

// ============================================
// EMAIL NOTIFICA RICHIESTA SQUADRA
// ============================================
// Inviata al capitano quando riceve una richiesta
export async function sendTeamRequestNotification(email, playerName, teamName) {
  try {
    await transporter.sendMail({
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
            <div style="text-align: center; margin: 40px 0;">
              <a href="${APP_URL}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 16px; font-weight: 700; display: inline-block; font-size: 16px;">
                Gestisci Richieste →
              </a>
            </div>
          </div>
        </div>
      `,
    });
    
    console.log('✅ Team request notification sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending team request notification:', error);
    return false;
  }
}

// ============================================
// EMAIL NOTIFICA FEEDBACK RICEVUTO
// ============================================
// Inviata quando ricevi un nuovo feedback
export async function sendFeedbackNotification(email, name, fromName, rating, tags) {
  try {
    const stars = '⭐'.repeat(rating);
    const tagsList = tags.join(', ');

    await transporter.sendMail({
      from: `"Pro Club Hub" <${process.env.BREVO_SMTP_USER}>`,
      to: email,
      subject: `${stars} Nuovo Feedback Ricevuto!`,
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
                Vedi Profilo →
              </a>
            </div>
          </div>
        </div>
      `,
    });
    
    console.log('✅ Feedback notification sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending feedback notification:', error);
    return false;
  }
}

// ============================================
// EMAIL NEWSLETTER (ADMIN)
// ============================================
// Inviata dall'admin a tutti gli utenti
export async function sendNewsletterEmail(email, name, subject, message) {
  try {
    await transporter.sendMail({
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
    
    console.log('✅ Newsletter sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending newsletter email:', error);
    return false;
  }
}
