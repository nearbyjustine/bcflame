'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error:', error);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We apologize for the inconvenience. An unexpected error has occurred.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => reset()} variant="default">
                Try again
              </Button>
              <Button onClick={() => (window.location.href = '/')} variant="outline">
                Go home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
