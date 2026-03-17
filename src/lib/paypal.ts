/**
 * PayPal OAuth helpers
 * Used for connecting creator PayPal business accounts from dashboard settings.
 */

export type PayPalUserInfo = {
  user_id?: string;
  payer_id?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function getPayPalMode(): 'sandbox' | 'live' {
  const mode = (process.env.PAYPAL_MODE || 'live').toLowerCase();
  return mode === 'sandbox' ? 'sandbox' : 'live';
}

function getPayPalApiBase(): string {
  return getPayPalMode() === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
}

function getPayPalAuthBase(): string {
  return getPayPalMode() === 'sandbox' ? 'https://www.sandbox.paypal.com' : 'https://www.paypal.com';
}

export function getPayPalAuthorizeUrl(state: string): string {
  const clientId = getRequiredEnv('PAYPAL_CLIENT_ID');
  const redirectUri = getRequiredEnv('PAYPAL_REDIRECT_URI');

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'openid email profile https://uri.paypal.com/services/paypalattributes',
    redirect_uri: redirectUri,
    state,
  });

  return `${getPayPalAuthBase()}/signin/authorize?${params.toString()}`;
}

export async function exchangePayPalCodeForToken(code: string): Promise<string> {
  const clientId = getRequiredEnv('PAYPAL_CLIENT_ID');
  const clientSecret = getRequiredEnv('PAYPAL_CLIENT_SECRET');

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
  });

  const response = await fetch(`${getPayPalApiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal token exchange failed: ${text}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('PayPal access token missing');
  return data.access_token;
}

export async function getPayPalUserInfo(accessToken: string): Promise<PayPalUserInfo> {
  const response = await fetch(`${getPayPalApiBase()}/v1/identity/openidconnect/userinfo/?schema=paypalv1`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal user info failed: ${text}`);
  }

  return (await response.json()) as PayPalUserInfo;
}
