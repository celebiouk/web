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

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${params.previewText ? `<meta name="description" content="${params.previewText}" />` : ''}
    <title>Email</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
      <div style="background:#ffffff;border-radius:16px;padding:24px;border:1px solid #e2e8f0;">
        ${withTrackedLinks}
      </div>
      <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px;">Powered by cele.bio</p>
    </div>
    <img src="${params.openTrackingUrl}" alt="" width="1" height="1" style="display:block;opacity:0;" />
  </body>
</html>
  `;
}
