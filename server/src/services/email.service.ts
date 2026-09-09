import axios from 'axios';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

interface EmailTemplateContext {
  [key: string]: any;
}

export class ResendEmailService {
  private apiKey: string;
  private apiUrl = 'https://api.resend.com/emails';
  private fromEmail: string;

  constructor(apiKey?: string, fromEmail?: string) {
    this.apiKey = apiKey || process.env.RESEND_API_KEY || '';
    this.fromEmail = fromEmail || process.env.FROM_EMAIL || 'noreply@devflow.app';

    if (!this.apiKey) {
      console.warn('[Resend] API key not configured. Email sending will be disabled.');
    }
  }

  /**
   * Send email using Resend API
   */
  async sendEmail(options: EmailOptions): Promise<any> {
    if (!this.apiKey) {
      console.warn('[Resend] API key not configured. Email not sent to', options.to);
      return null;
    }

    try {
      const payload = {
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        ...(options.text && { text: options.text }),
        ...(options.replyTo && { reply_to: options.replyTo }),
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`[Resend] Email sent successfully to ${options.to}`);
      return response.data;
    } catch (error: any) {
      console.error('[Resend] Failed to send email:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(userEmail: string, userName: string, activationUrl: string): Promise<any> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
            .content { padding: 30px 0; }
            .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to DevFlow! 🚀</h1>
            </div>
            
            <div class="content">
              <p>Hi ${userName},</p>
              
              <p>Thanks for signing up for DevFlow! We're excited to have you on board.</p>
              
              <p>DevFlow is a modern issue & project management platform designed to help teams collaborate efficiently and deliver projects faster.</p>
              
              <p>To get started, please verify your email address by clicking the button below:</p>
              
              <center>
                <a href="${activationUrl}" class="button">Verify Email Address</a>
              </center>
              
              <p>This link will expire in 24 hours.</p>
              
              <p>If you didn't create this account, you can safely ignore this email.</p>
              
              <hr />
              
              <h3>What you can do with DevFlow:</h3>
              <ul>
                <li>📋 Create and manage issues</li>
                <li>📊 Organize projects with Kanban boards</li>
                <li>👥 Collaborate with team members</li>
                <li>💬 Leave comments and updates</li>
                <li>🔔 Get real-time notifications</li>
                <li>🚀 Integrate with Slack</li>
              </ul>
              
              <p>Questions? Check out our <a href="https://devflow.app/docs">documentation</a> or <a href="mailto:support@devflow.app">contact support</a>.</p>
              
              <p>Happy collaborating!<br/>The DevFlow Team</p>
            </div>
            
            <div class="footer">
              <p>DevFlow • Issue & Project Management<br/>
              <a href="https://devflow.app">devflow.app</a> | <a href="mailto:support@devflow.app">support@devflow.app</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '🎉 Welcome to DevFlow - Verify Your Email',
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userEmail: string, userName: string, resetUrl: string): Promise<any> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
            .content { padding: 30px 0; }
            .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background: #FEF3C7; color: #92400E; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Reset Your Password</h1>
            </div>
            
            <div class="content">
              <p>Hi ${userName},</p>
              
              <p>We received a request to reset your DevFlow password. Click the button below to set a new password:</p>
              
              <center>
                <a href="${resetUrl}" class="button">Reset Password</a>
              </center>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or change your password immediately.
              </div>
              
              <p><strong>Can't click the button?</strong> Copy and paste this link in your browser:<br/>
              <code>${resetUrl}</code></p>
              
              <hr />
              
              <p><strong>Tips for a secure password:</strong></p>
              <ul>
                <li>Use at least 12 characters</li>
                <li>Mix uppercase, lowercase, numbers, and symbols</li>
                <li>Avoid personal information</li>
                <li>Don't reuse passwords from other accounts</li>
              </ul>
              
              <p>If you're having trouble, <a href="mailto:support@devflow.app">contact support</a>.</p>
              
              <p>Stay secure!<br/>The DevFlow Team</p>
            </div>
            
            <div class="footer">
              <p>DevFlow • Issue & Project Management<br/>
              <a href="https://devflow.app">devflow.app</a> | <a href="mailto:support@devflow.app">support@devflow.app</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '🔐 Reset Your DevFlow Password',
      html,
    });
  }

  /**
   * Send issue assigned notification
   */
  async sendIssueAssignedEmail(userEmail: string, userName: string, issueTitle: string, assignedBy: string, issueLink: string): Promise<any> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
            .content { padding: 30px 0; }
            .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .issue-card { background: #F3F4F6; padding: 20px; border-left: 4px solid #10B981; border-radius: 6px; margin: 20px 0; }
            .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📌 Issue Assigned to You</h1>
            </div>
            
            <div class="content">
              <p>Hi ${userName},</p>
              
              <p><strong>${assignedBy}</strong> has assigned you a new issue:</p>
              
              <div class="issue-card">
                <h3 style="margin-top: 0; color: #1F2937;">${issueTitle}</h3>
                <p style="color: #6B7280; margin-bottom: 0;">View more details and start working on this issue.</p>
              </div>
              
              <center>
                <a href="${issueLink}" class="button">View Issue</a>
              </center>
              
              <p>You can update the status, add comments, or ask questions directly in DevFlow.</p>
              
              <hr />
              
              <p>Need help? Check out our <a href="https://devflow.app/docs">documentation</a>.</p>
              
              <p>Thanks for your work on DevFlow!<br/>The DevFlow Team</p>
            </div>
            
            <div class="footer">
              <p>DevFlow • Issue & Project Management<br/>
              <a href="https://devflow.app">devflow.app</a> | <a href="mailto:support@devflow.app">support@devflow.app</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `📌 Issue Assigned: ${issueTitle}`,
      html,
    });
  }

  /**
   * Send comment on issue notification
   */
  async sendCommentNotificationEmail(
    userEmail: string,
    userName: string,
    issueTitle: string,
    commenterName: string,
    commentText: string,
    issueLink: string
  ): Promise<any> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
            .content { padding: 30px 0; }
            .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .comment-box { background: #F3F4F6; padding: 20px; border-left: 4px solid #8B5CF6; border-radius: 6px; margin: 20px 0; }
            .comment-author { color: #6B7280; font-weight: bold; margin-bottom: 10px; }
            .comment-text { color: #1F2937; line-height: 1.6; }
            .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 New Comment on Issue</h1>
            </div>
            
            <div class="content">
              <p>Hi ${userName},</p>
              
              <p><strong>${commenterName}</strong> commented on <strong>${issueTitle}</strong>:</p>
              
              <div class="comment-box">
                <div class="comment-author">${commenterName}</div>
                <div class="comment-text">${commentText}</div>
              </div>
              
              <center>
                <a href="${issueLink}" class="button">View Conversation</a>
              </center>
              
              <p>Reply directly in DevFlow to continue the discussion.</p>
              
              <hr />
              
              <p>Thanks for staying in the loop!<br/>The DevFlow Team</p>
            </div>
            
            <div class="footer">
              <p>DevFlow • Issue & Project Management<br/>
              <a href="https://devflow.app">devflow.app</a> | <a href="mailto:support@devflow.app">support@devflow.app</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `💬 ${commenterName} commented on "${issueTitle}"`,
      html,
    });
  }

  /**
   * Send team member invite
   */
  async sendTeamInviteEmail(userEmail: string, inviterName: string, organizationName: string, inviteLink: string): Promise<any> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
            .content { padding: 30px 0; }
            .button { display: inline-block; background: #EC4899; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .org-info { background: #F3F4F6; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
            .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>👥 You're Invited to DevFlow!</h1>
            </div>
            
            <div class="content">
              <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on DevFlow!</p>
              
              <div class="org-info">
                <h2 style="margin-top: 0; color: #1F2937;">${organizationName}</h2>
                <p style="color: #6B7280;">Collaborate on issues, manage projects, and boost productivity.</p>
              </div>
              
              <center>
                <a href="${inviteLink}" class="button">Accept Invitation</a>
              </center>
              
              <p>Once you accept, you'll be able to:</p>
              <ul>
                <li>📋 Work on project issues</li>
                <li>💬 Collaborate with team members</li>
                <li>📊 View project dashboards</li>
                <li>🔔 Get real-time notifications</li>
              </ul>
              
              <p>The invitation link will expire in 7 days.</p>
              
              <hr />
              
              <p>If you have any questions, feel free to <a href="mailto:support@devflow.app">contact support</a>.</p>
              
              <p>See you soon!<br/>The DevFlow Team</p>
            </div>
            
            <div class="footer">
              <p>DevFlow • Issue & Project Management<br/>
              <a href="https://devflow.app">devflow.app</a> | <a href="mailto:support@devflow.app">support@devflow.app</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `👥 ${inviterName} invited you to join ${organizationName}`,
      html,
    });
  }
}

export const emailService = new ResendEmailService();
