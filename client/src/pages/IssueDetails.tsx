import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Issue, Comment, Member, Activity, issueAPI, commentAPI, orgAPI, activityAPI } from '../services/api';
import { CommentList } from '../components/CommentList';
import { useAuth } from '../hooks/useAuth';
import {
  ChevronRight,
  Trash2,
  Save,
  Clock,
  User as UserIcon,
  Tag,
  AlertCircle,
  CheckCircle2,
  Calendar,
  History,
} from 'lucide-react';

export const IssueDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrg, can } = useAuth();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [type, setType] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [labels, setLabels] = useState('');

  const loadIssue = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [issueRes, commentRes, actRes] = await Promise.all([
        issueAPI.getById(id),
        commentAPI.getByIssue(id),
        activityAPI.getAll({ issueId: id, limit: 10 }),
      ]);

      const issueData = issueRes.data.data;
      setIssue(issueData);
      setTitle(issueData.title);
      setDescription(issueData.description || '');
      setStatus(issueData.status);
      setPriority(issueData.priority);
      setType(issueData.type);
      setAssigneeId(issueData.assigneeId?.id || '');
      setLabels((issueData.labels || []).join(', '));

      setComments(commentRes.data.data);
      setActivities(actRes.data.data);

      if (currentOrg) {
        const memRes = await orgAPI.getMembers(currentOrg.id);
        setMembers(memRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load issue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssue();
  }, [id, currentOrg]);

  const handleSave = async () => {
    if (!id || !title.trim()) return;
    try {
      setSaving(true);
      const labelsArray = labels
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      const res = await issueAPI.update(id, {
        title: title.trim(),
        description: description.trim(),
        status: status as any,
        priority: priority as any,
        type: type as any,
        assigneeId: (assigneeId || null) as any,
        labels: labelsArray,
      });

      setIssue(res.data.data);
      await loadIssue();
    } catch (err) {
      console.error('Failed to update issue', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this issue?')) return;
    try {
      await issueAPI.delete(id);
      navigate(issue?.projectId ? `/projects/${issue.projectId.id || issue.projectId}` : '/projects');
    } catch (err) {
      console.error('Failed to delete issue', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-4"></div>
        <div className="h-10 w-3/4 bg-slate-200 rounded animate-pulse mb-8"></div>
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 h-96 bg-slate-100 rounded-2xl animate-pulse"></div>
          <div className="h-96 bg-slate-100 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return <div className="p-8 text-center text-slate-500">Issue not found.</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumbs & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
          <Link to="/projects" className="hover:text-slate-600 transition-colors">
            Projects
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            to={`/projects/${issue.projectId?.id || issue.projectId}`}
            className="hover:text-slate-600 transition-colors"
          >
            {issue.projectId?.name || 'Project'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700 font-bold">{issue.key}</span>
        </div>

        <div className="flex items-center space-x-3">
          {can('DELETE_ISSUE') && (
            <button
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Delete Issue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {can('EDIT_ISSUE') && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs shadow-indigo-200 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-black text-xs border border-indigo-100">
                {issue.key}
              </span>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Issue title"
              className="w-full text-xl font-bold text-slate-900 border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none transition-colors py-1"
            />

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a more detailed description..."
                className="w-full p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed resize-y"
              />
            </div>
          </div>

          {/* Comments and Discussion */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
            <CommentList
              issueId={issue.id}
              comments={comments}
              onCommentUpdated={loadIssue}
            />
          </div>
        </div>

        {/* Sidebar Properties (Right 1 column) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2.5">
              Issue Properties
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="TASK">Task</option>
                <option value="BUG">Bug</option>
                <option value="FEATURE">Feature</option>
                <option value="IMPROVEMENT">Improvement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId.id} value={m.userId.id}>
                    {m.userId.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Labels</label>
              <input
                type="text"
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                placeholder="backend, api, high-priority"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
              <div className="flex items-center justify-between">
                <span>Reporter:</span>
                <span className="font-semibold text-slate-700">{issue.reporterId?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Created:</span>
                <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Activity Log for this Issue */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2.5">
              <History className="w-3.5 h-3.5" />
              <span>Issue History</span>
            </div>

            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act.id} className="text-[11px] text-slate-600 border-l-2 border-indigo-200 pl-2.5 py-0.5">
                  <p>
                    <span className="font-bold text-slate-800">{act.actorId?.name || 'Someone'}</span>{' '}
                    {act.action.toLowerCase().replace(/_/g, ' ')}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-xs text-slate-400">No activity logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
