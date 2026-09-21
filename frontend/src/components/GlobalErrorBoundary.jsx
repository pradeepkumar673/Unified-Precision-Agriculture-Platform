import React from 'react';

export default class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 text-center">
          <span className="material-symbols-outlined text-[64px] text-error mb-4">gpp_maybe</span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Application Error</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-8">
            We encountered an unexpected issue while rendering this page. 
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                this.setState({ hasError: false });
                window.location.hash = '#/';
              }}
              className="px-6 py-3 bg-surface-container text-on-surface rounded-xl font-label-lg text-label-lg font-bold hover:bg-surface-container-high transition-colors"
            >
              Go to Home
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-on-primary rounded-xl font-label-lg text-label-lg font-bold shadow-sm hover:opacity-90 transition-opacity"
            >
              Refresh Page
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && (
             <details className="mt-8 text-left bg-surface-container-low p-4 rounded-lg w-full max-w-2xl overflow-auto text-xs font-mono text-error">
               <summary className="cursor-pointer mb-2 font-bold text-sm">Error Details (Dev Only)</summary>
               {this.state.error?.toString()}
             </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
