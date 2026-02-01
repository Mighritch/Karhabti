const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Configuration Brevo SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: false,                  // false pour port 587 (STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,   // ex: a14203001@smtp-brevo.com
      pass: process.env.EMAIL_PASS,   // ta clé xsmtpsib-...
    },
    tls: {
      rejectUnauthorized: false,    // aide en dev si certificat capricieux
    },
    // Logs détaillés → très utile pour debugger la première fois
    debug: true,
    logger: true,
  });

  // Vérification de la connexion SMTP
  try {
    await transporter.verify();
    console.log('Brevo SMTP → Connexion vérifiée avec succès !');
  } catch (err) {
    console.error('Brevo SMTP → Erreur de connexion :', err.message);
    if (err.code) console.error('Code erreur :', err.code);
    throw err;
  }

  const message = {
    from: process.env.EMAIL_FROM || '"Karhabti" <noreply@karhabti.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: options.html || `<p>${options.message.replace(/\n/g, '<br>')}</p>`, // version HTML simple si besoin
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('EMAIL ENVOYÉ → Succès !');
    console.log('  → ID message :', info.messageId);
    console.log('  → Destinataire :', options.email);
    return info;
  } catch (error) {
    console.error('ERREUR ENVOI EMAIL :', error.message);
    if (error.response) {
      console.error('Réponse Brevo :', error.response);
    }
    if (error.code === 'EAUTH') {
      console.error('→ Problème probable : credentials invalides (username ou clé SMTP)');
    }
    throw error;
  }
};

module.exports = sendEmail;