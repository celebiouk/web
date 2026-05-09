import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NewEbookClient } from './client';

export const dynamic = 'force-dynamic';

export default async function NewEbookPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await (supabase as any).from('profiles')
    .select('subscription_tier, full_name')
    .eq('id', user.id)
    .maybeSingle();

  const isPro = profile?.subscription_tier === 'pro';
  if (!isPro) redirect('/dashboard/celestudio');

  return <NewEbookClient authorName={profile?.full_name ?? null} />;
}
