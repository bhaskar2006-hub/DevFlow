import { Issue, IIssue } from '../models/Issue';
import { Project } from '../models/Project';
import { User } from '../models/User';
import { ActivityService } from './activity.service';
import { SlackService } from './slack.service';
import { EmailService } from './email.service';
import { AppError } from '../middleware/error.middleware';

export interface CreateIssueDTO {
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string | null;
  type?: any;
  status?: any;
  priority?: any;
  dueDate?: Date | string | null;
  labels?: string[];
  order?: number;
}

export interface IssueFilterQuery {
  projectId?: string;
  organizationId?: string;
  status?: string;
  priority?: string;
  type?: string;
  assigneeId?: string;
  reporterId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class IssueService {
  public static async createIssue(data: CreateIssueDTO, userId: string): Promise<IIssue> {
    const project = await Project.findById(data.projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Increment issue counter atomically
    const updatedProject = await Project.findByIdAndUpdate(
      data.projectId,
      { $inc: { issueCounter: 1 } },
      { new: true }
    );

    const issueNumber = updatedProject?.issueCounter || 1;
    const key = `${project.key}-${issueNumber}`;

    const issue = await Issue.create({
      title: data.title.trim(),
      description: data.description || '',
      key,
      issueNumber,
      projectId: project._id,
      organizationId: project.organizationId,
      reporterId: userId,
      assigneeId: data.assigneeId || null,
      type: data.type || 'TASK',
      status: data.status || 'TODO',
      priority: data.priority || 'MEDIUM',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      labels: data.labels || [],
      order: data.order || 0,
    });

    await ActivityService.logActivity({
      organizationId: project.organizationId,
      projectId: project._id,
      issueId: issue._id,
      actorId: userId,
      action: 'CREATED_ISSUE',
      details: {
        key: issue.key,
        title: issue.title,
        status: issue.status,
        priority: issue.priority,
      },
    });

    const populatedIssue = (await issue.populate([
      { path: 'reporterId', select: 'name email avatar' },
      { path: 'assigneeId', select: 'name email avatar' },
      { path: 'projectId', select: 'name key' },
    ])) as any;

    // Asynchronously dispatch Slack notification
    SlackService.notifyIssueCreated(project.organizationId.toString(), {
      issueKey: issue.key,
      title: issue.title,
      type: issue.type,
      priority: issue.priority,
      reporterName: populatedIssue.reporterId?.name || 'User',
      assigneeName: populatedIssue.assigneeId?.name,
      projectName: project.name,
    }).catch((e) => console.warn('[Slack Notification Error]', e));

    // Asynchronously dispatch Email notification to assignee
    if (populatedIssue.assigneeId?.email) {
      EmailService.sendIssueAssignedEmail({
        recipientEmail: populatedIssue.assigneeId.email,
        recipientName: populatedIssue.assigneeId.name,
        issueKey: issue.key,
        issueTitle: issue.title,
        priority: issue.priority,
        assignedBy: populatedIssue.reporterId?.name || 'Team member',
      }).catch((e) => console.warn('[Email Notification Error]', e));
    }

    return populatedIssue as IIssue;
  }

  public static async getIssues(filter: IssueFilterQuery) {
    const query: any = {};

    if (filter.projectId) query.projectId = filter.projectId;
    if (filter.organizationId) query.organizationId = filter.organizationId;
    if (filter.status) query.status = filter.status;
    if (filter.priority) query.priority = filter.priority;
    if (filter.type) query.type = filter.type;
    if (filter.assigneeId) query.assigneeId = filter.assigneeId;
    if (filter.reporterId) query.reporterId = filter.reporterId;

    if (filter.search) {
      query.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } },
        { key: { $regex: filter.search, $options: 'i' } },
      ];
    }

    const limit = Math.min(filter.limit || 50, 100);
    const page = Math.max(filter.page || 1, 1);
    const skip = (page - 1) * limit;

    const [issues, total] = await Promise.all([
      Issue.find(query)
        .populate('reporterId', 'name email avatar')
        .populate('assigneeId', 'name email avatar')
        .populate('projectId', 'name key')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Issue.countDocuments(query),
    ]);

