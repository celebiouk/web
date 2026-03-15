import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { sendCancellationEmails } from '@/lib/email';
import type { Booking } from '@/types/supabase';

// Lazy initialization for Edge compatibility
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
  });
}

export async function POST(request: NextRequest) {
  try {
    const { 
      bookingId, 
      cancelToken, 
      cancelledBy,
      reason 
    }: {
      bookingId?: string;
      cancelToken?: string;
      cancelledBy: 'buyer' | 'creator';
      reason?: string;
    } = await request.json();

    const supabase = getSupabaseAdmin();
    let booking: Booking | null = null;

    // Find booking either by ID (creator) or by cancel token (buyer)
    if (cancelToken) {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('cancellation_token', cancelToken)
        .single();
      booking = data as Booking | null;
    } else if (bookingId) {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();
      booking = data as Booking | null;
    }

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if already cancelled
    if (booking.status.startsWith('cancelled')) {
      return NextResponse.json(
        { error: 'Booking already cancelled' },
        { status: 400 }
      );
    }

    // Check if booking is in the past
    if (new Date(booking.scheduled_at) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot cancel past bookings' },
        { status: 400 }
      );
    }

    // Process refund via Stripe
    let refundProcessed = false;
    let refundAmount = 0;

    if (booking.stripe_payment_intent_id) {
      const stripe = getStripe();
      
      try {
        // Calculate refund based on cancellation policy
        const hoursUntilCall = 
          (new Date(booking.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60);
        
        // Get cancellation policy from availability settings
        const { data: schedule } = await supabase
          .from('availability_schedules')
          .select('cancellation_policy, cancellation_hours')
          .eq('creator_id', booking.creator_id)
          .single();

        const policy = schedule?.cancellation_policy || '24_hours';
        const requiredHours = schedule?.cancellation_hours || 24;

        // Determine refund percentage
        let refundPercent = 100;
        if (policy === 'non_refundable') {
          refundPercent = 0;
        } else if (hoursUntilCall < requiredHours && cancelledBy === 'buyer') {
          // Late cancellation by buyer
          if (policy === '48_hours' || policy === '24_hours') {
            refundPercent = 50; // 50% refund for late cancellations
          }
        }

        // Creator cancellations always get full refund
        if (cancelledBy === 'creator') {
          refundPercent = 100;
        }

        if (refundPercent > 0) {
          const refund = await stripe.refunds.create({
            payment_intent: booking.stripe_payment_intent_id,
            amount: Math.round((booking.amount_cents * refundPercent) / 100),
          });
          refundProcessed = true;
          refundAmount = refund.amount;
        }
      } catch (refundError) {
        console.error('Refund error:', refundError);
        // Continue with cancellation even if refund fails
      }
    }

    // Update booking status
    const status = cancelledBy === 'creator' ? 'cancelled_by_creator' : 'cancelled_by_buyer';
    
    await supabase
      .from('bookings')
      .update({
        status,
        cancellation_reason: reason || 'No reason provided',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', booking.id);

    // Get creator and product info for email
    const { data: creator } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', booking.creator_id)
      .single();

    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', booking.product_id)
      .single();

    // Send cancellation emails
    try {
      await sendCancellationEmails({
        bookingId: booking.id,
        buyerName: booking.buyer_name,
        buyerEmail: booking.buyer_email,
        creatorName: creator?.display_name || creator?.username || 'Creator',
        creatorEmail: creator?.email || '',
        productTitle: product?.title || 'Coaching Call',
        scheduledAt: new Date(booking.scheduled_at),
        durationMinutes: booking.duration_minutes,
        timezone: booking.timezone || 'UTC',
        videoCallUrl: booking.video_call_url || '',
        cancellationToken: booking.cancellation_token,
        rescheduleToken: booking.reschedule_token,
        cancelledBy,
        reason,
        refundAmount,
      });
    } catch (emailError) {
      console.error('Failed to send cancellation emails:', emailError);
    }

    return NextResponse.json({
      success: true,
      refundProcessed,
      refundAmount,
    });
  } catch (error) {
    console.error('Booking cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
