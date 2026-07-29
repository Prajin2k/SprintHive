/**
 * Email Service (Nodemailer)
 * Configured with SMTP credentials from env vars.
 * Silently skips sending in dev mode if EMAIL_USER/PASS are not set —
 * logs the link to console instead so you can test without real SMTP.
 */

const nodemailer = require('nodemailer');
const templates = require('../utils/emailTemplates');

let _transporter = null;

const isConfigured = () => !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const getTransporter = () => {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587 STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return _transporter;
};

/**
 * Core send function
 */
const send = async ({ to, subject, html, text }) => {
if (!isConfigured()) {
    console.log("\n================ DEV EMAIL ================");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Text:\n", text);
    console.log("===========================================\n");

    return {
        messageId: "dev-mode",
        devMode: true,
    };
}

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: `"Sprint Hive" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });

  return info;
};

// ── Public helpers ─────────────────────────────────────────────

const sendVerificationEmail = async (user, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email/${token}`;
  const { subject, html, text } = templates.verificationEmail(user.name, url);
  return send({ to: user.email, subject, html, text });
};

const sendPasswordResetEmail = async (user, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password/${token}`;
  const { subject, html, text } = templates.passwordResetEmail(user.name, url);
  return send({ to: user.email, subject, html, text });
};

const sendWelcomeEmail = async (user) => {
  const { subject, html, text } = templates.welcomeEmail(user.name);
  return send({ to: user.email, subject, html, text });
};

const sendPasswordChangedEmail = async (user) => {
  const { subject, html, text } = templates.passwordChangedEmail(user.name);
  return send({ to: user.email, subject, html, text });
};

const sendOrgInviteEmail = async ({ to, orgName, role, inviterName, token }) => {
  const acceptUrl = `${process.env.CLIENT_URL}/accept-invite/${token}`;
  const { subject, html, text } = templates.orgInviteEmail(inviterName, orgName, role, acceptUrl);
  return send({ to, subject, html, text });
};

module.exports = {
  send,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendPasswordChangedEmail,
  sendOrgInviteEmail,
};
