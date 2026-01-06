import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { APP_ID } from './constants';
import { AppLayout } from './layouts/AppLayout';

// Lazy load pages for code splitting (faster initial load)
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

// --- Main Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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
      role: 'founder',
      joinedAt: serverTimestamp()
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
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

  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route
            path="/login"
            element={
              user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} onSignup={handleSignup} />
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout user={user} onLogout={handleLogout}>
                  <Dashboard user={user} />
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

          {/* Placeholders for other routes */}
          <Route path="/analytics" element={<Navigate to="/" replace />} />
          <Route path="/team" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router >
  );
}