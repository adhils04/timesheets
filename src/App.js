/* global __initial_auth_token */
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
import { setDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { APP_ID, FOUNDERS } from './constants';
import { AppLayout } from './layouts/AppLayout';
import { LandingPage } from './pages/LandingPage';

// Lazy load pages
const AdminLogin = lazy(() => import('./pages/AdminLogin').then(module => ({ default: module.AdminLogin })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Signup = lazy(() => import('./pages/Signup').then(module => ({ default: module.Signup })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));

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

// Helper to determine founder name from email (Legacy/Fallback)
const getFounderFromEmail = (email) => {
  if (!email) return null;
  const lowerEmail = email.toLowerCase();
  return FOUNDERS.find(f => lowerEmail.includes(f.split(' ')[0].toLowerCase()));
};

// --- Main Inner Component ---
const AppContent = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'founder', 'employee', 'admin'
  const [authLoading, setAuthLoading] = useState(true);
  const [adminVerified, setAdminVerified] = useState(false); // Biometric verification state
  const navigate = useNavigate();

  // --- Auth Initialization ---
  useEffect(() => {
    const initAuth = async () => {
      // eslint-disable-next-line
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try { await signInWithCustomToken(auth, __initial_auth_token); } catch (e) { console.error(e); }
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch Role
        try {
          const docRef = doc(db, 'artifacts', APP_ID, 'public', 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role);
          } else {
            setUserRole('employee');
          }
        } catch (e) {
          console.error("Failed to fetch role", e);
          setUserRole('employee');
        }
      } else {
        setUserRole(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // --- Auth Actions ---
  const handleLogin = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    navigate('/dashboard');
  };

  const handleSignup = async (email, password, fullName, phoneNumber, role) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    await updateProfile(newUser, { displayName: fullName });

    await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'users', newUser.uid), {
      email,
      fullName,
      phoneNumber,
      role: role,
      joinedAt: serverTimestamp()
    });

    setUserRole(role);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setUserRole(null);
    setAdminVerified(false);
    navigate('/');
  };

  if (authLoading) return <LoadingFallback />;

  // --- Guards ---
  const ProtectedRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" replace />;
    return children;
  };

  const AdminRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" replace />;

    // 1. Verify Role
    // (Allow fallback for hardcoded dev email if needed, but strictly role prefers)
    if (userRole !== 'admin' && user.email !== 'adhil.founder@timesheets.com') {
      return <Navigate to="/dashboard" replace />;
    }

    // 2. Verify Biometric (Simulation)
    if (!adminVerified) {
      return <Navigate to="/admin-login" replace />;
    }

    return children;
  };

  const currentFounderName = user?.displayName || getFounderFromEmail(user?.email) || user?.email?.split('@')[0];

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />

        <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup onSignup={handleSignup} />} />

        {/* Biometric Gate */}
        <Route path="/admin-login" element={
          !user ? <Navigate to="/login" /> :
            <AdminLogin user={{ ...user, role: userRole }} onSuccess={() => {
              setAdminVerified(true);
              navigate('/admintracker');
            }} />
        } />

        {/* Dashboard for Founders/Employees */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            {/* Always Personal Mode */}
            <AppLayout user={{ ...user, role: userRole }} onLogout={handleLogout}>
              <Dashboard user={{ ...user, role: userRole }} forcedFounder={currentFounderName} />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Admin Replica - Strict Access */}
        <Route path="/admintracker" element={
          <AdminRoute>
            <AppLayout user={{ ...user, role: userRole }} onLogout={handleLogout}>
              {/* Admin Mode (forcedFounder=undefined) */}
              <Dashboard user={{ ...user, role: userRole }} />
            </AppLayout>
          </AdminRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}