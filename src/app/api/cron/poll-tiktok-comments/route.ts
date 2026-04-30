import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Called by Vercel cron every 5 minutes.
// For each creator with an active TikTok connection + active triggers:
//   1. Refresh token if near expiry
//   2. Fetch their last 5 videos
//   3. For each video, fetch comments since last cursor
//   4. Match against triggers, reply if hit
//   5. Save updated cursor so we never reply twice

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceClient();
  let repliesSent = 0;
  let creatorsProcessed = 0;

  try {
    // Load all creators with a TikTok connection who have at least one active trigger
    const { data: connections } = await (supabase.from('tiktok_automation_connections') as any)
      .select('creator_id, tiktok_open_id, access_token, refresh_token, token_expires_at, refresh_token_expires_at');

    if (!connections?.length) {
      return NextResponse.json({ success: true, repliesSent: 0, creatorsProcessed: 0 });
    }

    for (const conn of connections as TikTokConnection[]) {
      // Skip if no active triggers
      const { data: triggers } = await (supabase.from('tiktok_automation_triggers') as any)
        .select('*')
        .eq('creator_id', conn.creator_id)
        .eq('is_active', true);

      if (!triggers?.length) continue;

      // Refresh access token if expiring within 10 minutes
      let accessToken = conn.access_token;
      const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : 0;
      const tenMinutes = 10 * 60 * 1000;

      if (conn.refresh_token && expiresAt - Date.now() < tenMinutes) {
        const refreshed = await refreshTikTokToken(conn.refresh_token);
        if (refreshed) {
          accessToken = refreshed.access_token;
          await (supabase.from('tiktok_automation_connections') as any)
            .update({
              access_token: refreshed.access_token,
              refresh_token: refreshed.refresh_token ?? conn.refresh_token,
              token_expires_at: new Date(Date.now() + (refreshed.expires_in ?? 86400) * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('creator_id', conn.creator_id);
        } else {
          // Token refresh failed — skip this creator
          continue;
        }
      }

      // Fetch creator's recent videos (last 5)
      const videos = await fetchRecentVideos(accessToken);
      if (!videos.length) continue;

      creatorsProcessed++;

      for (const video of videos) {
        // Get the last cursor we processed for this video
        const { data: cursorRow } = await (supabase.from('tiktok_video_cursors') as any)
          .select('last_cursor')
          .eq('creator_id', conn.creator_id)
          .eq('video_id', video.id)
          .maybeSingle();

        const lastCursor: number = cursorRow?.last_cursor ?? 0;

        // Fetch comments newer than last cursor
        const { comments, nextCursor } = await fetchNewComments(accessToken, video.id, lastCursor);

        for (const comment of comments) {
          // Skip replies (parent_comment_id is set means it's already a reply)
          if (comment.parent_comment_id) continue;

          const lowerText = comment.text.toLowerCase();
          const matched = (triggers as TikTokTrigger[]).find(t => {
            const kw = t.keyword.toLowerCase();
            switch (t.match_type) {
              case 'exact': return lowerText === kw;
              case 'starts_with': return lowerText.startsWith(kw);
              case 'contains':
              default: return lowerText.includes(kw);
            }
          });

          if (!matched) continue;

          let replySent = false;
          let errorMessage: string | null = null;

          try {
            const replyRes = await fetch('https://open.tiktokapis.com/v2/comment/reply/create/', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                video_id: video.id,
                parent_comment_id: comment.id,
                text_original: matched.comment_reply,
              }),
            });
            replySent = replyRes.ok;
            if (!replyRes.ok) {
              const errData = await replyRes.json();
              errorMessage = JSON.stringify(errData?.error ?? errData);
            }
          } catch (err) {
            errorMessage = err instanceof Error ? err.message : String(err);
          }

          if (replySent) repliesSent++;

          await (supabase.from('tiktok_automation_logs') as any).insert({
            creator_id: conn.creator_id,
            trigger_id: matched.id,
            video_id: video.id,
            comment_id: comment.id,
            commenter_username: comment.username ?? null,
            keyword_matched: matched.keyword,
            comment_text: comment.text,
            reply_sent: replySent,
            error_message: errorMessage,
          });
        }

        // Advance cursor so we never re-process these comments
        if (nextCursor > lastCursor) {
          await (supabase.from('tiktok_video_cursors') as any).upsert({
            creator_id: conn.creator_id,
            video_id: video.id,
            last_cursor: nextCursor,
            last_checked_at: new Date().toISOString(),
          }, { onConflict: 'creator_id,video_id' });
        }
      }
    }

    return NextResponse.json({ success: true, repliesSent, creatorsProcessed });
  } catch (err) {
    console.error('TikTok comment poll error:', err);
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 });
  }
}

// ── TikTok API helpers ──────────────────────────────────────────────────────

async function refreshTikTokToken(refreshToken: string) {
  try {
    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_ID!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.access_token) return null;
    return data as { access_token: string; refresh_token?: string; expires_in?: number };
  } catch {
    return null;
  }
}

async function fetchRecentVideos(accessToken: string): Promise<{ id: string }[]> {
  try {
    const res = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=id,create_time', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ max_count: 5 }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data?.videos ?? []) as { id: string }[];
  } catch {
    return [];
  }
}

async function fetchNewComments(
  accessToken: string,
  videoId: string,
  cursor: number
): Promise<{ comments: TikTokComment[]; nextCursor: number }> {
  try {
    const params = new URLSearchParams({
      fields: 'id,text,create_time,parent_comment_id,username',
      video_id: videoId,
      max_count: '20',
      ...(cursor > 0 ? { cursor: String(cursor) } : {}),
    });

    const res = await fetch(`https://open.tiktokapis.com/v2/comment/list/?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return { comments: [], nextCursor: cursor };

    const data = await res.json();
    const comments: TikTokComment[] = (data.data?.comments ?? []).map((c: Record<string, unknown>) => ({
      id: String(c.id ?? ''),
      text: String(c.text ?? ''),
      create_time: Number(c.create_time ?? 0),
      parent_comment_id: c.parent_comment_id ? String(c.parent_comment_id) : null,
      username: c.username ? String(c.username) : null,
    }));

    return {
      comments,
      nextCursor: Number(data.data?.cursor ?? cursor),
    };
  } catch {
    return { comments: [], nextCursor: cursor };
  }
}

// ── Types ───────────────────────────────────────────────────────────────────

interface TikTokConnection {
  creator_id: string;
  tiktok_open_id: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  refresh_token_expires_at: string | null;
}

interface TikTokTrigger {
  id: string;
  creator_id: string;
  keyword: string;
  match_type: 'contains' | 'exact' | 'starts_with';
  comment_reply: string;
  is_active: boolean;
}

interface TikTokComment {
  id: string;
  text: string;
  create_time: number;
  parent_comment_id: string | null;
  username: string | null;
}
