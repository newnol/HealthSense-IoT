// components/ErrorBoundary.jsx - React Error Boundary component
import React from 'react'
import { logError } from '../utils/errorHandler'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    logError(error, { 
      componentStack: errorInfo.componentStack,
      component: this.props.component || 'Unknown'
    })
    
    this.setState({
      error,
      errorInfo
    })
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry)
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2>Oops! Có lỗi xảy ra</h2>
            <p>
              Đã xảy ra lỗi không mong muốn. Chúng tôi đã ghi lại lỗi này và sẽ khắc phục sớm nhất có thể.
            </p>
            
            <div className="error-actions">
              <button 
                onClick={this.handleRetry}
                className="btn btn-primary"
              >
                Thử lại
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-secondary"
              >
                Tải lại trang
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Chi tiết lỗi (Development only)</summary>
                <pre className="error-stack">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>

          <style jsx>{`
            .error-boundary {
              min-height: 400px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 2rem;
              background: #f8f9fa;
              border-radius: 8px;
              margin: 1rem 0;
            }

            .error-boundary-content {
              text-align: center;
              max-width: 500px;
            }

            .error-icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }

            .error-boundary-content h2 {
              color: #e74c3c;
              margin-bottom: 1rem;
              font-size: 1.5rem;
            }

            .error-boundary-content p {
              color: #6c757d;
              margin-bottom: 2rem;
              line-height: 1.6;
            }

            .error-actions {
              display: flex;
              gap: 1rem;
              justify-content: center;
              margin-bottom: 2rem;
            }

            .btn {
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-weight: 500;
              text-decoration: none;
              display: inline-block;
              transition: all 0.2s;
            }

            .btn-primary {
              background: #007bff;
              color: white;
            }

            .btn-primary:hover {
              background: #0056b3;
            }

            .btn-secondary {
              background: #6c757d;
              color: white;
            }

            .btn-secondary:hover {
              background: #545b62;
            }

            .error-details {
              text-align: left;
              margin-top: 2rem;
              padding: 1rem;
              background: #f1f3f4;
              border-radius: 4px;
            }

            .error-details summary {
              cursor: pointer;
              font-weight: 500;
              margin-bottom: 1rem;
            }

            .error-stack {
              background: #fff;
              padding: 1rem;
              border-radius: 4px;
              overflow-x: auto;
              font-size: 0.875rem;
              color: #e74c3c;
              white-space: pre-wrap;
            }
          `}</style>
        </div>
      )
    }

    return this.props.children
  }
}

// HOC to wrap components with error boundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default ErrorBoundary