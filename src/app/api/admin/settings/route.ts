import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isInternalAdminEmail } from '@/lib/admin';

function mapRowToSettings(row: any) {
  return {
    siteName: row.site_name,
    siteUrl: row.site_url,
    supportEmail: row.support_email,
    commissionRate: Number(row.commission_rate),
    proMonthlyPrice: Number(row.pro_monthly_price),
    proYearlyPrice: Number(row.pro_yearly_price),
    maxFreeSubscribers: row.max_free_subscribers,
    enableNewSignups: row.enable_new_signups,
    enableStripeConnect: row.enable_stripe_connect,
    requireEmailVerification: row.require_email_verification,
    maintenanceMode: row.maintenance_mode,
  };
}

async function ensureAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isInternalAdminEmail(user.email)) {
    return null;
  }

  return user;
}

export async function GET() {
  try {
    const user = await ensureAdmin();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = await createServiceClient();
    const { data, error } = await (adminSupabase as any)
      .from('admin_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
    }

    return NextResponse.json({ settings: mapRowToSettings(data) });
  } catch (error) {
    console.error('Admin settings GET error:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await ensureAdmin();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();

    const adminSupabase = await createServiceClient();
    const { data, error } = await (adminSupabase as any)
      .from('admin_settings')
      .upsert({
        id: 1,
        site_name: payload.siteName,
        site_url: payload.siteUrl,
        support_email: payload.supportEmail,
        commission_rate: payload.commissionRate,
        pro_monthly_price: payload.proMonthlyPrice,
        pro_yearly_price: payload.proYearlyPrice,
        max_free_subscribers: payload.maxFreeSubscribers,
        enable_new_signups: payload.enableNewSignups,
        enable_stripe_connect: payload.enableStripeConnect,
        require_email_verification: payload.requireEmailVerification,
        maintenance_mode: payload.maintenanceMode,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    await (adminSupabase as any).from('admin_audit_logs').insert({
      admin_id: user.id,
      action: 'settings_update',
      details: { section: 'platform_settings' },
    });

    return NextResponse.json({ settings: mapRowToSettings(data), success: true });
  } catch (error) {
    console.error('Admin settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}