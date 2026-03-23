import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailClient } from '@azure/communication-email';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private client: EmailClient;
  private sender: string;
  private appUrl: string;

  constructor(private config: ConfigService) {
    const connectionString = this.config.get<string>('AZURE_COMMUNICATION_CONNECTION_STRING', '');
    this.client = new EmailClient(connectionString);
    this.sender = this.config.get<string>('MAIL_FROM', 'noreply@huynhkhandev.cloud');
    this.appUrl = this.config.get<string>('FRONTEND_URL', 'https://bot.huynhkhandev.cloud');
  }

  // ── Password Reset ──────────────────────────────────────────────────────────
  async sendPasswordReset(email: string, username: string, token: string) {
    const resetUrl = `${this.appUrl}/reset-password?token=${token}`;
    await this.send({
      to: email,
      subject: 'Reset your BotCloud password',
      html: this.wrapLayout(`
        <h2 style="margin:0 0 16px;font-size:20px;color:#f0f0f0">🔐 Reset your password</h2>
        <p style="margin:0 0 12px;color:#b0b0b0">Hi <strong style="color:#e0e0e0">${username}</strong>,</p>
        <p style="margin:0 0 24px;color:#b0b0b0">
          We received a request to reset your password. Click the button below — this link expires in
          <strong style="color:#e0e0e0">15 minutes</strong>.
        </p>
        <a href="${resetUrl}" style="
          display:inline-block;background:#6366f1;color:#fff;text-decoration:none;
          padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;margin-bottom:24px;
        ">Reset Password</a>
        <p style="margin:24px 0 0;color:#666;font-size:13px">
          If you didn't request this, you can safely ignore this email.
        </p>
        <p style="margin:8px 0 0;color:#555;font-size:12px;word-break:break-all">
          Or copy: <a href="${resetUrl}" style="color:#6366f1">${resetUrl}</a>
        </p>
      `),
    });
  }

  // ── Email Verification ──────────────────────────────────────────────────────
  async sendEmailVerification(email: string, username: string, token: string) {
    const verifyUrl = `${this.appUrl}/verify-email?token=${token}`;
    await this.send({
      to: email,
      subject: 'Verify your BotCloud email',
      html: this.wrapLayout(`
        <h2 style="margin:0 0 16px;font-size:20px;color:#f0f0f0">✉️ Verify your email</h2>
        <p style="margin:0 0 12px;color:#b0b0b0">Hi <strong style="color:#e0e0e0">${username}</strong>, welcome to BotCloud!</p>
        <p style="margin:0 0 24px;color:#b0b0b0">
          Please verify your email address. This link expires in <strong style="color:#e0e0e0">24 hours</strong>.
        </p>
        <a href="${verifyUrl}" style="
          display:inline-block;background:#6366f1;color:#fff;text-decoration:none;
          padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;margin-bottom:24px;
        ">Verify Email</a>
        <p style="margin:24px 0 0;color:#666;font-size:13px">
          If you didn't create a BotCloud account, ignore this email.
        </p>
        <p style="margin:8px 0 0;color:#555;font-size:12px;word-break:break-all">
          Or copy: <a href="${verifyUrl}" style="color:#6366f1">${verifyUrl}</a>
        </p>
      `),
    });
  }

  // ── Welcome ─────────────────────────────────────────────────────────────────
  async sendWelcome(email: string, username: string) {
    await this.send({
      to: email,
      subject: `Welcome to BotCloud, ${username}!`,
      html: this.wrapLayout(`
        <h2 style="margin:0 0 16px;font-size:20px;color:#f0f0f0">🎉 Welcome to BotCloud!</h2>
        <p style="margin:0 0 12px;color:#b0b0b0">Hi <strong style="color:#e0e0e0">${username}</strong>,</p>
        <p style="margin:0 0 24px;color:#b0b0b0">
          Your account is ready. Start chatting with AI assistants powered by Gemini and OpenAI.
        </p>
        <a href="${this.appUrl}/chat" style="
          display:inline-block;background:#6366f1;color:#fff;text-decoration:none;
          padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;
        ">Start Chatting →</a>
        <p style="margin:24px 0 0;color:#666;font-size:13px">
          You&apos;re on the <strong>Free plan</strong>: 20 messages/day · 200 messages/month.
        </p>
      `),
    });
  }

  // ── Internal send ───────────────────────────────────────────────────────────
  private async send(opts: { to: string; subject: string; html: string }) {
    try {
      const poller = await this.client.beginSend({
        senderAddress: this.sender,
        recipients: { to: [{ address: opts.to }] },
        content: {
          subject: opts.subject,
          html: opts.html,
        },
      });

      // Poll until sent (non-blocking timeout 30s)
      const result = await Promise.race([
        poller.pollUntilDone(),
        new Promise<null>((r) => setTimeout(() => r(null), 30000)),
      ]);

      if (result && (result as { status: string }).status === 'Succeeded') {
        this.logger.log(`✅ Email sent to ${opts.to}: "${opts.subject}"`);
      } else {
        this.logger.warn(`⚠️ Email to ${opts.to} pending/timeout`);
      }
    } catch (err) {
      this.logger.error(`❌ Email failed to ${opts.to}: ${err}`);
    }
  }

  // ── HTML layout ─────────────────────────────────────────────────────────────
  private wrapLayout(body: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <tr><td style="padding:0 0 24px">
          <span style="background:#6366f1;display:inline-block;width:36px;height:36px;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">🤖</span>
          <span style="color:#fff;font-size:18px;font-weight:700;vertical-align:middle;margin-left:8px">BotCloud</span>
        </td></tr>
        <tr><td style="background:#1a1a24;border:1px solid #2a2a3a;border-radius:16px;padding:36px 32px;">
          ${body}
        </td></tr>
        <tr><td style="padding:24px 0 0;text-align:center">
          <p style="margin:0;color:#444;font-size:12px">
            © 2026 BotCloud · <a href="${this.appUrl}" style="color:#555;text-decoration:none">huynhkhandev.cloud</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
