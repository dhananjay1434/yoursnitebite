/**
 * ✅ SECURE: Error Boundary Component
 * 
 * This component catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger, LogCategory } from '@/services/logging';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    this.logError(error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private async logError(error: Error, errorInfo: ErrorInfo) {
    try {
      await logger.error(
        LogCategory.SYSTEM,
        `React Error Boundary caught error: ${error.message}`,
        {
          errorId: this.state.errorId,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          errorInfo: {
            componentStack: errorInfo.componentStack,
          },
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
        error
      );
    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError);
      console.error('Original error:', error, errorInfo);
    }
  }

  private handleRetry = () => {
    // Reset the error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });

    // Log retry attempt
    logger.info(LogCategory.USER_ACTION, 'User retried after error', {
      errorId: this.state.errorId,
    });
  };

  private handleGoHome = () => {
    // Log navigation attempt
    logger.info(LogCategory.USER_ACTION, 'User navigated home after error', {
      errorId: this.state.errorId,
    });

    // Navigate to home page
    window.location.href = '/';
  };

  private handleReportError = async () => {
    try {
      // Log error report
      await logger.info(LogCategory.USER_ACTION, 'User reported error', {
        errorId: this.state.errorId,
        error: this.state.error?.message,
      });

      // You could integrate with a bug reporting service here
      // For now, we'll just show a success message
      alert('Error reported successfully. Thank you for helping us improve!');
    } catch (error) {
      console.error('Failed to report error:', error);
      alert('Failed to report error. Please try again later.');
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-nitebite-dark flex items-center justify-center p-4">
          <Card className="w-full max-w-md glassmorphic-card">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <CardTitle className="text-nitebite-highlight">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-nitebite-text-muted">
                We encountered an unexpected error. Don't worry, we've been notified and are working on a fix.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error details for development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-red-400 mb-2">
                    Error Details (Development Only)
                  </h4>
                  <p className="text-xs text-red-300 font-mono break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.errorId && (
                    <p className="text-xs text-red-300 mt-1">
                      Error ID: {this.state.errorId}
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2">
                <Button
                  onClick={this.handleRetry}
                  className="w-full glassmorphic-button"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  className="w-full"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Home Page
                </Button>
                
                <Button
                  onClick={this.handleReportError}
                  className="w-full"
                  variant="ghost"
                  size="sm"
                >
                  Report this error
                </Button>
              </div>

              {/* Error ID for user reference */}
              {this.state.errorId && (
                <div className="text-center">
                  <p className="text-xs text-nitebite-text-muted">
                    Error ID: {this.state.errorId}
                  </p>
                  <p className="text-xs text-nitebite-text-muted mt-1">
                    Please include this ID when contacting support
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error reporting in functional components
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: any) => {
    logger.error(
      LogCategory.SYSTEM,
      `Manual error report: ${error.message}`,
      {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      error
    );
  }, []);
}

export default ErrorBoundary;
