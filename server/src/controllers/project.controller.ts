import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ProjectService } from '../services/project.service';
import { IssueService } from '../services/issue.service';
import { OrganizationMember } from '../models/OrganizationMember';
import { AppError } from '../middleware/error.middleware';

export class ProjectController {
  public static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, key, description, organizationId, leadId } = req.body;
      const userId = req.user!._id.toString();

      if (!name || !key || !organizationId) {
        throw new AppError('Name, key, and organizationId are required', 400);
      }

      const project = await ProjectService.createProject(
        { name, key, description, organizationId, leadId },
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.query.organizationId as string;

      if (organizationId) {
        const projects = await ProjectService.getProjectsByOrganization(organizationId);
        res.status(200).json({
          success: true,
          data: projects,
        });
        return;
      }

      // If no org specified, find projects across user's organizations
      const memberships = await OrganizationMember.find({ userId: req.user!._id });
      const orgIds = memberships.map((m) => m.organizationId);

      const projects = await ProjectService.getProjectsByOrganization(orgIds as any);
      res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getByOrganization(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const organizationId = req.params.organizationId || (req.query.organizationId as string);
      if (!organizationId) {
        throw new AppError('Organization ID is required', 400);
      }

      const projects = await ProjectService.getProjectsByOrganization(organizationId);
      res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const project = await ProjectService.getProjectById(id);

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, leadId, status } = req.body;
      const userId = req.user!._id.toString();

      const project = await ProjectService.updateProject(
        id,
        { name, description, leadId, status },
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!._id.toString();

      const result = await ProjectService.deleteProject(id, userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // Nested routes: /api/projects/:id/issues
  public static async createIssue(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, assigneeId, type, status, priority, dueDate, labels, order } =
        req.body;
      const userId = req.user!._id.toString();

      if (!title) {
        throw new AppError('Issue title is required', 400);
      }

      const issue = await IssueService.createIssue(
        {
          title,
          description,
          projectId: id,
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

  public static async getIssues(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, priority, type, assigneeId, reporterId, search, page, limit } = req.query;

      const result = await IssueService.getIssues({
        projectId: id,
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
}
