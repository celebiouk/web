/**
 * Create Booking Payment Intent API
 * POST /api/bookings/create-payment-intent
 * 
 * Creates a Stripe Payment Intent for a booking
 * Uses Stripe Connect to route payment to the creator
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

// Generate Whereby room URL (placeholder - implement with actual API)
async function generateVideoCallUrl(bookingId: string): Promise<string> {
  // If Whereby API key is configured, create a room
  const wherebyApiKey = process.env.WHEREBY_API_KEY;
  
  if (wherebyApiKey) {
    try {
      const response = await fetch('https://api.whereby.dev/v1/meetings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${wherebyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          fields: ['hostRoomUrl', 'viewerRoomUrl'],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.roomUrl || data.hostRoomUrl;
      }
    } catch (error) {
      console.error('Whereby API error:', error);
    }
  }

  // Fallback: generate a placeholder URL (creator should set custom URL)
  return `https://cele.bio/call/${bookingId}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      productId,
      creatorId,
      scheduledAt,
      durationMinutes,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerNotes,
      buyerTimezone,
      intakeAnswers,
    } = body;

    const supabaseAdmin = getSupabaseAdmin();

    // Validate required fields
    if (!productId || !creatorId || !scheduledAt || !buyerName || !buyerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get product
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('type', 'coaching')
      .eq('is_published', true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get creator profile
    const { data: creator, error: creatorError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id, subscription_tier')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator?.stripe_account_id) {
      return NextResponse.json(
        { error: 'Creator has not set up payments' },
        { status: 400 }
      );
    }

    // Get creator's availability settings for video platform
    const { data: scheduleData } = await supabaseAdmin
      .from('availability_schedules')
      .select('video_platform, custom_video_url')
      .eq('creator_id', creatorId)
      .single();

    // Determine video call URL
    let videoCallUrl: string;
    if (scheduleData?.video_platform !== 'whereby' && scheduleData?.custom_video_url) {
      videoCallUrl = scheduleData.custom_video_url;
    } else {
      videoCallUrl = await generateVideoCallUrl(crypto.randomUUID());
    }

    // Handle free products
    if (product.price === 0) {
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from('bookings')
        .insert({
          product_id: productId,
          creator_id: creatorId,
          buyer_name: buyerName,
          buyer_email: buyerEmail,
          buyer_phone: buyerPhone || null,
          buyer_notes: buyerNotes || null,
          intake_answers: intakeAnswers || {},
          scheduled_at: scheduledAt,
          duration_minutes: durationMinutes || 60,
          timezone: buyerTimezone || 'America/New_York',
          amount_cents: 0,
          platform_fee_cents: 0,
          video_call_url: videoCallUrl,
          status: 'confirmed',
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Booking creation error:', bookingError);
        return NextResponse.json(
          { error: 'Failed to create booking' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        bookingId: booking.id,
        free: true,
      });
    }

    // Calculate platform fee
    const platformFee = calculatePlatformFee(product.price, creator.subscription_tier);

    // Create Payment Intent with Connect
    const paymentIntent = await createConnectPaymentIntent({
      amountCents: product.price,
      creatorStripeAccountId: creator.stripe_account_id,
      platformFeeCents: platformFee,
      metadata: {
        type: 'booking',
        productId,
        creatorId,
        buyerEmail,
        buyerName,
        scheduledAt,
      },
    });

    // Create pending booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        product_id: productId,
        creator_id: creatorId,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone || null,
        buyer_notes: buyerNotes || null,
        intake_answers: intakeAnswers || {},
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes || 60,
        timezone: buyerTimezone || 'America/New_York',
        amount_cents: product.price,
        platform_fee_cents: platformFee,
        stripe_payment_intent_id: paymentIntent.id,
        video_call_url: videoCallUrl,
        status: 'pending',
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      bookingId: booking.id,
    });

  } catch (error) {
    console.error('Booking payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create booking payment' },
      { status: 500 }
    );
  }
}
