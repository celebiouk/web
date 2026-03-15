'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';

type ProductOption = {
  id: string;
  title: string;
  price: number;
};

export default function EmailFormsPage() {
  const [title, setTitle] = useState('Get my free guide');
  const [description, setDescription] = useState('Join my email list for updates and launches.');
  const [leadMagnetProductId, setLeadMagnetProductId] = useState<string>('');
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    const response = await fetch('/api/email/forms');
    const json = await response.json();
    setTitle(json.form?.title || 'Get my free guide');
    setDescription(json.form?.description || 'Join my email list for updates and launches.');
    setLeadMagnetProductId(json.form?.leadMagnetProductId || '');
    setProducts((json.products || []) as ProductOption[]);
  }

  async function saveSettings() {
    setSaving(true);
    await fetch('/api/email/forms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        leadMagnetProductId: leadMagnetProductId || null,
      }),
    });
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Opt-in Forms</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure your storefront email capture and optional lead magnet.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Form title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Get my free guide" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Incentive description</label>
            <textarea
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none ring-brand-300 focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Lead magnet product (optional)</label>
            <select
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none ring-brand-300 focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
              value={leadMagnetProductId}
              onChange={(e) => setLeadMagnetProductId(e.target.value)}
            >
              <option value="">None</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.title}</option>
              ))}
            </select>
          </div>
          <Button onClick={saveSettings} disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
