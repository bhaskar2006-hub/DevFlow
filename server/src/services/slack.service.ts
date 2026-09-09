import axios from 'axios';
import { Organization } from '../models/Organization';

export class SlackService {
  /**
   * Helper to fetch organization slack settings
   */
  private static async getOrgSlackWebhook(orgId: string): Promise<string | null> {
    try {
      const org = await Organization.findById(orgId);
      if (!org || !org.slackWebhookUrl || org.slackNotifications === false) {
        return null;
      }
      return org.slackWebhookUrl;
    } catch (err) {
      console.warn('[Slack Service] Error fetching org webhook:', err);
      return null;
    }
  }

  /**
   * Send a test message to verify Slack webhook configuration
   */
  public static async testWebhook(webhookUrl: string, orgName: string): Promise<boolean> {
    try {
      await axios.post(webhookUrl, {
        text: `🎉 DevFlow is now connected to ${orgName}!`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '⚡ DevFlow Slack Integration Connected',
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Your workspace *${orgName}* is now actively connected to Slack. You will receive real-time notifications for sprint issues, comments, status changes, and member invites.`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Sent via *DevFlow Cloud* • ${new Date().toLocaleTimeString()}`,
              },
            ],
          },
        ],
      });
      return true;
    } catch (error: any) {
      console.error('[Slack Service] Test webhook failed:', error.response?.data || error.message);
      throw new Error(`Slack test failed: ${error.response?.data || error.message}`);
    }
  }

  /**
   * Notify Slack when a new issue is created
   */
  public static async notifyIssueCreated(orgId: string, payload: {
    issueKey: string;
    title: string;
    type: string;
    priority: string;
    reporterName: string;
    assigneeName?: string;
    projectName?: string;
  }): Promise<void> {
    const webhook = await this.getOrgSlackWebhook(orgId);
    if (!webhook) return;

    try {
      const priorityEmoji = payload.priority === 'URGENT' ? '🚨' : payload.priority === 'HIGH' ? '🔥' : '⚡';
      const typeEmoji = payload.type === 'BUG' ? '🐛' : payload.type === 'FEATURE' ? '✨' : '📋';

      await axios.post(webhook, {
        text: `${typeEmoji} [${payload.issueKey}] ${payload.title} created by ${payload.reporterName}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${typeEmoji} New Issue Created: <https://devflow123.vercel.app/issues|${payload.issueKey}>*\n*${payload.title}*`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Priority:*\n${priorityEmoji} ${payload.priority}`,
              },
              {
                type: 'mrkdwn',
                text: `*Type:*\n${payload.type}`,
              },
              {
                type: 'mrkdwn',
                text: `*Reporter:*\n${payload.reporterName}`,
              },
              {
                type: 'mrkdwn',
                text: `*Assignee:*\n${payload.assigneeName || '_Unassigned_'}`,
              },
            ],
          },
        ],
      });
    } catch (err) {
      console.warn('[Slack Service] Failed to send issue created notification:', err);
    }
  }

  /**
   * Notify Slack when an issue status changes (e.g. IN_PROGRESS -> DONE)
   */
  public static async notifyIssueStatusUpdated(orgId: string, payload: {
    issueKey: string;
    title: string;
    fromStatus: string;
    toStatus: string;
    actorName: string;
  }): Promise<void> {
    const webhook = await this.getOrgSlackWebhook(orgId);
    if (!webhook) return;

    try {
      const statusEmoji = payload.toStatus === 'DONE' ? '✅' : payload.toStatus === 'IN_PROGRESS' ? '🚧' : '🔄';

      await axios.post(webhook, {
        text: `${statusEmoji} [${payload.issueKey}] status updated to ${payload.toStatus} by ${payload.actorName}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${statusEmoji} *<https://devflow123.vercel.app/issues|${payload.issueKey}>* marked as *${payload.toStatus}* by *${payload.actorName}*\n_${payload.title}_`,
            },
          },
        ],
      });
    } catch (err) {
      console.warn('[Slack Service] Failed to send status updated notification:', err);
    }
  }

  /**
   * Notify Slack when a comment is added
   */
  public static async notifyCommentAdded(orgId: string, payload: {
    issueKey: string;
    authorName: string;
    commentText: string;
  }): Promise<void> {
    const webhook = await this.getOrgSlackWebhook(orgId);
    if (!webhook) return;

    try {
      await axios.post(webhook, {
        text: `💬 ${payload.authorName} commented on ${payload.issueKey}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `💬 *${payload.authorName}* commented on *<https://devflow123.vercel.app/issues|${payload.issueKey}>*:\n>${payload.commentText.replace(/\n/g, '\n>')}`,
            },
          },
        ],
      });
    } catch (err) {
      console.warn('[Slack Service] Failed to send comment notification:', err);
    }
  }
}
