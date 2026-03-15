import { createHmac } from 'node:crypto';

interface CreatorLabWebhookEvent {
  event: 'import.completed' | 'import.failed';
  import_id: string;
  product_id: string | null;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  account_id: string;
  correlation_id: string;
  timestamp: string;
  error_message?: string | null;
}

export function signCreatorLabWebhookBody(body: string, timestamp: string, secret: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

export async function emitCreatorLabWebhook(event: CreatorLabWebhookEvent): Promise<void> {
  const webhookUrl = process.env.CREATORLAB_IMPORT_WEBHOOK_URL;
  const webhookSecret = process.env.CREATORLAB_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    return;
  }

  const body = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signCreatorLabWebhookBody(body, timestamp, webhookSecret);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-celebio-timestamp': timestamp,
      'x-celebio-signature-sha256': signature,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`CreatorLab webhook delivery failed with status ${response.status}`);
  }
}
