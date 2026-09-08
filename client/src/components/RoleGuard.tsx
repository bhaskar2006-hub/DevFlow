import React, { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { OrgRole } from '../context/AuthContext';

interface RoleGuardProps {
  allowedRoles: OrgRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback = null,
}) => {
  const { hasRole } = useAuth();

  if (!hasRole(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
