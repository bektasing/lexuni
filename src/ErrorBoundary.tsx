import { Component, type ErrorInfo, type ReactNode } from "react";

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <main className="error-screen">
          <span className="eyebrow">Lexuni</span>
          <h1>Something went wrong.</h1>
          <p>Your local vocabulary is safe. Reload the app to try again.</p>
          <pre>{this.state.error?.message}</pre>
          <button type="button" className="button button-primary" onClick={() => window.location.reload()}>Reload Lexuni</button>
        </main>
      );
    }

    return this.props.children;
  }
}
