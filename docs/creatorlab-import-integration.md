# CreatorLab Import Integration (cele.bio)

This document describes the production integration for importing CreatorLab ebooks into cele.bio.

## OAuth App Configuration

Set these environment variables on cele.bio:

- `CREATORLAB_CLIENT_ID` (or `CLIENT_ID`)
- `CREATORLAB_CLIENT_SECRET` (or `CLIENT_SECRET`)
- `CREATORLAB_REDIRECT_URI` (single redirect URI) or `CREATORLAB_REDIRECT_URIS` (comma-separated)

Supported scopes:

- `products.write`
- `files.write`
- `products.read`

## OAuth Endpoints

- Authorize URL: `GET /oauth/authorize`
- Token URL: `POST /oauth/token`

### Authorize request

```text
GET https://cele.bio/oauth/authorize
  ?response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=https%3A%2F%2Fyour-app.example.com%2Foauth%2Fcallback
  &scope=products.write%20files.write%20products.read
  &state=opaque-state
```

On success, cele.bio redirects to:

```text
https://your-app.example.com/oauth/callback?code=...&state=...
```

### Token exchange request (authorization code)

```bash
curl -X POST "https://cele.bio/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=AUTH_CODE" \
  -d "redirect_uri=https://your-app.example.com/oauth/callback"
```

### Refresh token request

```bash
curl -X POST "https://cele.bio/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "refresh_token=REFRESH_TOKEN"
```

### Token response contract

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 3600,
  "scope": "products.write files.write products.read",
  "token_type": "Bearer",
  "account": {
    "id": "...",
    "username": "..."
  }
}
```

## Import API

All import endpoints require `Authorization: Bearer ACCESS_TOKEN`.

### Create/Update ebook import

`POST /v1/imports/ebook`

```bash
curl -X POST "https://cele.bio/v1/imports/ebook" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: your-correlation-id" \
  -d '{
    "external_source": "creatorlab",
    "external_id": "550e8400-e29b-41d4-a716-446655440000",
    "metadata": {
      "title": "My Ebook",
      "subtitle": null,
      "description": "Ebook description",
      "category": "Business",
      "tags": ["growth", "marketing"],
      "language": "en",
      "price": 1900,
      "currency": "USD"
    },
    "content": {
      "raw_text": "Raw ebook text",
      "formatted_json": {}
    },
    "assets": {
      "epub_url": null,
      "pdf_url": "https://cdn.example.com/ebook.pdf"
    },
    "options": {
      "draft": true
    }
  }'
```

Response:

```json
{
  "import_id": "...",
  "product_id": "...",
  "status": "ready",
  "edit_url": "https://cele.bio/dashboard/products/.../edit"
}
```

Idempotency is enforced by `(external_source, external_id, account_id)`.

### Poll import status

`GET /v1/imports/:id`

```bash
curl "https://cele.bio/v1/imports/IMPORT_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Response includes:

- `import_id`
- `product_id`
- `status` (`queued`, `processing`, `ready`, `failed`)
- `edit_url`

## Webhooks

cele.bio emits these events:

- `import.completed`
- `import.failed`

Configure:

- `CREATORLAB_IMPORT_WEBHOOK_URL`
- `CREATORLAB_WEBHOOK_SECRET`

Headers:

- `x-celebio-timestamp`: unix seconds
- `x-celebio-signature-sha256`: hex HMAC SHA256

Signing payload format:

```text
${timestamp}.${rawBody}
```

Verification example (Node.js):

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyCelebioWebhook({ rawBody, timestamp, signature, secret }: {
  rawBody: string;
  timestamp: string;
  signature: string;
  secret: string;
}) {
  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
```
