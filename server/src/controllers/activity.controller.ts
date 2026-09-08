import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ActivityService } from '../services/activity.service';

export class ActivityController {
  public static async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { organizationId, projectId, issueId, page, limit } = req.query;

      const result = await ActivityService.getActivities({
        organizationId: organizationId as string,
        projectId: projectId as string,
        issueId: issueId as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.activities,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}
