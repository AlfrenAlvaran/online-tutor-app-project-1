import { transporter } from "../config/mailer.js";
import { ENV } from "../libs/environments.js";
import { cacheTemplate } from "./cacheService.js";

export async function verifyMailer() {
  await transporter.verify();
}

function escapeHtml(input) {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const BRAND = {
  name: "ExcelEd",
  primary: "#1a56db",
  dark: "#111827",
  muted: "#6b7280",
  bg: "#f3f4f6",
  cardBg: "#ffffff",
  border: "#e5e7eb",
};

function emailWrapper(bodyHtml) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${BRAND.name}</title>
  </head>
  <body style="margin:0; padding:0; background-color:${BRAND.bg}; font-family:'Segoe UI', Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg}; padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cardBg}; border-radius:8px; overflow:hidden; border:1px solid ${BRAND.border};">
            <tr>
              <td style="background-color:${BRAND.primary}; padding:24px 32px;">
                <span style="color:#ffffff; font-size:20px; font-weight:600; letter-spacing:0.2px;">
                  ${BRAND.name}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background-color:${BRAND.bg}; padding:20px 32px; border-top:1px solid ${BRAND.border};">
                <p style="margin:0; color:${BRAND.muted}; font-size:12px; line-height:1.5;">
                  This message was sent by ${BRAND.name}. If you weren't expecting this email, you can safely ignore it.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

function renderAdminEmail(data) {
  const shell = cacheTemplate(`admin-shell:${data.program}:${data.mode}`, () =>
    emailWrapper(`
      <h2 style="margin:0 0 16px; color:${BRAND.dark}; font-size:18px;">
        New enrollment request — ${escapeHtml(data.program)}
      </h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; font-size:14px;">
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid ${BRAND.border}; color:${BRAND.muted}; width:130px;">Name</td>
          <td style="padding:10px 0; border-bottom:1px solid ${BRAND.border}; color:${BRAND.dark};">__NAME__</td>
        </tr>
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid ${BRAND.border}; color:${BRAND.muted};">Phone</td>
          <td style="padding:10px 0; border-bottom:1px solid ${BRAND.border}; color:${BRAND.dark};">__PHONE__</td>
        </tr>
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid ${BRAND.border}; color:${BRAND.muted};">Email</td>
          <td style="padding:10px 0; border-bottom:1px solid ${BRAND.border}; color:${BRAND.dark};">__EMAIL__</td>
        </tr>
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid ${BRAND.border}; color:${BRAND.muted};">Learner age</td>
          <td style="padding:10px 0; border-bottom:1px solid ${BRAND.border}; color:${BRAND.dark};">__AGE__</td>
        </tr>
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid ${BRAND.border}; color:${BRAND.muted};">Mode</td>
          <td style="padding:10px 0; border-bottom:1px solid ${BRAND.border}; color:${BRAND.dark};">${escapeHtml(data.mode)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0; color:${BRAND.muted}; vertical-align:top;">Message</td>
          <td style="padding:10px 0; color:${BRAND.dark};">__MESSAGE__</td>
        </tr>
      </table>
    `),
  );

  return shell
    .replace("__NAME__", escapeHtml(data.name))
    .replace("__PHONE__", escapeHtml(data.phone))
    .replace("__EMAIL__", escapeHtml(data.email))
    .replace("__AGE__", data.age ? String(data.age) : "—")
    .replace("__MESSAGE__", escapeHtml(data.message || "—"));
}

function renderConfirmationEmail(data) {
  const shell = cacheTemplate("confirmation-shell", () =>
    emailWrapper(`
      <h2 style="margin:0 0 16px; color:${BRAND.dark}; font-size:18px;">
        Thanks for reaching out, __NAME__!
      </h2>
      <p style="margin:0 0 16px; color:${BRAND.dark}; font-size:14px; line-height:1.6;">
        We received your enrollment request and our team will contact you
        within 1–2 business days to confirm your schedule.
      </p>
      <p style="margin:0 0 24px; color:${BRAND.dark}; font-size:14px; line-height:1.6;">
        No payment is needed right now.
      </p>
      <p style="margin:0; color:${BRAND.dark}; font-size:14px;">
        — The ${BRAND.name} Team
      </p>
    `),
  );
  return shell.replace(/__NAME__/g, escapeHtml(data.name));
}

export async function sendEnrollmentEmails(data) {
  await Promise.all([
    transporter.sendMail({
      from: ENV.mailFrom,
      to: ENV.mailTo,
      replyTo: data.email,
      subject: `New enrollment request — ${data.name}`,
      html: renderAdminEmail(data),
    }),
    transporter.sendMail({
      from: `"${BRAND.name}" <${ENV.mailFrom}>`,
      to: data.email,
      subject: `We received your enrollment request — ${BRAND.name}`,
      html: renderConfirmationEmail(data),
    }),
  ]);
}

export async function sendEnrollmentConfirmationEmail(inquiry, enrollmentLink) {
  const subject = "You're confirmed — complete your enrollment";

  const html = `
    <div style="font-family: Georgia, serif; background:#060e24; padding:32px;">
      <div style="max-width:480px; margin:0 auto; background:#0e1c3a; border:1px solid rgba(233,196,106,0.15); border-radius:16px; padding:32px; color:#f4f1ea;">
        <p style="font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#e9c46a; margin:0 0 12px;">Enrollment confirmed</p>
        <h1 style="font-size:22px; margin:0 0 16px;">Hi ${inquiry.name},</h1>
        <p style="font-size:14px; line-height:1.6; color:#cfd3dc; margin:0 0 20px;">
          Good news — your enrollment for <strong style="color:#f4f1ea;">${inquiry.program}</strong>
          has been confirmed. One more step: finish your enrollment details
          below so we can get you set up.
        </p>
        <a href="${enrollmentLink}"
           style="display:inline-block; background:linear-gradient(135deg,#f0d38a,#caa14d,#8a6a1f); color:#1a1204; font-weight:600; text-decoration:none; padding:12px 24px; border-radius:10px; font-size:14px;">
          Complete your enrollment
        </a>
        <p style="font-size:12px; color:#8a90a3; margin-top:24px;">
          This link expires in 7 days and can only be used once. If you
          didn't expect this email, you can ignore it.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || "no-reply@yourschool.ph",
    to: inquiry.email,
    subject,
    html,
  });
}
