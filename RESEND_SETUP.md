# Resend Email Integration Setup Guide

This guide helps you configure Resend for transactional emails in DevFlow.

## What is Resend?

Resend is a modern email sending platform designed for developers. It provides:
- ✨ Simple REST API for sending emails
- 📊 Real-time delivery tracking
- 🔐 Built-in authentication and security
- 💼 Domain verification and DKIM signing
- 📧 HTML email templates
- 🔔 Webhook notifications

## Step 1: Create a Resend Account

1. Go to [Resend.com](https://resend.com)
2. Click **Sign Up**
3. Create an account with your email
4. Verify your email address

## Step 2: Get Your API Key

You already have your API key:
```
re_hyct6ebu_F7FBAGbZ93VSd8EbYpjWqbL
```

Keep this safe! Never commit it to version control.

## Step 3: Verify Your Domain (Optional but Recommended)

For production, verify a custom domain:

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click **Add Domain**
3. Enter your domain (e.g., `notifications.devflow.app`)
4. Add the DNS records Resend provides:
   - DKIM record
   - DMARC record
   - Return-Path record

This improves email deliverability and prevents spoofing.

## Step 4: Set Environment Variables in Render

Go to your **DevFlow-backend** deployment on Render:

1. Click **Environment** (in left sidebar)
2. Update these variables:

| Key | Value |
|-----|-------|
| `RESEND_API_KEY` | `re_hyct6ebu_F7FBAGbZ93VSd8EbYpjWqbL` |
| `FROM_EMAIL` | `noreply@devflow.app` |
| `CLIENT_URL` | `https://devflow123.vercel.app` |

3. Click **Save**
4. **Redeploy** the service

## Step 5: Test Email Sending

Register a new user in your DevFlow app to trigger a welcome email.

Check:
- Your email inbox for the welcome email
- Resend dashboard for delivery status
- Render logs for any errors

## Email Templates

DevFlow includes the following email templates:

### 1. Welcome Email
Sent when user registers
- Verification link
- DevFlow features overview
- Call-to-action button

### 2. Password Reset Email
Sent when user requests password reset
- Secure password reset link
- Link expiration: 1 hour
- Security recommendations

### 3. Issue Assigned Email
Sent when issue is assigned to user
- Issue title and details
- Assignee notification
- Link to view issue

### 4. Comment Notification Email
Sent when someone comments on assigned issue
- Commenter name and text
- Issue details
- Link to conversation

### 5. Team Invite Email
Sent when inviting member to organization
- Organization name
- Inviter name
- Accept invitation link
- Link expiration: 7 days

## Integration Points

Emails are sent automatically at these events:

### User Registration
```typescript
// server/src/services/auth.service.ts
AuthService.register() → emailService.sendWelcomeEmail()
```

### Password Reset Request
```typescript
// server/src/services/auth.service.ts
AuthService.requestPasswordReset() → emailService.sendPasswordResetEmail()
```

### Issue Assignment
```typescript
// Can be triggered in issue.service.ts or controller
emailService.sendIssueAssignedEmail()
```

### Comment Added
```typescript
// Can be triggered in comment.controller.ts
emailService.sendCommentNotificationEmail()
```

### Team Member Invite
```typescript
// Can be triggered in organization.controller.ts
emailService.sendTeamInviteEmail()
```

## Customizing Emails

To modify email templates, edit [server/src/services/email.service.ts](../server/src/services/email.service.ts):

1. Update the HTML template (colors, text, layout)
2. Change the subject line
3. Add/remove sections as needed

Example:
```typescript
async sendWelcomeEmail(userEmail: string, userName: string, activationUrl: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <!-- Your custom HTML here -->
    </html>
  `;
  
  return this.sendEmail({
    to: userEmail,
    subject: 'Welcome to DevFlow! 🚀',
    html,
  });
}
```

## API Reference

### Send Custom Email

```typescript
import { emailService } from './services/email.service';

await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Your Subject',
  html: '<h1>Hello</h1>',
  from: 'custom@domain.com', // Optional
  replyTo: 'support@example.com', // Optional
});
```

## Monitoring & Analytics

### View Emails in Resend Dashboard

1. Go to [Resend Dashboard](https://resend.com)
2. Check **Email Activity**:
   - Delivery status
   - Open rates
   - Click rates
   - Bounce rates

### Set Up Webhooks (Optional)

Monitor email events:

1. Go to **Webhooks** in Resend settings
2. Add webhook URL: `https://devflow-backend.onrender.com/api/webhooks/resend`
3. Subscribe to events:
   - `email.sent`
   - `email.delivered`
   - `email.bounced`
   - `email.opened`
   - `email.clicked`

## Troubleshooting

### "Invalid API key" error
- Make sure the API key is correct
- Check for extra spaces or typos
- Regenerate the key if needed

### Emails not being sent
- Verify `RESEND_API_KEY` is set in Render
- Check Render logs for errors
- Ensure `FROM_EMAIL` is configured
- Check email address format is valid

### Email not received
- Check spam/junk folder
- Verify email address is correct
- Check Resend dashboard for bounce/reject reasons
- Verify domain is properly configured

### Images not loading in email
- Use absolute URLs (start with `https://`)
- Avoid embedding large files
- Use web-safe fonts
- Test on multiple email clients

## Production Best Practices

1. **Use a verified domain** for better deliverability
2. **Monitor bounce rates** and remove invalid emails
3. **Set up proper DNS records** (SPF, DKIM, DMARC)
4. **Test emails** in different email clients
5. **Keep API key secret** - never commit to version control
6. **Use webhooks** to track email events
7. **Implement unsubscribe** for notification emails
8. **Rate limit** email sending to avoid abuse

## Pricing

Resend offers:
- **Free tier**: 100 emails/day
- **Pro tier**: Pay as you go ($0.25 per 1000 emails)

Check [Resend Pricing](https://resend.com/pricing) for current rates.

## Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference/emails/send)
- [Email Templates Guide](https://resend.com/docs/examples)
- [Webhook Events](https://resend.com/docs/webhooks)

## Support

For issues or questions:
- Resend Support: [support@resend.com](mailto:support@resend.com)
- DevFlow Issues: [GitHub Issues](https://github.com/bhaskar2006-hub/DevFlow/issues)
