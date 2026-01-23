'use client';

import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

interface BulkActionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
}

export function BulkActionToolbar({ selectedCount, onClearSelection, actions }: BulkActionToolbarProps) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-primary/5 border rounded-lg sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-primary" />
        <span className="font-medium">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'outline'}
            size="sm"
            onClick={action.onClick}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="mr-2 h-4 w-4" />
          Clear Selection
        </Button>
      </div>
    </div>
  );
}
