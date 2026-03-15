import Stripe from 'stripe';

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is required');
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: '2026-02-25.clover',
    typescript: true,
  });

  const proMonthly = await stripe.prices.create({
    unit_amount: 1999,
    currency: 'usd',
    recurring: { interval: 'month' },
    product_data: { name: 'Cele.bio Pro Monthly' },
  });

  const proYearly = await stripe.prices.create({
    unit_amount: 16790,
    currency: 'usd',
    recurring: { interval: 'year' },
    product_data: { name: 'Cele.bio Pro Yearly' },
  });

  console.log('\nAdd these to .env.local and Vercel:\n');
  console.log(`STRIPE_PRO_MONTHLY_PRICE_ID=${proMonthly.id}`);
  console.log(`STRIPE_PRO_YEARLY_PRICE_ID=${proYearly.id}`);
}

main().catch((error) => {
  console.error('Failed to create Stripe billing products:', error);
  process.exit(1);
});
