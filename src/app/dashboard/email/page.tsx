import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';

export const metadata = {
  title: 'Email Marketing',
};

export default function EmailMarketingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Marketing</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Grow your audience, send broadcasts, and automate follow-ups.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Subscribers</CardTitle>
            <Link href="/dashboard/email/subscribers"><Button size="sm" variant="outline">Open</Button></Link>
          </CardHeader>
          <CardContent>
            Manage your email list, tags, import/export, and segmentation sources.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Opt-in Forms</CardTitle>
            <Link href="/dashboard/email/forms"><Button size="sm" variant="outline">Open</Button></Link>
          </CardHeader>
          <CardContent>
            Configure lead magnet title, description, and optional free resource attachment.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Broadcasts</CardTitle>
            <Link href="/dashboard/email/broadcasts"><Button size="sm" variant="outline">Open</Button></Link>
          </CardHeader>
          <CardContent>
            Send one-time campaigns now or schedule them for later.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sequences</CardTitle>
            <Link href="/dashboard/email/sequences"><Button size="sm" variant="outline">Open</Button></Link>
          </CardHeader>
          <CardContent>
            Build automated drip flows for subscribers, purchases, enrollments, and bookings.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
