import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Comment } from '../models/Comment';
import { Issue } from '../models/Issue';
import { ActivityService } from '../services/activity.service';
import { AppError } from '../middleware/error.middleware';

export class CommentController {
  public static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { issueId, content } = req.body;
      const userId = req.user!._id;

      if (!issueId || !content) {
        throw new AppError('issueId and content are required', 400);
      }

      const issue = await Issue.findById(issueId);
      if (!issue) {
        throw new AppError('Issue not found', 404);
      }

      const comment = await Comment.create({
        issueId,
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

  public static async getByIssue(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { issueId } = req.params;

      const comments = await Comment.find({ issueId })
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

  public static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user!._id;

      if (!content) {
        throw new AppError('Comment content is required', 400);
      }

      const comment = await Comment.findById(id);
      if (!comment) {
        throw new AppError('Comment not found', 404);
      }

      if (comment.authorId.toString() !== userId.toString()) {
        throw new AppError('You can only edit your own comments', 403);
      }

      comment.content = content.trim();
      await comment.save();

      res.status(200).json({
        success: true,
        message: 'Comment updated successfully',
        data: await comment.populate('authorId', 'name email avatar'),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!._id;

      const comment = await Comment.findById(id);
      if (!comment) {
        throw new AppError('Comment not found', 404);
      }

      if (comment.authorId.toString() !== userId.toString()) {
        throw new AppError('You can only delete your own comments', 403);
      }

      const issue = await Issue.findById(comment.issueId);

      await Comment.findByIdAndDelete(id);

      if (issue) {
        await ActivityService.logActivity({
          organizationId: issue.organizationId,
          projectId: issue.projectId,
          issueId: issue._id,
          actorId: userId,
          action: 'DELETED_COMMENT',
          details: { issueKey: issue.key },
        });
      }

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
