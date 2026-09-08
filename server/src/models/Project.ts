import mongoose, { Document, Schema, Types } from 'mongoose';

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';

export interface IProject extends Document {
  name: string;
  key: string;
  description?: string;
  organizationId: Types.ObjectId;
  leadId?: Types.ObjectId;
  status: ProjectStatus;
  issueCounter: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    key: {
      type: String,
      required: [true, 'Project key is required'],
      uppercase: true,
      trim: true,
      minlength: [2, 'Project key must be at least 2 characters'],
      maxlength: [10, 'Project key cannot exceed 10 characters'],
      match: [/^[A-Z0-9]+$/, 'Project key must contain only uppercase alphanumeric characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Project description cannot exceed 1000 characters'],
      default: '',
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
      index: true,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED', 'COMPLETED'],
      default: 'ACTIVE',
    },
    issueCounter: {
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

// Ensure unique project key per organization
ProjectSchema.index({ organizationId: 1, key: 1 }, { unique: true });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
