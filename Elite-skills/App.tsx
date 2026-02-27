import { Navigate, Route, Routes } from 'react-router-dom';

import LandingPage from './LandingPage';
import { useAuth } from './state/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CheckerPage from './pages/CheckerPage';
import ReferralsPage from './pages/ReferralsPage';
import NewReferralPage from './pages/NewReferralPage';
import ProfileMePage from './pages/ProfileMePage';
import ProfilePage from './pages/ProfilePage';
import RequestsPage from './pages/RequestsPage';
import ConnectionsPage from './pages/ConnectionsPage';
import NewRequestPage from './pages/NewRequestPage';
import ConnectionProfilePage from './pages/ConnectionProfilePage';
import ChatPage from './pages/ChatPage';
import NotificationsPage from './pages/NotificationsPage';
import ResumeCreatorPage from './pages/ResumeCreatorPage';
import ProtectedRoute from './state/ProtectedRoute';

function LandingOrRedirect() {
  const { token, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-elite-black text-elite-gold">Loading…</div>;
  return <LandingPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingOrRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/checker"
        element={
          <ProtectedRoute>
            <CheckerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/referrals"
        element={
          <ProtectedRoute>
            <ReferralsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/referrals/new"
        element={
          <ProtectedRoute>
            <NewReferralPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <RequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/new"
        element={
          <ProtectedRoute>
            <NewRequestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/connections"
        element={
          <ProtectedRoute>
            <ConnectionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/connections/:connectionId/profile"
        element={
          <ProtectedRoute>
            <ConnectionProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:connectionId"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume-creator"
        element={
          <ProtectedRoute>
            <ResumeCreatorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/me"
        element={
          <ProtectedRoute>
            <ProfileMePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:userId"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
