import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-error-light flex items-center justify-center mb-4">
        <AlertCircle size={28} className="text-error" />
      </div>
      <h3 className="text-lg font-semibold text-navy mb-2">{title}</h3>
      <p className="text-gray-body text-sm max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          leftIcon={<RefreshCw size={16} />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
