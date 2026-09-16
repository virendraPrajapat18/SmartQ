/**
 * ============================================================================
 * MAIN APPLICATION COMPONENT (App.jsx)
 * ============================================================================
 * The root component of the React application.
 * Handles the application routing logic, defining public routes, and protecting
 * restricted routes based on user roles (Customer, Admin, Super Admin) using
 * the ProtectedRoute wrapper. Wraps the app in necessary global state providers.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/Public/LandingPage';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import CustomerDashboard from './pages/Customer/CustomerDashboard';
import JoinQueue from './pages/Customer/JoinQueue';
import QueueHistory from './pages/Customer/QueueHistory';
import Feedback from './pages/Customer/Feedback';
import Profile from './pages/Customer/Profile';
import AdminDashboard from './pages/Admin/AdminDashboard';
import QueueControl from './pages/Admin/QueueControl';
import CounterManagement from './pages/Admin/CounterManagement';
import Reports from './pages/Admin/Reports';
import CounterDashboard from './pages/Admin/CounterDashboard';
import UserManagement from './pages/Admin/UserManagement';
import ServiceManagement from './pages/Admin/ServiceManagement';

import AdminFeedbacks from './pages/Admin/AdminFeedbacks';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Customer Routes (Protected) */}
            <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
              <Route path="/dashboard" element={<CustomerDashboard />} />
              <Route path="/join" element={<JoinQueue />} />
              <Route path="/history" element={<QueueHistory />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<div>Notifications Page (Coming Soon)</div>} />
            </Route>

            {/* Super Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/control" element={<QueueControl />} />
              <Route path="/admin/counters" element={<CounterManagement />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/services" element={<ServiceManagement />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/feedbacks" element={<AdminFeedbacks />} />
            </Route>

            {/* Counter Manager (Admin) Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
              <Route path="/admin/counter-dashboard" element={<CounterDashboard />} />
            </Route>



            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
