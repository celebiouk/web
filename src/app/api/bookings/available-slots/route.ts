/**
 * Available Slots API
 * POST /api/bookings/available-slots
 * 
 * Returns available time slots for a given date
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  generateAvailableSlots, 
  formatDateToString,
} from '@/lib/utils/generateAvailableSlots';
import type { WeeklySchedule } from '@/types/supabase';

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
    const { creatorId, date, durationMinutes, buyerTimezone } = body;

    if (!creatorId || !date) {
      return NextResponse.json(
        { error: 'Creator ID and date are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get creator's availability schedule
    const { data: schedule, error: scheduleError } = await supabaseAdmin
      .from('availability_schedules')
      .select('*')
      .eq('creator_id', creatorId)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json({ slots: [] });
    }

    // Get blocked dates
    const { data: blockedDatesData } = await supabaseAdmin
      .from('blocked_dates')
      .select('blocked_date')
      .eq('creator_id', creatorId);

    const blockedDates = (blockedDatesData || []).map(d => d.blocked_date);

    // Get existing bookings for this date
    const dateObj = new Date(date + 'T00:00:00');
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    const { data: existingBookings } = await supabaseAdmin
      .from('bookings')
      .select('scheduled_at, duration_minutes, status')
      .eq('creator_id', creatorId)
      .gte('scheduled_at', dateObj.toISOString())
      .lt('scheduled_at', nextDay.toISOString())
      .not('status', 'like', 'cancelled%');

    // Generate available slots
    const slots = generateAvailableSlots({
      date: dateObj,
      weeklySchedule: schedule.weekly_schedule as WeeklySchedule,
      blockedDates,
      existingBookings: existingBookings || [],
      durationMinutes: durationMinutes || 60,
      bufferMinutes: schedule.buffer_minutes || 15,
      minNoticeHours: schedule.min_notice_hours || 4,
      maxBookingsPerDay: schedule.max_bookings_per_day || 10,
      creatorTimezone: schedule.timezone,
      buyerTimezone,
    });

    return NextResponse.json({
      slots: slots.map(slot => ({
        time: slot.time,
        datetime: slot.datetime.toISOString(),
        available: slot.available,
      })),
    });

  } catch (error) {
    console.error('Available slots error:', error);
    return NextResponse.json(
      { error: 'Failed to get available slots' },
      { status: 500 }
    );
  }
}
