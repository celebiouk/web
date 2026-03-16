'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, Button, Input, Badge, Spinner } from '@/components/ui';
import { ProductRichTextEditor } from '@/components/dashboard/ProductRichTextEditor';
import { createClient } from '@/lib/supabase/client';
import { uploadFile, validateFile, FILE_TYPES, type UploadProgress } from '@/lib/utils/uploadFile';
import { FileText, GraduationCap, Users, type LucideIcon } from 'lucide-react';
import type { ProductType } from '@/types/supabase';

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

export default function NewProductPage() {
  const router = useRouter();
  const supabase = createClient();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const headerBannerInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [productType, setProductType] = useState<ProductType>('digital');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionHtml, setDescriptionHtml] = useState('<p></p>');
  const [price, setPrice] = useState('');
  const [currency] = useState('usd');

  // File state
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [headerBannerFile, setHeaderBannerFile] = useState<File | null>(null);
  const [headerBannerPreview, setHeaderBannerPreview] = useState<string | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [coverProgress, setCoverProgress] = useState<UploadProgress | null>(null);
  const [fileProgress, setFileProgress] = useState<UploadProgress | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: FILE_TYPES.images,
    });

    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setError(null);
  }

  function handleProductFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: FILE_TYPES.digitalProducts,
    });

    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setProductFile(file);
    setError(null);
  }

  function handleHeaderBannerSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: FILE_TYPES.images,
    });

    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setHeaderBannerFile(file);
    setHeaderBannerPreview(URL.createObjectURL(file));
    setError(null);
  }

  function removeCover() {
    setCoverFile(null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  }

  function removeProductFile() {
    setProductFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeHeaderBanner() {
    setHeaderBannerFile(null);
    if (headerBannerPreview) URL.revokeObjectURL(headerBannerPreview);
    setHeaderBannerPreview(null);
    if (headerBannerInputRef.current) headerBannerInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!coverFile) {
      setError('Product thumbnail is required');
      return;
    }

    if (!headerBannerFile) {
      setError('Product header banner is required (16:9, recommended 1920×1080)');
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      setError('Please enter a valid price');
      return;
    }

    if (productType === 'digital' && !productFile) {
      setError('Please upload a product file');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      let coverImageUrl: string | null = null;
      let headerBannerUrl: string | null = null;
      let fileUrl: string | null = null;

      // Upload cover image
      if (coverFile) {
        const result = await uploadFile('product-covers', coverFile, {
          folder: user.id,
          onProgress: setCoverProgress,
        });
        coverImageUrl = result.publicUrl || null;
      }

      // Upload product header banner (stored in product-covers bucket under headers/)
      if (headerBannerFile) {
        const result = await uploadFile('product-covers', headerBannerFile, {
          folder: `${user.id}/headers`,
        });
        headerBannerUrl = result.publicUrl || null;
      }

      // Upload product file
      if (productFile) {
        const result = await uploadFile('product-files', productFile, {
          folder: user.id,
          onProgress: setFileProgress,
        });
        fileUrl = result.path;
      }

      // Convert price to cents
      const priceInCents = Math.round(priceValue * 100);

      // Create product
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any).from('products').insert({
        creator_id: user.id,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        description: description.trim() || null,
        description_html: descriptionHtml.trim() || null,
        price: priceInCents,
        currency,
        type: productType,
        cover_image_url: coverImageUrl,
        header_banner_url: headerBannerUrl,
        file_url: fileUrl,
        is_published: false,
        metadata: {},
      });

      if (insertError) throw insertError;

      router.push('/dashboard/products');

    } catch (err) {
      console.error('Create product error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('storage') || errorMessage.includes('bucket')) {
        setError('File upload failed. Please ensure storage is configured properly.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('RLS')) {
        setError('Permission denied. Please try logging out and back in.');
      } else {
        setError(`Failed to create product: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
      setCoverProgress(null);
      setFileProgress(null);
    }
  }

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
            New Product
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Create a new digital product to sell
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
                Subtitle
              </label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="One short line that explains the core transformation"
                maxLength={140}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <ProductRichTextEditor
                value={descriptionHtml}
                onChange={(html, plainText) => {
                  setDescriptionHtml(html);
                  setDescription(plainText.slice(0, 5000));
                }}
                placeholder="Write your long-form sales copy with formatting, lists, images, and YouTube links."
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
              <p className="mt-1 text-xs text-gray-500">
                Enter 0 for a free product
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cover Image */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Cover Image
            </h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              This image will be displayed on your page. Recommended: 800x600px
            </p>

            {coverPreview ? (
              <div className="relative inline-block">
                <Image
                  src={coverPreview}
                  alt="Cover preview"
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

        {/* Header Banner Image */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Product Header Banner *
            </h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Standard ratio is 16:9. Recommended design size: 1920 × 1080.
            </p>

            {headerBannerPreview ? (
              <div className="relative inline-block">
                <Image
                  src={headerBannerPreview}
                  alt="Header banner preview"
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
                <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Upload 16:9 Banner
                </span>
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

        {/* Product File */}
        {productType === 'digital' && (
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Product File *
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Upload the file customers will download after purchase. Max 50MB.
              </p>

              {productFile ? (
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {productFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(productFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
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
                  <span className="mt-1 text-xs text-gray-400">
                    PDF, ZIP, CSV, XLSX, PPT accepted
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

        {/* Coaching Info */}
        {productType === 'coaching' && (
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Coaching Setup
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                After purchase, buyers will receive an email with instructions to schedule a session.
                You can customize the booking process in settings.
              </p>
              <Badge variant="default" className="mt-4">
                Coming Soon: Calendar Integration
              </Badge>
            </CardContent>
          </Card>
        )}

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
                Creating...
              </>
            ) : (
              'Create Product'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
