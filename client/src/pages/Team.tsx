import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Member, orgAPI } from '../services/api';
import { UserPlus, Shield, User, Trash2, Mail, Users } from 'lucide-react';
import { RoleBadge } from '../components/RoleBadge';

export const Team: React.FC = () => {
  const { currentOrg, user, can } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');

  const loadMembers = async () => {
    if (!currentOrg) return;
    try {
      setLoading(true);
      const res = await orgAPI.getMembers(currentOrg.id);
      setMembers(res.data.data);
    } catch (err) {
      console.error('Failed to load team members', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [currentOrg]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !email.trim()) return;

    try {
      setInviting(true);
      setError('');
      await orgAPI.addMember(currentOrg.id, { email: email.trim(), role });
      setShowInviteModal(false);
      setEmail('');
      await loadMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!currentOrg) return;
    try {
      await orgAPI.updateMemberRole(currentOrg.id, memberId, newRole);
      await loadMembers();
    } catch (err) {
      console.error('Failed to update member role', err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentOrg || !confirm('Are you sure you want to remove this member?')) return;
    try {
      await orgAPI.removeMember(currentOrg.id, memberId);
      await loadMembers();
    } catch (err) {
      console.error('Failed to remove member', err);
    }
  };

  const roleColors = {
    OWNER: 'bg-purple-50 text-purple-700 border-purple-200',
    ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    MEMBER: 'bg-blue-50 text-blue-700 border-blue-200',
    VIEWER: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Team Members</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization members, roles, and collaborative access
          </p>
        </div>

        {can('MANAGE_MEMBERS') && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs shadow-indigo-200 transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Members table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-800">
              Members of {currentOrg?.name} ({members.length})
            </h3>
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase">
            <tr>
              <th className="p-4 pl-6">User</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="p-4 pl-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-xs">
                      {member.userId?.name ? member.userId.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{member.userId?.name}</div>
                      {member.userId?.id === user?.id && (
                        <span className="text-[10px] text-indigo-600 font-semibold">(You)</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-slate-600">{member.userId?.email}</td>
                <td className="p-4">
                  {member.role === 'OWNER' || !can('MANAGE_MEMBERS') ? (
                    <RoleBadge role={member.role} />
                  ) : (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MEMBER">MEMBER</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  )}
                </td>
                <td className="p-4 pr-6 text-right">
                  {can('MANAGE_MEMBERS') && member.role !== 'OWNER' && member.userId?.id !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite/Add Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Team Member</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add registered user to <span className="font-semibold text-indigo-600">{currentOrg?.name}</span>
            </p>

            {error && (
              <div className="mb-4 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  User Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Organization Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="ADMIN">ADMIN (Manage projects and team)</option>
                  <option value="MEMBER">MEMBER (Create issues & projects)</option>
                  <option value="VIEWER">VIEWER (Read-only access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs shadow-indigo-200 disabled:opacity-50"
                >
                  {inviting ? 'Adding...' : 'Add to Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
