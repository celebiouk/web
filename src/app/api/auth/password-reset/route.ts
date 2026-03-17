/**
 * Custom Password Reset API
 * Sends beautiful branded password reset emails via Resend only
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
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const supabaseAdmin = getSupabaseAdmin();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cele.bio';
    const finalRedirectTo = new URL('/reset-password', appUrl).toString();
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'cele.bio <noreply@cele.bio>';

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      );
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
      // Keep success response to avoid user enumeration in auth flows
      return NextResponse.json({ success: true });
    }

    if (!data?.properties?.action_link) {
      console.error('No action link generated');
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
        from: fromEmail,
        to: email,
        subject: 'Reset your cele.bio password',
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', errorData);
      return NextResponse.json(
        { error: 'Unable to send reset email right now' },
        { status: 502 }
      );
    }

    console.log('Password reset email sent successfully via Resend to:', email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
