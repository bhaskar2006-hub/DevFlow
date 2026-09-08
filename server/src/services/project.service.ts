import { Project, IProject } from '../models/Project';
import { Issue } from '../models/Issue';
import { Comment } from '../models/Comment';
import { Organization } from '../models/Organization';
import { ActivityService } from './activity.service';
import { AppError } from '../middleware/error.middleware';

export class ProjectService {
  public static async createProject(
    data: {
      name: string;
      key: string;
      description?: string;
      organizationId: string;
      leadId?: string;
    },
    userId: string
  ): Promise<IProject> {
    const org = await Organization.findById(data.organizationId);
    if (!org) {
      throw new AppError('Organization not found', 404);
    }

    const keyUpper = data.key.toUpperCase().trim();
    const existing = await Project.findOne({
      organizationId: data.organizationId,
      key: keyUpper,
    });

    if (existing) {
      throw new AppError(`Project with key ${keyUpper} already exists in this organization`, 400);
    }

    const project = await Project.create({
      name: data.name.trim(),
      key: keyUpper,
      description: data.description || '',
      organizationId: data.organizationId,
      leadId: data.leadId || userId,
    });

    await ActivityService.logActivity({
      organizationId: data.organizationId,
      projectId: project._id,
      actorId: userId,
      action: 'CREATED_PROJECT',
      details: { name: project.name, key: project.key },
    });

    return project;
  }

  public static async getProjectsByOrganization(organizationId: string) {
    return await Project.find({ organizationId })
      .populate('leadId', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  public static async getProjectById(projectId: string) {
    const project = await Project.findById(projectId)
      .populate('organizationId', 'name slug')
      .populate('leadId', 'name email avatar');

    if (!project) {
      throw new AppError('Project not found', 404);
    }
    return project;
  }

  public static async updateProject(
    projectId: string,
    updateData: { name?: string; description?: string; leadId?: string; status?: any },
    userId: string
  ) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    if (updateData.name) project.name = updateData.name.trim();
    if (updateData.description !== undefined) project.description = updateData.description;
    if (updateData.leadId) project.leadId = updateData.leadId as any;
    if (updateData.status) project.status = updateData.status;

    await project.save();

    await ActivityService.logActivity({
      organizationId: project.organizationId,
      projectId: project._id,
      actorId: userId,
      action: 'UPDATED_PROJECT',
      details: updateData,
    });

    return project;
  }

  public static async deleteProject(projectId: string, userId: string) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Find all issues in this project to delete their comments
    const issues = await Issue.find({ projectId });
    const issueIds = issues.map((i) => i._id);

    await Promise.all([
      Project.findByIdAndDelete(projectId),
      Issue.deleteMany({ projectId }),
      Comment.deleteMany({ issueId: { $in: issueIds } }),
    ]);

    await ActivityService.logActivity({
      organizationId: project.organizationId,
      projectId: null,
      actorId: userId,
      action: 'DELETED_PROJECT',
      details: { projectName: project.name, projectKey: project.key },
    });

    return { message: `Project ${project.name} and all related issues deleted successfully` };
  }
}
