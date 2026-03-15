'use client';

import { Card, CardContent, Button, Badge, Spinner } from '@/components/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FileText, GraduationCap, Users } from 'lucide-react';
import type { Product, Profile } from '@/types/supabase';
import Image from 'next/image';

/**
 * Products Dashboard - Manage digital products
 */
export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      // Load profile and products in parallel
      const [profileRes, productsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('products')
          .select('*')
          .eq('creator_id', user.id)
          .order('sort_order', { ascending: true }),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (productsRes.error) throw productsRes.error;

      setProfile(profileRes.data);
      setProducts(productsRes.data || []);
    } catch (err) {
      console.error('Load error:', err);
      setError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }

  async function togglePublish(productId: string, currentStatus: boolean) {
    setTogglingId(productId);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('products')
        .update({ is_published: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev =>
        prev.map(p =>
          p.id === productId ? { ...p, is_published: !currentStatus } : p
        )
      );
    } catch (err) {
      console.error('Toggle error:', err);
      alert('Failed to update product');
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteProduct(productId: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setDeletingId(productId);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  }

  function formatPrice(priceInCents: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(priceInCents / 100);
  }

  const stripeConnected = profile?.stripe_account_id;

  async function handleAddProductClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (profile?.subscription_tier === 'free' && products.length >= 3) {
      event.preventDefault();
      try {
        await fetch('/api/nudges/show', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nudgeType: 'fourth_product_attempt' }),
        });
        await fetch('/api/nudges/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nudgeType: 'fourth_product_attempt' }),
        });
      } catch (error) {
        console.error('Failed to track fourth product nudge:', error);
      }
      router.push('/dashboard/settings/billing?upgrade=courses&nudge=fourth_product_attempt');
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-500">{error}</p>
            <Button className="mt-4" onClick={loadData}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Products
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage your digital products
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/products/bundles">
            <Button variant="outline">Bundles</Button>
          </Link>
          <Link href="/dashboard/products/new" onClick={handleAddProductClick}>
            <Button>+ Add Product</Button>
          </Link>
        </div>
      </div>

      {/* Stripe Warning */}
      {!stripeConnected && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
          <CardContent className="flex items-start gap-4 p-4">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                Connect Stripe to Sell
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                You need to connect your Stripe account before you can receive payments.
              </p>
              <Link href="/dashboard/settings/payments">
                <Button size="sm" variant="outline" className="mt-3">
                  Connect Stripe
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products List */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
              <span className="text-3xl">📦</span>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              No products yet
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Create your first digital product to start selling.
            </p>
            <Link href="/dashboard/products/new">
              <Button>Create Product</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Cover Image */}
                  <div className="relative h-32 w-full bg-gray-100 dark:bg-gray-800 sm:h-auto sm:w-40">
                    {product.cover_image_url ? (
                      <Image
                        src={product.cover_image_url}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        {product.type === 'digital' && <FileText className="h-10 w-10 text-gray-400" />}
                        {product.type === 'course' && <GraduationCap className="h-10 w-10 text-gray-400" />}
                        {product.type === 'coaching' && <Users className="h-10 w-10 text-gray-400" />}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {product.title}
                          </h3>
                          <Badge
                            variant={product.is_published ? 'success' : 'default'}
                          >
                            {product.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {product.description || 'No description'}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                        {formatPrice(product.price, product.currency)}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Badge variant="default" className="capitalize">
                        {product.type}
                      </Badge>
                      {!product.file_url && product.type === 'digital' && (
                        <Badge variant="warning">No file uploaded</Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap gap-2 border-t pt-4 dark:border-gray-700">
                      <Link href={`/dashboard/products/${product.id}/edit`}>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePublish(product.id, product.is_published)}
                        disabled={togglingId === product.id}
                      >
                        {togglingId === product.id ? (
                          <Spinner size="sm" />
                        ) : product.is_published ? (
                          'Unpublish'
                        ) : (
                          'Publish'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                        onClick={() => deleteProduct(product.id)}
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? <Spinner size="sm" /> : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {products.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Products
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {products.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Published
              </p>
              <p className="text-2xl font-bold text-green-600">
                {products.filter(p => p.is_published).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drafts
              </p>
              <p className="text-2xl font-bold text-gray-500">
                {products.filter(p => !p.is_published).length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
