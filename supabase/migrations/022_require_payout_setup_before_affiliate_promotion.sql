-- Block affiliate promotions until promoter payout setup is complete.

create or replace function public.enforce_payout_setup_on_affiliate_promotions_insert()
returns trigger
language plpgsql
as $$
begin
  if not public.is_creator_payout_setup_complete(new.promoter_id) then
    raise exception 'Complete payout settings before promoting products as an affiliate.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_payout_setup_affiliate_promotions_insert on public.affiliate_promotions;
create trigger trg_enforce_payout_setup_affiliate_promotions_insert
before insert
on public.affiliate_promotions
for each row
execute function public.enforce_payout_setup_on_affiliate_promotions_insert();
