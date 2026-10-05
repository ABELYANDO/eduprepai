// ── Resend transactional email API ───────────────────────────────
// Switched from direct Gmail SMTP — Render blocks outbound SMTP
// connections (ports 465/587), so nodemailer could never even reach
// Gmail's server (every send failed with a connection timeout before
// authentication was ever attempted). Resend's API runs over plain
// HTTPS, which isn't blocked, using native fetch — no new dependency.
//
// RESEND_API_KEY must be set in the environment. Until the sending
// domain below is a verified custom domain, Resend only allows
// delivery to the email address the Resend account itself was signed
// up with — fine for testing, but real users won't receive mail until
// a domain is verified.
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_ADDRESS    = 'YankelPrep <onboarding@resend.dev>'

// ── Send the password-reset email ───────────────────────────────
// Called by forgotPassword in auth.controller.js. resetUrl already
// contains the raw (unhashed) token as a query param.
export const sendPasswordResetEmail = async (to, resetUrl) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    FROM_ADDRESS,
      to,
      subject: 'Reset your YankelPrep password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #2563EB;">Reset your password</h2>
          <p>We received a request to reset your YankelPrep password. This link expires in 30 minutes.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background: #2563EB; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Reset password
            </a>
          </p>
          <p style="color: #64748B; font-size: 13px;">
            If you didn't request this, you can safely ignore this email — your password won't change.
          </p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Resend API error (${response.status}): ${body}`)
  }
}
