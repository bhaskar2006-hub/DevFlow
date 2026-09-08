import React from 'react';
import { Link } from 'react-router-dom';
import { Issue } from '../services/api';
import { AlertCircle, CheckCircle2, Bookmark, Flame, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

interface IssueCardProps {
  issue: Issue;
  onStatusChange?: (issueId: string, newStatus: string) => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  const priorityIcons = {
    URGENT: <Flame className="w-3.5 h-3.5 text-red-500" />,
    HIGH: <ArrowUp className="w-3.5 h-3.5 text-orange-500" />,
    MEDIUM: <ArrowRight className="w-3.5 h-3.5 text-amber-500" />,
    LOW: <ArrowDown className="w-3.5 h-3.5 text-slate-400" />,
  };

  const typeIcons = {
    BUG: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
    FEATURE: <SparkleIcon />,
    TASK: <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />,
    IMPROVEMENT: <Bookmark className="w-3.5 h-3.5 text-purple-500" />,
  };

  function SparkleIcon() {
    return (
      <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
      </svg>
    );
  }

  return (
    <Link
      to={`/issues/${issue.id}`}
      className="block group bg-white border border-slate-200/80 hover:border-indigo-300 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition-all duration-150 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5">
          {typeIcons[issue.type] || typeIcons.TASK}
          <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
            {issue.key}
          </span>
        </div>
        <div className="flex items-center space-x-1" title={`Priority: ${issue.priority}`}>
          {priorityIcons[issue.priority] || priorityIcons.MEDIUM}
        </div>
      </div>

      <h5 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 line-clamp-2 transition-colors mb-2.5">
        {issue.title}
      </h5>

      {issue.labels && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {issue.labels.map((label, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="text-[11px] text-slate-400">
          {new Date(issue.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </div>

        {issue.assigneeId ? (
          <div
            className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-[10px] flex items-center justify-center"
            title={`Assigned to ${issue.assigneeId.name}`}
          >
            {issue.assigneeId.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div
            className="w-6 h-6 rounded-full border border-dashed border-slate-300 text-slate-400 font-medium text-[10px] flex items-center justify-center"
            title="Unassigned"
          >
            -
          </div>
        )}
      </div>
    </Link>
  );
};
