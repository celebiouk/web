import { createHash, randomBytes } from 'crypto';

export function generateTestimonialToken() {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashTestimonialToken(token);
  return { token, tokenHash };
}

export function hashTestimonialToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function buildTestimonialSubmitUrl(token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cele.bio';
  return `${appUrl}/testimonials/submit/${token}`;
}

export async function sendTestimonialRequestEmail(params: {
  to: string;
  creatorName: string;
  productTitle: string;
  submitUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:30px 16px;">
      <div style="background:#fff;border-radius:14px;padding:28px;">
        <h1 style="margin:0 0 12px;color:#111827;font-size:22px;">Share your experience</h1>
        <p style="margin:0 0 14px;color:#374151;font-size:15px;line-height:1.55;">
          ${params.creatorName} would love your feedback on <strong>${params.productTitle}</strong>.
        </p>
        <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.55;">
          Your testimonial is buyer-verified and helps other people trust the offer.
        </p>
        <a href="${params.submitUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">
          Submit Testimonial
        </a>
        <p style="margin:18px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">
          If the button doesn’t work, copy and paste this link:<br />
          <a href="${params.submitUrl}">${params.submitUrl}</a>
        </p>
      </div>
    </div>
  </body>
</html>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'cele.bio <hello@cele.bio>',
      to: params.to,
      subject: `Share your feedback for ${params.productTitle}`,
      html,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    return { success: false, error: payload || 'Failed to send email' };
  }

  return { success: true };
}
