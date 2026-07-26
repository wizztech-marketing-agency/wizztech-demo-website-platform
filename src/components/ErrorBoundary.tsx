import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React component tree:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('wizztech_notifications');
    } catch (e) {
      console.warn(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center select-none">
          <div className="bg-white border border-red-200 p-8 rounded-2xl shadow-luxury max-w-md w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">Application Error</h2>
              <p className="text-xs text-secondary mt-1.5 leading-relaxed">
                {this.state.error?.message || 'A temporary rendering error occurred in the application.'}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-2.5 bg-black text-white text-xs font-semibold rounded-xl hover:bg-black/90 transition-all flex items-center justify-center gap-2 shadow-luxury cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset & Reload Platform</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
