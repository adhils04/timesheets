import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await onLogin(email, password);
        } catch (err) {
            setError('Invalid credentials');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="flex justify-center mb-6" style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                    <div className="logo-icon">
                        <Lock size={32} />
                    </div>
                </div>
                <h2 style={{ textAlign: 'center', margin: '0 0 0.5rem 0' }}>EasyEscape Login</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Access your dashboard
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="custom-input"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="custom-input"
                            placeholder="••••••••"
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/resetpassword')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary)',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                fontWeight: 500,
                                textDecoration: 'underline',
                                padding: '0.25rem 0' // Add some padding for hit area
                            }}
                        >
                            Forgot password?
                        </button>
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
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button
                        onClick={() => navigate('/signup')}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
                    >
                        New here? Create Account
                    </button>
                </div>
            </div>
        </div>
    );
};
