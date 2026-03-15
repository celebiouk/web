import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Avatar } from '@/components/ui';
import { PRICING } from '@/lib/constants';
import { isInternalAdminEmail } from '@/lib/admin';
import { Check } from 'lucide-react';
import type { Profile } from '@/types/supabase';

export const metadata = {
  title: 'Settings',
};

/**
 * Settings page - Profile, billing, and account settings
 */
export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single();

  const profile = data as Profile | null;
  const isPro = profile?.subscription_tier === 'pro';
  const isInternalAdmin = isInternalAdminEmail(user?.email);

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profile</CardTitle>
          <Button variant="outline" size="sm" disabled>
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar
              src={profile?.avatar_url}
              name={profile?.full_name || 'User'}
              size="lg"
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {profile?.full_name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{profile?.username}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>
          {profile?.bio && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {profile.bio}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Billing Section */}
      <Card id="billing">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Billing & Subscription</CardTitle>
          <Link href="/dashboard/settings/billing">
            <Button variant="outline" size="sm">
              Open Billing
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Current Plan:
                </span>
                <Badge variant={isPro ? 'pro' : 'default'}>
                  {isPro ? 'Pro' : 'Free'}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isPro
                  ? '0% commission on all sales'
                  : '8% commission per sale + gateway fees'}
              </p>
            </div>
          </div>

          {!isPro && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Pro Monthly */}
              <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Pro Monthly
                </h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    $19.99
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {PRICING.PRO_MONTHLY.features.slice(0, 4).map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <Check className="h-4 w-4 text-success-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard/settings/billing" className="mt-4 block">
                  <Button variant="outline" fullWidth>
                    Start Pro
                  </Button>
                </Link>
              </div>

              {/* Pro Yearly */}
              <div className="relative rounded-xl border-2 border-brand-500 p-6">
                <div className="absolute -top-3 left-4 rounded-full bg-gradient-to-r from-accent-400 to-accent-500 px-3 py-1 text-xs font-medium text-white">
                  Most Popular - Save 30%
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Pro Yearly
                </h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    $13.99
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="mt-1 text-sm text-success-600">
                  Billed as $167.90/year
                </p>
                <ul className="mt-4 space-y-2">
                  {PRICING.PRO_YEARLY.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <Check className="h-4 w-4 text-success-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard/settings/billing" className="mt-4 block">
                  <Button fullWidth>
                    Get Best Value
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {isPro && (
            <div className="rounded-xl border border-success-200 bg-success-50 p-4 dark:border-success-800 dark:bg-success-500/10">
              <p className="font-medium text-success-700 dark:text-success-400">
                You&apos;re on the Pro plan! Enjoy 0% commission and all premium features.
              </p>
              <Link href="/dashboard/settings/billing" className="mt-3 inline-block">
                <Button size="sm" variant="outline">
                  Manage Subscription
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Custom Domain</CardTitle>
          <Link href="/dashboard/settings/domain">
            <Button variant="outline" size="sm">
              Manage Domain
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Connect your own domain so fans can visit your storefront at yourbrand.com instead of cele.bio/username.
          </p>
          {!isPro && (
            <p className="mt-3 text-sm font-medium text-amber-600 dark:text-amber-400">
              Available on Pro only.
            </p>
          )}
        </CardContent>
      </Card>

      {isInternalAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Internal Reporting</CardTitle>
            <Link href="/dashboard/settings/internal/commission">
              <Button variant="outline" size="sm">
                Open Report
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View monthly platform commission totals for internal analytics.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-error-200 dark:border-error-800">
        <CardHeader>
          <CardTitle className="text-error-600 dark:text-error-400">
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Delete Account
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="danger" size="sm" disabled>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
