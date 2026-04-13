import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

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
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#0f1117] p-6 text-[#e2e8f0]">
          <div className="max-w-3xl w-full bg-[#141720] border border-red-500/50 rounded-xl p-6 shadow-2xl">
            <h1 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              Critical Application Error
            </h1>
            <p className="text-gray-300 mb-4">
              The application encountered an unexpected error and failed to render. Please copy the error details below and send them to the developer:
            </p>
            <div className="bg-[#0b0c10] border border-[#1e2334] rounded-lg p-4 overflow-auto max-h-[400px]">
              <h3 className="text-red-300 font-mono text-sm font-semibold mb-2">{this.state.error?.toString()}</h3>
              <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-6 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-4 py-2 rounded font-medium transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
