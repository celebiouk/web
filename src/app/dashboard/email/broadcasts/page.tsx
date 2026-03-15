'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Spinner } from '@/components/ui';

type Broadcast = {
  id: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  recipient_count: number;
  sent_at: string | null;
  scheduled_at: string | null;
  created_at: string;
};

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadBroadcasts();
  }, []);

  async function loadBroadcasts() {
    setLoading(true);
    const response = await fetch('/api/email/broadcasts');
    const json = await response.json();
    setBroadcasts((json.broadcasts || []) as Broadcast[]);
    setLoading(false);
  }

  if (loading) {
    return <div className="flex min-h-[300px] items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Broadcasts</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage sent and scheduled campaigns.</p>
        </div>
        <Link href="/dashboard/email/broadcasts/new"><Button>New Broadcast</Button></Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Recipients</th>
                  <th className="px-4 py-3">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {broadcasts.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.subject}</td>
                    <td className="px-4 py-3"><Badge variant={item.status === 'sent' ? 'success' : item.status === 'scheduled' ? 'warning' : 'default'}>{item.status}</Badge></td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.recipient_count || 0}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.sent_at ? new Date(item.sent_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
