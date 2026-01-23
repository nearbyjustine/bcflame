'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  totalCount: number;
  onExport: (format: 'csv' | 'xlsx', exportAll: boolean) => void;
}

export function ExportDialog({
  open,
  onOpenChange,
  selectedCount,
  totalCount,
  onExport,
}: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [exportAll, setExportAll] = useState(false);

  const handleExport = () => {
    onExport(format, exportAll);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Orders</DialogTitle>
          <DialogDescription>
            Download order data in CSV or Excel format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Scope */}
          <div className="space-y-3">
            <Label>Export Scope</Label>
            <RadioGroup value={exportAll ? 'all' : 'selected'} onValueChange={(v) => setExportAll(v === 'all')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="selected" id="selected" disabled={selectedCount === 0} />
                <Label htmlFor="selected" className={selectedCount === 0 ? 'text-muted-foreground' : ''}>
                  Selected orders ({selectedCount})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All orders ({totalCount})</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Format */}
          <div className="space-y-3">
            <Label>Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'csv' | 'xlsx')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">
                  CSV (.csv)
                  <span className="block text-xs text-muted-foreground">
                    Comma-separated values, compatible with Excel and spreadsheet apps
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx">
                  Excel (.xlsx)
                  <span className="block text-xs text-muted-foreground">
                    Microsoft Excel format with formatting
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <p className="text-sm text-muted-foreground">
            Export includes all order details: inquiry number, customer information, product details, status, payment, dates, notes, tracking, and customizations.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
