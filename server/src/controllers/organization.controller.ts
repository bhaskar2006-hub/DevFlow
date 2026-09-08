import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Organization } from '../models/Organization';
import { OrganizationMember } from '../models/OrganizationMember';
import { User } from '../models/User';
import { ActivityService } from '../services/activity.service';
import { AppError } from '../middleware/error.middleware';

export class OrganizationController {
  public static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, slug, description, avatarUrl } = req.body;
      const userId = req.user!._id;

      if (!name || !slug) {
        throw new AppError('Organization name and slug are required', 400);
      }

      const cleanSlug = slug.toLowerCase().trim();
      const existingOrg = await Organization.findOne({ slug: cleanSlug });
      if (existingOrg) {
        throw new AppError('Organization slug is already taken', 400);
      }

      const organization = await Organization.create({
        name: name.trim(),
        slug: cleanSlug,
        description: description || '',
        avatarUrl: avatarUrl || '',
        ownerId: userId,
      });

      // Add creator as OWNER
      await OrganizationMember.create({
        organizationId: organization._id,
        userId,
        role: 'OWNER',
      });

      await ActivityService.logActivity({
        organizationId: organization._id,
        actorId: userId,
        action: 'MEMBER_JOINED',
        details: { role: 'OWNER', note: 'Created organization' },
      });

      res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id;

      const memberships = await OrganizationMember.find({ userId }).populate('organizationId');

      const organizations = memberships
        .filter((m) => m.organizationId)
        .map((m) => ({
          ...(m.organizationId as any).toJSON(),
          membershipRole: m.role,
        }));

      res.status(200).json({
        success: true,
        data: organizations,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const organization = await Organization.findOne({
        $or: [
          { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
          { slug: id.toLowerCase() },
        ],
      }).populate('ownerId', 'name email avatar');

      if (!organization) {
        throw new AppError('Organization not found', 404);
      }

      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, avatarUrl } = req.body;

      const organization = await Organization.findById(id);
      if (!organization) {
        throw new AppError('Organization not found', 404);
      }

      if (name) organization.name = name.trim();
      if (description !== undefined) organization.description = description;
      if (avatarUrl !== undefined) organization.avatarUrl = avatarUrl;

      await organization.save();

      res.status(200).json({
        success: true,
        message: 'Organization updated successfully',
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const organization = await Organization.findById(id);
      if (!organization) {
        throw new AppError('Organization not found', 404);
      }

      await Organization.findByIdAndDelete(id);
      await OrganizationMember.deleteMany({ organizationId: id });

      res.status(200).json({
        success: true,
        message: 'Organization deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMembers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const members = await OrganizationMember.find({ organizationId: id })
        .populate('userId', 'name email avatar')
        .sort({ createdAt: 1 });

      res.status(200).json({
        success: true,
        data: members,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async addMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { email, role = 'MEMBER' } = req.body;

      if (!email) {
        throw new AppError('User email is required', 400);
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new AppError('User with this email does not exist', 404);
      }

      const existingMember = await OrganizationMember.findOne({
        organizationId: id,
        userId: user._id,
      });

      if (existingMember) {
        throw new AppError('User is already a member of this organization', 400);
      }

      const member = await OrganizationMember.create({
        organizationId: id,
        userId: user._id,
        role,
      });

      await ActivityService.logActivity({
        organizationId: id,
        actorId: req.user!._id,
        action: 'MEMBER_JOINED',
        details: { memberEmail: user.email, role },
      });

      res.status(201).json({
        success: true,
        message: 'Member added successfully',
        data: await member.populate('userId', 'name email avatar'),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateMemberRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, memberId } = req.params;
      const { role } = req.body;

      if (!role) {
        throw new AppError('Role is required', 400);
      }

      const member = await OrganizationMember.findOne({
        _id: memberId,
        organizationId: id,
      });

      if (!member) {
        throw new AppError('Membership record not found', 404);
      }

      const oldRole = member.role;
      member.role = role;
      await member.save();

      await ActivityService.logActivity({
        organizationId: id,
        actorId: req.user!._id,
        action: 'MEMBER_ROLE_CHANGED',
        details: { memberId, from: oldRole, to: role },
      });

      res.status(200).json({
        success: true,
        message: 'Member role updated successfully',
        data: member,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async removeMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, memberId } = req.params;

      const member = await OrganizationMember.findOne({
        _id: memberId,
        organizationId: id,
      });

      if (!member) {
        throw new AppError('Membership record not found', 404);
      }

      if (member.role === 'OWNER') {
        throw new AppError('Cannot remove the organization owner', 400);
      }

      await OrganizationMember.findByIdAndDelete(memberId);

      await ActivityService.logActivity({
        organizationId: id,
        actorId: req.user!._id,
        action: 'MEMBER_REMOVED',
        details: { memberId, userId: member.userId },
      });

      res.status(200).json({
        success: true,
        message: 'Member removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getActivities(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;

      const result = await ActivityService.getActivities({
        organizationId: id,
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
