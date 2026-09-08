import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { IssueService } from '../services/issue.service';
import { Comment } from '../models/Comment';
import { ActivityService } from '../services/activity.service';
import { AppError } from '../middleware/error.middleware';

export class IssueController {
  public static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        title,
        description,
        projectId,
        assigneeId,
        type,
        status,
        priority,
        dueDate,
        labels,
        order,
      } = req.body;
      const userId = req.user!._id.toString();

      if (!title || !projectId) {
        throw new AppError('Title and projectId are required', 400);
      }

      const issue = await IssueService.createIssue(
        {
          title,
          description,
          projectId,
          assigneeId,
          type,
          status,
          priority,
          dueDate,
          labels,
          order,
        },
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Issue created successfully',
        data: issue,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        projectId,
        organizationId,
        status,
        priority,
        type,
        assigneeId,
        reporterId,
        search,
        page,
        limit,
      } = req.query;

      const result = await IssueService.getIssues({
        projectId: projectId as string,
        organizationId: organizationId as string,
        status: status as string,
        priority: priority as string,
        type: type as string,
        assigneeId: assigneeId as string,
        reporterId: reporterId as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.issues,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const issue = await IssueService.getIssueById(id);

      res.status(200).json({
        success: true,
        data: issue,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!._id.toString();

      const issue = await IssueService.updateIssue(id, req.body, userId);

      res.status(200).json({
        success: true,
        message: 'Issue updated successfully',
        data: issue,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!._id.toString();

      const result = await IssueService.deleteIssue(id, userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // Nested routes: /api/issues/:id/comments
  public static async createComment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user!._id;

      if (!content || !content.trim()) {
        throw new AppError('Comment content is required', 400);
      }

      const issue = await IssueService.getIssueById(id);

      const comment = await Comment.create({
        issueId: id,
        authorId: userId,
        content: content.trim(),
      });

      await ActivityService.logActivity({
        organizationId: issue.organizationId,
        projectId: issue.projectId,
        issueId: issue._id,
        actorId: userId,
        action: 'ADDED_COMMENT',
        details: { issueKey: issue.key },
      });

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: await comment.populate('authorId', 'name email avatar'),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getComments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const comments = await Comment.find({ issueId: id })
        .populate('authorId', 'name email avatar')
        .sort({ createdAt: 1 });

      res.status(200).json({
        success: true,
        data: comments,
      });
    } catch (error) {
      next(error);
    }
  }
}
