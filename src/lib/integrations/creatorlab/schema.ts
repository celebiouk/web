import { z } from 'zod';

const maxString = (max: number) => z.string().trim().min(1).max(max);

export const creatorLabImportRequestSchema = z.object({
  external_source: z.literal('creatorlab'),
  external_id: z.string().uuid(),
  metadata: z.object({
    title: maxString(200),
    subtitle: z.string().trim().max(200).nullable(),
    description: z.string().trim().max(10000),
    category: z.string().trim().max(120),
    tags: z.array(z.string().trim().min(1).max(50)).max(25),
    language: z.string().trim().min(2).max(8),
    price: z.number().int().nonnegative(),
    currency: z.string().trim().length(3),
  }),
  content: z.object({
    raw_text: z.string().max(2_000_000),
    formatted_json: z.record(z.string(), z.unknown()),
  }),
  assets: z.object({
    epub_url: z.string().url().nullable(),
    pdf_url: z.string().url().nullable(),
  }),
  options: z.object({
    draft: z.boolean().default(true),
  }),
});

export const creatorLabImportResponseSchema = z.object({
  import_id: z.string().uuid(),
  product_id: z.string().min(1),
  status: z.enum(['queued', 'processing', 'ready', 'failed']),
  edit_url: z.string().url(),
});

export type CreatorLabImportRequest = z.infer<typeof creatorLabImportRequestSchema>;
export type CreatorLabImportResponse = z.infer<typeof creatorLabImportResponseSchema>;

export function sanitizeText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJson(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, sanitizeJson(nested)])
    );
  }

  if (typeof value === 'string') {
    return sanitizeText(value);
  }

  return value;
}
