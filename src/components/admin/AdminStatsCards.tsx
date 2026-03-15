'use client';

import {
  Users,
  UserCheck,
  ShoppingCart,
  Package,
  CreditCard,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalCreators: number;
  totalOrders: number;
  totalProducts: number;
  proSubscribers: number;
  totalRevenue: number;
  totalCommission: number;
}

interface AdminStatsCardsProps {
  stats: Stats;
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  const cards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Active Creators',
      value: stats.totalCreators.toLocaleString(),
      icon: UserCheck,
      color: 'bg-green-500',
      change: '+8%',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: 'bg-purple-500',
      change: '+23%',
    },
    {
      title: 'Products',
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      color: 'bg-orange-500',
      change: '+5%',
    },
    {
      title: 'Pro Subscribers',
      value: stats.proSubscribers.toLocaleString(),
      icon: CreditCard,
      color: 'bg-brand-500',
      change: '+15%',
    },
    {
      title: 'Total GMV',
      value: `$${(stats.totalRevenue / 100).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      change: '+18%',
    },
    {
      title: 'Commission Earned',
      value: `$${(stats.totalCommission / 100).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-pink-500',
      change: '+10%',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center justify-between">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color} text-white`}
            >
              <card.icon className="h-6 w-6" />
            </div>
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
              {card.change}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {card.title}
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
