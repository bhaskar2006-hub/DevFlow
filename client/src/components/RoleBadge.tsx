import React from 'react';
import { OrgRole } from '../context/AuthContext';
import { Shield, ShieldAlert, ShieldCheck, Eye } from 'lucide-react';

interface RoleBadgeProps {
  role?: OrgRole | string | null;
  showIcon?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role = 'MEMBER', showIcon = true }) => {
  const roleConfig: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    OWNER: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: <ShieldAlert className="w-3 h-3 text-purple-600" />,
    },
    ADMIN: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      icon: <ShieldCheck className="w-3 h-3 text-indigo-600" />,
    },
    MEMBER: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: <Shield className="w-3 h-3 text-blue-600" />,
    },
    VIEWER: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      icon: <Eye className="w-3 h-3 text-slate-500" />,
    },
  };

  const current = roleConfig[role || 'MEMBER'] || roleConfig.MEMBER;

  return (
    <span
      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${current.bg} ${current.text} ${current.border}`}
    >
      {showIcon && current.icon}
      <span>{role || 'MEMBER'}</span>
    </span>
  );
};
