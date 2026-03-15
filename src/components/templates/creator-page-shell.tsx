import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Package } from 'lucide-react';
import { Avatar, Badge, Button } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import type { Profile, Product } from '@/types/supabase';

interface CreatorPageShellProps {
  profile: Profile;
  template: {
    id: string;
    name: string;
    slug: string;
    category: string;
  } | null;
  products: Product[];
}

/**
 * Creator's public page shell
 * Renders the selected template with creator's profile and products
 */
export function CreatorPageShell({
  profile,
  template,
  products,
}: CreatorPageShellProps) {
  // Get template styles based on category
  const templateStyles = getTemplateStyles(template?.category || 'minimal');

  // Separate products by type
  const digitalProducts = products.filter((p) => p.type === 'digital');
  const coachingProducts = products.filter((p) => p.type === 'coaching');

  // Placeholder products for new creators
  const showPlaceholders = products.length === 0;

  return (
    <div className={templateStyles.container}>
      {/* Mobile-first single column layout */}
      <main className="mx-auto min-h-screen max-w-lg px-4 py-8 md:py-12">
        {/* Profile Header */}
        <header className="mb-10 text-center">
          <Avatar
            src={profile.avatar_url}
            name={profile.full_name || profile.username || 'Creator'}
            size="xl"
            className="mx-auto mb-4"
          />
          <h1 className={`text-2xl font-bold ${templateStyles.heading}`}>
            {profile.full_name}
          </h1>
          {profile.bio && (
            <p className={`mt-2 ${templateStyles.text}`}>{profile.bio}</p>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-2 inline-block text-sm ${templateStyles.link}`}
            >
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </header>

        {/* Products Section */}
        <section className="space-y-6">
          {/* Show placeholder products for new creators */}
          {showPlaceholders ? (
            <>
              <PlaceholderProductCard
                type="digital"
                templateStyles={templateStyles}
              />
              <PlaceholderProductCard
                type="digital"
                templateStyles={templateStyles}
              />
              <PlaceholderProductCard
                type="coaching"
                templateStyles={templateStyles}
              />
            </>
          ) : (
            <>
              {/* Digital Products */}
              {digitalProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  templateStyles={templateStyles}
                />
              ))}

              {/* Coaching Products */}
              {coachingProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  templateStyles={templateStyles}
                />
              ))}
            </>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-gray-200 pt-8 text-center dark:border-gray-800">
          <Link
            href="/"
            className={`text-sm ${templateStyles.muted}`}
          >
            Powered by{' '}
            <span className="font-semibold">cele.bio</span>
          </Link>
        </footer>
      </main>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  templateStyles: TemplateStyles;
}

function ProductCard({ product, templateStyles }: ProductCardProps) {
  const buttonText = product.type === 'coaching' ? 'Book Now' : product.price === 0 ? 'Get Free' : 'Buy Now';
  
  return (
    <div className={`overflow-hidden rounded-2xl border ${templateStyles.card}`}>
      {product.cover_image_url && (
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
          <Image
            src={product.cover_image_url}
            alt={product.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-4">
          <h3 className={`font-semibold ${templateStyles.heading}`}>
            {product.title}
          </h3>
          <Badge
            variant={product.type === 'coaching' ? 'brand' : 'default'}
            size="sm"
          >
            {product.type === 'coaching' ? '1:1 Call' : 'Digital'}
          </Badge>
        </div>
        {product.description && (
          <p className={`mb-4 text-sm line-clamp-2 ${templateStyles.text}`}>
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className={`text-lg font-bold ${templateStyles.heading}`}>
            {product.price === 0 ? 'Free' : formatPrice(product.price, product.currency)}
          </span>
          <Link href={`/checkout/${product.id}`}>
            <Button size="sm">{buttonText}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

interface PlaceholderProductCardProps {
  type: 'digital' | 'coaching';
  templateStyles: TemplateStyles;
}

function PlaceholderProductCard({
  type,
  templateStyles,
}: PlaceholderProductCardProps) {
  const isCoaching = type === 'coaching';

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${templateStyles.card} opacity-60`}
    >
      <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          {isCoaching ? (
            <Calendar className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
          ) : (
            <Package className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
          )}
        </div>
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-4">
          <h3 className={`font-semibold ${templateStyles.heading}`}>
            {isCoaching ? '1:1 Coaching Session' : 'Digital Product'}
          </h3>
          <Badge variant={isCoaching ? 'brand' : 'default'} size="sm">
            {isCoaching ? '1:1 Call' : 'Digital'}
          </Badge>
        </div>
        <p className={`mb-4 text-sm ${templateStyles.text}`}>
          {isCoaching
            ? 'Book a personal session with me'
            : 'A premium digital product for you'}
        </p>
        <div className="flex items-center justify-between">
          <span className={`text-lg font-bold ${templateStyles.heading}`}>
            {isCoaching ? '$99' : '$29'}
          </span>
          <Button size="sm" disabled>
            Coming Soon
          </Button>
        </div>
      </div>
    </div>
  );
}

interface TemplateStyles {
  container: string;
  heading: string;
  text: string;
  muted: string;
  link: string;
  card: string;
}

/**
 * Get template-specific styles based on category
 * These will be expanded in Phase 2 with full template engine
 */
function getTemplateStyles(category: string): TemplateStyles {
  const styles: Record<string, TemplateStyles> = {
    minimal: {
      container: 'bg-white dark:bg-gray-950',
      heading: 'text-gray-900 dark:text-white',
      text: 'text-gray-600 dark:text-gray-400',
      muted: 'text-gray-400 dark:text-gray-500',
      link: 'text-brand-600 hover:text-brand-700 dark:text-brand-400',
      card: 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
    },
    bold: {
      container: 'bg-gray-950',
      heading: 'text-white',
      text: 'text-gray-300',
      muted: 'text-gray-500',
      link: 'text-accent-400 hover:text-accent-300',
      card: 'border-gray-800 bg-gray-900',
    },
    elegant: {
      container: 'bg-stone-50 dark:bg-gray-950',
      heading: 'text-stone-900 dark:text-stone-100',
      text: 'text-stone-600 dark:text-stone-400',
      muted: 'text-stone-400 dark:text-stone-500',
      link: 'text-amber-600 hover:text-amber-700 dark:text-amber-400',
      card: 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900',
    },
    creative: {
      container: 'bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950',
      heading: 'text-gray-900 dark:text-white',
      text: 'text-gray-600 dark:text-gray-400',
      muted: 'text-gray-400 dark:text-gray-500',
      link: 'text-purple-600 hover:text-purple-700 dark:text-purple-400',
      card: 'border-purple-100 bg-white/80 backdrop-blur dark:border-purple-900/30 dark:bg-gray-900/80',
    },
    professional: {
      container: 'bg-slate-50 dark:bg-slate-950',
      heading: 'text-slate-900 dark:text-slate-100',
      text: 'text-slate-600 dark:text-slate-400',
      muted: 'text-slate-400 dark:text-slate-500',
      link: 'text-blue-600 hover:text-blue-700 dark:text-blue-400',
      card: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
    },
  };

  return styles[category] || styles.minimal;
}
