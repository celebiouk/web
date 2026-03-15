/**
 * Seed Creator Content Utility
 * Automatically creates placeholder products for new creators
 * Called after onboarding profile setup completes
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Placeholder product cover images from Unsplash
const PRODUCT_COVERS = {
  guide: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=400&fit=crop',
  resource: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&h=400&fit=crop',
  coaching: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop',
};

export interface SeedResult {
  success: boolean;
  productsCreated: number;
  error?: string;
}

/**
 * Seeds a new creator's account with placeholder products
 * Creates 2 digital products and 1 coaching session
 */
export async function seedCreatorContent(
  supabase: SupabaseClient<Database>,
  creatorId: string
): Promise<SeedResult> {
  try {
    // Check if creator already has products (prevent duplicate seeding)
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creatorId);

    if (count && count > 0) {
      return {
        success: true,
        productsCreated: 0, // Already seeded
      };
    }

    // Seed products
    const products = [
      {
        creator_id: creatorId,
        title: 'My Starter Guide',
        description: 'Everything you need to get started on your journey. This comprehensive PDF guide covers all the essentials and will set you up for success.',
        price: 2700, // $27.00 in cents
        type: 'digital' as const,
        cover_image_url: PRODUCT_COVERS.guide,
        is_published: true,
        sort_order: 1,
        metadata: {
          placeholder: true,
          format: 'PDF',
          pages: '45+',
        },
      },
      {
        creator_id: creatorId,
        title: 'Exclusive Resource Pack',
        description: 'A carefully curated collection of templates, checklists, and tools I use daily. Save hours of work with these ready-to-use resources.',
        price: 4700, // $47.00 in cents
        type: 'digital' as const,
        cover_image_url: PRODUCT_COVERS.resource,
        is_published: true,
        sort_order: 2,
        metadata: {
          placeholder: true,
          format: 'ZIP',
          includes: ['Templates', 'Checklists', 'Swipe Files'],
        },
      },
      {
        creator_id: creatorId,
        title: '1:1 Strategy Call',
        description: 'Book a private strategy session with me. We\'ll dive deep into your specific challenges and create an actionable plan together.',
        price: 15000, // $150.00 in cents
        type: 'coaching' as const,
        cover_image_url: PRODUCT_COVERS.coaching,
        is_published: true,
        sort_order: 3,
        duration_minutes: 60,
        metadata: {
          placeholder: true,
          includes: ['60-min video call', 'Recording', 'Follow-up notes'],
        },
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('products')
      .insert(products);

    if (error) {
      console.error('Error seeding creator content:', error);
      return {
        success: false,
        productsCreated: 0,
        error: error.message,
      };
    }

    return {
      success: true,
      productsCreated: products.length,
    };
  } catch (error) {
    console.error('Error seeding creator content:', error);
    return {
      success: false,
      productsCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Removes placeholder products for a creator
 * Useful when creator wants to start fresh
 */
export async function clearPlaceholderContent(
  supabase: SupabaseClient<Database>,
  creatorId: string
): Promise<boolean> {
  try {
    // Only delete products marked as placeholders
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('products')
      .delete()
      .eq('creator_id', creatorId)
      .contains('metadata', { placeholder: true });

    if (error) {
      console.error('Error clearing placeholder content:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error clearing placeholder content:', error);
    return false;
  }
}
