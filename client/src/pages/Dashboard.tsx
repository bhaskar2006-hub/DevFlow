import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Project, Issue, Activity, Member, projectAPI, issueAPI, activityAPI, orgAPI } from '../services/api';
import { ProjectCard } from '../components/ProjectCard';
import { IssueCard } from '../components/IssueCard';
import { RoleBadge } from '../components/RoleBadge';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Users,
  Activity as ActivityIcon,
  Plus,
  ArrowRight,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { currentOrg, user, userRole, can, createOrganization, refreshUserData } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Org creation state for onboarding
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [orgError, setOrgError] = useState('');

  // Quick Project creation modal
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projName, setProjName] = useState('');
  const [projKey, setProjKey] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [creatingProj, setCreatingProj] = useState(false);
  const [projError, setProjError] = useState('');

  const loadDashboardData = async () => {
    if (!currentOrg) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [projRes, issueRes, actRes, memRes] = await Promise.all([
        projectAPI.getByOrg(currentOrg.id),
        issueAPI.getAll({ organizationId: currentOrg.id, limit: 10 }),
        activityAPI.getAll({ organizationId: currentOrg.id, limit: 8 }),
        orgAPI.getMembers(currentOrg.id),
      ]);

      setProjects(projRes.data.data);
      setIssues(issueRes.data.data);
      setActivities(actRes.data.data);
      setMembers(memRes.data.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentOrg]);

  const handleQuickCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName || !newOrgSlug) return;
    try {
      setCreatingOrg(true);
      setOrgError('');
      await createOrganization({
        name: newOrgName.trim(),
        slug: newOrgSlug.trim().toLowerCase(),
      });
      setNewOrgName('');
      setNewOrgSlug('');
    } catch (err: any) {
      setOrgError(err.response?.data?.message || 'Failed to create organization. Please try again.');
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !projName || !projKey) return;
    try {
      setCreatingProj(true);
      setProjError('');
      await projectAPI.create({
        name: projName.trim(),
        key: projKey.trim().toUpperCase(),
        description: projDesc.trim(),
        organizationId: currentOrg.id,
      });

      setShowProjectModal(false);
      setProjName('');
      setProjKey('');
      setProjDesc('');
      await loadDashboardData();
    } catch (err: any) {
      setProjError(err.response?.data?.message || 'Failed to create project. Please try again.');
    } finally {
      setCreatingProj(false);
    }
  };

  // If no organization is created/selected yet, render an onboarding card
  if (!currentOrg) {
    return (
      <div className="p-6 md:p-12 max-w-2xl mx-auto my-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm shadow-indigo-100">
            <Building2 className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Create Your First Organization
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              Organizations allow you to manage engineering projects, sprint boards, role-based access, and collaborate with your team.
            </p>
          </div>

          {orgError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
              {orgError}
            </div>
          )}

          <form onSubmit={handleQuickCreateOrg} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                required
                value={newOrgName}
                onChange={(e) => {
                  setNewOrgName(e.target.value);
                  setNewOrgSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, '-')
                      .replace(/-+/g, '-')
                  );
                }}
                placeholder="e.g. Acme Engineering"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                URL Identifier / Slug
              </label>
              <input
                type="text"
                required
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value)}
                placeholder="e.g. acme-engineering"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={creatingOrg}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm shadow-indigo-200 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{creatingOrg ? 'Creating Workspace...' : 'Create Workspace & Continue'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const openIssuesCount = issues.filter((i) => ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW'].includes(i.status)).length;
  const completedCount = issues.filter((i) => i.status === 'DONE').length;
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete project "${projectName}"? This will also remove all its issues and comments.`)) {
      return;
    }

    try {
      await projectAPI.delete(projectId);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to delete project', err);
      alert('Failed to delete project. Make sure you have OWNER / ADMIN permissions.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Personalized Welcome Header with Role Display */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Welcome {firstName} 👋
            </h1>
            {userRole && <RoleBadge role={userRole} />}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Active Workspace: <span className="font-bold text-slate-800">{currentOrg.name}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {can('CREATE_PROJECT') && (
            <button
              onClick={() => setShowProjectModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs shadow-indigo-200 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric summary cards: Projects, Open Issues, Completed, Team Members */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Projects</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{projects.length}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Open Issues</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{openIssuesCount}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{completedCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Team Members</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{members.length}</h3>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Projects & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Projects & Issues */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Active Projects</h2>
              <Link
                to="/projects"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.slice(0, 4).map((p) => (
                  <ProjectCard key={p.id} project={p} onDelete={handleDeleteProject} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
                <FolderKanban className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Projects in this Workspace</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Create a project to start organizing your sprints, boards, and issues.
                </p>
                {can('CREATE_PROJECT') && (
                  <button
                    onClick={() => setShowProjectModal(true)}
                    className="mt-2 inline-flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-indigo-200 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Your First Project</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Recent Issues</h2>
            </div>
            {issues.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {issues.slice(0, 4).map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center text-xs text-slate-500">
                No issues tracked yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs h-fit">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
            <ActivityIcon className="w-4 h-4 text-indigo-600" />
            <span>Activity Stream</span>
          </div>

          <div className="space-y-4">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start space-x-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                  {act.actorId?.name ? act.actorId.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800">
                    <span className="font-semibold">{act.actorId?.name || 'Someone'}</span>{' '}
                    <span className="text-slate-500">
                      {act.action.toLowerCase().replace(/_/g, ' ')}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(act.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {activities.length === 0 && (
              <p className="text-center py-6 text-xs text-slate-400">No recent activity.</p>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create Project</h3>
            <p className="text-xs text-slate-500 mb-4">
              Workspace: <span className="font-semibold text-indigo-600">{currentOrg.name}</span>
            </p>

            {projError && (
              <div className="mb-4 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
                {projError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => {
                    setProjName(e.target.value);
                    if (!projKey) {
                      setProjKey(
                        e.target.value
                          .replace(/[^a-zA-Z0-9]/g, '')
                          .slice(0, 4)
                          .toUpperCase()
                      );
                    }
                  }}
                  placeholder="e.g. Core Engine"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Project Key (Prefix for issues)
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={projKey}
                  onChange={(e) => setProjKey(e.target.value.toUpperCase())}
                  placeholder="e.g. CORE"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="What is this project focused on?"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProj}
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs shadow-indigo-200 disabled:opacity-50"
                >
                  {creatingProj ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
