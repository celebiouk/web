/**
 * Course Enrollment API
 * POST /api/courses/enroll
 * 
 * Creates a Stripe Payment Intent for course enrollment,
 * or enrolls directly for free courses.
 */

import { NextResponse } from 'next/server';
import { createConnectPaymentIntent, calculatePlatformFee } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization for Supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courseId, buyerEmail, userId } = body;
    const supabaseAdmin = getSupabaseAdmin();

    if (!courseId || !buyerEmail) {
      return NextResponse.json(
        { error: 'Course ID and buyer email are required' },
        { status: 400 }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get course
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('status', 'published')
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get creator profile
    const { data: creator, error: creatorError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id, subscription_tier, username')
      .eq('id', (course as { creator_id: string }).creator_id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_email', buyerEmail)
      .single();

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this course', alreadyEnrolled: true },
        { status: 400 }
      );
    }

    const priceCents = (course as { price_cents: number }).price_cents;

    // Free enrollment
    if (priceCents === 0) {
      const { data: enrollment, error: enrollError } = await supabaseAdmin
        .from('enrollments')
        .insert({
          course_id: courseId,
          creator_id: (course as { creator_id: string }).creator_id,
          student_email: buyerEmail,
          student_user_id: userId || null,
          amount_cents: 0,
          platform_fee_cents: 0,
          net_amount_cents: 0,
        })
        .select()
        .single();

      if (enrollError) {
        console.error('Enrollment creation error:', enrollError);
        return NextResponse.json(
          { error: 'Failed to enroll' },
          { status: 500 }
        );
      }

      // Increment student count
      const rpcResult = await supabaseAdmin.rpc('increment_student_count', { course_id: courseId });
      if (rpcResult.error) {
        // Fallback: manual increment
        await (supabaseAdmin.from('courses') as any)
          .update({ student_count: ((course as { student_count: number }).student_count || 0) + 1 })
          .eq('id', courseId);
      }

      return NextResponse.json({
        enrollmentId: (enrollment as { id: string }).id,
        free: true,
        username: (creator as { username: string | null }).username,
      });
    }

    // Paid enrollment — create payment intent
    if (!(creator as { stripe_account_id: string | null }).stripe_account_id) {
      return NextResponse.json(
        { error: 'Creator has not set up payments' },
        { status: 400 }
      );
    }

    const platformFeeCents = calculatePlatformFee(
      priceCents,
      (creator as { subscription_tier: 'free' | 'pro' }).subscription_tier
    );

    const paymentIntent = await createConnectPaymentIntent({
      amountCents: priceCents,
      creatorStripeAccountId: (creator as { stripe_account_id: string }).stripe_account_id,
      platformFeeCents,
      metadata: {
        type: 'course_enrollment',
        course_id: courseId,
        buyer_email: buyerEmail,
        student_user_id: userId || '',
        creator_id: (course as { creator_id: string }).creator_id,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: priceCents,
      username: (creator as { username: string | null }).username,
    });
  } catch (error) {
    console.error('Course enrollment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
