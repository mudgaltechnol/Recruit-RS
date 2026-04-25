import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { PositionsPage } from './pages/PositionsPage';
import { CandidatesList } from './pages/CandidatesList';
import { CandidateDetail } from './pages/CandidateDetail';
import { RolesCatalog } from './pages/RolesCatalog';
import { NewsletterAdmin } from './pages/NewsletterAdmin';
import { ScheduleAdmin } from './pages/ScheduleAdmin';
import { Reports } from './pages/Reports';
import { AdminIntelligence } from './pages/AdminIntelligence';
import { EmployeesAdmin } from './pages/EmployeesAdmin';
import { AdminLayout } from './components/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/positions" element={<PositionsPage />} />
          <Route path="/intelligence" element={<Dashboard />} />

          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <Navigate to="/admin/candidates" replace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/intelligence" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout>
                  <AdminIntelligence />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/candidates" 
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CandidatesList />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/candidates/:id" 
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <CandidateDetail />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/roles" 
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <RolesCatalog />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/newsletter" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout>
                  <NewsletterAdmin />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/schedule" 
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <ScheduleAdmin />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/employees" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout>
                  <EmployeesAdmin />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/reports" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout>
                  <Reports />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
