import React from 'react';
import { Link } from 'react-router-dom';
import { Empty } from '../components/common/index.jsx';

export default function NotFound() {
  return <Empty title="This page wandered off" body="Head back to your learning space and keep going." action={<Link className="btn btn-primary" to="/dashboard">Go to dashboard</Link>} />;
}
