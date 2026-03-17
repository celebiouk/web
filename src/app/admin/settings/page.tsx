'use client';

import { useEffect, useState } from 'react';
import { Save, Globe, DollarSign, Mail, Shield, Database } from 'lucide-react';

type AdminSettings = {
  siteName: string;
  siteUrl: string;
  supportEmail: string;
  commissionRate: number;
  proMonthlyPrice: number;
  proYearlyPrice: number;
  maxFreeSubscribers: number;
  enableNewSignups: boolean;
  enableStripeConnect: boolean;
  requireEmailVerification: boolean;
  maintenanceMode: boolean;
};

const defaultSettings: AdminSettings = {
  siteName: 'cele.bio',
  siteUrl: 'https://cele.bio',
  supportEmail: 'support@cele.bio',
  commissionRate: 8,
  proMonthlyPrice: 19.99,
  proYearlyPrice: 167.90,
  maxFreeSubscribers: 500,
  enableNewSignups: true,
  enableStripeConnect: true,
  requireEmailVerification: true,
  maintenanceMode: false,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const response = await fetch('/api/admin/settings', { cache: 'no-store' });
        const json = await response.json();

        if (!response.ok) {
          setErrorMessage(json.error || 'Failed to load settings.');
          return;
        }

        setSettings(json.settings || defaultSettings);
      } catch {
        setErrorMessage('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const json = await response.json();
      if (!response.ok) {
        setErrorMessage(json.error || 'Failed to save settings.');
        return;
      }

      setSettings(json.settings || settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setErrorMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Platform Settings
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Configure platform-wide settings
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Loading...' : saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/10 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      {/* General Settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/10">
            <Globe className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">General</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Site Name
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Site URL
            </label>
            <input
              type="text"
              value={settings.siteUrl}
              onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Pricing Settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-500/10">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pricing & Commission</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Free Tier Commission (%)
            </label>
            <input
              type="number"
              value={settings.commissionRate}
              onChange={(e) => setSettings({ ...settings, commissionRate: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Pro Monthly ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.proMonthlyPrice}
              onChange={(e) => setSettings({ ...settings, proMonthlyPrice: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Pro Yearly ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.proYearlyPrice}
              onChange={(e) => setSettings({ ...settings, proYearlyPrice: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Email Settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/10">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Support Email
            </label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Max Free Tier Subscribers
            </label>
            <input
              type="number"
              value={settings.maxFreeSubscribers}
              onChange={(e) => setSettings({ ...settings, maxFreeSubscribers: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-500/10">
            <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Feature Toggles</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: 'enableNewSignups', label: 'Enable New Signups', description: 'Allow new users to register' },
            { key: 'enableStripeConnect', label: 'Enable Stripe Connect', description: 'Allow creators to connect Stripe accounts' },
            { key: 'requireEmailVerification', label: 'Require Email Verification', description: 'Users must verify email before accessing platform' },
            { key: 'maintenanceMode', label: 'Maintenance Mode', description: 'Show maintenance page to non-admin users' },
          ].map((toggle) => {
            const isEnabled = settings[toggle.key as keyof Pick<AdminSettings, 'enableNewSignups' | 'enableStripeConnect' | 'requireEmailVerification' | 'maintenanceMode'>];

            return (
            <div key={toggle.key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{toggle.label}</p>
                <p className="text-sm text-gray-500">{toggle.description}</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, [toggle.key]: !isEnabled })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  isEnabled
                    ? 'bg-brand-500'
                    : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    isEnabled ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          );
          })}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-900/10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/10">
            <Database className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-red-900 dark:text-red-400">Danger Zone</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-900 dark:text-red-400">Clear All Cache</p>
              <p className="text-sm text-red-700 dark:text-red-500">Purge all cached data</p>
            </div>
            <button className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-700 dark:bg-transparent dark:hover:bg-red-900/20">
              Clear Cache
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-900 dark:text-red-400">Export All Data</p>
              <p className="text-sm text-red-700 dark:text-red-500">Download complete platform backup</p>
            </div>
            <button className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-700 dark:bg-transparent dark:hover:bg-red-900/20">
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
