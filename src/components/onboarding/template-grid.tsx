'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Template } from '@/types/supabase';

interface TemplateGridProps {
  templates: Template[];
  selectedTemplateId: string | null;
}

/**
 * Template selection grid component
 * Shows all available templates with preview and selection
 */
export function TemplateGrid({ templates, selectedTemplateId }: TemplateGridProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(selectedTemplateId);
  const [isLoading, setIsLoading] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const supabase = createClient();

  const handleSelect = (templateId: string) => {
    setSelected(templateId);
  };

  const handleContinue = async () => {
    if (!selected) return;

    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Save the selected template to the user's profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ template_id: selected })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving template:', error);
        return;
      }

      // Navigate to next step
      router.push('/onboarding/setup-profile');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    minimal: 'Minimal',
    bold: 'Bold',
    elegant: 'Elegant',
    creative: 'Creative',
    professional: 'Professional',
  };

  return (
    <>
      {/* Template Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleSelect(template.id)}
            className={cn(
              'group relative cursor-pointer overflow-hidden rounded-2xl border-2 bg-white transition-all duration-200',
              'hover:shadow-lg hover:-translate-y-1',
              'dark:bg-gray-900',
              selected === template.id
                ? 'border-brand-500 shadow-lg shadow-brand-500/20'
                : 'border-gray-200 dark:border-gray-800'
            )}
          >
            {/* Template Preview Image */}
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800">
              {template.thumbnail_url ? (
                <Image
                  src={template.thumbnail_url}
                  alt={template.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-4xl">🎨</span>
                </div>
              )}

              {/* Selection indicator */}
              {selected === template.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-brand-500/20 backdrop-blur-[2px]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* Preview Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewTemplate(template);
                }}
                className="absolute bottom-3 right-3 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-700 opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:opacity-100"
              >
                Preview
              </button>

              {/* Premium badge */}
              {template.is_premium && (
                <div className="absolute left-3 top-3">
                  <Badge variant="pro" size="sm">
                    PRO
                  </Badge>
                </div>
              )}
            </div>

            {/* Template Info */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {template.name}
                </h3>
                <Badge variant="default" size="sm">
                  {categoryLabels[template.category] || template.category}
                </Badge>
              </div>
              {template.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2 dark:text-gray-400">
                  {template.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/90 backdrop-blur-sm safe-area-bottom dark:border-gray-800 dark:bg-gray-950/90">
        <div className="container-page flex items-center justify-between py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selected ? '1 template selected' : 'Select a template to continue'}
          </p>
          <Button
            onClick={handleContinue}
            disabled={!selected}
            isLoading={isLoading}
          >
            Continue
          </Button>
        </div>
      </div>

      {/* Add bottom padding for sticky footer */}
      <div className="h-24" />

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="animate-scale-in relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[3/4]">
              {previewTemplate.preview_image_url ? (
                <Image
                  src={previewTemplate.preview_image_url}
                  alt={previewTemplate.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <span className="text-6xl">🎨</span>
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {previewTemplate.name}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {previewTemplate.description}
              </p>
              <div className="mt-4 flex gap-3">
                <Button
                  onClick={() => {
                    handleSelect(previewTemplate.id);
                    setPreviewTemplate(null);
                  }}
                  fullWidth
                >
                  Select This Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPreviewTemplate(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
