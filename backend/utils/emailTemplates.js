/**
 * Email HTML Templates
 * Branded Sprint Hive transactional emails.
 * All templates return { subject, html, text } objects.
 */

const BASE_STYLES = `
  body { margin: 0; padding: 0; background: #0f172a; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { max-width: 600px; margin: 40px auto; padding: 0 20px; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 40px; }
  .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
  .logo-icon { width: 28px; height: 28px; object-fit: contain; }
  .logo-text { font-size: 20px; font-weight: 700; color: #ffffff; }
  .logo-accent { color: #5B5FFF; }
  h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 12px; }
  p { color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 20px; }
  .btn { display: inline-block; background: #5B5FFF; color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 8px 0 24px; }
  .divider { border: none; border-top: 1px solid #334155; margin: 28px 0; }
  .small { font-size: 13px; color: #64748b; }
  .url-box { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #94a3b8; word-break: break-all; margin: 12px 0; }
  .footer { text-align: center; margin-top: 24px; color: #64748b; font-size: 12px; }
`;

const wrapHtml = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div style="width:100%; margin-bottom:16px;">
        <img src="${process.env.CLIENT_URL}/src/assets/email_banner.png" alt="Sprint Hive" style="width:100%; max-width:100%; height:auto; object-fit:contain; border-radius:8px; display:block; margin: 0 auto;" />
      </div>
      <div class="logo">
        <img src="${process.env.CLIENT_URL}/src/assets/logo_icon.png" alt="Logo" class="logo-icon" />
        <span class="logo-text">Sprint<span class="logo-accent">Hive</span></span>
      </div>
      ${content}
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Sprint Hive. This is an automated message, please do not reply.
    </div>
  </div>
</body>
</html>`;

// ── Template 1: Email Verification ────────────────────────────
const verificationEmail = (name, verificationUrl) => ({
  subject: 'Sprint Hive — Verify your account',
  html: wrapHtml(`
    <h1>Welcome to Sprint Hive, ${name.split(' ')[0]}! 👋</h1>
    <p>You're almost ready to start shipping faster. Please verify your email address to activate your account.</p>
    <a href="${verificationUrl}" class="btn">Verify Email Address</a>
    <hr class="divider" />
    <p class="small">This link will expire in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.</p>
    <p class="small">Or copy and paste this URL into your browser:</p>
    <div class="url-box">${verificationUrl}</div>
  `),
  text: `Welcome to Sprint Hive, ${name}!\n\nVerify your email: ${verificationUrl}\n\nThis link expires in 24 hours.`,
});

// ── Template 2: Password Reset ─────────────────────────────────
const passwordResetEmail = (name, resetUrl) => ({
  subject: '🔐 Sprint Hive — Reset your password',
  html: wrapHtml(`
    <h1>Password reset requested</h1>
    <p>Hi ${name.split(' ')[0]}, we received a request to reset your Sprint Hive password. Click the button below to choose a new one.</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <hr class="divider" />
    <p class="small">⏱️ This link will expire in <strong>1 hour</strong>.</p>
    <p class="small">If you didn't request a password reset, please ignore this email — your password won't change.</p>
    <div class="url-box">${resetUrl}</div>
  `),
  text: `Hi ${name},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.`,
});

// ── Template 3: Welcome (post-verification) ────────────────────
const welcomeEmail = (name) => ({
  subject: 'Sprint Hive — Welcome to your workspace!',
  html: wrapHtml(`
    <h1>Your account is ready! 🎉</h1>
    <p>Hi ${name.split(' ')[0]}, your email has been verified and your Sprint Hive account is now active.</p>
    <p>Get started by creating your first workspace and inviting your team.</p>
    <a href="${process.env.CLIENT_URL}/login" class="btn">Go to Sprint Hive →</a>
    <hr class="divider" />
    <p class="small">Need help? Check out our <a href="${process.env.CLIENT_URL}/docs" style="color:#5B5FFF">documentation</a>.</p>
  `),
  text: `Hi ${name},\n\nYour email is verified! Log in at: ${process.env.CLIENT_URL}/login`,
});

// ── Template 4: Password Changed ──────────────────────────────
const passwordChangedEmail = (name) => ({
  subject: '🔒 Sprint Hive — Your password was changed',
  html: wrapHtml(`
    <h1>Password changed successfully</h1>
    <p>Hi ${name.split(' ')[0]}, your Sprint Hive password was just changed. All active sessions have been signed out for security.</p>
    <p>If you made this change, you can safely ignore this email.</p>
    <p>If you didn't change your password, please <a href="${process.env.CLIENT_URL}/forgot-password" style="color:#5B5FFF">reset it immediately</a>.</p>
  `),
  text: `Hi ${name},\n\nYour password was changed and all sessions were signed out. If this wasn't you, reset your password: ${process.env.CLIENT_URL}/forgot-password`,
});

// ── Template 5: Organization Invite ─────────────────────────────
const orgInviteEmail = (inviterName, orgName, role, acceptUrl) => ({
  subject: `Sprint Hive — You're invited to join ${orgName}`,
  html: wrapHtml(`
    <h1>You've been invited!</h1>
    <p><strong>${inviterName}</strong> invited you to join <strong>${orgName}</strong> on Sprint Hive as <span style="color:#5B5FFF;font-weight:600">${role}</span>.</p>
    <a href="${acceptUrl}" class="btn">Accept Invitation →</a>
    <hr class="divider" />
    <p class="small">⏱️ This invite expires in <strong>7 days</strong>.</p>
    <p class="small">If you don't have a Sprint Hive account, you'll be prompted to create one after clicking the link above.</p>
    <div class="url-box">${acceptUrl}</div>
  `),
  text: `${inviterName} invited you to join ${orgName} on Sprint Hive as ${role}.\n\nAccept here: ${acceptUrl}\n\nThis invite expires in 7 days.`,
});

module.exports = {
  verificationEmail,
  passwordResetEmail,
  welcomeEmail,
  passwordChangedEmail,
  orgInviteEmail,
};
