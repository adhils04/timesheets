import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

export const ResetPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // if (!email.endsWith('@easy-escape.com')) {
        //     setError('Email using valid domain @easy-escape.com is required.');
        //     return;
        // }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setEmailSent(true);
        } catch (err) {
            console.error("Password reset error:", err);
            if (err.code === 'auth/user-not-found') {
                setError('No account found with this email.');
            } else {
                setError(err.message || 'Failed to send reset email. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div style={{ marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            background: 'none',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: 0
                        }}
                    >
                        <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back to Login
                    </button>
                </div>

                <h2 style={{ textAlign: 'center', margin: '0 0 0.5rem 0' }}>Reset Password</h2>

                {!emailSent ? (
                    <>
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            Enter your work email to receive a password reset link
                        </p>

                        <form onSubmit={handleEmailSubmit}>
                            <div className="input-group">
                                <label className="input-label">Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="custom-input"
                                        placeholder="you@easy-escape.com"
                                        style={{ paddingLeft: '2.5rem' }}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>⚠️</span> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="action-btn btn-primary"
                                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                            >
                                {loading ? 'Sending Link...' : 'Send Reset Link'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ background: '#dcfce7', color: '#166534', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <CheckCircle size={48} />
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>Email Sent!</h3>
                                <p style={{ margin: 0 }}>Check your inbox for a link to reset your password.</p>
                            </div>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Didn't receive it? <button onClick={() => setEmailSent(false)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Try again</button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
