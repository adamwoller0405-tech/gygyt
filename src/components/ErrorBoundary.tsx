import React, { Component, type ReactNode } from 'react';
import { Bike, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-bg-deep text-center p-8 space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-[32px] flex items-center justify-center text-red-500 border border-red-500/20 shadow-2xl">
            <Bike size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Valami elromlott</h2>
            <p className="text-xs text-neutral-500 font-bold max-w-xs mx-auto leading-relaxed">
              {this.state.error?.message || 'Ismeretlen hiba történt.'}
            </p>
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            className="flex items-center gap-2 bg-brand-orange text-black font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-widest transition-all active:scale-95"
          >
            <RefreshCw size={16} />
            <span>Újratöltés</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
