# Slack Integration Setup Guide

This guide helps you configure Slack integration for DevFlow.

## Step 1: Create/Open Your Slack App

1. Go to [Slack API Dashboard](https://api.slack.com/apps)
2. Click **Create New App** → **From scratch**
3. Enter:
   - **App Name:** `DevFlow`
   - **Workspace:** Select your workspace
4. Click **Create App**

## Step 2: Collect Your Credentials

From the **Basic Information** page, copy:

- **App ID**: `A0C0BABC551` (from your screenshot)
- **Client ID**: `11424089587893.1201135141317`
- **Client Secret**: `4bebdf7ab0c898ca3029c85454b4ec55`
- **Signing Secret**: `29b9f48e5657f47f070bc59ecb54e611`

## Step 3: Configure OAuth & Permissions

1. Go to **OAuth & Permissions** (left sidebar)
2. Scroll to **Scopes**
3. Add these **Bot Token Scopes**:
   - `chat:write` - Send messages
   - `commands` - Slash commands
   - `incoming-webhook` - For webhooks
   - `users:read` - Read user info
   - `team:read` - Read team info

4. Scroll up to **OAuth Tokens for Your Workspace**
5. Click **Install to Workspace** (if not already done)
6. **Copy the Bot User OAuth Token** (starts with `xoxb-`)

## Step 4: Set Environment Variables in Render

Go to your **DevFlow-backend** deployment on Render:

1. Click **Environment** (in left sidebar)
2. Add these variables:

| Key | Value |
|-----|-------|
| `SLACK_BOT_TOKEN` | `xoxb-...` (from Step 3) |
| `SLACK_CLIENT_ID` | `11424089587893.1201135141317` |
| `SLACK_CLIENT_SECRET` | `4bebdf7ab0c898ca3029c85454b4ec55` |
| `SLACK_SIGNING_SECRET` | `29b9f48e5657f47f070bc59ecb54e611` |
| `API_URL` | `https://devflow-backend.onrender.com` |

3. Click **Save**
4. **Redeploy** the service

## Step 5: Configure Slash Commands

In your Slack App settings:

1. Go to **Slash Commands** (left sidebar)
2. Click **Create New Command**
3. Create these commands:

### Command 1: /create-issue
- **Command:** `/create-issue`
- **Request URL:** `https://devflow-backend.onrender.com/api/slack/commands`
- **Short Description:** `Create a new DevFlow issue`
- **Usage hint:** `title:Issue Name | description:Details | priority:high`

### Command 2: /list-issues
- **Command:** `/list-issues`
- **Request URL:** `https://devflow-backend.onrender.com/api/slack/commands`
- **Short Description:** `List all issues`
- **Usage hint:** `[status]` (optional: open, in-progress, done)

### Command 3: /my-issues
- **Command:** `/my-issues`
- **Request URL:** `https://devflow-backend.onrender.com/api/slack/commands`
- **Short Description:** `Show issues assigned to you`

### Command 4: /issue-status
- **Command:** `/issue-status`
- **Request URL:** `https://devflow-backend.onrender.com/api/slack/commands`
- **Short Description:** `Update issue status`
- **Usage hint:** `issue-id:123 status:done`

## Step 6: Enable Event Subscriptions

1. Go to **Event Subscriptions** (left sidebar)
2. Toggle **Enable Events** to ON
3. Set **Request URL** to: `https://devflow-backend.onrender.com/api/slack/events`
4. Verify URL (Slack will send a challenge)
5. Under **Subscribe to bot events**, add:
   - `app_mention` - When someone mentions your app
   - `message.channels` - For channel messages

## Step 7: Upload App Icon

1. Go to **Basic Information**
2. Scroll to **Display Information**
3. Click **Upload** and select: `/client/public/devflow-icon.svg`

## Step 8: Test Integration

In your Slack workspace, try these commands:

```
/create-issue title:Test Issue | description:Testing Slack integration | priority:high

/list-issues open

/my-issues

/issue-status issue-id:ISSUE_ID status:done

@DevFlow help
```

## Using Slack Features

### Creating Issues from Slack

```
/create-issue title:Bug Report | description:Something is broken | priority:urgent | project:PROJECT_ID
```

### Listing Issues

```
/list-issues open
/list-issues in-progress
/list-issues done
```

### Assigning Issues

```
/issue-status issue-id:64f3b2c1d8e9f1a2b3c4d5e6 status:in-progress
```

## Webhook Notifications

Your organization can also receive notifications in Slack when events happen:

1. In DevFlow, go to **Organization Settings**
2. Add your Slack channel webhook URL
3. Enable notifications for:
   - Issue created
   - Issue updated
   - Comments added
   - Project updates

## Troubleshooting

### "Invalid signature" error
- Make sure your `SLACK_SIGNING_SECRET` is correct
- Timestamps must be within 5 minutes

### Commands not showing up in Slack
- Wait a few minutes after creating the commands
- Make sure the bot is installed in your workspace
- Check permissions under **OAuth & Permissions**

### Messages not being sent
- Verify the bot token starts with `xoxb-`
- Make sure the bot has `chat:write` scope
- Check Render logs for errors

## Resources

- [Slack API Docs](https://api.slack.com/docs)
- [Slack Bolt Framework](https://slack.dev/bolt-js/)
- [Slack OAuth](https://api.slack.com/authentication/oauth-v2)
