import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { applyEmailTokens, sendMarketingEmail } from '@/lib/email-marketing';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createServiceClient();

    const { data: pending } = await (supabase.from('email_sequence_enrollments') as any)
      .select('id, sequence_id, subscriber_id, current_step, next_send_at, completed')
      .eq('completed', false)
      .lte('next_send_at', new Date().toISOString())
      .limit(200);

    let processed = 0;

    for (const enrollment of pending || []) {
      const { data: sequence } = await (supabase.from('email_sequences') as any)
        .select('id,creator_id,name,is_active')
        .eq('id', enrollment.sequence_id)
        .maybeSingle();
      if (!sequence?.is_active) continue;

      const { data: step } = await (supabase.from('email_sequence_steps') as any)
        .select('*')
        .eq('sequence_id', enrollment.sequence_id)
        .eq('position', enrollment.current_step)
        .maybeSingle();

      if (!step) {
        await (supabase.from('email_sequence_enrollments') as any)
          .update({ completed: true })
          .eq('id', enrollment.id);
        continue;
      }

      const { data: subscriber } = await (supabase.from('email_subscribers') as any)
        .select('email,first_name,is_active')
        .eq('id', enrollment.subscriber_id)
        .maybeSingle();
      if (!subscriber?.is_active) continue;

      const { data: creator } = await (supabase.from('profiles') as any)
        .select('full_name')
        .eq('id', sequence.creator_id)
        .maybeSingle();

      const html = applyEmailTokens(step.body_html, {
        firstName: subscriber.first_name,
        creatorName: creator?.full_name || 'Creator',
      });

      await sendMarketingEmail({
        to: subscriber.email,
        subject: applyEmailTokens(step.subject, {
          firstName: subscriber.first_name,
          creatorName: creator?.full_name || 'Creator',
        }),
        html,
      });

      const { data: nextStep } = await (supabase.from('email_sequence_steps') as any)
        .select('*')
        .eq('sequence_id', enrollment.sequence_id)
        .eq('position', enrollment.current_step + 1)
        .maybeSingle();

      if (!nextStep) {
        await (supabase.from('email_sequence_enrollments') as any)
          .update({ completed: true, current_step: enrollment.current_step + 1 })
          .eq('id', enrollment.id);
      } else {
        const nextSendAt = new Date();
        nextSendAt.setDate(nextSendAt.getDate() + (nextStep.delay_days || 1));

        await (supabase.from('email_sequence_enrollments') as any)
          .update({
            current_step: enrollment.current_step + 1,
            next_send_at: nextSendAt.toISOString(),
          })
          .eq('id', enrollment.id);
      }

      processed += 1;
    }

    return NextResponse.json({ success: true, processed });
  } catch (error) {
    console.error('Process email sequences cron error:', error);
    return NextResponse.json({ error: 'Failed to process sequences' }, { status: 500 });
  }
}
