import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import AdminUsers from './pages/AdminUsers';
import Members from './pages/Members';
import MembershipFees from './pages/MembershipFees';
import MemberPassView from './pages/MemberPassView';
import Sidebar from './components/Sidebar';
import Attendance from './pages/Attendance';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090E] flex items-center justify-center text-slate-400 text-xs font-bold">
        Loading Pulse Fit Session...
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/users' : '/dashboard'} replace />;
  }

  return children;
};

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col lg:flex-row">
      <Sidebar />
      {/* Increased top padding (pt-24 on mobile/tablet to clear the header bar, lg:pt-10 on desktop) */}
      <main className="flex-grow pt-24 sm:pt-28 lg:pt-10 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Standalone Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/pass/:memberId" element={<MemberPassView />} />

          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['GYM_OWNER', 'TRAINER', 'STAFF']}>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/members" element={
            <ProtectedRoute allowedRoles={['GYM_OWNER', 'TRAINER', 'STAFF']}>
              <Layout><Members /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/attendance" element={
            <ProtectedRoute allowedRoles={['GYM_OWNER', 'TRAINER', 'STAFF']}>
              <Layout><Attendance /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/fees" element={
            <ProtectedRoute allowedRoles={['GYM_OWNER', 'TRAINER', 'STAFF']}>
              <Layout><MembershipFees /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'GYM_OWNER']}>
              <Layout><AdminUsers /></Layout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}