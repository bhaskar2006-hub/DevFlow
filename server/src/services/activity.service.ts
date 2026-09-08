import { Activity, ActivityAction, IActivity } from '../models/Activity';
import { User } from '../models/User';

interface LogActivityParams {
  organizationId: string | any;
  projectId?: string | any;
  issueId?: string | any;
  actorId: string | any;
  action: ActivityAction;
  details?: Record<string, any>;
}

export class ActivityService {
  public static async logActivity(params: LogActivityParams): Promise<IActivity> {
    const activity = await Activity.create({
      organizationId: params.organizationId,
      projectId: params.projectId || null,
      issueId: params.issueId || null,
      actorId: params.actorId,
      action: params.action,
      details: params.details || {},
    });

    // Output formatted progress chat in backend logs
    try {
      const actor = await User.findById(params.actorId).select('name');
      const actorName = actor?.name || 'Team Member';
      const actionIcons: Record<string, string> = {
        CREATED_PROJECT: '📁',
        UPDATED_PROJECT: '✏️',
        DELETED_PROJECT: '🗑️',
        CREATED_ISSUE: '🎫',
        UPDATED_STATUS: '🚀',
        UPDATED_ASSIGNEE: '👤',
        UPDATED_PRIORITY: '🔥',
        ADDED_COMMENT: '💬',
        DELETED_COMMENT: '🧹',
        MEMBER_JOINED: '👋',
        MEMBER_ROLE_CHANGED: '🛡️',
        MEMBER_REMOVED: '🚪',
      };

      const icon = actionIcons[params.action] || '📌';
      let progressDetail = '';

      if (params.action === 'UPDATED_STATUS') {
        progressDetail = `moved ${params.details?.issueKey || 'ticket'} from [${params.details?.from}] ➔ [${params.details?.to}]`;
      } else if (params.action === 'CREATED_ISSUE') {
        progressDetail = `created issue ${params.details?.key}: "${params.details?.title}"`;
      } else if (params.action === 'ADDED_COMMENT') {
        progressDetail = `commented on issue ${params.details?.issueKey || ''}: "${params.details?.contentSnippet || 'New discussion message'}"`;
      } else if (params.action === 'CREATED_PROJECT') {
        progressDetail = `created project "${params.details?.name}" [${params.details?.key}]`;
      } else if (params.action === 'DELETED_PROJECT') {
        progressDetail = `deleted project "${params.details?.projectName}" [${params.details?.projectKey}]`;
      } else {
        progressDetail = `${params.action.toLowerCase().replace(/_/g, ' ')}`;
      }

      console.log(`\n[Progress Chat ${new Date().toLocaleTimeString()}] ${icon} \x1b[36m${actorName}\x1b[0m ${progressDetail}`);
    } catch (e) {
      // Non-blocking log
    }

    return activity;
  }

  public static async getActivities(filters: {
    organizationId?: string;
    projectId?: string;
    issueId?: string;
    limit?: number;
    page?: number;
  }) {
    const limit = Math.min(filters.limit || 20, 100);
    const page = Math.max(filters.page || 1, 1);
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.projectId) query.projectId = filters.projectId;
    if (filters.issueId) query.issueId = filters.issueId;

    const [activities, total] = await Promise.all([
      Activity.find(query)
        .populate('actorId', 'name email avatar')
        .populate('projectId', 'name key')
        .populate('issueId', 'title key')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Activity.countDocuments(query),
    ]);

    return {
      activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
