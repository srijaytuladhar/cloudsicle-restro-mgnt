import React from 'react';
import { 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  UtensilsCrossed, 
  Sparkles, 
  BadgeCheck,
  Coins,
  X
} from 'lucide-react';

export const STATUS_CONFIG = {
  ORDER_PLACED: {
    label: 'Order Placed',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    icon: Clock
  },
  PREPARING_IN_KITCHEN: {
    label: 'Preparing in Kitchen',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    icon: ChefHat
  },
  READY: {
    label: 'Ready to Serve',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20',
    icon: Sparkles
  },
  SERVING: {
    label: 'Serving',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
    icon: UtensilsCrossed
  },
  SERVED: {
    label: 'Served',
    bg: 'bg-teal-500/10',
    text: 'text-teal-400',
    border: 'border-teal-500/20',
    icon: CheckCircle2
  },
  PAYMENT_DONE: {
    label: 'Payment Done',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    icon: BadgeCheck
  },
  CASH_PAYMENT_PENDING: {
    label: 'Cash Requested',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    icon: Coins
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    icon: X
  }
};

export const ORDER_FLOW = [
  'ORDER_PLACED',
  'PREPARING_IN_KITCHEN',
  'READY',
  'SERVING',
  'SERVED',
  'PAYMENT_DONE'
];

export default function StatusBadge({ status, showIcon = true, size = 'md' }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-slate-800',
    text: 'text-slate-400',
    border: 'border-slate-700',
    icon: Clock
  };

  const Icon = config.icon;

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : size === 'lg' 
    ? 'px-3.5 py-1.5 text-sm font-semibold' 
    : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}>
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      {config.label}
    </span>
  );
}
