import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Project, projectAPI } from '../services/api';
import { ProjectCard } from '../components/ProjectCard';
import { Plus, Search, FolderKanban } from 'lucide-react';

export const Projects: React.FC = () => {
  const { currentOrg, can } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadProjects = async () => {
    if (!currentOrg) return;
    try {
      setLoading(true);
      const res = await projectAPI.getByOrg(currentOrg.id);
      setProjects(res.data.data);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [currentOrg]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !name || !key) return;

    try {
      setSubmitting(true);
      setError('');
      await projectAPI.create({
        name,
        key: key.toUpperCase().trim(),
        description,
        organizationId: currentOrg.id,
      });

      setShowCreateModal(false);
      setName('');
      setKey('');
      setDescription('');
      await loadProjects();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete project "${projectName}"? This will also remove all its issues and comments.`)) {
      return;
    }

    try {
      await projectAPI.delete(projectId);
      await loadProjects();
    } catch (err) {
      console.error('Failed to delete project', err);
      alert('Failed to delete project. Make sure you have OWNER / ADMIN permissions.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Projects</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your organization's engineering initiatives and issue trackers
          </p>
        </div>
        {can('CREATE_PROJECT') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs shadow-indigo-200 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter projects by name or key..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => (
            <ProjectCard key={p.id} project={p} onDelete={handleDeleteProject} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No projects found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {searchTerm ? 'Try adjusting your search query' : 'Create your first project to start tracking issues.'}
          </p>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create Project</h3>
            <p className="text-xs text-slate-500 mb-4">Set up a new workspace for your issue tickets</p>

            {error && (
              <div className="mb-4 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!key) {
                      setKey(
                        e.target.value
                          .replace(/[^a-zA-Z0-9]/g, '')
                          .slice(0, 4)
                          .toUpperCase()
                      );
                    }
                  }}
                  placeholder="e.g. Core Platform"
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
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this project focused on?"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs shadow-indigo-200 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
