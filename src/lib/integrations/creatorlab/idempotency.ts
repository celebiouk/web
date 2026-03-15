export interface ExistingImportRecord {
  id: string;
  product_id: string | null;
  status: 'queued' | 'processing' | 'ready' | 'failed';
}

export interface ImportOperationPlan {
  createImportRecord: boolean;
  createProduct: boolean;
  importId?: string;
  productId?: string | null;
}

export function planImportOperation(existingImport: ExistingImportRecord | null): ImportOperationPlan {
  if (!existingImport) {
    return {
      createImportRecord: true,
      createProduct: true,
    };
  }

  return {
    createImportRecord: false,
    createProduct: !existingImport.product_id,
    importId: existingImport.id,
    productId: existingImport.product_id,
  };
}
