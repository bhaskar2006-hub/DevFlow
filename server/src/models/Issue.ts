import mongoose, { Document, Schema, Types } from 'mongoose';

export type IssueType = 'BUG' | 'FEATURE' | 'TASK' | 'IMPROVEMENT';
export type IssueStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface IIssue extends Document {
  title: string;
  description?: string;
  key: string;
  issueNumber: number;
  projectId: Types.ObjectId;
  organizationId: Types.ObjectId;
  reporterId: Types.ObjectId;
  assigneeId?: Types.ObjectId | null;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  dueDate?: Date | null;
  labels: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<IIssue>(
  {
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
      maxlength: [200, 'Issue title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
    },
    key: {
      type: String,
      required: [true, 'Issue key is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    issueNumber: {
      type: Number,
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
      index: true,
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
      index: true,
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ['BUG', 'FEATURE', 'TASK', 'IMPROVEMENT'],
      default: 'TASK',
    },
    status: {
      type: String,
      enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'],
      default: 'TODO',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    labels: {
      type: [String],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for unique issue key per organization/project
IssueSchema.index({ projectId: 1, issueNumber: 1 }, { unique: true });

export const Issue = mongoose.model<IIssue>('Issue', IssueSchema);
