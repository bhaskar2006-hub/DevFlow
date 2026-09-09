import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// SMTP fallback transport
let smtpTransporter: any = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export class EmailService {
  /**
   * Generic sender with Resend primary & Nodemailer fallback
   */
  private static async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean> {
    const fromAddress = process.env.EMAIL_FROM || 'DevFlow Notifications <onboarding@resend.dev>';

    // 1. Try Resend if API key is present
    if (resend) {
      try {
        await resend.emails.send({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
        });
        console.log(`[Email Service] Sent email via Resend to ${options.to}`);
        return true;
      } catch (err: any) {
        console.warn(`[Email Service] Resend send failed: ${err.message}`);
      }
    }

    // 2. Try SMTP if configured
    if (smtpTransporter) {
      try {
        await smtpTransporter.sendMail({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
        });
        console.log(`[Email Service] Sent email via SMTP to ${options.to}`);
        return true;
      } catch (err: any) {
        console.warn(`[Email Service] SMTP send failed: ${err.message}`);
      }
    }

    // 3. Fallback log in dev / unconfigured mode
    console.log(`[Email Service Mock] (Configure RESEND_API_KEY or SMTP to deliver live emails) -> To: ${options.to} | Subject: ${options.subject}`);
    return false;
  }

  /**
   * Send notification when an issue is assigned
   */
  public static async sendIssueAssignedEmail(params: {
    recipientEmail: string;
    recipientName: string;
    issueKey: string;
    issueTitle: string;
    priority: string;
    assignedBy: string;
  }): Promise<void> {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #4f46e5; padding: 24px; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 700;">DevFlow Issue Assignment</h1>
        </div>
        <div style="padding: 24px; color: #334155; line-height: 1.6;">
          <p style="font-size: 15px; margin-top: 0;">Hi <strong>${params.recipientName}</strong>,</p>
          <p><strong>${params.assignedBy}</strong> has assigned you to a ticket:</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #4f46e5; border-radius: 6px; padding: 14px 18px; margin: 20px 0;">
            <div style="font-weight: 700; font-size: 16px; color: #0f172a;">[${params.issueKey}] ${params.issueTitle}</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 6px;">Priority: <strong style="color: #4f46e5;">${params.priority}</strong></div>
          </div>
          <a href="https://devflow123.vercel.app/issues" style="display: inline-block; background: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 10px 20px; border-radius: 8px; margin-top: 8px;">View Issue Details</a>
        </div>
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; font-size: 12px; color: #94a3b8; text-align: center;">
          DevFlow Issue & Project Management Platform
        </div>
      </div>
    `;

    await this.sendMail({
      to: params.recipientEmail,
      subject: `[DevFlow] Assigned to ${params.issueKey}: ${params.issueTitle}`,
      html,
    });
  }

  /**
   * Send notification when a user is invited to an organization
   */
  public static async sendMemberInvitedEmail(params: {
    recipientEmail: string;
    orgName: string;
    role: string;
    invitedBy: string;
  }): Promise<void> {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #4f46e5; padding: 24px; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Workspace Invitation</h1>
        </div>
        <div style="padding: 24px; color: #334155; line-height: 1.6;">
          <p style="font-size: 15px; margin-top: 0;">Hello,</p>
          <p><strong>${params.invitedBy}</strong> has invited you to collaborate in <strong>${params.orgName}</strong> on DevFlow as a <strong>${params.role}</strong>.</p>
          <div style="margin: 24px 0;">
            <a href="https://devflow123.vercel.app/login" style="display: inline-block; background: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px;">Accept & Open Workspace</a>
          </div>
          <p style="font-size: 13px; color: #64748b;">If you already have an account, log in with this email to access the new workspace immediately.</p>
        </div>
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; font-size: 12px; color: #94a3b8; text-align: center;">
          DevFlow Issue & Project Management Platform
        </div>
      </div>
    `;

    await this.sendMail({
      to: params.recipientEmail,
      subject: `[DevFlow] You've been invited to ${params.orgName}`,
      html,
    });
  }
}
