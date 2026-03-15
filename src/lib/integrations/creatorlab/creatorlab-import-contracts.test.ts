import { describe, expect, it } from 'vitest';
import { planImportOperation } from '@/lib/integrations/creatorlab/idempotency';
import { creatorLabImportResponseSchema } from '@/lib/integrations/creatorlab/schema';

describe('CreatorLab import idempotency', () => {
  it('creates import and product for first-time import', () => {
    const plan = planImportOperation(null);
    expect(plan.createImportRecord).toBe(true);
    expect(plan.createProduct).toBe(true);
  });

  it('reuses import and product for repeated import', () => {
    const plan = planImportOperation({
      id: 'import-id',
      product_id: 'product-id',
      status: 'ready',
    });

    expect(plan.createImportRecord).toBe(false);
    expect(plan.createProduct).toBe(false);
    expect(plan.importId).toBe('import-id');
    expect(plan.productId).toBe('product-id');
  });
});

describe('CreatorLab response contracts', () => {
  it('validates import response shape', () => {
    const parsed = creatorLabImportResponseSchema.parse({
      import_id: '550e8400-e29b-41d4-a716-446655440000',
      product_id: '9a976f91-3c7b-47de-bf0f-f7b8a77765ce',
      status: 'ready',
      edit_url: 'https://cele.bio/dashboard/products/9a976f91-3c7b-47de-bf0f-f7b8a77765ce/edit',
    });

    expect(parsed.status).toBe('ready');
  });
});
