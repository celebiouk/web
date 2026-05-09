import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PrintView } from './client';
import type { Block } from '@/lib/celestudio/blocks';
import type { DesignSystemSlug } from '@/lib/celestudio/design-systems';

export const dynamic = 'force-dynamic';

interface EbookRow {
  id: string;
  title: string;
  subtitle: string | null;
  design_system: DesignSystemSlug;
  blocks: Block[];
}

export default async function EbookPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await (supabase as any).from('celestudio_ebooks')
    .select('id, title, subtitle, design_system, blocks')
    .eq('id', id)
    .eq('creator_id', user.id)
    .maybeSingle();

  if (error || !data) notFound();
  return <PrintView ebook={data as EbookRow} />;
}
