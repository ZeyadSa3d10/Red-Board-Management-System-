import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary d-flex flex-column align-items-center justify-content-center min-vh-100 p-4">
          <h2 className="mb-3">حدث خطأ غير متوقع</h2>
          <p className="text-muted mb-4">يرجى المحاولة مرة أخرى</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
