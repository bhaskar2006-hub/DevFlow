import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { OrganizationMember } from '../models/OrganizationMember';
import { Project } from '../models/Project';
import { Issue } from '../models/Issue';
import { Comment } from '../models/Comment';
import { Activity } from '../models/Activity';
import { hashPassword } from './password';

const seedData = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/devflow';

  try {
    console.log(`🌱 Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log(' connected to database.');

    // Clean existing seed data or preserve existing
    console.log('🧹 Cleaning old test data...');
    await Promise.all([
      User.deleteMany({ email: { $in: [
        'bhaskar@devflow.io',
        'sarah.connor@devflow.io',
        'david.miller@devflow.io',
        'elena.rostova@devflow.io',
        'alex.rivera@devflow.io',
      ]}}),
      Organization.deleteMany({ slug: { $in: ['acme-engineering', 'devflow-cloud'] } }),
    ]);

    console.log('👤 Creating sample team members...');
    const defaultPassword = await hashPassword('password123');

    const users = await User.create([
      {
        name: 'Bhaskar Reddy',
        email: 'bhaskar@devflow.io',
        password: defaultPassword,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      },
      {
        name: 'Sarah Connor',
        email: 'sarah.connor@devflow.io',
        password: defaultPassword,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      },
      {
        name: 'David Miller',
        email: 'david.miller@devflow.io',
        password: defaultPassword,
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      },
      {
        name: 'Elena Rostova',
        email: 'elena.rostova@devflow.io',
        password: defaultPassword,
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
      },
      {
        name: 'Alex Rivera',
        email: 'alex.rivera@devflow.io',
        password: defaultPassword,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      },
    ]);

    const [bhaskar, sarah, david, elena, alex] = users;

    console.log('🏢 Creating sample organization...');
    const org = await Organization.create({
      name: 'Acme Engineering',
      slug: 'acme-engineering',
      description: 'Next-gen distributed cloud software and developer platform',
      ownerId: bhaskar._id,
      avatarUrl: '',
    });

    console.log('👥 Assigning organization roles...');
    await OrganizationMember.create([
      { organizationId: org._id, userId: bhaskar._id, role: 'OWNER' },
      { organizationId: org._id, userId: sarah._id, role: 'ADMIN' },
      { organizationId: org._id, userId: alex._id, role: 'ADMIN' },
      { organizationId: org._id, userId: david._id, role: 'MEMBER' },
      { organizationId: org._id, userId: elena._id, role: 'VIEWER' },
    ]);

    console.log('📁 Creating sample projects...');
    const p1 = await Project.create({
      name: 'DevFlow Core Platform',
      key: 'DEV',
      description: 'Backend services, REST APIs, and authentication engine',
      organizationId: org._id,
      leadId: bhaskar._id,
      status: 'ACTIVE',
      issueCounter: 5,
    });

    const p2 = await Project.create({
      name: 'iOS & Mobile App',
      key: 'MOB',
      description: 'Native mobile companion app for iOS and Android',
      organizationId: org._id,
      leadId: sarah._id,
      status: 'ACTIVE',
      issueCounter: 4,
    });

    const p3 = await Project.create({
      name: 'Payments & Billing Gateway',
      key: 'PAY',
      description: 'Stripe subscription billing, webhooks, and invoice generation',
      organizationId: org._id,
      leadId: david._id,
      status: 'ACTIVE',
      issueCounter: 3,
    });

    const p4 = await Project.create({
      name: 'AI Workflow Copilot',
      key: 'AI',
      description: 'Intelligent sprint planning and automated issue triage',
      organizationId: org._id,
      leadId: alex._id,
      status: 'ACTIVE',
      issueCounter: 3,
    });

    console.log('🎫 Creating sample issues...');
    const issues = await Issue.create([
      // DevFlow Core (DEV)
      {
        title: 'Implement OAuth 2.0 Google SSO Login Flow',
        description: 'Allow users to authenticate securely with their Google Workspace account and automatically link credentials.',
        key: 'DEV-1',
        issueNumber: 1,
        projectId: p1._id,
        organizationId: org._id,
        reporterId: bhaskar._id,
        assigneeId: alex._id,
        type: 'FEATURE',
        status: 'DONE',
        priority: 'HIGH',
        labels: ['auth', 'security', 'backend'],
        order: 1,
      },
      {
        title: 'Optimize MongoDB indexing for compound activity queries',
        description: 'Add compound indexes on { organizationId: 1, createdAt: -1 } to speed up audit trail pagination.',
        key: 'DEV-2',
        issueNumber: 2,
        projectId: p1._id,
        organizationId: org._id,
        reporterId: sarah._id,
        assigneeId: bhaskar._id,
        type: 'IMPROVEMENT',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        labels: ['database', 'performance'],
        order: 2,
      },
      {
        title: 'Fix token expiry redirect loop on 401 response',
        description: 'When JWT expires, the frontend Axios interceptor should clear local storage and redirect to /login.',
        key: 'DEV-3',
        issueNumber: 3,
        projectId: p1._id,
        organizationId: org._id,
        reporterId: david._id,
        assigneeId: david._id,
        type: 'BUG',
        status: 'IN_REVIEW',
        priority: 'URGENT',
        labels: ['frontend', 'auth', 'bugfix'],
        order: 3,
      },
      {
        title: 'Implement Rate Limiting for public auth endpoints',
        description: 'Protect /api/auth/login and /api/auth/register against brute-force attacks using Redis or memory store.',
        key: 'DEV-4',
        issueNumber: 4,
        projectId: p1._id,
        organizationId: org._id,
        reporterId: bhaskar._id,
        assigneeId: sarah._id,
        type: 'TASK',
        status: 'TODO',
        priority: 'MEDIUM',
        labels: ['security', 'backend'],
        order: 4,
      },
      {
        title: 'Audit and update Dockerfile multi-stage alpine build',
        description: 'Ensure Node 20 alpine slim image is pinned and layer caching is optimized for production deployment.',
        key: 'DEV-5',
        issueNumber: 5,
        projectId: p1._id,
        organizationId: org._id,
        reporterId: alex._id,
        assigneeId: null,
        type: 'TASK',
        status: 'BACKLOG',
        priority: 'LOW',
        labels: ['devops', 'docker'],
        order: 5,
      },

      // Mobile App (MOB)
      {
        title: 'Design Dark Mode UI for Kanban board view',
        description: 'Support seamless system dark mode with high contrast cards, slate-900 background, and custom scrollbars.',
        key: 'MOB-1',
        issueNumber: 1,
        projectId: p2._id,
        organizationId: org._id,
        reporterId: sarah._id,
        assigneeId: elena._id,
        type: 'FEATURE',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        labels: ['design', 'ui', 'mobile'],
        order: 1,
      },
      {
        title: 'Push notifications for issue assignment and comments',
        description: 'Integrate Firebase Cloud Messaging (FCM) to send instant push notifications to mobile devices.',
        key: 'MOB-2',
        issueNumber: 2,
        projectId: p2._id,
        organizationId: org._id,
        reporterId: bhaskar._id,
        assigneeId: sarah._id,
        type: 'FEATURE',
        status: 'TODO',
        priority: 'HIGH',
        labels: ['notifications', 'fcm'],
        order: 2,
      },
      {
        title: 'Fix gesture conflict between swipe navigation and Kanban columns',
        description: 'Horizontal scroll on Kanban columns was conflicting with bottom navigation swipe gestures.',
        key: 'MOB-3',
        issueNumber: 3,
        projectId: p2._id,
        organizationId: org._id,
        reporterId: david._id,
        assigneeId: sarah._id,
        type: 'BUG',
        status: 'DONE',
        priority: 'HIGH',
        labels: ['mobile', 'touch', 'bugfix'],
        order: 3,
      },

      // Payments (PAY)
      {
        title: 'Setup Stripe webhook handler for subscription renewal',
        description: 'Handle customer.subscription.updated and invoice.payment_succeeded events to update organization tiers.',
        key: 'PAY-1',
        issueNumber: 1,
        projectId: p3._id,
        organizationId: org._id,
        reporterId: david._id,
        assigneeId: david._id,
        type: 'TASK',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        labels: ['billing', 'stripe'],
        order: 1,
      },
      {
        title: 'Generate PDF downloadable invoices for billing statements',
        description: 'Allow organization owners to download PDF receipts with VAT/tax breakdown from the team billing tab.',
        key: 'PAY-2',
        issueNumber: 2,
        projectId: p3._id,
        organizationId: org._id,
        reporterId: bhaskar._id,
        assigneeId: alex._id,
        type: 'FEATURE',
        status: 'TODO',
        priority: 'MEDIUM',
        labels: ['billing', 'pdf'],
        order: 2,
      },

      // AI Workflow (AI)
      {
        title: 'Auto-generate sprint retrospective summary with Gemini 2.0',
        description: 'Analyze resolved issues, cycle time, and velocity to generate actionable sprint review bullet points.',
        key: 'AI-1',
        issueNumber: 1,
        projectId: p4._id,
        organizationId: org._id,
        reporterId: alex._id,
        assigneeId: alex._id,
        type: 'FEATURE',
        status: 'IN_REVIEW',
        priority: 'HIGH',
        labels: ['ai', 'gemini', 'analytics'],
        order: 1,
      },
      {
        title: 'Smart issue duplication detector',
        description: 'Use embeddings to check for semantic similarity when a user types an issue title and suggest existing tickets.',
        key: 'AI-2',
        issueNumber: 2,
        projectId: p4._id,
        organizationId: org._id,
        reporterId: bhaskar._id,
        assigneeId: david._id,
        type: 'FEATURE',
        status: 'TODO',
        priority: 'MEDIUM',
        labels: ['ai', 'search', 'vector'],
        order: 2,
      },
    ]);

    console.log('💬 Creating sample comments...');
    await Comment.create([
      {
        issueId: issues[0]._id, // DEV-1
        authorId: sarah._id,
        content: 'OAuth integration tested with Google Workspace domains. Token exchange is running smoothly!',
      },
      {
        issueId: issues[0]._id,
        authorId: bhaskar._id,
        content: 'Awesome work! Verified token validation and profile sync on login.',
      },
      {
        issueId: issues[1]._id, // DEV-2
        authorId: alex._id,
        content: 'Checked ripgrep logs. Adding indexes reduced query response time from 180ms down to 14ms.',
      },
      {
        issueId: issues[2]._id, // DEV-3
        authorId: david._id,
        content: 'Fix submitted in PR #42. Added automated test coverage for 401 response interceptor.',
      },
    ]);

    console.log('⚡ Creating sample activity timeline...');
    await Activity.create([
      {
        organizationId: org._id,
        projectId: p1._id,
        issueId: issues[0]._id,
        actorId: bhaskar._id,
        action: 'UPDATED_STATUS',
        details: { issueKey: 'DEV-1', from: 'IN_REVIEW', to: 'DONE' },
      },
      {
        organizationId: org._id,
        projectId: p1._id,
        issueId: issues[1]._id,
        actorId: sarah._id,
        action: 'UPDATED_PRIORITY',
        details: { issueKey: 'DEV-2', from: 'MEDIUM', to: 'HIGH' },
      },
      {
        organizationId: org._id,
        projectId: p2._id,
        issueId: issues[5]._id,
        actorId: alex._id,
        action: 'CREATED_ISSUE',
        details: { issueKey: 'MOB-1', title: 'Design Dark Mode UI for Kanban board view' },
      },
      {
        organizationId: org._id,
        projectId: p3._id,
        issueId: issues[8]._id,
        actorId: david._id,
        action: 'ADDED_COMMENT',
        details: { issueKey: 'PAY-1' },
      },
      {
        organizationId: org._id,
        actorId: bhaskar._id,
        action: 'MEMBER_JOINED',
        details: { memberEmail: 'elena.rostova@devflow.io', role: 'VIEWER' },
      },
    ]);

    console.log('🎉 Fake data seeded successfully into MongoDB Atlas!');
    console.log('\n===========================================');
    console.log('🔑 TEST LOGIN CREDENTIALS:');
    console.log('  Owner:  bhaskar@devflow.io       / password123');
    console.log('  Admin:  sarah.connor@devflow.io  / password123');
    console.log('  Member: david.miller@devflow.io  / password123');
    console.log('  Viewer: elena.rostova@devflow.io / password123');
    console.log('===========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
