import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Copy } from 'lucide-react';
import { User } from '@/api/entities';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, errorCode: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  async componentDidCatch(error, errorInfo) {
    const errorCode = `ERR-${Date.now()}`;
    this.setState({ errorInfo, errorCode });
    
    // --- Telemetry Logging ---
    // In a real app, you'd send this to a logging service (Sentry, Datadog, etc.)
    try {
      const user = await User.me();
      console.error("Caught an error:", {
        errorCode,
        error,
        errorInfo,
        user: { id: user.id, email: user.email },
        route: window.location.pathname,
        // scanId can be passed as a prop to the ErrorBoundary if available on the page
        scanId: this.props.scanId || 'N/A',
      });
    } catch (e) {
      console.error("Caught an error (unauthenticated user):", {
        errorCode,
        error,
        errorInfo,
        route: window.location.pathname,
        scanId: this.props.scanId || 'N/A',
      });
    }
  }

  copyErrorDetails = () => {
    const { error, errorInfo, errorCode } = this.state;
    const details = `Error Code: ${errorCode}\n\nError: ${error.toString()}\n\nStack Trace:\n${errorInfo.componentStack}`;
    navigator.clipboard.writeText(details).then(() => {
      alert('Error details copied to clipboard.');
    }, () => {
      alert('Failed to copy error details.');
    });
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-6 md:p-8 flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="max-w-lg w-full bg-zinc-900 border-red-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-red-400">
                        <AlertTriangle className="w-6 h-6" />
                        Something Went Wrong
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-zinc-300">
                        An unexpected error occurred. Please try again. If the problem persists, contact support with the details below.
                    </p>
                    {this.state.errorCode && <p className="text-sm text-zinc-500">Error Code: {this.state.errorCode}</p>}
                    <div className="flex gap-4">
                        <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700">
                            Try Again
                        </Button>
                        <Button variant="outline" onClick={this.copyErrorDetails} className="border-zinc-600">
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Error Details
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;