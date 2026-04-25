import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService, isAdminUser } from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  if (!isAuthenticated) {
    // Redirect to home if not authenticated
    // The header will handle showing the login dialog if they click Admin
    // But if they deep link, we just send them back to home
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdminUser(currentUser)) {
    return <Navigate to="/admin/candidates" replace />;
  }

  return <>{children}</>;
};
