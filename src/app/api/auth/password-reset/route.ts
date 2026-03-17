/**
 * Custom Password Reset API
 * Sends beautiful branded password reset emails via Resend
 * Falls back to Supabase default email if Resend is not configured
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { render } from '@react-email/components';
import { PasswordReset } from '@/../emails/PasswordReset';
import type { Database } from '@/types/supabase';

// Get admin client for generating recovery link
function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const { email, redirectTo } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const supabaseAdmin = getSupabaseAdmin();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cele.bio';
    const finalRedirectTo = redirectTo || `${appUrl}/reset-password`;

    // If Resend is not configured, use Supabase default email
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, using Supabase default email');
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: finalRedirectTo,
      });
      if (error) {
        console.error('Supabase reset email error:', error);
      }
      return NextResponse.json({ success: true });
    }

    // Generate the password recovery link using Supabase Admin API
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: finalRedirectTo,
      },
    });

    if (linkError) {
      console.error('Generate link error:', linkError);
      // Fall back to Supabase default email
      await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: finalRedirectTo,
      });
      return NextResponse.json({ success: true });
    }

    if (!data?.properties?.action_link) {
      console.error('No action link generated');
      // Fall back to Supabase default email
      await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: finalRedirectTo,
      });
      return NextResponse.json({ success: true });
    }

    // Try to get the user's name for personalization
    let userName = 'there';
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', data.user?.id || '')
        .single();
      
      if (profile?.full_name) {
        userName = profile.full_name.split(' ')[0]; // First name only
      }
    } catch {
      // Ignore - use default greeting
    }

    // Render the beautiful email template
    const emailHtml = await render(
      PasswordReset({
        userName,
        resetUrl: data.properties.action_link,
        expiresIn: '1 hour',
      })
    );

    // Send via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'cele.bio <noreply@cele.bio>',
        to: email,
        subject: 'Reset your cele.bio password',
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', errorData);
      // Fall back to Supabase default email
      await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: finalRedirectTo,
      });
      return NextResponse.json({ success: true });
    }

    console.log('Password reset email sent successfully via Resend to:', email);
    return NextResponse.json({ success: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true });
  }
}
