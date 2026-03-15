import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, UpgradePrompt } from '@/components/ui';
import { DomainSettingsClient } from './client';

export const metadata = {
  title: 'Custom Domain',
};

export default async function DomainSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('subscription_tier, custom_domain, domain_verified, username')
    .eq('id', user.id)
    .single();

  const profile = profileRaw as {
    subscription_tier: 'free' | 'pro';
    custom_domain: string | null;
    domain_verified: boolean;
    username: string | null;
  } | null;

  if (!profile) return null;

  if (profile.subscription_tier !== 'pro') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Custom domain</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Use your own domain instead of cele.bio/username.</p>
        </div>
        <UpgradePrompt feature="customDomain" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Custom domain</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Connect your own domain and make your public page feel fully branded.</p>
      </div>
      <DomainSettingsClient
        username={profile.username || ''}
        currentDomain={profile.custom_domain}
        verified={profile.domain_verified}
      />
      <Card>
        <CardHeader>
          <CardTitle>Vercel setup note</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <p>Add your wildcard or individual custom domains in Vercel so the platform can accept requests for creator domains.</p>
          <p>You can do this manually in the Vercel dashboard now, or later automate it with the Vercel Domains API.</p>
        </CardContent>
      </Card>
    </div>
  );
}
