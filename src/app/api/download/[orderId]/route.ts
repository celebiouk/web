/**
 * Download API
 * GET /api/download/[orderId]
 * 
 * Generates a signed URL for downloading the product file
 * Tracks download in order_downloads table
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

// Lazy initialization for Supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const headersList = await headers();
    const supabaseAdmin = getSupabaseAdmin();

    // Get order with product info
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        products (
          id,
          title,
          file_url
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check order status
    if (order.status !== 'completed') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const product = order.products as { id: string; title: string; file_url: string | null };

    if (!product?.file_url) {
      return NextResponse.json(
        { error: 'No file available for this product' },
        { status: 400 }
      );
    }

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('product-files')
      .createSignedUrl(product.file_url, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Signed URL error:', signedUrlError);
      return NextResponse.json(
        { error: 'Failed to generate download link' },
        { status: 500 }
      );
    }

    // Track download
    await supabaseAdmin.from('order_downloads').insert({
      order_id: orderId,
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null,
      user_agent: headersList.get('user-agent') || null,
    });

    return NextResponse.json({
      downloadUrl: signedUrlData.signedUrl,
      fileName: product.title,
      expiresIn: 3600,
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to process download' },
      { status: 500 }
    );
  }
}
