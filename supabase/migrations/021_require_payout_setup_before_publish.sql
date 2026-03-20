-- Block publishing products/courses until payout setup is complete.

create or replace function public.is_creator_payout_setup_complete(p_creator_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  payout record;
  resolved_provider text;
  country_code text;
begin
  select
    payout_country_code,
    payout_provider,
    stripe_account_id,
    stripe_account_status,
    paystack_subaccount_code,
    paystack_subaccount_status,
    manual_bank_account_name,
    manual_bank_account_number,
    manual_bank_name,
    manual_bank_code,
    manual_bank_iban,
    manual_bank_swift
  into payout
  from public.profiles
  where id = p_creator_id;

  if not found then
    return false;
  end if;

  country_code := upper(coalesce(trim(payout.payout_country_code), ''));
  if country_code = '' then
    return false;
  end if;

  resolved_provider := coalesce(
    payout.payout_provider,
    case
      when country_code in ('NG', 'GH', 'ZA', 'KE', 'CI') then 'paystack'
      when country_code in (
        'AE','AT','AU','BE','BG','BR','CA','CH','CY','CZ','DE','DK','EE','ES',
        'FI','FR','GB','GI','GR','HK','HR','HU','IE','IN','IT','JP','LI','LT',
        'LU','LV','MT','MX','MY','NL','NO','NZ','PL','PT','RO','SE','SG','SI',
        'SK','TH','US'
      ) then 'stripe'
      else 'manual_bank'
    end
  );

  if resolved_provider = 'stripe' then
    return payout.stripe_account_id is not null
      and payout.stripe_account_status = 'complete';
  end if;

  if resolved_provider = 'paystack' then
    return payout.paystack_subaccount_code is not null
      and payout.paystack_subaccount_status = 'connected';
  end if;

  return payout.manual_bank_account_name is not null
    and payout.manual_bank_account_number is not null
    and (
      payout.manual_bank_name is not null
      or payout.manual_bank_code is not null
      or payout.manual_bank_iban is not null
      or payout.manual_bank_swift is not null
    );
end;
$$;

create or replace function public.enforce_payout_setup_on_products_publish()
returns trigger
language plpgsql
as $$
begin
  if new.is_published is true
     and (tg_op = 'INSERT' or coalesce(old.is_published, false) = false)
     and not public.is_creator_payout_setup_complete(new.creator_id) then
    raise exception 'Complete payout settings before publishing products.';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_payout_setup_on_courses_publish()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published'
     and (tg_op = 'INSERT' or coalesce(old.status, 'draft') <> 'published')
     and not public.is_creator_payout_setup_complete(new.creator_id) then
    raise exception 'Complete payout settings before publishing courses.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_payout_setup_products_publish on public.products;
create trigger trg_enforce_payout_setup_products_publish
before insert or update of is_published
on public.products
for each row
execute function public.enforce_payout_setup_on_products_publish();

drop trigger if exists trg_enforce_payout_setup_courses_publish on public.courses;
create trigger trg_enforce_payout_setup_courses_publish
before insert or update of status
on public.courses
for each row
execute function public.enforce_payout_setup_on_courses_publish();
