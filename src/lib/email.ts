/**
 * Email Service using Resend
 * Handles all transactional emails for bookings
 */

import { generateICSFile } from '@/lib/utils/generateAvailableSlots';

// Types
interface BookingEmailData {
  bookingId: string;
  buyerName: string;
  buyerEmail: string;
  creatorName: string;
  creatorEmail: string;
  productTitle: string;
  scheduledAt: Date;
  durationMinutes: number;
  timezone: string;
  videoCallUrl: string;
  cancellationToken: string;
  rescheduleToken: string;
  customMessage?: string;
  amountCents?: number;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Format date for email display
 */
function formatDateForEmail(date: Date, timezone: string): string {
  try {
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return date.toLocaleString();
  }
}

/**
 * Send email via Resend API
 */
async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
}): Promise<EmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not set, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'cele.bio <bookings@cele.bio>',
        to: params.to,
        subject: params.subject,
        html: params.html,
        attachments: params.attachments?.map(a => ({
          filename: a.filename,
          content: Buffer.from(a.content).toString('base64'),
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', errorData);
      return { success: false, error: 'Failed to send email' };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Email send failed' };
  }
}

/**
 * Generate booking confirmation email HTML for buyer
 */
function generateBuyerConfirmationEmail(data: BookingEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cele.bio';
  const cancelUrl = `${appUrl}/book/cancel/${data.bookingId}?token=${data.cancellationToken}`;
  const rescheduleUrl = `${appUrl}/book/reschedule/${data.bookingId}?token=${data.rescheduleToken}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 32px;">✓</span>
        </div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">Booking Confirmed!</h1>
        <p style="margin: 8px 0 0; color: #71717a;">Your call with ${data.creatorName} is scheduled</p>
      </div>

      <!-- Booking Details -->
      <div style="background: #f4f4f5; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <div style="margin-bottom: 16px;">
          <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">Session</p>
          <p style="margin: 4px 0 0; font-size: 18px; font-weight: 600; color: #18181b;">${data.productTitle}</p>
        </div>
        <div style="margin-bottom: 16px;">
          <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">Date & Time</p>
          <p style="margin: 4px 0 0; font-size: 16px; color: #18181b;">${formatDateForEmail(data.scheduledAt, data.timezone)}</p>
          <p style="margin: 4px 0 0; font-size: 14px; color: #71717a;">${data.durationMinutes} minutes · ${data.timezone}</p>
        </div>
        <div>
          <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">Host</p>
          <p style="margin: 4px 0 0; font-size: 16px; color: #18181b;">${data.creatorName}</p>
        </div>
      </div>

      <!-- Video Call Link -->
      <div style="margin-bottom: 24px;">
        <a href="${data.videoCallUrl}" style="display: block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; text-align: center; padding: 16px 24px; border-radius: 12px; font-weight: 600; font-size: 16px;">
          Join Video Call
        </a>
        <p style="margin: 8px 0 0; text-align: center; font-size: 12px; color: #71717a;">
          Click this button when it's time for your call
        </p>
      </div>

      ${data.customMessage ? `
      <!-- Creator Message -->
      <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">
          <strong>Message from ${data.creatorName}:</strong><br>
          ${data.customMessage}
        </p>
      </div>
      ` : ''}

      <!-- Calendar Links -->
      <div style="margin-bottom: 24px;">
        <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #18181b;">Add to Calendar:</p>
        <p style="margin: 0; font-size: 14px; color: #71717a;">
          The .ics calendar file is attached to this email. Open it to add this event to your calendar.
        </p>
      </div>

      <!-- Actions -->
      <div style="border-top: 1px solid #e4e4e7; padding-top: 24px; text-align: center;">
        <a href="${rescheduleUrl}" style="color: #6366f1; text-decoration: none; font-size: 14px; margin-right: 16px;">Reschedule</a>
        <a href="${cancelUrl}" style="color: #ef4444; text-decoration: none; font-size: 14px;">Cancel Booking</a>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 24px;">
      <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
        Powered by <a href="https://cele.bio" style="color: #6366f1; text-decoration: none;">cele.bio</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate booking notification email HTML for creator
 */
function generateCreatorNotificationEmail(data: BookingEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 32px;">📅</span>
        </div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">New Booking!</h1>
        <p style="margin: 8px 0 0; color: #71717a;">Someone just booked a call with you</p>
      </div>

      <!-- Buyer Info -->
      <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <div style="margin-bottom: 16px;">
          <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">Client</p>
          <p style="margin: 4px 0 0; font-size: 18px; font-weight: 600; color: #18181b;">${data.buyerName}</p>
          <p style="margin: 4px 0 0; font-size: 14px; color: #71717a;">${data.buyerEmail}</p>
        </div>
        <div style="margin-bottom: 16px;">
          <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">Session</p>
          <p style="margin: 4px 0 0; font-size: 16px; color: #18181b;">${data.productTitle}</p>
        </div>
        <div style="margin-bottom: 16px;">
          <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">Date & Time</p>
          <p style="margin: 4px 0 0; font-size: 16px; color: #18181b;">${formatDateForEmail(data.scheduledAt, data.timezone)}</p>
          <p style="margin: 4px 0 0; font-size: 14px; color: #71717a;">${data.durationMinutes} minutes</p>
        </div>
        ${data.amountCents !== undefined ? `
        <div>
          <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a;">Amount</p>
          <p style="margin: 4px 0 0; font-size: 18px; font-weight: 600; color: #059669;">$${(data.amountCents / 100).toFixed(2)}</p>
        </div>
        ` : ''}
      </div>

      <!-- Video Call Link -->
      <div style="margin-bottom: 24px;">
        <a href="${data.videoCallUrl}" style="display: block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; text-align: center; padding: 16px 24px; border-radius: 12px; font-weight: 600; font-size: 16px;">
          Join Video Call
        </a>
      </div>

      <!-- View in Dashboard -->
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cele.bio'}/dashboard/bookings" style="color: #6366f1; text-decoration: none; font-size: 14px;">View in Dashboard →</a>
      </div>

    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate cancellation email HTML
 */
function generateCancellationEmail(data: BookingEmailData & { cancelledBy: 'creator' | 'buyer'; reason?: string }): string {
  const isByCreator = data.cancelledBy === 'creator';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Cancelled</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 64px; height: 64px; background: #fef2f2; border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 32px;">❌</span>
        </div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">Booking Cancelled</h1>
        <p style="margin: 8px 0 0; color: #71717a;">
          ${isByCreator ? `${data.creatorName} has cancelled your booking` : 'Your booking has been cancelled'}
        </p>
      </div>

      <!-- Booking Details -->
      <div style="background: #fef2f2; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #18181b;">${data.productTitle}</p>
        <p style="margin: 0; font-size: 14px; color: #71717a;">
          Was scheduled for ${formatDateForEmail(data.scheduledAt, data.timezone)}
        </p>
      </div>

      ${data.reason ? `
      <div style="margin-bottom: 24px;">
        <p style="margin: 0; font-size: 14px; color: #71717a;">
          <strong>Reason:</strong> ${data.reason}
        </p>
      </div>
      ` : ''}

      ${data.amountCents && data.amountCents > 0 ? `
      <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 14px; color: #059669;">
          💰 A refund of $${(data.amountCents / 100).toFixed(2)} will be processed to your original payment method within 5-10 business days.
        </p>
      </div>
      ` : ''}

    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send booking confirmation emails to both buyer and creator
 */
export async function sendBookingConfirmationEmails(data: BookingEmailData): Promise<{
  buyer: EmailResult;
  creator: EmailResult;
}> {
  // Generate ICS file
  const icsContent = generateICSFile({
    title: `${data.productTitle} with ${data.creatorName}`,
    description: `Video call link: ${data.videoCallUrl}`,
    location: data.videoCallUrl,
    startTime: data.scheduledAt,
    durationMinutes: data.durationMinutes,
    organizerName: data.creatorName,
    organizerEmail: data.creatorEmail,
    attendeeName: data.buyerName,
    attendeeEmail: data.buyerEmail,
  });

  // Send to buyer
  const buyerResult = await sendEmail({
    to: data.buyerEmail,
    subject: `Confirmed: ${data.productTitle} with ${data.creatorName}`,
    html: generateBuyerConfirmationEmail(data),
    attachments: [
      {
        filename: 'booking.ics',
        content: icsContent,
      },
    ],
  });

  // Send to creator
  const creatorResult = await sendEmail({
    to: data.creatorEmail,
    subject: `New Booking: ${data.buyerName} - ${data.productTitle}`,
    html: generateCreatorNotificationEmail(data),
    attachments: [
      {
        filename: 'booking.ics',
        content: icsContent,
      },
    ],
  });

  return { buyer: buyerResult, creator: creatorResult };
}

/**
 * Send cancellation emails to both parties
 */
export async function sendCancellationEmails(
  data: BookingEmailData & { cancelledBy: 'creator' | 'buyer'; reason?: string; refundAmount?: number }
): Promise<{ buyer: EmailResult; creator: EmailResult }> {
  // Send to buyer
  const buyerResult = await sendEmail({
    to: data.buyerEmail,
    subject: `Booking Cancelled: ${data.productTitle}`,
    html: generateCancellationEmail({ ...data, amountCents: data.refundAmount }),
  });

  // Send to creator (only if cancelled by buyer)
  let creatorResult: EmailResult = { success: true };
  if (data.cancelledBy === 'buyer') {
    creatorResult = await sendEmail({
      to: data.creatorEmail,
      subject: `Booking Cancelled: ${data.buyerName} - ${data.productTitle}`,
      html: generateCancellationEmail(data),
    });
  }

  return { buyer: buyerResult, creator: creatorResult };
}

/**
 * Send reschedule notification emails
 */
export async function sendRescheduleEmails(
  data: BookingEmailData & { oldScheduledAt: Date }
): Promise<{ buyer: EmailResult; creator: EmailResult }> {
  const buyerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Rescheduled</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">Booking Rescheduled</h1>
        <p style="margin: 8px 0 0; color: #71717a;">Your call has been moved to a new time</p>
      </div>

      <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">
          <s>Was: ${formatDateForEmail(data.oldScheduledAt, data.timezone)}</s><br>
          <strong>Now: ${formatDateForEmail(data.scheduledAt, data.timezone)}</strong>
        </p>
      </div>

      <div style="margin-bottom: 24px;">
        <a href="${data.videoCallUrl}" style="display: block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; text-align: center; padding: 16px 24px; border-radius: 12px; font-weight: 600; font-size: 16px;">
          Join Video Call
        </a>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // Generate new ICS file
  const icsContent = generateICSFile({
    title: `${data.productTitle} with ${data.creatorName}`,
    description: `Video call link: ${data.videoCallUrl}`,
    location: data.videoCallUrl,
    startTime: data.scheduledAt,
    durationMinutes: data.durationMinutes,
    organizerName: data.creatorName,
    organizerEmail: data.creatorEmail,
    attendeeName: data.buyerName,
    attendeeEmail: data.buyerEmail,
  });

  const buyerResult = await sendEmail({
    to: data.buyerEmail,
    subject: `Rescheduled: ${data.productTitle} with ${data.creatorName}`,
    html: buyerHtml,
    attachments: [
      {
        filename: 'booking-updated.ics',
        content: icsContent,
      },
    ],
  });

  const creatorResult = await sendEmail({
    to: data.creatorEmail,
    subject: `Booking Rescheduled: ${data.buyerName}`,
    html: buyerHtml.replace('Your call', `${data.buyerName}'s call`),
    attachments: [
      {
        filename: 'booking-updated.ics',
        content: icsContent,
      },
    ],
  });

  return { buyer: buyerResult, creator: creatorResult };
}
