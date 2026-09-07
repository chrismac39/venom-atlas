import { Component, type ErrorInfo, type ReactNode } from 'react';

interface VisualizationErrorBoundaryProps {
  children: ReactNode;
  fallback: string;
}

interface VisualizationErrorBoundaryState {
  failed: boolean;
}

export class VisualizationErrorBoundary extends Component<
  VisualizationErrorBoundaryProps,
  VisualizationErrorBoundaryState
> {
  state: VisualizationErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): VisualizationErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Atlas visualization failed to render.', error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return <p className="panel atlas-visualization-error">{this.props.fallback}</p>;
    }

    return this.props.children;
  }
}