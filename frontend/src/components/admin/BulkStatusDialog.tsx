'use client';

import { OrderStatus } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BulkStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  currentStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export function BulkStatusDialog({
  open,
  onOpenChange,
  selectedCount,
  currentStatus,
  onStatusChange,
  onConfirm,
  isProcessing,
}: BulkStatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Change the status of {selectedCount} selected {selectedCount === 1 ? 'order' : 'orders'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">New Status</Label>
            <Select value={currentStatus} onValueChange={(value) => onStatusChange(value as OrderStatus)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            This will trigger email notifications and status updates for all selected orders.
            This action cannot be undone.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isProcessing}>
            {isProcessing
              ? 'Processing...'
              : `Update ${selectedCount} ${selectedCount === 1 ? 'Order' : 'Orders'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
