import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { orgAPI } from '../services/api';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Save, 
  ShieldAlert,
  Webhook,
  Sparkles,
  Check
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { currentOrg, userRole, refreshUserData } = useAuth();
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [slackNotifications, setSlackNotifications] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingSlack, setTestingSlack] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState('');

  const canManage = userRole === 'OWNER' || userRole === 'ADMIN';

  useEffect(() => {
    if (currentOrg) {
      setSlackWebhookUrl(currentOrg.slackWebhookUrl || '');
      setSlackNotifications(currentOrg.slackNotifications !== false);
    }
  }, [currentOrg]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    try {
      setSaving(true);
      setError('');
      setSaveSuccess(false);

      await orgAPI.update(currentOrg.id, {
        slackWebhookUrl: slackWebhookUrl.trim(),
        slackNotifications,
      });

      await refreshUserData();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update Slack integration settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSlack = async () => {
    if (!currentOrg || !slackWebhookUrl.trim()) {
      setError('Please provide a Slack Webhook URL first');
      return;
    }

    try {
      setTestingSlack(true);
      setTestResult(null);
      setError('');

      const res = await orgAPI.testSlack(currentOrg.id, slackWebhookUrl.trim());
      setTestResult({
        success: true,
        message: res.data.message || 'Test message sent to Slack channel!',
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Failed to send test message to Slack. Check your Webhook URL.',
      });
    } finally {
      setTestingSlack(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Slack Integration</h1>
        <p className="text-xs text-slate-500 mt-1">
          Connect your organization <span className="font-semibold text-slate-700">{currentOrg?.name}</span> to a Slack channel for instant real-time updates.
        </p>
      </div>

      {!canManage && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-amber-800 text-xs">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold">Admin Permissions Required</p>
            <p className="mt-0.5 text-amber-700">
              Only Workspace Owners and Admins can configure the Slack webhook URL and notification settings.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Slack integration settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Slack Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shadow-purple-200">
                <Webhook className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Slack Incoming Webhook</h2>
                <p className="text-xs text-slate-500">Post ticket alerts, status updates & comments directly into a Slack channel</p>
              </div>
            </div>

            <a 
              href="https://api.slack.com/messaging/webhooks" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold"
            >
              <span>Slack Webhook Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Slack Webhook URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="url"
                disabled={!canManage}
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
                placeholder="Enter your Slack Incoming Webhook URL..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={handleTestSlack}
                disabled={testingSlack || !slackWebhookUrl.trim() || !canManage}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testingSlack ? 'Sending...' : 'Test Slack'}</span>
              </button>
            </div>
          </div>

          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2.5 ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Setup Instructions */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 space-y-2 text-xs text-slate-600">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>How to get your Slack Webhook in 1 minute:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-500 pl-1">
              <li>Open <a href="https://api.slack.com/apps" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-medium">api.slack.com/apps</a> and click <strong>Create New App</strong> &rarr; <em>From scratch</em>.</li>
              <li>Under <strong>Features</strong>, enable <strong>Incoming Webhooks</strong>.</li>
              <li>Click <strong>Add New Webhook to Workspace</strong> and choose your notification channel (e.g. <code>#general</code> or <code>#devflow</code>).</li>
              <li>Copy the generated Webhook URL, paste it above, and click <strong>Test Slack</strong>.</li>
            </ol>
          </div>

          {/* Toggle Slack notifications */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800">Enable Real-Time Slack Notifications</span>
              <p className="text-[11px] text-slate-400">Trigger alerts whenever tickets are created, sprint statuses change, or comments are added</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={!canManage}
                checked={slackNotifications}
                onChange={(e) => setSlackNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        {canManage && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs shadow-indigo-200 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Settings;
