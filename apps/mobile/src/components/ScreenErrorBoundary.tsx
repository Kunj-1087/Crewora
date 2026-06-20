'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { logError } from '@/lib/log';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render-time errors in the screen tree and shows a recoverable fallback
 * instead of a white screen. Errors are forwarded to the logging sink (spec §5).
 */
export class ScreenErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError(error, `ScreenErrorBoundary${info.componentStack ? '' : ''}`);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-light">
          <AlertTriangle size={28} className="text-error" aria-hidden="true" />
        </div>
        <h2 className="mb-1.5 text-lg font-semibold text-navy">
          Something went wrong
        </h2>
        <p className="mb-6 max-w-xs text-sm text-gray-body">
          An unexpected error occurred while loading this screen. Please try again.
        </p>
        <Button variant="primary" onClick={this.handleRetry}>
          Try Again
        </Button>
      </div>
    );
  }
}
