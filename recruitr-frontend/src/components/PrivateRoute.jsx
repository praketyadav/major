import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const PrivateRoute = ({ children, allowedRole }) => {
  const { token, role } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Navigate to="/super-admin" replace />;
      case 'COMPANY_ADMIN':
        return <Navigate to="/company-admin" replace />;
      case 'COLLEGE_ADMIN':
        return <Navigate to="/college-admin" replace />;
      case 'STUDENT':
        return <Navigate to="/student" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default PrivateRoute;
