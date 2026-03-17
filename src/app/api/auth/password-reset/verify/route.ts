import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { token_hash, type } = await request.json();

    if (!token_hash || type !== 'recovery') {
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash,
    });

    if (error) {
      return NextResponse.json({ error: 'Reset link is expired or invalid' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset verify error:', error);
    return NextResponse.json({ error: 'Failed to verify reset token' }, { status: 500 });
  }
}
