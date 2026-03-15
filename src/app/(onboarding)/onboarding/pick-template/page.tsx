import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TemplateGrid } from '@/components/onboarding/template-grid';
import type { Profile, Template } from '@/types/supabase';

export const metadata = {
  title: 'Choose Your Template',
};

/**
 * Step 1: Pick your template
 * Shows a grid of all available templates for the user to choose from
 */
export default async function PickTemplatePage() {
  const supabase = await createClient();

  // Check if user already has a template selected
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('profiles')
    .select('template_id')
    .eq('id', user.id)
    .single();

  const profile = data as Pick<Profile, 'template_id'> | null;

  // Fetch all active templates
  const { data: templatesData } = await supabase
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const templates = templatesData as Template[] | null;

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-fade-in">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center rounded-full bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
            Step 1 of 2
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            Choose your template
          </h1>
          <p className="mx-auto max-w-lg text-lg text-zinc-400">
            Pick a design that matches your brand. Don&apos;t worry — you can customize
            everything later.
          </p>
        </div>

        {/* Template Grid */}
        <TemplateGrid
          templates={templates || []}
          selectedTemplateId={profile?.template_id || null}
        />
      </div>
    </div>
  );
}
