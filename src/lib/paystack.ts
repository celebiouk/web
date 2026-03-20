import { APP_URL } from '@/lib/constants';

const PAYSTACK_API_BASE = 'https://api.paystack.co';

function getSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }
  return key;
}

async function paystackRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${PAYSTACK_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  const body = await response.text();
  let parsed: any;
  try {
    parsed = body ? JSON.parse(body) : {};
  } catch {
    parsed = { message: body };
  }

  if (!response.ok || parsed?.status === false) {
    throw new Error(parsed?.message || `Paystack request failed (${response.status})`);
  }

  return parsed as T;
}

export type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data: {
    status: 'success' | 'failed' | string;
    reference: string;
    amount: number;
    customer?: { email?: string };
    metadata?: Record<string, any>;
  };
};

export type PaystackSubaccountResponse = {
  status: boolean;
  message: string;
  data: {
    subaccount_code: string;
    id: number;
  };
};

export async function createPaystackSubaccount(params: {
  businessName: string;
  accountNumber: string;
  bankCode: string;
  percentageCharge?: number;
}) {
  return paystackRequest<PaystackSubaccountResponse>('/subaccount', {
    method: 'POST',
    body: JSON.stringify({
      business_name: params.businessName,
      settlement_bank: params.bankCode,
      account_number: params.accountNumber,
      percentage_charge: params.percentageCharge ?? 0,
      description: 'cele.bio creator payout subaccount',
    }),
  });
}

export async function initializePaystackTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  subaccountCode?: string | null;
  transactionChargeKobo?: number;
  metadata?: Record<string, any>;
}) {
  return paystackRequest<PaystackInitializeResponse>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      currency: 'NGN',
      reference: params.reference,
      callback_url: `${APP_URL}/api/paystack/verify`,
      subaccount: params.subaccountCode || undefined,
      transaction_charge: params.transactionChargeKobo || undefined,
      bearer: 'subaccount',
      metadata: params.metadata,
    }),
  });
}

export async function verifyPaystackTransaction(reference: string) {
  return paystackRequest<PaystackVerifyResponse>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function buildPaystackReference(seed: string) {
  const cleaned = seed.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  return `cbi_${cleaned}_${Date.now()}`;
}
