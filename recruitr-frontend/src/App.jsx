import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import CompanyDashboard from './pages/companyadmin/CompanyDashboard';
import CollegeDashboard from './pages/collegeadmin/CollegeDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import ExamPage from './pages/student/ExamPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/super-admin"
            element={
              <PrivateRoute allowedRole="SUPER_ADMIN">
                <SuperAdminDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/company-admin"
            element={
              <PrivateRoute allowedRole="COMPANY_ADMIN">
                <CompanyDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/college-admin"
            element={
              <PrivateRoute allowedRole="COLLEGE_ADMIN">
                <CollegeDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/student"
            element={
              <PrivateRoute allowedRole="STUDENT">
                <StudentDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/student/exam/:roundId"
            element={
              <PrivateRoute allowedRole="STUDENT">
                <ExamPage />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
