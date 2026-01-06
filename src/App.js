import React, { useState, useEffect } from 'react';
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

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Timesheets } from './pages/Timesheets';
import { Profile } from './pages/Profile';
import { AppLayout } from './layouts/AppLayout';



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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-body)' }}>Loading...</div>;
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


    </Router >
  );
}