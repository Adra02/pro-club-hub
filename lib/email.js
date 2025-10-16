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

export async function sendWelcomeEmail(email, name) {
  const transport = getTransporter();
  if (!transport) return false;

  try {
    await transport.sendMail({
      from: process.env.GMAIL_EMAIL,
      to: email,
      subject: 'Benvenuto su Pro Club Hub! ⚽',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">Benvenuto su Pro Club Hub!</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333;">Ciao ${name}! 👋</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Grazie per esserti registrato su Pro Club Hub, la piattaforma definitiva per i giocatori di FIFA Pro Clubs!
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Ora puoi:
            </p>
            <ul style="color: #666; font-size: 16px; line-height: 1.8;">
              <li>Cercare altri giocatori per la tua squadra</li>
              <li>Creare o unirti a team competitivi</li>
              <li>Lasciare e ricevere feedback</li>
              <li>Connetterti con la community</li>
            </ul>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.VERCEL_URL || 'https://proclubhub.vercel.app'}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Inizia Ora
              </a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 14px;">
            <p>Pro Club Hub - La tua community FIFA Pro Clubs</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
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
      subject: `Nuovo Feedback Ricevuto! ${stars}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">Nuovo Feedback! 🎉</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333;">Ciao ${name}!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              <strong>${fromName}</strong> ti ha lasciato un feedback:
            </p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p style="font-size: 24px; margin: 0; color: #ffc107;">${stars}</p>
              <p style="color: #666; margin-top: 10px;"><strong>Valutazione:</strong> ${rating}/5</p>
              ${tagsList ? `<p style="color: #666;"><strong>Tag:</strong> ${tagsList}</p>` : ''}
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.VERCEL_URL || 'https://proclubhub.vercel.app'}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Vedi Profilo
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