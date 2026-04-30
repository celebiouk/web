import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Meta sends a GET to verify the webhook endpoint
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

// Meta sends a POST when a comment event fires
export async function POST(request: Request) {
  let body: InstagramWebhookPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.object !== 'instagram') {
    return NextResponse.json({ received: true });
  }

  const supabaseAdmin = getSupabaseAdmin();

  for (const entry of body.entry ?? []) {
    const igUserId = entry.id;

    for (const change of entry.changes ?? []) {
      if (change.field !== 'comments') continue;

      const { from, id: commentId, text: commentText } = change.value;
      if (!from?.id || !commentId || !commentText) continue;

      await handleCommentTrigger({
        supabaseAdmin,
        igUserId,
        commentId,
        commentText,
        commenterIgId: from.id,
        commenterUsername: from.username ?? null,
      });
    }
  }

  return NextResponse.json({ received: true });
}

async function handleCommentTrigger({
  supabaseAdmin,
  igUserId,
  commentId,
  commentText,
  commenterIgId,
  commenterUsername,
}: {
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>;
  igUserId: string;
  commentId: string;
  commentText: string;
  commenterIgId: string;
  commenterUsername: string | null;
}) {
  // Find the creator who owns this IG account
  const { data: connection } = await (supabaseAdmin as any).from('instagram_connections')
    .select('creator_id, access_token')
    .eq('ig_user_id', igUserId)
    .maybeSingle();

  if (!connection) return;

  // Load their active triggers
  const { data: triggers } = await (supabaseAdmin as any).from('instagram_triggers')
    .select('*')
    .eq('creator_id', connection.creator_id)
    .eq('is_active', true);

  if (!triggers?.length) return;

  // Find the first matching trigger
  const lowerComment = commentText.toLowerCase();
  const matched = (triggers as InstagramTrigger[]).find(trigger => {
    const kw = trigger.keyword.toLowerCase();
    switch (trigger.match_type) {
      case 'exact': return lowerComment === kw;
      case 'starts_with': return lowerComment.startsWith(kw);
      case 'contains':
      default: return lowerComment.includes(kw);
    }
  });

  if (!matched) return;

  let commentReplySent = false;
  let dmSent = false;
  let errorMessage: string | null = null;

  try {
    // Reply to the comment
    const replyRes = await fetch(
      `https://graph.facebook.com/v21.0/${commentId}/replies`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: matched.comment_reply,
          access_token: connection.access_token,
        }),
      }
    );
    commentReplySent = replyRes.ok;

    // Send DM to the commenter
    const dmRes = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: commenterIgId },
          message: { text: matched.dm_message },
          access_token: connection.access_token,
        }),
      }
    );
    dmSent = dmRes.ok;

    if (!dmRes.ok) {
      const dmError = await dmRes.json();
      errorMessage = JSON.stringify(dmError?.error ?? dmError);
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  // Log the automation run
  await (supabaseAdmin as any).from('instagram_automation_logs').insert({
    creator_id: connection.creator_id,
    trigger_id: matched.id,
    comment_id: commentId,
    commenter_ig_id: commenterIgId,
    commenter_username: commenterUsername,
    keyword_matched: matched.keyword,
    comment_text: commentText,
    comment_reply_sent: commentReplySent,
    dm_sent: dmSent,
    error_message: errorMessage,
  });
}

// Types for the Meta webhook payload
interface InstagramWebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    time: number;
    changes?: Array<{
      field: string;
      value: {
        from?: { id: string; username?: string };
        media?: { id: string };
        id: string;
        text: string;
      };
    }>;
  }>;
}

interface InstagramTrigger {
  id: string;
  creator_id: string;
  keyword: string;
  match_type: 'contains' | 'exact' | 'starts_with';
  comment_reply: string;
  dm_message: string;
  is_active: boolean;
}
