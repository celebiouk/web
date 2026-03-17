'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  FileText,
  GraduationCap,
  Users,
  Package,
  Plus,
  Clock3,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  AlertTriangle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { Product, Profile } from '@/types/supabase';
import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Products Dashboard - Premium Design
 * Manage digital products, courses, and coaching
 */
export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [updatingOfferId, setUpdatingOfferId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

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

  function hasOfferTimeLimit(limitType: Product['offer_limit_type']) {
    return limitType === 'time' || limitType === 'both';
  }

  function hasOfferClaimsLimit(limitType: Product['offer_limit_type']) {
    return limitType === 'claims' || limitType === 'both';
  }

  function getOfferTimeRemaining(product: Product) {
    if (!product.offer_enabled || !hasOfferTimeLimit(product.offer_limit_type) || !product.offer_expires_at) {
      return null;
    }

    const expiresAtMs = new Date(product.offer_expires_at).getTime();
    if (!Number.isFinite(expiresAtMs)) {
      return null;
    }

    return Math.max(0, Math.floor((expiresAtMs - currentTime) / 1000));
  }

  function formatCountdown(totalSeconds: number) {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  async function updateOfferFields(productId: string, updates: Partial<Product>) {
    setUpdatingOfferId(productId);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('products')
        .update(updates)
        .eq('id', productId);

      if (error) throw error;

      setProducts((previous) =>
        previous.map((item) => (item.id === productId ? { ...item, ...updates } : item))
      );
    } catch (err) {
      console.error('Offer update error:', err);
      alert('Failed to update offer timer');
    } finally {
      setUpdatingOfferId(null);
    }
  }

  async function extendOfferTimer(product: Product, minutesToAdd: number) {
    const existingMs = product.offer_expires_at ? new Date(product.offer_expires_at).getTime() : Number.NaN;
    const baselineMs = Number.isFinite(existingMs) && existingMs > currentTime ? existingMs : currentTime;
    const nextExpiresAt = new Date(baselineMs + (minutesToAdd * 60 * 1000)).toISOString();

    await updateOfferFields(product.id, { offer_expires_at: nextExpiresAt });
  }

  async function editOfferTimer(product: Product) {
    const input = window.prompt('Add how many minutes to the countdown?', '30');
    if (!input) return;

    const parsed = Number.parseInt(input, 10);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 10080) {
      alert('Enter a number between 1 and 10080 minutes.');
      return;
    }

    await extendOfferTimer(product, parsed);
  }

  async function removeOfferTimer(product: Product) {
    const nextLimitType = product.offer_limit_type === 'both' ? 'claims' : 'none';

    await updateOfferFields(product.id, {
      offer_limit_type: nextLimitType,
      offer_expires_at: null,
      offer_max_claims: nextLimitType === 'none' ? null : product.offer_max_claims,
      offer_claims_used: nextLimitType === 'none' ? 0 : product.offer_claims_used,
    });
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

  const getProductIcon = (type: string) => {
    switch (type) {
      case 'course':
        return GraduationCap;
      case 'coaching':
        return Users;
      default:
        return FileText;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in flex min-h-[400px] flex-col items-center justify-center">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-[13px] font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
            Products
          </h1>
          <p className="mt-1 text-[13px] text-zinc-500">
            Manage your digital products, courses, and coaching
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/products/bundles"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-[13px] font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800"
          >
            <Layers className="h-4 w-4" strokeWidth={1.75} />
            Bundles
          </Link>
          <Link
            href="/dashboard/products/new"
            onClick={handleAddProductClick}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-400"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add Product
          </Link>
        </div>
      </div>

      {/* Stripe Warning */}
      {!stripeConnected && (
        <div className="flex items-start gap-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-400" strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-200">Connect Stripe to Sell</h3>
            <p className="mt-1 text-[13px] text-amber-300/80">
              You need to connect your Stripe account before you can receive payments.
            </p>
            <Link
              href="/dashboard/settings/payments"
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[13px] font-medium text-amber-200 transition-colors hover:bg-amber-500/20"
            >
              Connect Stripe
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Products List */}
      {products.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/60 bg-[#111113] p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800/50">
            <Package className="h-6 w-6 text-zinc-500" strokeWidth={1.75} />
          </div>
          <h2 className="mb-2 text-[15px] font-semibold text-zinc-200">
            No products yet
          </h2>
          <p className="mb-6 text-[13px] text-zinc-500">
            Create your first digital product to start selling.
          </p>
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-400"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Create Product
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {products.map((product) => {
            const ProductIcon = getProductIcon(product.type);
            const offerLimitType = product.offer_limit_type || 'none';
            const hasTimeLimit = hasOfferTimeLimit(offerLimitType);
            const hasClaimsLimit = hasOfferClaimsLimit(offerLimitType);
            const offerTimeRemaining = getOfferTimeRemaining(product);
            const offerClaimsLeft = hasClaimsLimit
              ? Math.max(0, Number(product.offer_max_claims || 0) - Number(product.offer_claims_used || 0))
              : null;
            const showOfferControls = product.offer_enabled && hasTimeLimit;

            return (
              <div
                key={product.id}
                className="group overflow-hidden rounded-xl border border-zinc-800/60 bg-[#111113] transition-all hover:border-zinc-700"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Cover Image */}
                  <div className="relative h-32 w-full shrink-0 bg-zinc-800/50 sm:h-auto sm:w-40">
                    {product.cover_image_url ? (
                      <Image
                        src={product.cover_image_url}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ProductIcon className="h-8 w-8 text-zinc-600" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-[14px] font-semibold text-zinc-200">
                            {product.title}
                          </h3>
                          <span
                            className={cn(
                              'shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                              product.is_published
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-zinc-800 text-zinc-500'
                            )}
                          >
                            {product.is_published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[13px] text-zinc-500">
                          {product.description || 'No description'}
                        </p>
                      </div>
                      <span className="ml-4 shrink-0 font-mono text-[15px] font-semibold text-indigo-400">
                        {formatPrice(product.price, product.currency)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium capitalize text-zinc-400">
                        {product.type}
                      </span>
                      {!product.file_url && product.type === 'digital' && (
                        <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                          No file uploaded
                        </span>
                      )}
                      {product.offer_enabled && (
                        <span className="rounded bg-indigo-500/15 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
                          Offer active
                        </span>
                      )}
                    </div>

                    {product.offer_enabled && (hasTimeLimit || hasClaimsLimit) && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                        {hasTimeLimit && (
                          <span className="inline-flex items-center gap-1 rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 font-mono text-zinc-300">
                            <Clock3 className="h-3.5 w-3.5" />
                            {offerTimeRemaining !== null && offerTimeRemaining > 0 ? formatCountdown(offerTimeRemaining) : 'Timer ended'}
                          </span>
                        )}
                        {hasClaimsLimit && offerClaimsLeft !== null && (
                          <span className="rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 font-medium text-zinc-300">
                            {offerClaimsLeft} spot{offerClaimsLeft === 1 ? '' : 's'} left
                          </span>
                        )}
                      </div>
                    )}

                    {showOfferControls && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-800/60 pt-3">
                        <button
                          onClick={() => extendOfferTimer(product, 15)}
                          disabled={updatingOfferId === product.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800 disabled:opacity-50"
                        >
                          +15m
                        </button>
                        <button
                          onClick={() => extendOfferTimer(product, 60)}
                          disabled={updatingOfferId === product.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800 disabled:opacity-50"
                        >
                          +1h
                        </button>
                        <button
                          onClick={() => editOfferTimer(product)}
                          disabled={updatingOfferId === product.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800 disabled:opacity-50"
                        >
                          Edit timer
                        </button>
                        <button
                          onClick={() => removeOfferTimer(product)}
                          disabled={updatingOfferId === product.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 py-1.5 text-[11px] font-medium text-red-300 transition-colors hover:border-red-500/30 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          Remove timer
                        </button>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-2 border-t border-zinc-800/60 pt-4">
                      <Link
                        href={`/dashboard/products/${product.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-[12px] font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Edit
                      </Link>
                      <button
                        onClick={() => togglePublish(product.id, product.is_published)}
                        disabled={togglingId === product.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-[12px] font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
                      >
                        {togglingId === product.id ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border border-zinc-600 border-t-zinc-400" />
                        ) : product.is_published ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Publish
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        disabled={deletingId === product.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-[12px] font-medium text-red-400 transition-colors hover:border-red-500/30 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {deletingId === product.id ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border border-red-600 border-t-red-400" />
                        ) : (
                          <>
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      {products.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800/60 bg-[#111113] p-5">
            <p className="text-[12px] font-medium uppercase tracking-wider text-zinc-500">
              Total Products
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-zinc-100">
              {products.length}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800/60 bg-[#111113] p-5">
            <p className="text-[12px] font-medium uppercase tracking-wider text-zinc-500">
              Published
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-emerald-400">
              {products.filter(p => p.is_published).length}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800/60 bg-[#111113] p-5">
            <p className="text-[12px] font-medium uppercase tracking-wider text-zinc-500">
              Drafts
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-zinc-500">
              {products.filter(p => !p.is_published).length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
