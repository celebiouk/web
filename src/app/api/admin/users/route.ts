import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isInternalAdminEmail } from '@/lib/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Admin actions are not configured correctly (missing service role key).' },
        { status: 500 }
      );
    }

    const adminSupabase = await createServiceClient() as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isInternalAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, action, data } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
    }

    // Log the admin action
    try {
      await adminSupabase.from('admin_audit_logs').insert({
        admin_id: user.id,
        action,
        target_user_id: userId,
        details: data || {},
      });
    } catch (auditError) {
      console.error('Admin audit log failed:', auditError);
    }

    switch (action) {
      case 'suspend': {
        const { data: updatedProfile, error } = await adminSupabase
          .from('profiles')
          .update({ is_suspended: true, suspended_at: new Date().toISOString() })
          .eq('id', userId)
          .select('id')
          .maybeSingle();
        if (error) throw error;
        if (!updatedProfile) {
          return NextResponse.json({ error: 'Could not suspend user profile' }, { status: 400 });
        }
        break;
      }

      case 'unsuspend': {
        const { data: updatedProfile, error } = await adminSupabase
          .from('profiles')
          .update({ is_suspended: false, suspended_at: null })
          .eq('id', userId)
          .select('id')
          .maybeSingle();
        if (error) throw error;
        if (!updatedProfile) {
          return NextResponse.json({ error: 'Could not unsuspend user profile' }, { status: 400 });
        }
        break;
      }

      case 'upgrade_pro': {
        const hasPaid = Boolean(data?.hasPaid);
        const reason = typeof data?.reason === 'string' ? data.reason.trim() : '';

        if (!reason) {
          return NextResponse.json({ error: 'Reason is required to grant Pro access' }, { status: 400 });
        }

        // Grant Pro access manually (paid or admin-approved comp)
        const { data: updatedProfile, error } = await adminSupabase
          .from('profiles')
          .update({ subscription_tier: 'pro' })
          .eq('id', userId)
          .select('id, subscription_tier')
          .maybeSingle();
        if (error) throw error;
        if (!updatedProfile) {
          return NextResponse.json({ error: 'Could not grant Pro access for this user' }, { status: 400 });
        }

        break;
      }

      case 'downgrade_free': {
        const { data: updatedProfile, error } = await adminSupabase
          .from('profiles')
          .update({ subscription_tier: 'free' })
          .eq('id', userId)
          .select('id, subscription_tier')
          .maybeSingle();
        if (error) throw error;
        if (!updatedProfile) {
          return NextResponse.json({ error: 'Could not set user to Free tier' }, { status: 400 });
        }
        break;
      }

      case 'delete': {
        // Soft delete - just mark as deleted
        const { data: updatedProfile, error } = await adminSupabase
          .from('profiles')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', userId)
          .select('id')
          .maybeSingle();
        if (error) throw error;
        if (!updatedProfile) {
          return NextResponse.json({ error: 'Could not delete user profile' }, { status: 400 });
        }
        break;
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin user action error:', error);
    const message = error instanceof Error ? error.message : 'Action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isInternalAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      // Get single user details
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, subscriptions(*), products(*), orders!orders_creator_id_fkey(*)')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return NextResponse.json(profile);
    }

    // Get all users (paginated)
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data: users, count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({ users, count, page, perPage });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
