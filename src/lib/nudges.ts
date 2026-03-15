type SupabaseLike = {
  from: (table: string) => any;
};

export type UpgradeNudgeType =
  | 'first_sale'
  | 'third_sale'
  | 'fourth_product_attempt'
  | 'email_limit_warning';

export async function ensureUpgradeNudge(
  supabase: SupabaseLike,
  userId: string,
  nudgeType: UpgradeNudgeType
) {
  const existing = await (supabase.from('upgrade_nudges') as any)
    .select('id')
    .eq('user_id', userId)
    .eq('nudge_type', nudgeType)
    .maybeSingle();

  if (existing.data) {
    return existing.data;
  }

  const inserted = await (supabase.from('upgrade_nudges') as any)
    .insert({ user_id: userId, nudge_type: nudgeType })
    .select('id')
    .single();

  return inserted.data;
}

export async function markUpgradeNudgeClicked(
  supabase: SupabaseLike,
  userId: string,
  nudgeType: UpgradeNudgeType
) {
  await (supabase.from('upgrade_nudges') as any)
    .update({ clicked: true })
    .eq('user_id', userId)
    .eq('nudge_type', nudgeType);
}

export async function markUpgradeNudgeConverted(
  supabase: SupabaseLike,
  userId: string
) {
  await (supabase.from('upgrade_nudges') as any)
    .update({ converted: true })
    .eq('user_id', userId)
    .eq('converted', false);
}
