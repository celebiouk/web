export interface SubscriberLike {
  email: string;
  first_name?: string | null;
}

export function applyEmailTokens(template: string, context: {
  firstName?: string | null;
  creatorName?: string | null;
}) {
  return template
    .replace(/{{\s*first_name\s*}}/gi, context.firstName || 'there')
    .replace(/{{\s*creator_name\s*}}/gi, context.creatorName || 'Creator');
}

export async function sendMarketingEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from || 'cele.bio <updates@cele.bio>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error: ${body}`);
  }

  return response.json();
}

export function buildBroadcastHtml(params: {
  bodyHtml: string;
  previewText?: string | null;
  openTrackingUrl: string;
  clickTrackingPrefix: string;
}) {
  const withTrackedLinks = params.bodyHtml.replace(
    /href=["']([^"']+)["']/gi,
    (_full, url: string) => {
      const tracked = `${params.clickTrackingPrefix}?url=${encodeURIComponent(url)}`;
      return `href="${tracked}"`;
    }
  );

  const previewText = params.previewText || 'Updates from your creator';

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${previewText ? `<meta name="description" content="${previewText}" />` : ''}
    <title>Email</title>
    <style>
      body { margin: 0; padding: 0; background: #f4f6fb; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #0f172a; }
      .wrap { width: 100%; padding: 30px 12px; }
      .card { max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 40px rgba(15, 23, 42, 0.06); }
      .topbar { height: 8px; background: linear-gradient(90deg, #4f46e5 0%, #2563eb 45%, #14b8a6 100%); }
      .header { padding: 20px 28px 14px 28px; }
      .brand { display: inline-block; font-weight: 700; font-size: 14px; letter-spacing: 0.02em; color: #334155; text-decoration: none; }
      .content { padding: 8px 28px 28px 28px; font-size: 16px; line-height: 1.72; color: #0f172a; }
      .content p { margin: 0 0 16px; }
      .content h1, .content h2, .content h3 { margin: 0 0 14px; line-height: 1.3; color: #020617; }
      .content ul, .content ol { margin: 0 0 16px 20px; padding: 0; }
      .content li { margin: 0 0 8px; }
      .content a { color: #2563eb; text-decoration: none; font-weight: 600; }
      .content a:hover { text-decoration: underline; }
      .content blockquote { margin: 0 0 16px; padding: 14px 16px; border-left: 4px solid #c7d2fe; background: #f8faff; border-radius: 10px; color: #334155; }
      .content img { max-width: 100%; border-radius: 12px; height: auto; display: block; margin: 14px 0; }
      .divider { height: 1px; background: #e5e7eb; margin: 0 28px; }
      .footer { padding: 16px 28px 24px 28px; font-size: 12px; line-height: 1.6; color: #64748b; }
      .muted { color: #94a3b8; }
      @media only screen and (max-width: 640px) {
        .header, .content, .footer { padding-left: 18px !important; padding-right: 18px !important; }
        .divider { margin-left: 18px !important; margin-right: 18px !important; }
      }
    </style>
  </head>
  <body>
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${previewText}</div>
    <div class="wrap">
      <div class="card">
        <div class="topbar"></div>
        <div class="header">
          <a href="https://cele.bio" class="brand">cele.bio</a>
        </div>
        <div class="content">
          ${withTrackedLinks}
        </div>
        <div class="divider"></div>
        <div class="footer">
          Sent with cele.bio • Creator email tools for beautiful storefront businesses.<br />
          <span class="muted">You are receiving this because you subscribed to creator updates.</span>
        </div>
      </div>
    </div>
    <img src="${params.openTrackingUrl}" alt="" width="1" height="1" style="display:block;opacity:0;" />
  </body>
</html>
  `;
}

export function buildCampaignEmailHtml(params: {
  bodyHtml: string;
  previewText?: string | null;
}) {
  const previewText = params.previewText || 'Updates from your creator';

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${previewText ? `<meta name="description" content="${previewText}" />` : ''}
    <title>Email</title>
    <style>
      body { margin: 0; padding: 0; background: #f4f6fb; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #0f172a; }
      .wrap { width: 100%; padding: 30px 12px; }
      .card { max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 40px rgba(15, 23, 42, 0.06); }
      .topbar { height: 8px; background: linear-gradient(90deg, #4f46e5 0%, #2563eb 45%, #14b8a6 100%); }
      .header { padding: 20px 28px 14px 28px; }
      .brand { display: inline-block; font-weight: 700; font-size: 14px; letter-spacing: 0.02em; color: #334155; text-decoration: none; }
      .content { padding: 8px 28px 28px 28px; font-size: 16px; line-height: 1.72; color: #0f172a; }
      .content p { margin: 0 0 16px; }
      .content h1, .content h2, .content h3 { margin: 0 0 14px; line-height: 1.3; color: #020617; }
      .content ul, .content ol { margin: 0 0 16px 20px; padding: 0; }
      .content li { margin: 0 0 8px; }
      .content a { color: #2563eb; text-decoration: none; font-weight: 600; }
      .content a:hover { text-decoration: underline; }
      .content blockquote { margin: 0 0 16px; padding: 14px 16px; border-left: 4px solid #c7d2fe; background: #f8faff; border-radius: 10px; color: #334155; }
      .content img { max-width: 100%; border-radius: 12px; height: auto; display: block; margin: 14px 0; }
      .divider { height: 1px; background: #e5e7eb; margin: 0 28px; }
      .footer { padding: 16px 28px 24px 28px; font-size: 12px; line-height: 1.6; color: #64748b; }
      .muted { color: #94a3b8; }
      @media only screen and (max-width: 640px) {
        .header, .content, .footer { padding-left: 18px !important; padding-right: 18px !important; }
        .divider { margin-left: 18px !important; margin-right: 18px !important; }
      }
    </style>
  </head>
  <body>
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${previewText}</div>
    <div class="wrap">
      <div class="card">
        <div class="topbar"></div>
        <div class="header">
          <a href="https://cele.bio" class="brand">cele.bio</a>
        </div>
        <div class="content">
          ${params.bodyHtml}
        </div>
        <div class="divider"></div>
        <div class="footer">
          Sent with cele.bio • Creator email tools for beautiful storefront businesses.<br />
          <span class="muted">You are receiving this because you subscribed to creator updates.</span>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
}
