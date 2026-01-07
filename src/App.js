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
// We split AppContent so we can use useNavigate inside it
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
          // eslint-disable-next-line no-undef
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

    // Custom Redirect Logic
    if (email.toLowerCase().includes('founder')) {
      // Redirect to personal dashboard
      navigate('/dashboard');
    } else {
      // Admin or fallback? User said "Admin page with tail /admintrack"
      // I'll assume generic login goes to /admintrack if allowed?
      navigate('/admintrack');
    }
  };

  const handleSignup = async (email, password, fullName, phoneNumber) => {
    // Signup Logic (Redirects handled by useEffect or manual)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    await updateProfile(newUser, {
      displayName: fullName
    });

    await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'users', newUser.uid), {
      email,
      fullName,
      phoneNumber,
      role: 'founder',
      joinedAt: serverTimestamp()
    });

    // Redirect after signup?
    if (email.toLowerCase().includes('founder')) {
      navigate('/dashboard');
    } else {
      navigate('/admintrack');
    }
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

  const currentFounderName = getFounderFromEmail(user?.email);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Login Page */}
        <Route
          path="/login"
          element={
            // user ? (user.email.includes('founder') ? <Navigate to="/dashboard" /> : <Navigate to="/admintrack" />) : 
            <Login onLogin={handleLogin} onSignup={handleSignup} />
          }
        />

        {/* Admin Dashboard (All Founders) */}
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
                {/* Enforce filtering by passing forcedFounder */}
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