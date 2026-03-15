import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isInternalAdminEmail } from '@/lib/admin';
import { CommissionMonthlyClient } from './client';

export const metadata = {
  title: 'Internal Commission Report',
};

export default async function InternalCommissionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isInternalAdminEmail(user.email)) {
    redirect('/dashboard');
  }

  return <CommissionMonthlyClient />;
}
