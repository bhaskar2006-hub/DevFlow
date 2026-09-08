import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ChevronDown, LogOut, Plus, Building2, UserCircle } from 'lucide-react';
import { orgAPI } from '../services/api';
import { RoleBadge } from './RoleBadge';

export const Navbar: React.FC = () => {
  const { user, currentOrg, organizations, userRole, setCurrentOrg, createOrganization, logout, refreshUserData } = useAuth();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNewOrgModal, setShowNewOrgModal] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName || !orgSlug) return;
    try {
      setIsSubmitting(true);
      await createOrganization({ name: orgName, slug: orgSlug });
      setShowNewOrgModal(false);
      setOrgName('');
      setOrgSlug('');
    } catch (err) {
      console.error('Failed to create org', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between">
        {/* Organization Switcher */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-800"
            >
              <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {currentOrg ? currentOrg.name.charAt(0).toUpperCase() : 'D'}
              </div>
              <span className="font-semibold text-sm truncate max-w-[150px]">
                {currentOrg ? currentOrg.name : 'Select Organization'}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {showOrgDropdown && (
              <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Organizations
                </div>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setCurrentOrg(org);
                      setShowOrgDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 text-sm ${
                      currentOrg?.id === org.id ? 'font-semibold text-indigo-600 bg-indigo-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span className="truncate">{org.name}</span>
                    {currentOrg?.id === org.id && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    )}
                  </button>
                ))}
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={() => {
                    setShowOrgDropdown(false);
                    setShowNewOrgModal(true);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center space-x-2 text-indigo-600 hover:bg-indigo-50 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Organization</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Profile & Role */}
        <div className="flex items-center space-x-3">
          {userRole && <RoleBadge role={userRole} />}

          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-3 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-semibold text-sm text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center space-x-2 text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Create Org Modal */}
      {showNewOrgModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Organization</h3>
                <p className="text-xs text-slate-500">Collaborate with your team members</p>
              </div>
            </div>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    setOrgSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, '-')
                        .replace(/-+/g, '-')
                    );
                  }}
                  placeholder="e.g. Acme Labs"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Slug (URL identifier)
                </label>
                <input
                  type="text"
                  required
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  placeholder="e.g. acme-labs"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewOrgModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm shadow-indigo-200 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
