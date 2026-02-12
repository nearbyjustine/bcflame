'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageUploadProps {
  value?: string | File;
  onChange: (file: File | null) => void;
  onImageLoad?: (file: File) => void;
  accept?: string;
  maxSize?: number;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  onImageLoad,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  label,
  error,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate preview URL
  const getPreviewUrl = useCallback(() => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    return URL.createObjectURL(value);
  }, [value]);

  // Handle file selection
  const handleFile = useCallback(
    async (file: File) => {
      // Validate file type
      if (accept && !file.type.match(accept.replace('*', '.*'))) {
        return;
      }

      // Validate file size
      if (maxSize && file.size > maxSize) {
        return;
      }

      setIsLoading(true);

      // Create preview
      const url = URL.createObjectURL(file);
      setPreview(url);

      // Notify parent
      onChange(file);

      // Trigger image load callback for color extraction
      if (onImageLoad) {
        onImageLoad(file);
      }

      setIsLoading(false);
    },
    [accept, maxSize, onChange, onImageLoad]
  );

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  // Handle remove
  const handleRemove = useCallback(() => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [preview, onChange]);

  // Handle click to upload
  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const previewUrl = preview || getPreviewUrl();

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-destructive',
          previewUrl && 'border-solid'
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />

        {previewUrl ? (
          // Preview mode
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover"
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          // Upload mode
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            className={cn(
              'flex flex-col items-center justify-center w-full py-12 px-4 text-center',
              !disabled && 'cursor-pointer hover:bg-muted/50'
            )}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            ) : (
              <>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                  {isDragging ? (
                    <Upload className="w-6 h-6 text-primary" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to {(maxSize / (1024 * 1024)).toFixed(0)}MB
                </p>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
