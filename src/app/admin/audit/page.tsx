import { createClient } from '@/lib/supabase/server';
import { History, User, Shield, Settings } from 'lucide-react';

type AuditLog = {
  id: string;
  action: string;
  admin_email: string;
  target_user_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

export default async function AdminAuditLogsPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100) as unknown as { data: AuditLog[] | null };

  const getActionIcon = (action: string) => {
    if (action.includes('user')) return User;
    if (action.includes('suspend') || action.includes('delete')) return Shield;
    if (action.includes('settings') || action.includes('update')) return Settings;
    return History;
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('suspend')) return 'text-red-500';
    if (action.includes('create') || action.includes('upgrade')) return 'text-green-500';
    if (action.includes('update') || action.includes('edit')) return 'text-blue-500';
    return 'text-gray-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Audit Logs
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Track all admin actions for security and compliance
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
          <option value="all">All Actions</option>
          <option value="user">User Actions</option>
          <option value="order">Order Actions</option>
          <option value="product">Product Actions</option>
          <option value="settings">Settings Changes</option>
        </select>
        <input
          type="date"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <button className="ml-auto rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
          Export CSV
        </button>
      </div>

      {/* Logs Timeline */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {logs?.map((log) => {
            const Icon = getActionIcon(log.action);
            const colorClass = getActionColor(log.action);
            return (
              <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {log.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </p>
                    <time className="text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </time>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Admin: {log.admin_email}
                  </p>
                  {log.target_user_id && (
                    <p className="text-sm text-gray-500">
                      Target User: {log.target_user_id}
                    </p>
                  )}
                  {log.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">
                        View Details
                      </summary>
                      <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-100 p-3 text-xs dark:bg-gray-800">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            );
          })}
          {(!logs || logs.length === 0) && (
            <div className="p-8 text-center text-gray-500">
              No audit logs found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
