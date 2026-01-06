import React, { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { auth } from '../firebase';
import { User, Lock, Mail, Save, AlertCircle, CheckCircle } from 'lucide-react';

export const Profile = ({ user }) => {

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '...' }
    const [loading, setLoading] = useState(false);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {

            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                if (newPassword.length < 6) {
                    throw new Error("Password should be at least 6 characters");
                }
                await updatePassword(auth.currentUser, newPassword);
            }

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error(error);
            let errorMsg = "Failed to update profile";
            if (error.code === 'auth/requires-recent-login') {
                errorMsg = "Security requirement: Please logout and login again to change your password.";
            } else if (error.message) {
                errorMsg = error.message;
            }
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container" style={{ display: 'block', padding: '2rem' }}>
            <header className="top-bar" style={{ marginBottom: '2rem' }}>
                <div className="page-title">
                    <h1>User Profile</h1>
                    <span className="date-display">Manage your account settings</span>
                </div>
            </header>

            <div className="card" style={{ maxWidth: '600px', animation: 'none', opacity: 1 }}>
                <form onSubmit={handleUpdateProfile}>
                    {/* User Info Section */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={20} /> Personal Information
                        </h3>

                        <div className="input-group">
                            <label className="input-label">Email Address</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px', color: 'var(--text-muted)' }}>
                                <Mail size={18} />
                                <span>{user?.email}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Email cannot be changed.
                            </div>
                        </div>


                    </div>

                    {/* Password Section */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Lock size={20} /> Security
                        </h3>

                        <div className="input-group">
                            <label className="input-label">New Password</label>
                            <input
                                type="password"
                                className="custom-input"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Leave blank to keep current"
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Confirm New Password</label>
                            <input
                                type="password"
                                className="custom-input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    {/* Messages */}
                    {message && (
                        <div style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 71, 111, 0.1)',
                            color: message.type === 'success' ? '#10b981' : '#ef476f'
                        }}>
                            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="action-btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        {loading ? 'Updating...' : <><Save size={20} /> Save Changes</>}
                    </button>
                </form>
            </div>
        </div>
    );
};
