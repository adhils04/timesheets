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
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Signup = lazy(() => import('./pages/Signup').then(module => ({ default: module.Signup }))); // New
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));

// Loading Component
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-body)' }}>
    <div className="loading-spinner"></div>
    <style>{`
      .loading-spinner {
        width: 40px; height: 40px; border: 3px solid rgba(67, 97, 238, 0.3);
        border-radius: 50%; border-top-color: var(--primary);
        animation: spin 1s ease-in-out infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    `}</style>
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
  const navigate = useNavigate();

  // --- Auth Initialization ---
  useEffect(() => {
    // eslint-disable-next-line
    const initAuth = async () => {
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
            // Admin fallback? Or default to employee?
            // If email indicates old admin logic?
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
      role: role, // 'founder' or 'employee'
      joinedAt: serverTimestamp()
    });

    // Update local state immediately to avoid reload lag
    setUserRole(role);

    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setUserRole(null);
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
    // Allow role 'admin' OR manually approved admins OR hardcoded dev
    const isAdmin = userRole === 'admin' || user.email === 'adhil.founder@timesheets.com' /* fallback example */;
    // Note: User prompt implies STRICT access.
    // I will allow 'founder' to access for now if role is not set, BUT user said "Normal users won't be able... under any circumstances".
    // So strictly 'admin' role. 
    // Since I can't set 'admin' role easily from UI, I'll allow access if I manually set it.
    // For now, I'll let it fail if not admin, to satisfy "Strict" requirement.
    // Wait, if I lock myself out? I'll use logic: userRole === 'admin'.

    // TEMPORARY: Allow if role is missing (for testing) or use a override?
    // User said "Replica... for admin".
    // I will enforce `userRole === 'admin'`.
    // I will tell user how to become admin.
    if (userRole !== 'admin') return <Navigate to="/dashboard" replace />;

    return children;
  };

  const currentFounderName = user?.displayName || getFounderFromEmail(user?.email) || user?.email?.split('@')[0];

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />

        <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup onSignup={handleSignup} />} />

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

        {/* Explicitly removed /timesheets, /profile as per "Remove all other urls" request logic. 
            However, Sidebar might link them? 
            If I remove the route, Sidebar links will 404/redirect.
            I will remove them to comply with "Remove all other urls". 
            (User might mean "Remove urls from the prompt list? Or remove pages entirely?")
            "Apart from the above mentioned urls, remove all other urls from the existing project".
            This is strict. I will remove them.
        */}

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