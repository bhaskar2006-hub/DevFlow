import React from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { FolderKanban, Clock, User as UserIcon, Trash2 } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onDelete?: (projectId: string, projectName: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
  const { can, hasRole } = useAuth();

  const statusColors = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ARCHIVED: 'bg-slate-100 text-slate-600 border-slate-200',
    COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(project.id, project.name);
    }
  };

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block group bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 relative"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center font-bold text-sm transition-colors">
            {project.key}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {project.name}
            </h4>
            <span
              className={`inline-block px-2 py-0.5 mt-0.5 rounded-md text-[11px] font-semibold border ${
                statusColors[project.status] || 'bg-slate-100 text-slate-600'
              }`}
            >
              {project.status}
            </span>
          </div>
        </div>

        {onDelete && (can('DELETE_PROJECT') || hasRole(['OWNER', 'ADMIN'])) && (
          <button
            onClick={handleDelete}
            className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Project"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8">
        {project.description || 'No description provided for this project.'}
      </p>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-1.5">
          <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
          <span>{project.issueCounter || 0} issues</span>
        </div>
        {project.leadId && (
          <div className="flex items-center space-x-1.5" title={`Lead: ${project.leadId.name}`}>
            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[100px]">{project.leadId.name}</span>
          </div>
        )}
      </div>
    </Link>
  );
};
