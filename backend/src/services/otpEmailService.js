import { transporter } from "../config/mailer.js";

export async function sendOtpEmail(user, code) {
  await transporter.sendMail({
    from: `"ExcelEd Security" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: "Your ExcelEd verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <h2 style="margin: 0 0 8px; font-size: 1.1rem; font-weight: 600; color: #1a1a1a;">
          ExcelEd Verification Code
        </h2>
        <p style="margin: 0 0 24px; font-size: 0.95rem; color: #4a4a4a; line-height: 1.5;">
          Use the code below to complete your sign-in. This code is valid for 10 minutes.
        </p>
        <div style="background: #f4f5f7; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 2rem; font-weight: 700; letter-spacing: 0.3em; color: #1a1a1a;">
            ${code}
          </span>
        </div>
        <p style="margin: 0; font-size: 0.85rem; color: #8a8a8a; line-height: 1.5;">
          If you didn't request this code, you can safely ignore this email — your account is still secure.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0 16px;" />
        <p style="margin: 0; font-size: 0.75rem; color: #b0b0b0;">
          © ${new Date().getFullYear()} ExcelEd. This is an automated message, please do not reply.
        </p>
      </div>
    `,
  });
}