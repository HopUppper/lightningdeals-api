import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[REACT ERROR BOUNDARY]', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg text-fg flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-card border border-border rounded-panel p-8 text-center space-y-6 shadow-xl">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-fg">Something unexpected occurred</h2>
              <p className="text-xs text-muted leading-relaxed font-mono">
                The application encountered a temporary UI rendering state. Your data and API keys remain safe and unaffected.
              </p>
            </div>

            <div className="p-3 rounded-control bg-subtle border border-border text-[11px] font-mono text-muted text-left overflow-x-auto max-h-24">
              {this.state.error?.message || 'Unknown render error'}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="ui-button-primary py-2.5 px-4 text-xs font-semibold gap-2 justify-center"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="ui-button-secondary py-2.5 px-4 text-xs font-semibold gap-2 justify-center"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
