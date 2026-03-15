import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendRescheduleEmails } from '@/lib/email';
import type { Booking } from '@/types/supabase';

// Lazy initialization for Edge compatibility
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const { 
      bookingId, 
      rescheduleToken, 
      newDateTime,
      rescheduledBy 
    }: {
      bookingId?: string;
      rescheduleToken?: string;
      newDateTime: string;
      rescheduledBy: 'buyer' | 'creator';
    } = await request.json();

    const supabase = getSupabaseAdmin();
    let booking: Booking | null = null;

    // Find booking by ID or reschedule token
    if (rescheduleToken) {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('reschedule_token', rescheduleToken)
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

    // Validate booking can be rescheduled
    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Only confirmed bookings can be rescheduled' },
        { status: 400 }
      );
    }

    // Check if original date is in the past
    if (new Date(booking.scheduled_at) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot reschedule past bookings' },
        { status: 400 }
      );
    }

    // Validate new date is in the future
    const newDate = new Date(newDateTime);
    if (newDate < new Date()) {
      return NextResponse.json(
        { error: 'New date must be in the future' },
        { status: 400 }
      );
    }

    // Check for conflicts (another booking at the same time)
    const startWindow = new Date(newDate);
    const endWindow = new Date(newDate.getTime() + booking.duration_minutes * 60 * 1000);

    const { data: conflicts } = await supabase
      .from('bookings')
      .select('id')
      .eq('creator_id', booking.creator_id)
      .eq('status', 'confirmed')
      .neq('id', booking.id)
      .gte('scheduled_at', startWindow.toISOString())
      .lt('scheduled_at', endWindow.toISOString());

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 }
      );
    }

    // Store old date for email
    const oldDateTime = booking.scheduled_at;

    // Update booking with new date and new reschedule token
    const newRescheduleToken = crypto.randomUUID();
    
    await supabase
      .from('bookings')
      .update({
        scheduled_at: newDateTime,
        reschedule_token: newRescheduleToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id);

    // Get creator and product info
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

    // Send reschedule emails
    try {
      await sendRescheduleEmails({
        bookingId: booking.id,
        buyerName: booking.buyer_name,
        buyerEmail: booking.buyer_email,
        creatorName: creator?.display_name || creator?.username || 'Creator',
        creatorEmail: creator?.email || '',
        productTitle: product?.title || 'Coaching Call',
        scheduledAt: new Date(newDateTime),
        durationMinutes: booking.duration_minutes,
        timezone: booking.timezone || 'UTC',
        videoCallUrl: booking.video_call_url || '',
        cancellationToken: booking.cancellation_token,
        rescheduleToken: newRescheduleToken,
        oldScheduledAt: new Date(oldDateTime),
      });
    } catch (emailError) {
      console.error('Failed to send reschedule emails:', emailError);
    }

    return NextResponse.json({
      success: true,
      newDateTime,
    });
  } catch (error) {
    console.error('Booking reschedule error:', error);
    return NextResponse.json(
      { error: 'Failed to reschedule booking' },
      { status: 500 }
    );
  }
}
