import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Email credentials not configured');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  return transporter;
}

const APP_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

export async function sendWelcomeEmail(email, name) {
  const transport = getTransporter();
  if (!transport) return false;

  try {
    await transport.sendMail({
      from: process.env.GMAIL_EMAIL,
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
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(email, name, resetToken) {
  const transport = getTransporter();
  if (!transport) return false;

  const resetLink = `${APP_URL}?reset=${resetToken}`;

  try {
    await transport.sendMail({
      from: process.env.GMAIL_EMAIL,
      to: email,
      subject: '🔐 Reset Password - Pro Club Hub',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0f1e; color: #f1f5f9; border-radius: 20px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 900;">🔐 Reset Password</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #3b82f6; margin-top: 0;">Ciao ${name}!</h2>
            <p style="color: #cbd5e1; font-size: 16px; line-height: 1.8;">
              Hai richiesto di reimpostare la tua password. Clicca sul pulsante qui sotto per procedere:
            </p>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 16px; font-weight: 700; display: inline-block; font-size: 16px;">
                Reset Password →
              </a>
            </div>
            <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 20px; margin: 30px 0; border-radius: 8px;">
              <p style="color: #fca5a5; margin: 0; font-size: 14px; line-height: 1.6;">
                ⚠️ Se non hai richiesto questo reset, ignora questa email. Il link scadrà tra 1 ora.
              </p>
            </div>
          </div>
          <div style="text-align: center; padding: 30px; background: rgba(15, 23, 42, 0.5); color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Pro Club Hub</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Error sending reset email:', error);
    return false;
  }
}

export async function sendTeamRequestNotification(email, playerName, teamName) {
  const transport = getTransporter();
  if (!transport) return false;

  try {
    await transport.sendMail({
      from: process.env.GMAIL_EMAIL,
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
    return true;
  } catch (error) {
    console.error('Error sending team request notification:', error);
    return false;
  }
}

export async function sendFeedbackNotification(email, name, fromName, rating, tags) {
  const transport = getTransporter();
  if (!transport) return false;

  try {
    const stars = '⭐'.repeat(rating);
    const tagsList = tags.join(', ');

    await transport.sendMail({
      from: process.env.GMAIL_EMAIL,
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
    return true;
  } catch (error) {
    console.error('Error sending feedback notification:', error);
    return false;
  }
}
