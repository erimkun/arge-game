import { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorBoundary
 * Catches React errors and prevents app crashes
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
          <div className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-red-600">⚠️ Bir Hata Oluştu</h2>
            <p className="mt-3 text-sm text-gray-600">
              3D model yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.
            </p>
            {this.props.showDetails && this.state.error && (
              <details className="mt-4 rounded-lg bg-gray-100 p-3 text-xs">
                <summary className="cursor-pointer font-semibold">Hata Detayları</summary>
                <pre className="mt-2 overflow-auto text-red-600">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full rounded-xl bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  showDetails: PropTypes.bool,
};

ErrorBoundary.defaultProps = {
  showDetails: false,
};

export default ErrorBoundary;