import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithCustomToken,
  updateProfile
} from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { APP_ID, FOUNDERS } from './constants';
import { AppLayout } from './layouts/AppLayout';
import { LandingPage } from './pages/LandingPage';

// Lazy load pages
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Timesheets = lazy(() => import('./pages/Timesheets').then(module => ({ default: module.Timesheets })));
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));

// Loading Component
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-body)' }}>
    <div className="loading-spinner" style={{
      width: '40px',
      height: '40px',
      border: '3px solid rgba(67, 97, 238, 0.3)',
      borderRadius: '50%',
      borderTopColor: 'var(--primary)',
      animation: 'spin 1s ease-in-out infinite'
    }}></div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Helper to determine founder name from email
const getFounderFromEmail = (email) => {
  if (!email) return null;
  const lowerEmail = email.toLowerCase();
  // Try to match first name
  return FOUNDERS.find(f => {
    const firstName = f.split(' ')[0].toLowerCase();
    return lowerEmail.includes(firstName);
  });
};

// --- Main Inner Component (w/ Router context) ---
const AppContent = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  // --- Auth Initialization ---
  useEffect(() => {
    const initAuth = async () => {
      // eslint-disable-next-line no-undef
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
          await signInWithCustomToken(auth, __initial_auth_token);
        } catch (e) {
          console.error("Preview auth failed", e);
        }
      }
    };

    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // --- Auth Actions ---
  const handleLogin = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    // Standard routing: Dashboard for everyone unless manually navigating to Admin
    navigate('/dashboard');
  };

  const handleSignup = async (email, password, fullName, phoneNumber) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    await updateProfile(newUser, {
      displayName: fullName
    });

    await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'users', newUser.uid), {
      email,
      fullName,
      phoneNumber,
      role: 'founder', // Default role
      joinedAt: serverTimestamp()
    });

    // Send everyone to their personal dashboard
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (authLoading) {
    return <LoadingFallback />;
  }

  // --- Route Guard ---
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Determine the name to enforce for Personal Dashboard
  // Prioritize displayName (from signup), then email match, then email itself fallback
  const currentFounderName = user?.displayName || getFounderFromEmail(user?.email) || user?.email?.split('@')[0];

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Login Page */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/dashboard" replace /> :
              <Login onLogin={handleLogin} onSignup={handleSignup} />
          }
        />

        {/* Admin Dashboard (All Founders) - Explicitly accessible */}
        <Route
          path="/admintrack"
          element={
            <ProtectedRoute>
              <AppLayout user={user} onLogout={handleLogout}>
                <Dashboard user={user} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Personal Dashboard (Single Founder) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout user={user} onLogout={handleLogout}>
                {/* Enforce filtering by passing forcedFounder key */}
                {/* Note: If currentFounderName is null, it acts as Admin dashboard. */}
                <Dashboard user={user} forcedFounder={currentFounderName} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/timesheets"
          element={
            <ProtectedRoute>
              <AppLayout user={user} onLogout={handleLogout}>
                <Timesheets user={user} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout user={user} onLogout={handleLogout}>
                <Profile user={user} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

// Main Export
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}