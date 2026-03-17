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
  subject?: string | null;
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
  const subject = params.subject || 'New update for you';

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${previewText ? `<meta name="description" content="${previewText}" />` : ''}
    <title>${subject}</title>
    <style>
      body { margin: 0; padding: 0; background: #f1f5f9; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #0f172a; }
      .wrap { width: 100%; padding: 28px 10px; }
      .shell { max-width: 680px; margin: 0 auto; }
      .hero { border-radius: 24px; overflow: hidden; background: radial-gradient(circle at 85% 20%, rgba(20, 184, 166, 0.28) 0%, rgba(20, 184, 166, 0) 45%), linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0f766e 100%); box-shadow: 0 14px 44px rgba(2, 6, 23, 0.28); }
      .heroInner { padding: 26px 28px 30px; }
      .brandRow { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .brand { display: inline-block; font-weight: 800; font-size: 20px; letter-spacing: -0.01em; color: #ffffff; text-decoration: none; }
      .tag { display: inline-block; border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 999px; padding: 6px 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255, 255, 255, 0.9); }
      .heroTitle { margin: 16px 0 8px; font-size: 32px; line-height: 1.2; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; }
      .heroSub { margin: 0; font-size: 14px; line-height: 1.7; color: rgba(255, 255, 255, 0.82); }

      .card { margin-top: 14px; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background: #ffffff; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08); }
      .topbar { height: 8px; background: linear-gradient(90deg, #4f46e5 0%, #2563eb 45%, #14b8a6 100%); }
      .content { padding: 24px 30px 30px; font-size: 16px; line-height: 1.75; color: #0f172a; }
      .content p { margin: 0 0 18px; }
      .content h1, .content h2, .content h3 { margin: 0 0 14px; line-height: 1.25; color: #020617; letter-spacing: -0.01em; }
      .content h1 { font-size: 28px; }
      .content h2 { font-size: 22px; }
      .content h3 { font-size: 18px; }
      .content ul, .content ol { margin: 0 0 18px 20px; padding: 0; }
      .content li { margin: 0 0 8px; }
      .content a { color: #1d4ed8; text-decoration: none; font-weight: 700; }
      .content a:hover { text-decoration: underline; }
      .content blockquote { margin: 0 0 18px; padding: 14px 16px; border-left: 4px solid #818cf8; background: #f8faff; border-radius: 12px; color: #334155; }
      .content img { max-width: 100%; border-radius: 14px; height: auto; display: block; margin: 14px 0; border: 1px solid #e2e8f0; }

      .content table { width: 100%; border-collapse: collapse; margin: 0 0 18px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
      .content th { background: #f8fafc; color: #0f172a; text-align: left; font-size: 13px; font-weight: 700; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
      .content td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; }

      .divider { height: 1px; background: #e2e8f0; margin: 0 30px; }
      .footer { padding: 18px 30px 24px; font-size: 12px; line-height: 1.7; color: #64748b; }
      .footerLinks { margin-top: 8px; }
      .footerLinks a { color: #475569; text-decoration: none; font-weight: 600; margin-right: 10px; }
      .muted { color: #94a3b8; }
      @media only screen and (max-width: 640px) {
        .heroInner { padding: 20px 20px 24px !important; }
        .heroTitle { font-size: 26px !important; }
        .content, .footer { padding-left: 20px !important; padding-right: 20px !important; }
        .divider { margin-left: 20px !important; margin-right: 20px !important; }
      }
    </style>
  </head>
  <body>
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${previewText}</div>
    <div class="wrap">
      <div class="shell">
        <div class="hero">
          <div class="heroInner">
            <div class="brandRow">
              <a href="https://cele.bio" class="brand">cele.bio</a>
              <span class="tag">Creator Update</span>
            </div>
            <h1 class="heroTitle">${subject}</h1>
            <p class="heroSub">A fresh update from your creator — crafted to feel like a premium mini website right in your inbox.</p>
          </div>
        </div>

        <div class="card">
          <div class="topbar"></div>
          <div class="content">
            ${withTrackedLinks}
          </div>
          <div class="divider"></div>
          <div class="footer">
            Sent with cele.bio • Creator email tools for beautiful storefront businesses.<br />
            <div class="footerLinks">
              <a href="https://cele.bio">Visit cele.bio</a>
              <a href="https://cele.bio/pricing">Pricing</a>
              <a href="https://cele.bio/privacy">Privacy</a>
            </div>
            <span class="muted">You are receiving this because you subscribed to creator updates.</span>
          </div>
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
  subject?: string | null;
}) {
  const previewText = params.previewText || 'Updates from your creator';
  const subject = params.subject || 'New update for you';

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${previewText ? `<meta name="description" content="${previewText}" />` : ''}
    <title>${subject}</title>
    <style>
      body { margin: 0; padding: 0; background: #f1f5f9; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #0f172a; }
      .wrap { width: 100%; padding: 28px 10px; }
      .shell { max-width: 680px; margin: 0 auto; }
      .hero { border-radius: 24px; overflow: hidden; background: radial-gradient(circle at 85% 20%, rgba(20, 184, 166, 0.28) 0%, rgba(20, 184, 166, 0) 45%), linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0f766e 100%); box-shadow: 0 14px 44px rgba(2, 6, 23, 0.28); }
      .heroInner { padding: 26px 28px 30px; }
      .brandRow { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .brand { display: inline-block; font-weight: 800; font-size: 20px; letter-spacing: -0.01em; color: #ffffff; text-decoration: none; }
      .tag { display: inline-block; border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 999px; padding: 6px 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255, 255, 255, 0.9); }
      .heroTitle { margin: 16px 0 8px; font-size: 32px; line-height: 1.2; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; }
      .heroSub { margin: 0; font-size: 14px; line-height: 1.7; color: rgba(255, 255, 255, 0.82); }

      .card { margin-top: 14px; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background: #ffffff; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08); }
      .topbar { height: 8px; background: linear-gradient(90deg, #4f46e5 0%, #2563eb 45%, #14b8a6 100%); }
      .content { padding: 24px 30px 30px; font-size: 16px; line-height: 1.75; color: #0f172a; }
      .content p { margin: 0 0 18px; }
      .content h1, .content h2, .content h3 { margin: 0 0 14px; line-height: 1.25; color: #020617; letter-spacing: -0.01em; }
      .content h1 { font-size: 28px; }
      .content h2 { font-size: 22px; }
      .content h3 { font-size: 18px; }
      .content ul, .content ol { margin: 0 0 18px 20px; padding: 0; }
      .content li { margin: 0 0 8px; }
      .content a { color: #1d4ed8; text-decoration: none; font-weight: 700; }
      .content a:hover { text-decoration: underline; }
      .content blockquote { margin: 0 0 18px; padding: 14px 16px; border-left: 4px solid #818cf8; background: #f8faff; border-radius: 12px; color: #334155; }
      .content img { max-width: 100%; border-radius: 14px; height: auto; display: block; margin: 14px 0; border: 1px solid #e2e8f0; }

      .content table { width: 100%; border-collapse: collapse; margin: 0 0 18px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
      .content th { background: #f8fafc; color: #0f172a; text-align: left; font-size: 13px; font-weight: 700; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
      .content td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; }

      .divider { height: 1px; background: #e2e8f0; margin: 0 30px; }
      .footer { padding: 18px 30px 24px; font-size: 12px; line-height: 1.7; color: #64748b; }
      .footerLinks { margin-top: 8px; }
      .footerLinks a { color: #475569; text-decoration: none; font-weight: 600; margin-right: 10px; }
      .muted { color: #94a3b8; }
      @media only screen and (max-width: 640px) {
        .heroInner { padding: 20px 20px 24px !important; }
        .heroTitle { font-size: 26px !important; }
        .content, .footer { padding-left: 20px !important; padding-right: 20px !important; }
        .divider { margin-left: 20px !important; margin-right: 20px !important; }
      }
    </style>
  </head>
  <body>
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${previewText}</div>
    <div class="wrap">
      <div class="shell">
        <div class="hero">
          <div class="heroInner">
            <div class="brandRow">
              <a href="https://cele.bio" class="brand">cele.bio</a>
              <span class="tag">Creator Update</span>
            </div>
            <h1 class="heroTitle">${subject}</h1>
            <p class="heroSub">A fresh update from your creator — crafted to feel like a premium mini website right in your inbox.</p>
          </div>
        </div>

        <div class="card">
          <div class="topbar"></div>
          <div class="content">
            ${params.bodyHtml}
          </div>
          <div class="divider"></div>
          <div class="footer">
            Sent with cele.bio • Creator email tools for beautiful storefront businesses.<br />
            <div class="footerLinks">
              <a href="https://cele.bio">Visit cele.bio</a>
              <a href="https://cele.bio/pricing">Pricing</a>
              <a href="https://cele.bio/privacy">Privacy</a>
            </div>
            <span class="muted">You are receiving this because you subscribed to creator updates.</span>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
}
