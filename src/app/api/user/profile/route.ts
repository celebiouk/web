/**
 * User Profile API
 * GET /api/user/profile
 * 
 * Returns the authenticated user's profile
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ProfileUpdate } from '@/types/supabase';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const updates = await request.json();

    // Only allow specific fields to be updated
    const allowedFields = [
      'full_name',
      'bio',
      'avatar_url',
      'website',
      'social_links',
      'page_theme',
      'template_slug',
    ];

    const sanitizedUpdates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in updates) {
        sanitizedUpdates[field] = updates[field];
      }
    }

    // Update profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile, error: updateError } = await (supabase as any)
      .from('profiles')
      .update(sanitizedUpdates)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(profile);

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
