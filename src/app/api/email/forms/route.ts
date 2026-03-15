import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const updateFormSchema = z.object({
  title: z.string().max(120),
  description: z.string().max(500),
  leadMagnetProductId: z.string().uuid().nullable().optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase.from('profiles') as any)
      .select('email_form_title,email_form_description,lead_magnet_product_id')
      .eq('id', user.id)
      .maybeSingle();

    const { data: products } = await (supabase.from('products') as any)
      .select('id,title,price,is_published')
      .eq('creator_id', user.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      form: {
        title: profile?.email_form_title || 'Get my free guide',
        description: profile?.email_form_description || 'Join my email list for tips, launches, and special offers.',
        leadMagnetProductId: profile?.lead_magnet_product_id || null,
      },
      products: products || [],
    });
  } catch (error) {
    console.error('Email forms GET error:', error);
    return NextResponse.json({ error: 'Failed to load form settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = updateFormSchema.parse(await request.json());

    const { error } = await (supabase.from('profiles') as any)
      .update({
        email_form_title: body.title,
        email_form_description: body.description,
        lead_magnet_product_id: body.leadMagnetProductId || null,
      })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email forms PUT error:', error);
    return NextResponse.json({ error: 'Invalid form payload' }, { status: 400 });
  }
}
