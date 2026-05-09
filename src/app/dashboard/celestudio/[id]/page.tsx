import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EbookViewerClient } from './client';
import type { Block } from '@/lib/celestudio/blocks';
import type { DesignSystemSlug } from '@/lib/celestudio/design-systems';

export const dynamic = 'force-dynamic';

interface EbookRow {
  id: string;
  title: string;
  subtitle: string | null;
  design_system: DesignSystemSlug;
  status: string;
  blocks: Block[];
  source_text: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export default async function EbookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await (supabase as any).from('celestudio_ebooks')
    .select('*')
    .eq('id', id)
    .eq('creator_id', user.id)
    .maybeSingle();

  if (error || !data) notFound();
  const ebook = data as EbookRow;

  return <EbookViewerClient ebook={ebook} />;
}
