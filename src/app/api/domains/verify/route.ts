import { NextResponse } from 'next/server';
import { resolve } from 'node:dns/promises';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  domain: z.string().min(3),
});

const CNAME_TARGET = (process.env.CUSTOM_DOMAIN_CNAME_TARGET || 'cname.cele.bio').replace(/\.$/, '').toLowerCase();
const APEX_TARGET = (process.env.CUSTOM_DOMAIN_APEX_IP || '76.76.21.21').trim();

function normalizeDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const serviceSupabase = await createServiceClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = bodySchema.parse(await request.json());
    const domain = normalizeDomain(body.domain);

    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const profile = profileRaw as { subscription_tier: 'free' | 'pro' } | null;

    if (profile?.subscription_tier !== 'pro') {
      return NextResponse.json({ error: 'Custom domains are available on Pro only' }, { status: 403 });
    }

    let apexMatches = false;
    let cnameMatches = false;

    try {
      const apexRecords = await resolve(domain, 'A');
      apexMatches = apexRecords.includes(APEX_TARGET);
    } catch {
      apexMatches = false;
    }

    try {
      const cnameRecords = await resolve(`www.${domain}`, 'CNAME');
      cnameMatches = cnameRecords.some((value) => value.replace(/\.$/, '').toLowerCase() === CNAME_TARGET);
    } catch {
      cnameMatches = false;
    }

    const verified = apexMatches || cnameMatches;

    await (serviceSupabase.from('profiles') as any)
      .update({
        custom_domain: domain,
        domain_verified: verified,
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      domain,
      status: verified ? 'verified' : 'pending',
      checks: {
        apexMatches,
        cnameMatches,
        apexTarget: APEX_TARGET,
        cnameTarget: CNAME_TARGET,
      },
    });
  } catch (error) {
    console.error('Domain verification error:', error);
    return NextResponse.json({ error: 'Failed to verify domain' }, { status: 500 });
  }
}
