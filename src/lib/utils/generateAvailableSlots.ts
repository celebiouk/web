/**
 * Slot Generation Algorithm
 * Generates available time slots for booking based on creator's schedule
 */

import type { WeeklySchedule, DaySchedule, Booking } from '@/types/supabase';

export interface GenerateSlotsParams {
  date: Date;
  weeklySchedule: WeeklySchedule;
  blockedDates: string[]; // YYYY-MM-DD format
  existingBookings: Array<{
    scheduled_at: string;
    duration_minutes: number;
    status: string;
  }>;
  durationMinutes: number;
  bufferMinutes: number;
  minNoticeHours: number;
  maxBookingsPerDay: number;
  creatorTimezone: string;
  buyerTimezone?: string;
}

export interface TimeSlot {
  time: string; // "HH:MM" format in creator's timezone
  datetime: Date; // Full datetime object
  available: boolean;
  reason?: string;
}

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

/**
 * Parse time string to minutes since midnight
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Format minutes since midnight to "HH:MM" string
 */
function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get day schedule for a specific date
 */
function getDaySchedule(date: Date, weeklySchedule: WeeklySchedule): DaySchedule | null {
  const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
  const schedule = weeklySchedule[dayOfWeek];
  
  if (!schedule || !schedule.enabled) {
    return null;
  }
  
  return schedule;
}

/**
 * Check if a date is blocked
 */
function isDateBlocked(date: Date, blockedDates: string[]): boolean {
  const dateStr = formatDateToString(date);
  return blockedDates.includes(dateStr);
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a slot overlaps with existing bookings
 */
function slotOverlapsBookings(
  slotStart: Date,
  durationMinutes: number,
  bookings: GenerateSlotsParams['existingBookings']
): boolean {
  const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

  for (const booking of bookings) {
    // Skip cancelled bookings
    if (booking.status.startsWith('cancelled')) {
      continue;
    }

    const bookingStart = new Date(booking.scheduled_at);
    const bookingEnd = new Date(bookingStart.getTime() + booking.duration_minutes * 60000);

    // Check for overlap
    if (slotStart < bookingEnd && slotEnd > bookingStart) {
      return true;
    }
  }

  return false;
}

/**
 * Check if time is within break window
 */
function isInBreakWindow(timeMinutes: number, durationMinutes: number, daySchedule: DaySchedule): boolean {
  if (!daySchedule.break_start || !daySchedule.break_end) {
    return false;
  }

  const breakStart = parseTimeToMinutes(daySchedule.break_start);
  const breakEnd = parseTimeToMinutes(daySchedule.break_end);
  const slotEnd = timeMinutes + durationMinutes;

  // Check if slot overlaps with break
  return timeMinutes < breakEnd && slotEnd > breakStart;
}

/**
 * Generate available time slots for a given date
 */
export function generateAvailableSlots(params: GenerateSlotsParams): TimeSlot[] {
  const {
    date,
    weeklySchedule,
    blockedDates,
    existingBookings,
    durationMinutes,
    bufferMinutes,
    minNoticeHours,
    maxBookingsPerDay,
    creatorTimezone,
  } = params;

  // Check if date is blocked
  if (isDateBlocked(date, blockedDates)) {
    return [];
  }

  // Get day schedule
  const daySchedule = getDaySchedule(date, weeklySchedule);
  if (!daySchedule) {
    return [];
  }

  // Count existing confirmed bookings for the day
  const dayBookings = existingBookings.filter(booking => {
    if (booking.status.startsWith('cancelled')) return false;
    const bookingDate = new Date(booking.scheduled_at);
    return formatDateToString(bookingDate) === formatDateToString(date);
  });

  if (dayBookings.length >= maxBookingsPerDay) {
    return [];
  }

  const slots: TimeSlot[] = [];
  const now = new Date();
  const minBookingTime = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);

  const startMinutes = parseTimeToMinutes(daySchedule.start);
  const endMinutes = parseTimeToMinutes(daySchedule.end);
  const slotStep = durationMinutes + bufferMinutes;

  // Generate all possible slots
  for (let time = startMinutes; time + durationMinutes <= endMinutes; time += slotStep) {
    const timeStr = formatMinutesToTime(time);
    
    // Create full datetime for this slot
    const slotDate = new Date(date);
    slotDate.setHours(Math.floor(time / 60), time % 60, 0, 0);

    let available = true;
    let reason: string | undefined;

    // Check if slot is in the past or within minimum notice
    if (slotDate <= minBookingTime) {
      available = false;
      reason = 'Too close to current time';
    }

    // Check if slot is in break window
    if (available && isInBreakWindow(time, durationMinutes, daySchedule)) {
      available = false;
      reason = 'Break time';
    }

    // Check if slot overlaps with existing bookings
    if (available && slotOverlapsBookings(slotDate, durationMinutes, existingBookings)) {
      available = false;
      reason = 'Already booked';
    }

    slots.push({
      time: timeStr,
      datetime: slotDate,
      available,
      reason,
    });
  }

  return slots;
}

