import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Project, Issue, Member, projectAPI, issueAPI, orgAPI } from '../services/api';
import { KanbanColumn } from '../components/KanbanColumn';
import { useAuth } from '../hooks/useAuth';
import {
  Plus,
  Filter,
  Search,
  LayoutGrid,
  List as ListIcon,
  ChevronRight,
  User as UserIcon,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrg, can, hasRole } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('ALL');

  // Create Issue Modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('TASK');
  const [newStatus, setNewStatus] = useState('TODO');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [newLabels, setNewLabels] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [projRes, issueRes] = await Promise.all([
        projectAPI.getById(id),
        issueAPI.getAll({ projectId: id, limit: 100 }),
      ]);
      setProject(projRes.data.data);
      setIssues(issueRes.data.data);

      if (currentOrg) {
        const memRes = await orgAPI.getMembers(currentOrg.id);
        setMembers(memRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load project details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, currentOrg]);

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newTitle.trim()) return;

    try {
      setSubmitting(true);
      const labelsArray = newLabels
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      await issueAPI.create({
        title: newTitle.trim(),
        description: newDesc.trim(),
        projectId: id,
        type: newType as any,
        status: newStatus as any,
        priority: newPriority as any,
        assigneeId: newAssigneeId || null,
        labels: labelsArray,
      });

      setShowIssueModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewLabels('');
      await loadData();
    } catch (err) {
      console.error('Failed to create issue', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (issueId: string, status: string) => {
    try {
      await issueAPI.update(issueId, { status: status as any });
      await loadData();
    } catch (err) {
      console.error('Failed to update issue status', err);
    }
  };

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority =
      selectedPriority === 'ALL' || issue.priority === selectedPriority;
    const matchesAssignee =
      selectedAssignee === 'ALL' ||
      (selectedAssignee === 'UNASSIGNED' && !issue.assigneeId) ||
      issue.assigneeId?.id === selectedAssignee;

    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const handleDeleteProject = async () => {
    if (!id || !project) return;
    if (!confirm(`Are you sure you want to delete project "${project.name}" (${project.key})? This will also remove all associated issues and comments.`)) {
      return;
    }

    try {
      await projectAPI.delete(id);
      navigate('/projects');
    } catch (err) {
      console.error('Failed to delete project', err);
      alert('Failed to delete project. Make sure you have OWNER / ADMIN permissions.');
    }
  };

  const columns = [
    { status: 'BACKLOG', title: 'Backlog' },
    { status: 'TODO', title: 'To Do' },
    { status: 'IN_PROGRESS', title: 'In Progress' },
    { status: 'IN_REVIEW', title: 'In Review' },
    { status: 'DONE', title: 'Done' },
  ];

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6"></div>
        <div className="flex space-x-4 overflow-hidden">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="w-72 h-96 bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-slate-500">
        Project not found.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-full space-y-6">
      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-1">
            <Link to="/projects" className="hover:text-slate-600 transition-colors">
              Projects
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-bold">{project.name}</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-black text-xs border border-indigo-100">
              {project.key}
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{project.name}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                viewMode === 'kanban' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                viewMode === 'list' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          {can('CREATE_ISSUE') && (
            <button
              onClick={() => {
                setNewStatus('TODO');
                setShowIssueModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs shadow-indigo-200 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Issue</span>
            </button>
          )}

          {(can('DELETE_PROJECT') || hasRole(['OWNER', 'ADMIN'])) && (
            <button
              onClick={handleDeleteProject}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-100"
              title="Delete this project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center space-x-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search issues by key or title..."
            className="w-full text-xs bg-transparent focus:outline-none text-slate-700"
          />
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Assignees</option>
            <option value="UNASSIGNED">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId.id} value={m.userId.id}>
                {m.userId.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="flex space-x-4 overflow-x-auto pb-4 pt-1">
          {columns.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              title={col.title}
              issues={filteredIssues.filter((i) => i.status === col.status)}
              onAddIssue={(status) => {
                setNewStatus(status);
                setShowIssueModal(true);
              }}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase">
              <tr>
                <th className="p-3.5 pl-6">Key</th>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Assignee</th>
                <th className="p-3.5 pr-6">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 pl-6 font-bold text-slate-900">
                    <Link to={`/issues/${issue.id}`} className="text-indigo-600 hover:underline">
                      {issue.key}
                    </Link>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800">{issue.title}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {issue.status}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-medium text-slate-600">{issue.priority}</span>
                  </td>
                  <td className="p-3.5">
                    {issue.assigneeId ? (
                      <span className="text-slate-700">{issue.assigneeId.name}</span>
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="p-3.5 pr-6 text-slate-400">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filteredIssues.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No issues found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-100 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create New Issue</h3>
            <p className="text-xs text-slate-500 mb-4">
              Project: <span className="font-semibold text-indigo-600">{project.name}</span>
            </p>

            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Issue Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement OAuth login flow"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detailed description, reproduction steps, or acceptance criteria..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Issue Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="TASK">Task</option>
                    <option value="BUG">Bug</option>
                    <option value="FEATURE">Feature</option>
                    <option value="IMPROVEMENT">Improvement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BACKLOG">Backlog</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Assignee
                  </label>
                  <select
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.userId.id} value={m.userId.id}>
                        {m.userId.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Labels (comma separated)
                </label>
                <input
                  type="text"
                  value={newLabels}
                  onChange={(e) => setNewLabels(e.target.value)}
                  placeholder="frontend, auth, bugfix"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs shadow-indigo-200 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
