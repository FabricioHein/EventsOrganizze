import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/ui/Layout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import Dashboard from './pages/Dashboard';
import ClientsPage from './pages/ClientsPage';
import EventsPage from './pages/EventsPage';
import PaymentsPage from './pages/PaymentsPage';

// Placeholder components for remaining pages
import CalendarPage from './pages/CalendarPage';
import GuestsPage from './pages/GuestsPage';
import SubscriptionPage from './pages/SubscriptionPage';

import ReportsPage from './pages/ReportsPage';
import SuppliersPage from './pages/SuppliersPage';
import ProposalsPage from './pages/ProposalsPage';
import SettingsPage from './pages/SettingsPage';
import ProductsPage from './pages/ProductsPage';
import ToastContainer from './components/ui/ToastContainer';
import { useToast } from './contexts/ToastContext';

const AppContent: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
               <Layout>
                 <AdminPage />
               </Layout>
             
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <Layout>
                <ClientsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <Layout>
                <EventsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Layout>
                <PaymentsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Layout>
                <CalendarPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <ReportsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <Layout>
                <SuppliersPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/proposals"
          element={
            <ProtectedRoute>
              <Layout>
                <ProposalsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription"
          element={
            <ProtectedRoute>
              <Layout>
                <SubscriptionPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/guests"
          element={
            <ProtectedRoute>
              <Layout>
                <GuestsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Layout>
                <ProductsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <DataProvider>
          <Router>
            <AppContent />
          </Router>
        </DataProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;