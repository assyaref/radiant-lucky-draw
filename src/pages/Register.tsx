import { Navigate } from 'react-router-dom';

/** Redirect legacy /register links to the Public Booth. */
export default function Register() {
  return <Navigate to="/booth" replace />;
}
