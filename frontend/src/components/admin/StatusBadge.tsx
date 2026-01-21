'use client';

import { cn } from '@/lib/utils';

// Order status types
export type OrderStatus = 'pending' | 'reviewing' | 'approved' | 'fulfilled' | 'cancelled';

// Payment status types
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

// Invoice status types
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

// Stock status types
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';

// Category types (product strain types)
export type CategoryStatus = 'Indica' | 'Sativa' | 'Hybrid';

// Published status types
export type PublishedStatus = 'published' | 'draft';

// User account status types
export type UserAccountStatus = 'active' | 'pending' | 'blocked';

// User confirmation status types
export type UserConfirmationStatus = 'confirmed' | 'unconfirmed';

export type UserType = 'admin' | 'reseller';

// Generic status type for flexibility
export type StatusType = OrderStatus | PaymentStatus | InvoiceStatus | StockStatus | CategoryStatus | PublishedStatus | UserAccountStatus | UserConfirmationStatus | UserType | string;

interface StatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
  dotColor?: string;
}

const orderStatusConfig: Record<OrderStatus, StatusConfig> = {
  pending: {
    label: 'Pending',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    textColor: 'text-amber-700 dark:text-amber-300',
    dotColor: 'bg-amber-500',
  },
  reviewing: {
    label: 'Reviewing',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    dotColor: 'bg-blue-500',
  },
  approved: {
    label: 'Approved',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
    dotColor: 'bg-green-500',
  },
  fulfilled: {
    label: 'Fulfilled',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-700 dark:text-purple-300',
    dotColor: 'bg-purple-500',
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    dotColor: 'bg-red-500',
  },
};

const paymentStatusConfig: Record<PaymentStatus, StatusConfig> = {
  unpaid: {
    label: 'Unpaid',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    dotColor: 'bg-red-500',
  },
  partial: {
    label: 'Partial',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    textColor: 'text-amber-700 dark:text-amber-300',
    dotColor: 'bg-amber-500',
  },
  paid: {
    label: 'Paid',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
    dotColor: 'bg-green-500',
  },
};

const invoiceStatusConfig: Record<InvoiceStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    bgColor: 'bg-muted/50',
    textColor: 'text-muted-foreground',
    dotColor: 'bg-muted-foreground',
  },
  sent: {
    label: 'Sent',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    dotColor: 'bg-blue-500',
  },
  paid: {
    label: 'Paid',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
    dotColor: 'bg-green-500',
  },
  overdue: {
    label: 'Overdue',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    dotColor: 'bg-red-500',
  },
};

const stockStatusConfig: Record<StockStatus, StatusConfig> = {
  in_stock: {
    label: 'In stock',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
  },
  low_stock: {
    label: 'Low stock',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    textColor: 'text-amber-700 dark:text-amber-300',
  },
  out_of_stock: {
    label: 'Out of stock',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
  },
  unknown: {
    label: 'No inventory',
    bgColor: 'bg-slate-50 dark:bg-slate-900/20',
    textColor: 'text-slate-600 dark:text-slate-400',
  },
};

const categoryStatusConfig: Record<CategoryStatus, StatusConfig> = {
  Indica: {
    label: 'Indica',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-700 dark:text-purple-300',
  },
  Sativa: {
    label: 'Sativa',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
  },
  Hybrid: {
    label: 'Hybrid',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
  },
};

const publishedStatusConfig: Record<PublishedStatus, StatusConfig> = {
  published: {
    label: 'Published',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
  },
  draft: {
    label: 'Draft',
    bgColor: 'bg-muted/50',
    textColor: 'text-muted-foreground',
  },
};

const userAccountStatusConfig: Record<UserAccountStatus, StatusConfig> = {
  active: {
    label: 'Active',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
  },
  pending: {
    label: 'Pending',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    textColor: 'text-amber-700 dark:text-amber-300',
  },
  blocked: {
    label: 'Blocked',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
  },
};

const userConfirmationStatusConfig: Record<UserConfirmationStatus, StatusConfig> = {
  confirmed: {
    label: 'Yes',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
  },
  unconfirmed: {
    label: 'Pending',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    textColor: 'text-amber-700 dark:text-amber-300',
  },
};

const userTypeConfig: Record<UserType, StatusConfig> = {
  admin: {
    label: 'Admin',
    bgColor: 'bg-slate-50 dark:bg-slate-900/20',
    textColor: 'text-slate-600 dark:text-slate-400',
  },
  reseller: {
    label: 'Reseller',
    bgColor: 'bg-slate-50 dark:bg-slate-900/20',
    textColor: 'text-slate-600 dark:text-slate-400',
  },
};

// Default config for unknown statuses
const defaultConfig: StatusConfig = {
  label: 'Unknown',
  bgColor: 'bg-muted/50',
  textColor: 'text-muted-foreground',
  dotColor: 'bg-muted-foreground',
};

type StatusVariant = 'order' | 'payment' | 'invoice' | 'stock' | 'category' | 'published' | 'user-account' | 'user-confirmation' | 'user-type';

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
  if (variant === 'stock' && status in stockStatusConfig) {
    return stockStatusConfig[status as StockStatus];
  }
  if (variant === 'category' && status in categoryStatusConfig) {
    return categoryStatusConfig[status as CategoryStatus];
  }
  if (variant === 'published' && status in publishedStatusConfig) {
    return publishedStatusConfig[status as PublishedStatus];
  }
  if (variant === 'user-account' && status in userAccountStatusConfig) {
    return userAccountStatusConfig[status as UserAccountStatus];
  }
  if (variant === 'user-confirmation' && status in userConfirmationStatusConfig) {
    return userConfirmationStatusConfig[status as UserConfirmationStatus];
  }
  if (variant === 'user-type' && status in userTypeConfig) {
    return userTypeConfig[status as UserType];
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
  if (status in stockStatusConfig) {
    return stockStatusConfig[status as StockStatus];
  }
  if (status in categoryStatusConfig) {
    return categoryStatusConfig[status as CategoryStatus];
  }
  if (status in publishedStatusConfig) {
    return publishedStatusConfig[status as PublishedStatus];
  }
  if (status in userAccountStatusConfig) {
    return userAccountStatusConfig[status as UserAccountStatus];
  }
  if (status in userConfirmationStatusConfig) {
    return userConfirmationStatusConfig[status as UserConfirmationStatus];
  }
  if (status in userTypeConfig) {
    return userTypeConfig[status as UserType];
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
