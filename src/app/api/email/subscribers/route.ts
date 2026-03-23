import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isInternalAdminEmail } from '@/lib/admin';

const createSubscriberSchema = z.object({
  email: z.string().email(),
  first_name: z.string().max(120).optional(),
  source: z.string().max(120).optional(),
  tags: z.array(z.string().max(100)).optional(),
});

const updateSubscriberSchema = z.object({
  id: z.string().uuid(),
  tags: z.array(z.string().max(100)).optional(),
  is_active: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const scope = (url.searchParams.get('scope') || '').trim();
    const search = (url.searchParams.get('search') || '').trim();
    const tag = (url.searchParams.get('tag') || '').trim();
    const source = (url.searchParams.get('source') || '').trim();

    if (scope === 'platform') {
      if (!isInternalAdminEmail(user.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const serviceSupabase = await createServiceClient();
      const authUsers: { id: string; email: string }[] = [];
      let page = 1;

      while (true) {
        const { data, error } = await (serviceSupabase as any).auth.admin.listUsers({
          page,
          perPage: 1000,
        });

        if (error) {
          return NextResponse.json({ error: 'Failed to load platform users' }, { status: 500 });
        }

        const users = (data?.users || []) as { id: string; email?: string | null }[];
        for (const authUser of users) {
          const email = String(authUser.email || '').trim().toLowerCase();
          if (!email) continue;
          authUsers.push({ id: String(authUser.id), email });
        }

        if (users.length < 1000) {
          break;
        }

        page += 1;
      }

      const deduped = new Map<string, { id: string; email: string }>();
      for (const row of authUsers || []) {
        const email = String((row as { email?: string }).email || '').trim().toLowerCase();
        if (!email) continue;
        deduped.set(email, { id: String((row as { id: string }).id), email });
      }

      const records = Array.from(deduped.values());
      const filtered = search
        ? records.filter((record) => record.email.includes(search.toLowerCase()))
        : records;

      return NextResponse.json({ subscribers: filtered });
    }

    let query = (supabase.from('email_subscribers') as any)
      .select('*')
      .eq('creator_id', user.id)
      .order('subscribed_at', { ascending: false });

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%`);
    }
    if (source) {
      query = query.eq('source', source);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Failed to load subscribers' }, { status: 500 });
    }

    const filtered = tag
      ? (data || []).filter((row: { tags?: string[] }) => (row.tags || []).includes(tag))
      : (data || []);

    return NextResponse.json({ subscribers: filtered });
  } catch (error) {
    console.error('Subscribers GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = createSubscriberSchema.parse(await request.json());

    const { data, error } = await (supabase.from('email_subscribers') as any)
      .insert({
        creator_id: user.id,
        email: body.email.toLowerCase(),
        first_name: body.first_name || null,
        name: body.first_name || null,
        source: body.source || 'manual',
        tags: body.tags || [],
        is_active: true,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to create subscriber' }, { status: 400 });
    }

    return NextResponse.json({ subscriber: data });
  } catch (error) {
    console.error('Subscribers POST error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = updateSubscriberSchema.parse(await request.json());

    const updatePayload: Record<string, unknown> = {};
    if (body.tags) updatePayload.tags = body.tags;
    if (typeof body.is_active === 'boolean') updatePayload.is_active = body.is_active;

    const { data, error } = await (supabase.from('email_subscribers') as any)
      .update(updatePayload)
      .eq('id', body.id)
      .eq('creator_id', user.id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update subscriber' }, { status: 500 });
    }

    return NextResponse.json({ subscriber: data });
  } catch (error) {
    console.error('Subscribers PATCH error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const ids = (url.searchParams.get('ids') || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (!ids.length) {
      return NextResponse.json({ error: 'No subscribers selected' }, { status: 400 });
    }

    const { error } = await (supabase.from('email_subscribers') as any)
      .update({ is_active: false })
      .in('id', ids)
      .eq('creator_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete subscribers' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscribers DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
