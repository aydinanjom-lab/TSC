import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: undefined }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    this.setState({ error })
    console.error(error)
  }

  render() {
    return this.state.error ? (
      <div style={{ padding: 20, color: '#fff' }}>Something went wrong. Check console.</div>
    ) : (
      this.props.children
    )
  }
}

export default ErrorBoundary
