import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isInternalAdminEmail } from '@/lib/admin';
import type { CommissionMonthlyTotal } from '@/types/supabase';

export async function GET() {
  try {
    const supabase = await createClient();
    const serviceSupabase = await createServiceClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isInternalAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await serviceSupabase
      .from('commission_monthly_totals')
      .select('month,total_commission_cents,sales_count')
      .order('month', { ascending: false });

    if (error) {
      console.error('Admin commission monthly query error:', error);
      return NextResponse.json({ error: 'Failed to fetch commission totals' }, { status: 500 });
    }

    const rows = (data || []) as CommissionMonthlyTotal[];
    const summary = rows.reduce(
      (acc, row) => {
        acc.totalCommissionCents += row.total_commission_cents ?? 0;
        acc.totalSales += row.sales_count ?? 0;
        return acc;
      },
      { totalCommissionCents: 0, totalSales: 0 }
    );

    return NextResponse.json({
      rows,
      summary,
    });
  } catch (error) {
    console.error('Admin commission monthly API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
