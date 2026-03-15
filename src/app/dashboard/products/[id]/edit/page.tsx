'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, Button, Input, Badge, Spinner } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { uploadFile, deleteFile, validateFile, FILE_TYPES, type UploadProgress } from '@/lib/utils/uploadFile';
import { FileText, GraduationCap, Users, type LucideIcon } from 'lucide-react';
import type { Product, ProductType, ProductUpdate } from '@/types/supabase';

const PRODUCT_TYPES: { value: ProductType; label: string; icon: LucideIcon; description: string }[] = [
  {
    value: 'digital',
    label: 'Digital Download',
    icon: FileText,
    description: 'PDFs, eBooks, templates, presets',
  },
  {
    value: 'course',
    label: 'Course',
    icon: GraduationCap,
    description: 'Video courses and tutorials',
  },
  {
    value: 'coaching',
    label: 'Coaching',
    icon: Users,
    description: '1-on-1 coaching sessions',
  },
];

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const supabase = createClient();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const headerBannerInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading state
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null);

  // Form state
  const [productType, setProductType] = useState<ProductType>('digital');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency] = useState('usd');
  const [upsellEnabled, setUpsellEnabled] = useState(false);
  const [upsellProductId, setUpsellProductId] = useState('');
  const [upsellPrice, setUpsellPrice] = useState('');
  const [upsellOptions, setUpsellOptions] = useState<Array<{ id: string; title: string; price: number }>>([]);

  // File state
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [headerBannerFile, setHeaderBannerFile] = useState<File | null>(null);
  const [headerBannerPreview, setHeaderBannerPreview] = useState<string | null>(null);
  const [existingHeaderBannerUrl, setExistingHeaderBannerUrl] = useState<string | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [coverProgress, setCoverProgress] = useState<UploadProgress | null>(null);
  const [fileProgress, setFileProgress] = useState<UploadProgress | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  async function loadProduct() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('creator_id', user.id)
        .single();

      if (error || !data) {
        router.push('/dashboard/products');
        return;
      }

      const product = data as Product;
      setOriginalProduct(product);
      setProductType(product.type);
      setTitle(product.title);
      setSubtitle((product as any).subtitle || '');
      setDescription(product.description || '');
      setPrice((product.price / 100).toFixed(2));
      setExistingCoverUrl(product.cover_image_url);
      setExistingHeaderBannerUrl((product as any).header_banner_url || null);
      setExistingFileUrl(product.file_url);
      const productWithUpsell = product as Product & {
        upsell_enabled?: boolean;
        upsell_product_id?: string | null;
        upsell_price_cents?: number | null;
      };
      setUpsellEnabled(Boolean(productWithUpsell.upsell_enabled));
      setUpsellProductId(productWithUpsell.upsell_product_id || '');
      setUpsellPrice(productWithUpsell.upsell_price_cents ? (productWithUpsell.upsell_price_cents / 100).toFixed(2) : '');

      const { data: options } = await supabase
        .from('products')
        .select('id,title,price')
        .eq('creator_id', user.id)
        .neq('id', productId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      setUpsellOptions((options || []) as Array<{ id: string; title: string; price: number }>);
    } catch (err) {
      console.error('Load error:', err);
      setError('Failed to load product');
    } finally {
      setIsLoadingProduct(false);
    }
  }

  function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, {
      maxSize: 5 * 1024 * 1024,
      allowedTypes: FILE_TYPES.images,
    });

    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setExistingCoverUrl(null);
    setError(null);
  }

  function handleProductFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, {
      maxSize: 50 * 1024 * 1024,
      allowedTypes: FILE_TYPES.digitalProducts,
    });

    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setProductFile(file);
    setExistingFileUrl(null);
    setError(null);
  }

  function handleHeaderBannerSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: FILE_TYPES.images,
    });

    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setHeaderBannerFile(file);
    setHeaderBannerPreview(URL.createObjectURL(file));
    setExistingHeaderBannerUrl(null);
    setError(null);
  }

  function removeCover() {
    setCoverFile(null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
    setExistingCoverUrl(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  }

  function removeProductFile() {
    setProductFile(null);
    setExistingFileUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeHeaderBanner() {
    setHeaderBannerFile(null);
    if (headerBannerPreview) URL.revokeObjectURL(headerBannerPreview);
    setHeaderBannerPreview(null);
    setExistingHeaderBannerUrl(null);
    if (headerBannerInputRef.current) headerBannerInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      setError('Please enter a valid price');
      return;
    }

    if (productType === 'digital' && !productFile && !existingFileUrl) {
      setError('Please upload a product file');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      let coverImageUrl: string | null = existingCoverUrl;
      let headerBannerUrl: string | null = existingHeaderBannerUrl;
      let fileUrl: string | null = existingFileUrl;

      // Upload new cover if changed
      if (coverFile) {
        // Delete old cover if exists
        if (originalProduct?.cover_image_url) {
          try {
            const oldPath = originalProduct.cover_image_url.split('/').pop();
            if (oldPath) await deleteFile('product-covers', `${user.id}/${oldPath}`);
          } catch {
            // Ignore delete errors
          }
        }

        const result = await uploadFile('product-covers', coverFile, {
          folder: user.id,
          onProgress: setCoverProgress,
        });
        coverImageUrl = result.publicUrl || null;
      }

      if (headerBannerFile) {
        const result = await uploadFile('product-covers', headerBannerFile, {
          folder: `${user.id}/headers`,
        });
        headerBannerUrl = result.publicUrl || null;
      }

      // Upload new product file if changed
      if (productFile) {
        // Delete old file if exists
        if (originalProduct?.file_url) {
          try {
            await deleteFile('product-files', originalProduct.file_url);
          } catch {
            // Ignore delete errors
          }
        }

        const result = await uploadFile('product-files', productFile, {
          folder: user.id,
          onProgress: setFileProgress,
        });
        fileUrl = result.path;
      }

      const priceInCents = Math.round(priceValue * 100);
      const upsellPriceValue = parseFloat(upsellPrice || '0');
      const upsellPriceCents = upsellEnabled && upsellPriceValue > 0 ? Math.round(upsellPriceValue * 100) : null;

      if (upsellEnabled && !upsellProductId) {
        setError('Select an upsell product');
        setIsSubmitting(false);
        return;
      }

      if (upsellEnabled && upsellPriceCents !== null) {
        const selectedUpsellProduct = upsellOptions.find((item) => item.id === upsellProductId);
        if (selectedUpsellProduct && upsellPriceCents > selectedUpsellProduct.price) {
          setError('Upsell price must be less than or equal to the selected product price');
          setIsSubmitting(false);
          return;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('products')
        .update({
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          description: description.trim() || null,
          price: priceInCents,
          type: productType,
          cover_image_url: coverImageUrl,
          header_banner_url: headerBannerUrl,
          file_url: fileUrl,
          upsell_enabled: upsellEnabled,
          upsell_product_id: upsellEnabled ? upsellProductId || null : null,
          upsell_price_cents: upsellEnabled ? upsellPriceCents : null,
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      router.push('/dashboard/products');

    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update product. Please try again.');
    } finally {
      setIsSubmitting(false);
      setCoverProgress(null);
      setFileProgress(null);
    }
  }

  if (isLoadingProduct) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentCover = coverPreview || existingCoverUrl;
  const hasProductFile = productFile || existingFileUrl;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="sm">
            ← Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Product
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Update your product details
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Type */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Product Type
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {PRODUCT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setProductType(type.value)}
                  className={`rounded-lg border p-4 text-left transition-all ${
                    productType === type.value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  }`}
                >
                  <type.icon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                  <h3 className="mt-2 font-medium text-gray-900 dark:text-white">
                    {type.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {type.description}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Post-Purchase Upsell
            </h2>

            <label className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable post-purchase upsell
              </span>
              <input
                type="checkbox"
                checked={upsellEnabled}
                onChange={(event) => setUpsellEnabled(event.target.checked)}
              />
            </label>

            {upsellEnabled && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Upsell product
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    value={upsellProductId}
                    onChange={(event) => setUpsellProductId(event.target.value)}
                  >
                    <option value="">Select product</option>
                    {upsellOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.title} — ${(option.price / 100).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Upsell price (USD)
                  </label>
                  <Input
                    type="number"
                    value={upsellPrice}
                    onChange={(event) => setUpsellPrice(event.target.value)}
                    placeholder="e.g. 9.99"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Basic Information
            </h2>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Social Media Growth Guide"
                maxLength={100}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what's included..."
                rows={4}
                maxLength={1000}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subtitle
              </label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="One short line that explains the product promise"
                maxLength={140}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Price (USD) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-8"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cover Image */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Cover Image
            </h2>

            {currentCover ? (
              <div className="relative inline-block">
                <Image
                  src={currentCover}
                  alt="Cover"
                  width={200}
                  height={150}
                  className="rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={removeCover}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="flex h-32 w-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-brand-500 dark:border-gray-600"
              >
                <span className="text-2xl">🖼️</span>
                <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Upload Image
                </span>
              </button>
            )}

            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverSelect}
              className="hidden"
            />

            {coverProgress && (
              <div className="mt-4">
                <div className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                  Uploading cover... {coverProgress.percentage}%
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full bg-brand-500 transition-all"
                    style={{ width: `${coverProgress.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product File */}
        {productType === 'digital' && (
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Product File *
              </h2>

              {hasProductFile ? (
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {productFile?.name || 'Uploaded file'}
                    </p>
                    {productFile && (
                      <p className="text-sm text-gray-500">
                        {(productFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                    {existingFileUrl && !productFile && (
                      <p className="text-sm text-green-600">Current file</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Replace
                  </Button>
                  <button
                    type="button"
                    onClick={removeProductFile}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-32 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-brand-500 dark:border-gray-600"
                >
                  <span className="text-2xl">📤</span>
                  <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Click to upload file
                  </span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.zip,.csv,.xlsx,.xls,.ppt,.pptx,.epub,.json,.txt"
                onChange={handleProductFileSelect}
                className="hidden"
              />

              {fileProgress && (
                <div className="mt-4">
                  <div className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Uploading file... {fileProgress.percentage}%
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full bg-brand-500 transition-all"
                      style={{ width: `${fileProgress.percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Header Banner */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Product Header Banner
            </h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Standard ratio is 16:9. Recommended size: 1920 × 1080.
            </p>

            {(headerBannerPreview || existingHeaderBannerUrl) ? (
              <div className="relative inline-block">
                <Image
                  src={headerBannerPreview || existingHeaderBannerUrl || ''}
                  alt="Header banner"
                  width={320}
                  height={180}
                  className="rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={removeHeaderBanner}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => headerBannerInputRef.current?.click()}
                className="flex h-32 w-56 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-brand-500 dark:border-gray-600"
              >
                <span className="text-2xl">🖼️</span>
                <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">Upload 16:9 Banner</span>
              </button>
            )}

            <input
              ref={headerBannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleHeaderBannerSelect}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <Link href="/dashboard/products" className="flex-1 sm:flex-initial">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial"
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
