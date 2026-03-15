import { Card, CardContent, Button } from '@/components/ui';
import Link from 'next/link';

export const metadata = {
  title: 'My Page',
};

/**
 * My Page - Editor for the creator's public page
 * Full implementation in Phase 2
 */
export default function MyPagePage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Page
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Customize your public storefront
        </p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
            <span className="text-3xl">🎨</span>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Page Editor Coming Soon
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Full template customization and live preview will be available in the
            next update.
          </p>
          <Link href="/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
