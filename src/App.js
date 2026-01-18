/* global __initial_auth_token */
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithCustomToken,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { setDoc, doc, serverTimestamp, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { APP_ID, FOUNDERS } from './constants';
import { AppLayout } from './layouts/AppLayout';
import { LandingPage } from './pages/LandingPage';

// Lazy load pages
const AdminLogin = lazy(() => import('./pages/AdminLogin').then(module => ({ default: module.AdminLogin })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Signup = lazy(() => import('./pages/Signup').then(module => ({ default: module.Signup })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Timesheets = lazy(() => import('./pages/Timesheets').then(module => ({ default: module.Timesheets })));
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })));
const ResetDataTool = lazy(() => import('./pages/ResetDataTool').then(module => ({ default: module.ResetDataTool })));

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

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserRole(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // --- User Role Listener ---
  useEffect(() => {
    if (!user) return;

    // Use onSnapshot to handle race conditions during signup (when doc is created slightly after auth)
    // and to keep role in sync.
    // Use onSnapshot to handle race conditions during signup (when doc is created slightly after auth)
    // and to keep role in sync.
    const userDocRef = doc(db, 'artifacts', APP_ID, 'users', user.uid);

    // Default to 'employee' if we can't find the doc immediately (will update when doc is created)
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure we capture the role correctly
        if (data.role) {
          setUserRole(data.role);
        } else {
          setUserRole('employee');
        }
      } else {
        setUserRole('employee');
      }
      setAuthLoading(false);
    }, (error) => {
      console.error("Error fetching user role:", error);
      setUserRole('employee');
      setAuthLoading(false);
    });

    return () => unsubscribeUser();
  }, [user]);

  // --- Auth Actions ---
  const handleLogin = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      await signOut(auth);
      // We can't use alert() directly here nicely if we want to show it in the UI properly (as `error` state).
      // But `handleLogin` is async called from Login.js inside a try-catch.
      // If we throw an Error here, Login.js will catch it and show "Invalid credentials" by default unless we change that.
      // Let's modify Login.js to show the specific error message too.
      throw new Error("Email verification pending. Please verify your email before signing in.");
    }

    navigate('/dashboard');
  };

  const handleSignup = async (email, password, fullName, phoneNumber, role) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    await updateProfile(newUser, { displayName: fullName });

    // Send Verification Email
    try {
      await sendEmailVerification(newUser);
      alert("Account created successfully! A verification email has been sent to your inbox.");
    } catch (e) {
      console.error("Failed to send verification email:", e);
      // Continue with signup even if email fails (non-blocking)
    }

    await setDoc(doc(db, 'artifacts', APP_ID, 'users', newUser.uid), {
      email,
      fullName,
      phoneNumber,
      role: role,
      joinedAt: serverTimestamp()
    });

    // Sign out immediately so they can't access dashboard until verified
    await signOut(auth);
    setUser(null);
    setUserRole(null);

    alert("Account created successfully! Please check your email and verify your account before logging in.");
    navigate('/login');
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
    // 1. Verify Secret Code (Public Access Allowed)
    if (!adminVerified) {
      return <Navigate to="/admintracker" replace />;
    }

    return children;
  };

  const currentFounderName = user?.displayName || getFounderFromEmail(user?.email) || user?.email?.split('@')[0];

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />

        <Route path="/resetpassword" element={user ? <Navigate to="/dashboard" /> : <ResetPassword />} />

        <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup onSignup={handleSignup} />} />

        {/* Admin Section */}

        {/* 1. Admin Login (Secret Code) */}
        <Route path="/admintracker" element={
          <AdminLogin
            user={{ ...user, role: userRole }}
            onSuccess={() => {
              setAdminVerified(true);
              navigate('/admintracker/dashboard');
            }}
          />
        } />

        {/* 2. Admin Dashboard (Protected by Secret Code) */}
        <Route path="/admintracker/dashboard" element={
          <AdminRoute>
            <AppLayout user={user} onLogout={handleLogout} isAdmin={true}>
              {/* Admin Mode (forcedFounder=undefined) */}
              <Dashboard user={user} isReadOnly={!user} />
            </AppLayout>
          </AdminRoute>
        } />

        {/* 3. Admin Timesheets (Protected by Secret Code) */}
        <Route path="/admintracker/timesheets" element={
          <AdminRoute>
            <AppLayout user={user} onLogout={handleLogout} isAdmin={true}>
              <Timesheets user={user} isAdmin={true} />
            </AppLayout>
          </AdminRoute>
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

        {/* Timesheets History */}
        <Route path="/timesheets" element={
          <ProtectedRoute>
            <AppLayout user={{ ...user, role: userRole }} onLogout={handleLogout}>
              <Timesheets user={{ ...user, role: userRole }} forcedFounder={currentFounderName} />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Profile Page */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <AppLayout user={{ ...user, role: userRole }} onLogout={handleLogout}>
              <Profile user={user} />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/reset-data-tool" element={<ResetDataTool />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default function App() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
}