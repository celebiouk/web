/**
 * Booking Confirmation API
 * POST /api/bookings/confirm
 * 
 * Confirms a booking and sends notification emails
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBookingConfirmationEmails } from '@/lib/email';
import type { Booking, Product, Profile, AvailabilitySchedule } from '@/types/supabase';

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
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get booking
    const { data: bookingData, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !bookingData) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const booking = bookingData as unknown as Booking;

    // Update status to confirmed if pending
    if (booking.status === 'pending') {
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);
    }

    // Get product
    let productTitle = 'Coaching Call';
    if (booking.product_id) {
      const { data: productData } = await supabaseAdmin
        .from('products')
        .select('title')
        .eq('id', booking.product_id)
        .single();
      
      if (productData) {
        productTitle = productData.title;
      }
    }

    // Get creator
    const { data: creatorData, error: creatorError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', booking.creator_id)
      .single();

    if (creatorError || !creatorData) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    const creator = creatorData as unknown as Profile;

    // Get creator's custom confirmation message
    const { data: scheduleData } = await supabaseAdmin
      .from('availability_schedules')
      .select('custom_confirmation_message')
      .eq('creator_id', creator.id)
      .single();

    // Send confirmation emails
    const emailResult = await sendBookingConfirmationEmails({
      bookingId: booking.id,
      buyerName: booking.buyer_name,
      buyerEmail: booking.buyer_email,
      creatorName: creator.full_name || creator.username || 'Creator',
      creatorEmail: 'noreply@cele.bio', // Use creator's email when available
      productTitle,
      scheduledAt: new Date(booking.scheduled_at),
      durationMinutes: booking.duration_minutes,
      timezone: booking.timezone,
      videoCallUrl: booking.video_call_url || '',
      cancellationToken: booking.cancellation_token,
      rescheduleToken: booking.reschedule_token,
      customMessage: scheduleData?.custom_confirmation_message || undefined,
      amountCents: booking.amount_cents,
    });

    return NextResponse.json({
      success: true,
      emailsSent: {
        buyer: emailResult.buyer.success,
        creator: emailResult.creator.success,
      },
    });

  } catch (error) {
    console.error('Booking confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm booking' },
      { status: 500 }
    );
  }
}
