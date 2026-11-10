import React from 'react';

export default class RouteErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <main className="route-error-page">
      <div className="route-error-card" role="alert">
        <span className="eyebrow">PAGE ERROR</span>
        <h1>This page could not load</h1>
        <p>There was a problem opening this screen. Reload the page or return to your dashboard.</p>
        <div><button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>Reload page</button><a className="btn btn-outline" href="/dashboard">Go to dashboard</a></div>
      </div>
    </main>;
  }
}
