import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { OrganizationMember, OrgRole } from '../models/OrganizationMember';
import { Project } from '../models/Project';
import { Issue } from '../models/Issue';
import { AppError } from './error.middleware';

export interface RoleAuthRequest extends AuthRequest {
  userRole?: OrgRole;
}

/**
 * Validates organization-level roles (e.g. OWNER, ADMIN, MEMBER, VIEWER)
 */
export const requireOrgRole = (allowedRoles: OrgRole[]) => {
  return async (req: RoleAuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const organizationId =
        req.params.organizationId ||
        req.params.orgId ||
        req.params.id ||
        req.body.organizationId ||
        (req.query.organizationId as string);

      if (!organizationId) {
        throw new AppError('Organization ID is required for authorization.', 400);
      }

      const membership = await OrganizationMember.findOne({
        organizationId,
        userId: req.user._id,
      });

      if (!membership) {
        throw new AppError('You are not a member of this organization.', 403);
      }

      if (!allowedRoles.includes(membership.role)) {
        throw new AppError(
          `Access Denied: Requires one of [${allowedRoles.join(', ')}]. Your role: ${membership.role}`,
          403
        );
      }

      req.userRole = membership.role;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validates project-level roles by looking up the project's organization
 */
export const requireProjectRole = (allowedRoles: OrgRole[]) => {
  return async (req: RoleAuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const projectId = req.params.projectId || req.params.id || req.body.projectId;

      if (!projectId) {
        throw new AppError('Project ID is required for authorization.', 400);
      }

      const project = await Project.findById(projectId);
      if (!project) {
        throw new AppError('Project not found.', 404);
      }

      const membership = await OrganizationMember.findOne({
        organizationId: project.organizationId,
        userId: req.user._id,
      });

      if (!membership) {
        throw new AppError('You do not belong to the organization owning this project.', 403);
      }

      if (!allowedRoles.includes(membership.role)) {
        throw new AppError(
          `Access Denied: Requires one of [${allowedRoles.join(', ')}]. Your role: ${membership.role}`,
          403
        );
      }

      req.userRole = membership.role;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validates issue-level roles by looking up the issue's parent organization
 */
export const requireIssueRole = (allowedRoles: OrgRole[]) => {
  return async (req: RoleAuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const issueId = req.params.issueId || req.params.id || req.body.issueId;

      if (!issueId) {
        throw new AppError('Issue ID is required for authorization.', 400);
      }

      const issue = await Issue.findById(issueId);
      if (!issue) {
        throw new AppError('Issue not found.', 404);
      }

      const membership = await OrganizationMember.findOne({
        organizationId: issue.organizationId,
        userId: req.user._id,
      });

      if (!membership) {
        throw new AppError('You do not belong to the organization owning this issue.', 403);
      }

      if (!allowedRoles.includes(membership.role)) {
        throw new AppError(
          `Access Denied: Requires one of [${allowedRoles.join(', ')}]. Your role: ${membership.role}`,
          403
        );
      }

      req.userRole = membership.role;
      next();
    } catch (error) {
      next(error);
    }
  };
};
