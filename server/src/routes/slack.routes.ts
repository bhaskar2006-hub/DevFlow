import { Router, Request, Response } from 'express';
import { SlackController } from '../controllers/slack.controller';

const router = Router();

/**
 * POST /api/slack/events
 * Handle Slack events, slash commands, and interactive actions
 */
router.post('/events', async (req: Request, res: Response) => {
  await SlackController.handleSlackEvent(req, res);
});

/**
 * POST /api/slack/commands
 * Handle slash commands
 */
router.post('/commands', async (req: Request, res: Response) => {
  await SlackController.handleSlashCommand(req, res);
});

/**
 * GET /api/slack/authorize
 * OAuth callback for Slack workspace authorization
 */
router.get('/authorize', async (req: Request, res: Response) => {
  await SlackController.authorizeSlack(req, res);
});

export default router;
