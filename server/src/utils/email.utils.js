import nodemailer from 'nodemailer'

// ── Gmail SMTP transporter ──────────────────────────────────────
// EMAIL_USER is the sending Gmail address; EMAIL_PASS is a Google
// "App Password" for that account (not the regular login password —
// Gmail requires an app password for SMTP access from code).
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// ── Send the password-reset email ───────────────────────────────
// Called by forgotPassword in auth.controller.js. resetUrl already
// contains the raw (unhashed) token as a query param.
export const sendPasswordResetEmail = async (to, resetUrl) => {
  await transporter.sendMail({
    from:    `EduPrepAI <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your EduPrepAI password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1F4E8C;">Reset your password</h2>
        <p>We received a request to reset your EduPrepAI password. This link expires in 30 minutes.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #1F4E8C; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Reset password
          </a>
        </p>
        <p style="color: #64748B; font-size: 13px;">
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
      </div>
    `,
  })
}
