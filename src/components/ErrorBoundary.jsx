import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.state = { hasError: true, error, errorInfo };
    }

    render() {
        if (this.state.hasError) {
            const errorDetails = this.state.error ? {
                message: this.state.error.message,
                stack: this.state.error.stack,
                ...this.state.error
            } : 'Unknown Error';

            return (
                <div style={{
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    maxWidth: '800px',
                    margin: '0 auto',
                    fontFamily: 'system-ui, sans-serif'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '1rem' }}>
                        🚨
                    </div>

                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
                        Oops! Something went wrong
                    </h1>

                    <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>
                        The application encountered an error. Please share the details below so we can fix it:
                    </p>

                    <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        marginBottom: '2rem',
                        textAlign: 'left',
                        maxHeight: '400px',
                        overflow: 'auto'
                    }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem' }}>
                            Error Details:
                        </h3>
                        <pre style={{ fontSize: '0.75rem', color: '#dc2626', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                            {this.state.error && (this.state.error.stack || JSON.stringify(errorDetails, null, 2) || this.state.error.toString())}
                        </pre>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '0.75rem 2rem', background: '#3b82f6', color: 'white',
                                border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            Reload Page
                        </button>
                        <button
                            onClick={() => {
                                localStorage.clear();
                                window.location.href = '/';
                            }}
                            style={{
                                padding: '0.75rem 2rem', background: '#ef4444', color: 'white',
                                border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            Clear Cache & Restart
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
