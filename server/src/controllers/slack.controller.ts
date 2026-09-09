import { Request, Response } from 'express';
import crypto from 'crypto';
import { Issue } from '../models/Issue';
import { Comment } from '../models/Comment';
import { SlackService } from '../services/slack.service';

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || '';
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || '';

export class SlackController {
  /**
   * Verify Slack request signature
   */
  private static verifySlackSignature(
    signature: string,
    timestamp: string,
    body: string
  ): boolean {
    const requestTimestamp = parseInt(timestamp);
    const currentTimestamp = Math.floor(Date.now() / 1000);

    // Prevent replay attacks
    if (Math.abs(currentTimestamp - requestTimestamp) > 300) {
      return false;
    }

    const baseString = `v0:${timestamp}:${body}`;
    const hmac = crypto.createHmac('sha256', SLACK_SIGNING_SECRET);
    const computedSignature = 'v0=' + hmac.update(baseString).digest('hex');

    return computedSignature === signature;
  }

  /**
   * Handle Slack events (slash commands, interactive messages, etc.)
   */
  static async handleSlackEvent(req: Request, res: Response): Promise<void> {
    const signature = req.headers['x-slack-request-signature'] as string;
    const timestamp = req.headers['x-slack-request-timestamp'] as string;
    const body = (req as any).rawBody || JSON.stringify(req.body);

    // Verify request authenticity
    if (!this.verifySlackSignature(signature, timestamp, body)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { type, token, challenge, event, actions, trigger_id } = req.body;

    // URL verification challenge for initial Slack setup
    if (type === 'url_verification') {
      res.json({ challenge });
      return;
    }

    // Handle events
    if (type === 'event_callback') {
      res.status(200).send();

      if (event.type === 'app_mention') {
        await this.handleAppMention(event);
      }

      return;
    }

    // Handle interactive actions (buttons, select menus, etc.)
    if (type === 'block_actions' || type === 'shortcut' || req.body.command) {
      await this.handleSlashCommand(req, res);
      return;
    }

    res.status(200).send();
  }

  /**
   * Handle slash commands like /create-issue, /list-issues, etc.
   */
  static async handleSlashCommand(req: Request, res: Response): Promise<void> {
    const { command, text, user_id, team_id, response_url, trigger_id } = req.body;

    // Acknowledge immediately
    res.status(200).json({ response_type: 'in_channel' });

    try {
      switch (command) {
        case '/create-issue':
          await this.createIssueFromSlack(text, user_id, team_id, response_url);
          break;

        case '/list-issues':
          await this.listIssuesFromSlack(text, response_url);
          break;

        case '/issue-status':
          await this.updateIssueStatusFromSlack(text, user_id, response_url);
          break;

        case '/my-issues':
          await this.myIssuesFromSlack(user_id, response_url);
          break;

        default:
          await this.sendSlackMessage(response_url, {
            text: `Unknown command: ${command}`,
            response_type: 'ephemeral',
          });
      }
    } catch (error: any) {
      console.error('[Slack] Slash command error:', error);
      await this.sendSlackMessage(response_url, {
        text: `❌ Error: ${error.message}`,
        response_type: 'ephemeral',
      });
    }
  }

  /**
   * Create an issue from Slack
   * Usage: /create-issue title:My Issue | description:Details | priority:high
   */
  private static async createIssueFromSlack(
    text: string,
    userId: string,
    teamId: string,
    responseUrl: string
  ): Promise<void> {
    // Parse command text
    const params = new URLSearchParams();
    text.split('|').forEach((part) => {
      const [key, value] = part.split(':').map((s) => s.trim());
      if (key && value) params.set(key, value);
    });

    const title = params.get('title');
    const description = params.get('description') || '';
    const priority = params.get('priority') || 'medium';
    const projectId = params.get('project');

    if (!title) {
      await this.sendSlackMessage(responseUrl, {
        text: '❌ Title is required. Usage: /create-issue title:My Issue | description:Details | priority:high',
        response_type: 'ephemeral',
      });
      return;
    }

    // Create issue
    const issue = new Issue({
      title,
      description,
      priority,
      status: 'open',
      type: 'task',
      projectId,
      reportedBy: userId,
    });

    await issue.save();

    await this.sendSlackMessage(responseUrl, {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ Issue created successfully!\n*${title}*\nPriority: ${priority}`,
          },
        },
      ],
      response_type: 'in_channel',
    });
  }

  /**
   * List all issues
   */
  private static async listIssuesFromSlack(text: string, responseUrl: string): Promise<void> {
    const status = text?.toLowerCase() || 'open';

    const issues = await Issue.find({ status }).limit(10);

    if (issues.length === 0) {
      await this.sendSlackMessage(responseUrl, {
        text: `No ${status} issues found.`,
        response_type: 'in_channel',
      });
      return;
    }

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📋 Issues (${status})*`,
        },
      },
    ];

    issues.forEach((issue) => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `• *${issue.title}* - Priority: ${issue.priority}`,
        },
      });
    });

    await this.sendSlackMessage(responseUrl, {
      blocks,
      response_type: 'in_channel',
    });
  }

  /**
   * Update issue status
   * Usage: /issue-status issue-id:123 status:done
   */
  private static async updateIssueStatusFromSlack(
    text: string,
    userId: string,
    responseUrl: string
  ): Promise<void> {
    const params = new URLSearchParams();
    text.split('|').forEach((part) => {
      const [key, value] = part.split(':').map((s) => s.trim());
      if (key && value) params.set(key, value);
    });

    const issueId = params.get('issue-id');
    const status = params.get('status');

    if (!issueId || !status) {
      await this.sendSlackMessage(responseUrl, {
        text: '❌ Issue ID and status required. Usage: /issue-status issue-id:123 status:done',
        response_type: 'ephemeral',
      });
      return;
    }

    const issue = await Issue.findByIdAndUpdate(issueId, { status }, { new: true });

    if (!issue) {
      await this.sendSlackMessage(responseUrl, {
        text: `❌ Issue ${issueId} not found.`,
        response_type: 'ephemeral',
      });
      return;
    }

    await this.sendSlackMessage(responseUrl, {
      text: `✅ Issue ${issue.title} status updated to ${status}`,
      response_type: 'in_channel',
    });
  }

  /**
   * List user's assigned issues
   */
  private static async myIssuesFromSlack(userId: string, responseUrl: string): Promise<void> {
    const issues = await Issue.find({ assignedTo: userId }).limit(10);

    if (issues.length === 0) {
      await this.sendSlackMessage(responseUrl, {
        text: 'No issues assigned to you.',
        response_type: 'in_channel',
      });
      return;
    }

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📋 Your Assigned Issues (${issues.length})*`,
        },
      },
    ];

    issues.forEach((issue) => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `• *${issue.title}* (${issue.status})\n  Priority: ${issue.priority}`,
        },
      });
    });

    await this.sendSlackMessage(responseUrl, {
      blocks,
      response_type: 'in_channel',
    });
  }

  /**
   * Handle app mentions
   */
  private static async handleAppMention(event: any): Promise<void> {
    const { user, text, channel, ts } = event;

    if (text.includes('help')) {
      await this.sendSlackMessage(channel, {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*📚 DevFlow Slack Commands*\n/create-issue - Create a new issue\n/list-issues - List all issues\n/my-issues - Show your assigned issues\n/issue-status - Update issue status`,
            },
          },
        ],
      });
    }
  }

  /**
   * Send a message to Slack
   */
  private static async sendSlackMessage(
    channelOrUrl: string,
    message: any
  ): Promise<void> {
    try {
      // If it's a response URL, post to it
      if (channelOrUrl.includes('hooks.slack.com')) {
        await fetch(channelOrUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        });
      } else {
        // Otherwise use bot token to send to channel
        const response = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channel: channelOrUrl,
            ...message,
          }),
        });

        const data = await response.json();
        if (!data.ok) {
          throw new Error(`Slack API error: ${data.error}`);
        }
      }
    } catch (error: any) {
      console.error('[Slack] Failed to send message:', error.message);
    }
  }

  /**
   * Authorize Slack workspace
   * Endpoint for Slack OAuth callback
   */
  static async authorizeSlack(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.query;

      if (!code) {
        res.status(400).json({ error: 'Missing authorization code' });
        return;
      }

      // Exchange code for token
      const response = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.SLACK_CLIENT_ID || '',
          client_secret: process.env.SLACK_CLIENT_SECRET || '',
          code: code as string,
          redirect_uri: `${process.env.API_URL}/api/slack/authorize`,
        }).toString(),
      });

      const data = await response.json();

      if (!data.ok) {
        res.status(400).json({ error: `Slack authorization failed: ${data.error}` });
        return;
      }

      // Store workspace info (you could save this to a SlackWorkspace model)
      res.json({
        success: true,
        workspace: data.team.name,
        botUserId: data.bot_user_id,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