/**
 * Get only available slots (filters out unavailable ones)
 */
export function getAvailableSlotTimes(params: GenerateSlotsParams): string[] {
  const slots = generateAvailableSlots(params);
  return slots.filter(slot => slot.available).map(slot => slot.time);
}

/**
 * Check if a specific date has any availability
 */
export function dateHasAvailability(params: Omit<GenerateSlotsParams, 'date'> & { date: Date }): boolean {
  const slots = generateAvailableSlots(params);
  return slots.some(slot => slot.available);
}

/**
 * Get available dates for the next N days
 */
export function getAvailableDates(
  params: Omit<GenerateSlotsParams, 'date'>,
  daysAhead: number = 60
): Date[] {
  const availableDates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    if (dateHasAvailability({ ...params, date })) {
      availableDates.push(date);
    }
  }

  return availableDates;
}

/**
 * Format time for display (12-hour format)
 */
export function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get timezone offset string (e.g., "GMT-5")
 */
export function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart?.value || timezone;
  } catch {
    return timezone;
  }
}

/**
 * Convert time between timezones
 */
export function convertTimezone(
  date: Date,
  fromTimezone: string,
  toTimezone: string
): Date {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: toTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const formatted = formatter.format(date);
  return new Date(formatted.replace(',', ''));
}

/**
 * Get user's browser timezone
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Common timezone options for selector
 */
export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
];

/**
 * Default weekly schedule (all days disabled)
 */
export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: { enabled: false, start: '09:00', end: '17:00', break_start: null, break_end: null },
  tuesday: { enabled: false, start: '09:00', end: '17:00', break_start: null, break_end: null },
  wednesday: { enabled: false, start: '09:00', end: '17:00', break_start: null, break_end: null },
  thursday: { enabled: false, start: '09:00', end: '17:00', break_start: null, break_end: null },
  friday: { enabled: false, start: '09:00', end: '17:00', break_start: null, break_end: null },
  saturday: { enabled: false, start: '09:00', end: '17:00', break_start: null, break_end: null },
  sunday: { enabled: false, start: '09:00', end: '17:00', break_start: null, break_end: null },
};

/**
 * Generate .ics calendar file content
 */
export function generateICSFile(params: {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  durationMinutes: number;
  organizerName: string;
  organizerEmail: string;
  attendeeName: string;
  attendeeEmail: string;
}): string {
  const {
    title,
    description,
    location,
    startTime,
    durationMinutes,
    organizerName,
    organizerEmail,
    attendeeName,
    attendeeEmail,
  } = params;

  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@cele.bio`;

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//cele.bio//Booking//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTART:${formatDate(startTime)}
DTEND:${formatDate(endTime)}
SUMMARY:${title}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
LOCATION:${location}
ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}
ATTENDEE;CN=${attendeeName};RSVP=TRUE:mailto:${attendeeEmail}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}
