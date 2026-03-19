'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button, Input, Spinner } from '@/components/ui';
import { BrandWordmark } from '@/components/ui/brand-wordmark';
import { createClient } from '@/lib/supabase/client';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Flame, 
  DollarSign,
  ArrowUpDown,
  ChevronDown,
  Check,
  X,
  Users,
  ShoppingBag
} from 'lucide-react';

type AffiliateProduct = {
  id: string;
  title: string;
  description: string | null;
  price_cents: number;
  cover_image_url: string | null;
  product_type: string;
  affiliate_commission_rate: number;
  total_affiliate_sales: number;
  created_at: string;
  creator_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
};

const CATEGORIES = [
  'All Categories',
  'Digital Products',
  'Courses',
  'Coaching',
  'Templates',
  'Ebooks',
  'Presets',
  'Other'
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'commission_high', label: 'Highest Commission' },
  { value: 'commission_low', label: 'Lowest Commission' },
  { value: 'most_sold', label: 'Most Sold' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'price_low', label: 'Price: Low to High' },
];

export default function AffiliateMarketplacePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [promotingIds, setPromotingIds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadProducts();
    checkAuth();
  }, [sortBy]);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      // Load products user is already promoting
      const { data } = await (supabase as any)
        .from('affiliate_promotions')
        .select('product_id')
        .eq('promoter_id', user.id) as { data: { product_id: string }[] | null };
      
      if (data) {
        setPromotingIds(new Set(data.map(p => p.product_id)));
      }
    }
  }

  async function loadProducts() {
    setIsLoading(true);
    try {
      let query = (supabase as any)
        .from('affiliate_marketplace')
        .select('*');
      
      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'commission_high':
          query = query.order('affiliate_commission_rate', { ascending: false });
          break;
        case 'commission_low':
          query = query.order('affiliate_commission_rate', { ascending: true });
          break;
        case 'most_sold':
          query = query.order('total_affiliate_sales', { ascending: false });
          break;
        case 'price_high':
          query = query.order('price_cents', { ascending: false });
          break;
        case 'price_low':
          query = query.order('price_cents', { ascending: true });
          break;
      }

      const { data, error } = await query as { data: AffiliateProduct[] | null, error: any };
      
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePromote(productId: string) {
    if (!user) {
      router.push('/signup?redirect=/affiliate-marketplace&message=Create a free account to start promoting');
      return;
    }

    if (promotingIds.has(productId)) {
      return; // Already promoting
    }

    setAddingId(productId);
    try {
      const { error } = await (supabase as any)
        .from('affiliate_promotions')
        .insert({
          promoter_id: user.id,
          product_id: productId,
          display_mode: 'list',
          sort_order: promotingIds.size
        });

      if (error) throw error;

      setPromotingIds(prev => new Set([...prev, productId]));
      showToast('Added to your page!', 'success');
    } catch (err) {
      console.error('Failed to add promotion:', err);
      showToast('Failed to add. Try again.', 'error');
    } finally {
      setAddingId(null);
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  // Filter products by search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All Categories' || 
      product.product_type.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-white shadow-lg animate-fade-in ${
          toast.type === 'success' ? 'bg-success-500' : 'bg-red-500'
        }`}>
          {toast.type === 'success' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
          {toast.message}
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-950/80">
        <div className="container-page flex items-center justify-between py-4">
          <Link href="/" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            <BrandWordmark dotClassName="text-brand-600" />
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get Started Free</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-50 to-white py-16 dark:from-brand-950/20 dark:to-gray-950">
        <div className="container-page text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-success-50 px-4 py-2 text-sm font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400 mb-6">
            <DollarSign className="h-4 w-4" />
            Earn commissions on every sale
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white md:text-5xl lg:text-6xl mb-4">
            Affiliate <span className="text-brand-600">Marketplace</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Earn commissions promoting products you believe in. Browse products from top creators, 
            add them to your page, and earn up to 50% on every sale.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success-500" />
              Next-day payouts
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success-500" />
              Real-time tracking
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success-500" />
              No approval needed
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="sticky top-[65px] z-30 border-b border-gray-200 bg-white py-4 dark:border-gray-800 dark:bg-gray-950">
        <div className="container-page">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search products, creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 md:hidden"
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Filters (Desktop always visible, Mobile collapsible) */}
            <div className={`flex flex-col gap-3 md:flex-row md:items-center ${showFilters ? '' : 'hidden md:flex'}`}>
              {/* Category Dropdown */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-12">
        <div className="container-page">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : filteredProducts.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10 mb-6">
                <ShoppingBag className="h-10 w-10 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery || selectedCategory !== 'All Categories' 
                  ? 'No products found' 
                  : 'Be the first creator to enable affiliates'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'All Categories'
                  ? 'Try adjusting your search or filters'
                  : 'Enable affiliate program on your products and let others promote them for you'}
              </p>
              <Link href="/dashboard/products">
                <Button>Create a Product</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isPromoting={promotingIds.has(product.id)}
                    isAdding={addingId === product.id}
                    onPromote={() => handlePromote(product.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-gray-200 bg-gray-100 py-16 dark:border-gray-800 dark:bg-gray-900">
        <div className="container-page text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Want to list your products here?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Enable affiliate program on your products and let thousands of creators promote them for you.
          </p>
          <Link href="/signup">
            <Button size="lg">Create Your Free Page</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 dark:border-gray-800">
        <div className="container-page flex flex-col items-center justify-between gap-4 md:flex-row">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            <BrandWordmark dotClassName="text-brand-600" />
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Cele.bio. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

function ProductCard({ 
  product, 
  isPromoting, 
  isAdding,
  onPromote 
}: { 
  product: AffiliateProduct;
  isPromoting: boolean;
  isAdding: boolean;
  onPromote: () => void;
}) {
  const commissionAmount = (product.price_cents * product.affiliate_commission_rate) / 100;
  const commissionPercent = Math.round(product.affiliate_commission_rate * 100);
  const isTrending = product.total_affiliate_sales > 100;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/5 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/30">
      {/* Cover Image */}
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800">
        {product.cover_image_url ? (
          <Image
            src={product.cover_image_url}
            alt={product.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-gray-300 dark:text-gray-700" />
          </div>
        )}
        
        {/* Trending Badge */}
        {isTrending && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-orange-500 px-2 py-1 text-xs font-medium text-white">
            <Flame className="h-3 w-3" />
            Trending
          </div>
        )}

        {/* Commission Badge */}
        <div className="absolute bottom-3 right-3 rounded-full bg-success-500 px-3 py-1 text-sm font-bold text-white shadow-lg">
          Earn ${commissionAmount.toFixed(2)}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Creator */}
        <div className="mb-2 flex items-center gap-2">
          {product.avatar_url ? (
            <Image
              src={product.avatar_url}
              alt={product.full_name || product.username}
              width={24}
              height={24}
              className="rounded-full"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
              <Users className="h-3 w-3 text-brand-600" />
            </div>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {product.full_name || `@${product.username}`}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
          {product.title}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        {/* Price & Stats */}
        <div className="mt-auto flex items-center justify-between text-sm">
          <span className="font-bold text-gray-900 dark:text-white">
            ${(product.price_cents / 100).toFixed(2)}
          </span>
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {product.total_affiliate_sales} sold
            </span>
            <span className="text-success-600 font-medium">
              {commissionPercent}%
            </span>
          </div>
        </div>

        {/* Promote Button */}
        <button
          onClick={onPromote}
          disabled={isPromoting || isAdding}
          className={`mt-4 w-full rounded-lg py-2.5 text-sm font-semibold transition-colors ${
            isPromoting
              ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400 cursor-default'
              : 'bg-brand-600 text-white hover:bg-brand-700'
          }`}
        >
          {isAdding ? (
            <Spinner size="sm" />
          ) : isPromoting ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              Promoting
            </span>
          ) : (
            'Promote This'
          )}
        </button>
      </div>
    </div>
  );
}
