'use client';

import { DollarSign, ShoppingCart, Clock, CheckCircle } from 'lucide-react';

interface OrdersStatsProps {
  stats: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalRevenue: number;
  };
}

export function OrdersStats({ stats }: OrdersStatsProps) {
  const cards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: 'Completed',
      value: stats.completedOrders.toLocaleString(),
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Pending',
      value: stats.pendingOrders.toLocaleString(),
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      title: 'Total Revenue',
      value: `$${(stats.totalRevenue / 100).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color} text-white`}
          >
            <card.icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {card.title}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
