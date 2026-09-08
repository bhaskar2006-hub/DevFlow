import React from 'react';
import { Issue } from '../services/api';
import { IssueCard } from './IssueCard';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  status: string;
  title: string;
  issues: Issue[];
  onAddIssue?: (status: string) => void;
  onStatusChange?: (issueId: string, newStatus: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  issues,
  onAddIssue,
  onStatusChange,
}) => {
  const columnStyles: Record<string, { indicator: string; badge: string }> = {
    BACKLOG: {
      indicator: 'bg-slate-400',
      badge: 'bg-slate-100 text-slate-700',
    },
    TODO: {
      indicator: 'bg-blue-500',
      badge: 'bg-blue-50 text-blue-700',
    },
    IN_PROGRESS: {
      indicator: 'bg-amber-500',
      badge: 'bg-amber-50 text-amber-700',
    },
    IN_REVIEW: {
      indicator: 'bg-purple-500',
      badge: 'bg-purple-50 text-purple-700',
    },
    DONE: {
      indicator: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700',
    },
    CANCELLED: {
      indicator: 'bg-rose-400',
      badge: 'bg-rose-50 text-rose-700',
    },
  };

  const currentStyle = columnStyles[status] || {
    indicator: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="flex-1 min-w-[280px] max-w-[340px] bg-slate-100/70 border border-slate-200/80 rounded-2xl flex flex-col h-[calc(100vh-14rem)]">
      {/* Column Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-slate-200/50">
        <div className="flex items-center space-x-2">
          <span className={`w-2.5 h-2.5 rounded-full ${currentStyle.indicator}`}></span>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">{title}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${currentStyle.badge}`}>
            {issues.length}
          </span>
        </div>

        {onAddIssue && (
          <button
            onClick={() => onAddIssue(status)}
            className="p-1 hover:bg-white rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
            title="Add issue to this column"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Issues list container */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} onStatusChange={onStatusChange} />
        ))}

        {issues.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400">
            No issues
          </div>
        )}
      </div>
    </div>
  );
};
