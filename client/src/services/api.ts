import axios from 'axios';

const defaultBaseUrl =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://devflow-backend.netlify.app/api'
    : '/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: any;
  avatarUrl?: string;
  slackWebhookUrl?: string;
  slackNotifications?: boolean;
  membershipRole?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  createdAt: string;
}

export interface Member {
  id: string;
  organizationId: string;
  userId: User;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  organizationId: any;
  leadId?: User;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  issueCounter: number;
  createdAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description?: string;
  key: string;
  issueNumber: number;
  projectId: any;
  organizationId: any;
  reporterId: User;
  assigneeId?: User | null;
  type: 'BUG' | 'FEATURE' | 'TASK' | 'IMPROVEMENT';
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string | null;
  labels: string[];
  order: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  issueId: string;
  authorId: User;
  content: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  organizationId: string;
  projectId?: Project;
  issueId?: Issue;
  actorId: User;
  action: string;
  details?: Record<string, any>;
  createdAt: string;
}

export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { name: string; email: string; password: string }) => api.post('/auth/register', data),
  googleLogin: (data: { idToken?: string; email?: string; name?: string; avatar?: string }) => api.post('/auth/google', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { name?: string; avatar?: string }) => api.patch('/auth/me', data),
};

export const orgAPI = {
  getMyOrganizations: () => api.get<{ success: boolean; data: Organization[] }>('/organizations/my'),
  getByIdOrSlug: (idOrSlug: string) => api.get<{ success: boolean; data: Organization }>(`/organizations/${idOrSlug}`),
  create: (data: { name: string; slug: string; description?: string }) => api.post('/organizations', data),
  update: (id: string, data: Partial<Organization>) => api.patch<{ success: boolean; data: Organization }>(`/organizations/${id}`, data),
  testSlack: (orgId: string, webhookUrl?: string) => api.post<{ success: boolean; message: string }>(`/organizations/${orgId}/test-slack`, { webhookUrl }),
  getMembers: (orgId: string) => api.get<{ success: boolean; data: Member[] }>(`/organizations/${orgId}/members`),
  addMember: (orgId: string, data: { email: string; role?: string }) => api.post(`/organizations/${orgId}/members`, data),
  updateMemberRole: (orgId: string, memberId: string, role: string) => api.patch(`/organizations/${orgId}/members/${memberId}`, { role }),
  removeMember: (orgId: string, memberId: string) => api.delete(`/organizations/${orgId}/members/${memberId}`),
};

export const projectAPI = {
  getByOrg: (orgId: string) => api.get<{ success: boolean; data: Project[] }>(`/projects/organization/${orgId}`),
  getById: (id: string) => api.get<{ success: boolean; data: Project }>(`/projects/${id}`),
  create: (data: { name: string; key: string; description?: string; organizationId: string }) => api.post('/projects', data),
  update: (id: string, data: Partial<Project>) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const issueAPI = {
  getAll: (params?: Record<string, any>) => api.get<{ success: boolean; data: Issue[]; pagination: any }>('/issues', { params }),
  getById: (id: string) => api.get<{ success: boolean; data: Issue }>(`/issues/${id}`),
  create: (data: Omit<Partial<Issue>, 'assigneeId'> & { title: string; projectId: string; assigneeId?: string | null }) =>
    api.post<{ success: boolean; data: Issue }>('/issues', data),
  update: (id: string, data: Omit<Partial<Issue>, 'assigneeId'> & { assigneeId?: string | null }) =>
    api.patch<{ success: boolean; data: Issue }>(`/issues/${id}`, data),
  delete: (id: string) => api.delete(`/issues/${id}`),
};

export const commentAPI = {
  getByIssue: (issueId: string) => api.get<{ success: boolean; data: Comment[] }>(`/comments/issue/${issueId}`),
  create: (data: { issueId: string; content: string }) => api.post('/comments', data),
  update: (id: string, data: { content: string }) => api.patch(`/comments/${id}`, data),
  delete: (id: string) => api.delete(`/comments/${id}`),
};

export const activityAPI = {
  getAll: (params?: { organizationId?: string; projectId?: string; issueId?: string; limit?: number }) =>
    api.get<{ success: boolean; data: Activity[]; pagination: any }>('/activities', { params }),
};

export default api;
