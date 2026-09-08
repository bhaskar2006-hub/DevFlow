import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Organization, authAPI, orgAPI } from '../services/api';

export type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

interface AuthContextType {
  user: User | null;
  token: string | null;
  organizations: Organization[];
  currentOrg: Organization | null;
  userRole: OrgRole | null;
  isLoading: boolean;
  hasRole: (allowedRoles: OrgRole[]) => boolean;
  can: (action: 'CREATE_PROJECT' | 'DELETE_PROJECT' | 'MANAGE_MEMBERS' | 'CREATE_ISSUE' | 'EDIT_ISSUE' | 'DELETE_ISSUE') => boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => void;
  setCurrentOrg: (org: Organization) => void;
  createOrganization: (data: { name: string; slug: string; description?: string }) => Promise<Organization>;
  refreshUserData: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(() => {
    const saved = localStorage.getItem('currentOrg');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchOrganizations = async (): Promise<Organization[]> => {
    try {
      const res = await orgAPI.getMyOrganizations();
      const orgs = res.data.data;
      setOrganizations(orgs);

      if (orgs.length > 0) {
        const savedOrg = localStorage.getItem('currentOrg');
        const parsedSavedOrg = savedOrg ? JSON.parse(savedOrg) : null;
        const matchingOrg = orgs.find((o) => o.id === parsedSavedOrg?.id);

        if (matchingOrg) {
          setCurrentOrgState(matchingOrg);
          localStorage.setItem('currentOrg', JSON.stringify(matchingOrg));
        } else {
          setCurrentOrgState(orgs[0]);
          localStorage.setItem('currentOrg', JSON.stringify(orgs[0]));
        }
      } else {
        setCurrentOrgState(null);
        localStorage.removeItem('currentOrg');
      }
      return orgs;
    } catch (err) {
      console.error('Failed to load organizations', err);
      return [];
    }
  };

  const refreshUserData = async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return;
    try {
      const meRes = await authAPI.getMe();
      setUser(meRes.data.data);
      localStorage.setItem('user', JSON.stringify(meRes.data.data));
      await fetchOrganizations();
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        await refreshUserData();
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const userRole: OrgRole | null = currentOrg?.membershipRole || (currentOrg?.ownerId === user?.id ? 'OWNER' : 'MEMBER');

  const hasRole = (allowedRoles: OrgRole[]): boolean => {
    if (!userRole) return false;
    return allowedRoles.includes(userRole);
  };

  const can = (action: 'CREATE_PROJECT' | 'DELETE_PROJECT' | 'MANAGE_MEMBERS' | 'CREATE_ISSUE' | 'EDIT_ISSUE' | 'DELETE_ISSUE'): boolean => {
    if (!userRole) return false;

    switch (action) {
      case 'DELETE_PROJECT':
        return userRole === 'OWNER';
      case 'MANAGE_MEMBERS':
        return userRole === 'OWNER' || userRole === 'ADMIN';
      case 'CREATE_PROJECT':
        return userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'MEMBER';
      case 'CREATE_ISSUE':
      case 'EDIT_ISSUE':
        return userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'MEMBER';
      case 'DELETE_ISSUE':
        return userRole === 'OWNER' || userRole === 'ADMIN';
      default:
        return false;
    }
  };

  const createOrganization = async (data: { name: string; slug: string; description?: string }): Promise<Organization> => {
    const res = await orgAPI.create(data);
    const newOrg = res.data.data;
    const orgWithRole = { ...newOrg, membershipRole: 'OWNER' as OrgRole };
    
    setOrganizations((prev) => [orgWithRole, ...prev]);
    setCurrentOrgState(orgWithRole);
    localStorage.setItem('currentOrg', JSON.stringify(orgWithRole));
    await refreshUserData();
    return orgWithRole;
  };

  const login = async (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    // Immediately fetch organizations
    try {
      const res = await orgAPI.getMyOrganizations();
      const orgs = res.data.data;
      setOrganizations(orgs);
      if (orgs.length > 0) {
        setCurrentOrgState(orgs[0]);
        localStorage.setItem('currentOrg', JSON.stringify(orgs[0]));
      }
    } catch (e) {
      console.error('Failed to load orgs on login', e);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentOrg');
    setToken(null);
    setUser(null);
    setOrganizations([]);
    setCurrentOrgState(null);
  };

  const setCurrentOrg = (org: Organization) => {
    setCurrentOrgState(org);
    localStorage.setItem('currentOrg', JSON.stringify(org));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        organizations,
        currentOrg,
        userRole,
        isLoading,
        hasRole,
        can,
        login,
        logout,
        setCurrentOrg,
        createOrganization,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