    return {
      issues,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async getIssueById(issueId: string): Promise<IIssue> {
    const issue = await Issue.findById(issueId)
      .populate('reporterId', 'name email avatar')
      .populate('assigneeId', 'name email avatar')
      .populate('projectId', 'name key organizationId')
      .populate('organizationId', 'name slug');

    if (!issue) {
      throw new AppError('Issue not found', 404);
    }
    return issue;
  }

  public static async updateIssue(
    issueId: string,
    updates: Partial<IIssue> & Record<string, any>,
    userId: string
  ): Promise<IIssue> {
    const issue = await Issue.findById(issueId);
    if (!issue) {
      throw new AppError('Issue not found', 404);
    }

    const oldStatus = issue.status;
    const oldAssignee = issue.assigneeId?.toString();
    const oldPriority = issue.priority;

    if (updates.title !== undefined) issue.title = updates.title.trim();
    if (updates.description !== undefined) issue.description = updates.description;
    if (updates.type !== undefined) issue.type = updates.type;
    if (updates.status !== undefined) issue.status = updates.status;
    if (updates.priority !== undefined) issue.priority = updates.priority;
    if (updates.assigneeId !== undefined) issue.assigneeId = updates.assigneeId || null;
    if (updates.dueDate !== undefined)
      issue.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    if (updates.labels !== undefined) issue.labels = updates.labels;
    if (updates.order !== undefined) issue.order = updates.order;

    await issue.save();

    // Log targeted activities if key properties changed
    if (updates.status && updates.status !== oldStatus) {
      await ActivityService.logActivity({
        organizationId: issue.organizationId,
        projectId: issue.projectId,
        issueId: issue._id,
        actorId: userId,
        action: 'UPDATED_STATUS',
        details: { from: oldStatus, to: issue.status, issueKey: issue.key },
      });
    }

    if (updates.assigneeId !== undefined && updates.assigneeId?.toString() !== oldAssignee) {
      await ActivityService.logActivity({
        organizationId: issue.organizationId,
        projectId: issue.projectId,
        issueId: issue._id,
        actorId: userId,
        action: 'UPDATED_ASSIGNEE',
        details: { from: oldAssignee, to: issue.assigneeId, issueKey: issue.key },
      });
    }

    if (updates.priority && updates.priority !== oldPriority) {
      await ActivityService.logActivity({
        organizationId: issue.organizationId,
        projectId: issue.projectId,
        issueId: issue._id,
        actorId: userId,
        action: 'UPDATED_PRIORITY',
        details: { from: oldPriority, to: issue.priority, issueKey: issue.key },
      });
    }

    const updatedIssue = (await issue.populate([
      { path: 'reporterId', select: 'name email avatar' },
      { path: 'assigneeId', select: 'name email avatar' },
      { path: 'projectId', select: 'name key' },
    ])) as any;

    // Send Slack notification on status change
    if (updates.status && updates.status !== oldStatus) {
      const actor = await User.findById(userId);
      SlackService.notifyIssueStatusUpdated(issue.organizationId.toString(), {
        issueKey: issue.key,
        title: issue.title,
        fromStatus: oldStatus,
        toStatus: issue.status,
        actorName: actor?.name || 'Team member',
      }).catch((e) => console.warn('[Slack Notification Error]', e));
    }

    // Send Email notification on new assignment
    if (
      updates.assigneeId !== undefined &&
      updates.assigneeId?.toString() !== oldAssignee &&
      updatedIssue.assigneeId?.email
    ) {
      const actor = await User.findById(userId);
      EmailService.sendIssueAssignedEmail({
        recipientEmail: updatedIssue.assigneeId.email,
        recipientName: updatedIssue.assigneeId.name,
        issueKey: issue.key,
        issueTitle: issue.title,
        priority: issue.priority,
        assignedBy: actor?.name || 'Team member',
      }).catch((e) => console.warn('[Email Notification Error]', e));
    }

    return updatedIssue as IIssue;
  }

  public static async deleteIssue(issueId: string, userId: string) {
    const issue = await Issue.findById(issueId);
    if (!issue) {
      throw new AppError('Issue not found', 404);
    }

    await Issue.findByIdAndDelete(issueId);

    await ActivityService.logActivity({
      organizationId: issue.organizationId,
      projectId: issue.projectId,
      issueId: null,
      actorId: userId,
      action: 'DELETED_ISSUE',
      details: { issueKey: issue.key, issueTitle: issue.title },
    });

    return { message: 'Issue deleted successfully' };
  }
}
