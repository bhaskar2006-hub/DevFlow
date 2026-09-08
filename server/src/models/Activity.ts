import mongoose, { Document, Schema, Types } from 'mongoose';

export type ActivityAction =
  | 'CREATED_PROJECT'
  | 'UPDATED_PROJECT'
  | 'DELETED_PROJECT'
  | 'CREATED_ISSUE'
  | 'UPDATED_STATUS'
  | 'UPDATED_ASSIGNEE'
  | 'UPDATED_PRIORITY'
  | 'UPDATED_ISSUE'
  | 'DELETED_ISSUE'
  | 'ADDED_COMMENT'
  | 'DELETED_COMMENT'
  | 'MEMBER_JOINED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_ROLE_CHANGED';

export interface IActivity extends Document {
  organizationId: Types.ObjectId;
  projectId?: Types.ObjectId | null;
  issueId?: Types.ObjectId | null;
  actorId: Types.ObjectId;
  action: ActivityAction;
  details?: Record<string, any>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    issueId: {
      type: Schema.Types.ObjectId,
      ref: 'Issue',
      default: null,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
