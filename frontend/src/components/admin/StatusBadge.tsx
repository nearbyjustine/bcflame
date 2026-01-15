'use client';

import { cn } from '@/lib/utils';

// Order status types
export type OrderStatus = 'pending' | 'reviewing' | 'approved' | 'fulfilled' | 'cancelled';

// Payment status types
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

// Invoice status types
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

// Generic status type for flexibility
export type StatusType = OrderStatus | PaymentStatus | InvoiceStatus | string;

interface StatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
  dotColor?: string;
}

const orderStatusConfig: Record<OrderStatus, StatusConfig> = {
  pending: {
    label: 'Pending',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
  reviewing: {
    label: 'Reviewing',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    dotColor: 'bg-blue-500',
  },
  approved: {
    label: 'Approved',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    dotColor: 'bg-green-500',
  },
  fulfilled: {
    label: 'Fulfilled',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    dotColor: 'bg-purple-500',
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    dotColor: 'bg-red-500',
  },
};

const paymentStatusConfig: Record<PaymentStatus, StatusConfig> = {
  unpaid: {
    label: 'Unpaid',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    dotColor: 'bg-red-500',
  },
  partial: {
    label: 'Partial',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
  paid: {
    label: 'Paid',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    dotColor: 'bg-green-500',
  },
};

const invoiceStatusConfig: Record<InvoiceStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    dotColor: 'bg-slate-500',
  },
  sent: {
    label: 'Sent',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    dotColor: 'bg-blue-500',
  },
  paid: {
    label: 'Paid',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    dotColor: 'bg-green-500',
  },
  overdue: {
    label: 'Overdue',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    dotColor: 'bg-red-500',
  },
};

// Default config for unknown statuses
const defaultConfig: StatusConfig = {
  label: 'Unknown',
  bgColor: 'bg-slate-50',
  textColor: 'text-slate-700',
  dotColor: 'bg-slate-500',
};

type StatusVariant = 'order' | 'payment' | 'invoice';

interface StatusBadgeProps {
  status: StatusType;
  variant?: StatusVariant;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

function getStatusConfig(status: StatusType, variant?: StatusVariant): StatusConfig {
  if (variant === 'order' && status in orderStatusConfig) {
    return orderStatusConfig[status as OrderStatus];
  }
  if (variant === 'payment' && status in paymentStatusConfig) {
    return paymentStatusConfig[status as PaymentStatus];
  }
  if (variant === 'invoice' && status in invoiceStatusConfig) {
    return invoiceStatusConfig[status as InvoiceStatus];
  }

  // Try to auto-detect based on status value
  if (status in orderStatusConfig) {
    return orderStatusConfig[status as OrderStatus];
  }
  if (status in paymentStatusConfig) {
    return paymentStatusConfig[status as PaymentStatus];
  }
  if (status in invoiceStatusConfig) {
    return invoiceStatusConfig[status as InvoiceStatus];
  }

  // Return default with the status as label
  return {
    ...defaultConfig,
    label: String(status).charAt(0).toUpperCase() + String(status).slice(1),
  };
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-sm',
};

const dotSizeClasses = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
};

export function StatusBadge({
  status,
  variant,
  size = 'md',
  showDot = true,
  className,
}: StatusBadgeProps) {
  const config = getStatusConfig(status, variant);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bgColor,
        config.textColor,
        sizeClasses[size],
        className
      )}
    >
      {showDot && config.dotColor && (
        <span
          className={cn('rounded-full', config.dotColor, dotSizeClasses[size])}
        />
      )}
      {config.label}
    </span>
  );
}

// Export helper function for getting just the config (useful for custom rendering)
export { getStatusConfig };
