import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { COUNTRY_CODES } from '../constants';

export const Login = ({ onLogin, onSignup }) => {
    const [isLogin, setIsLogin] = useState(true);

    // Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Signup Extra State
    const [fullName, setFullName] = useState('');
    const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
    const [phoneNumber, setPhoneNumber] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                await onLogin(email, password);
            } else {
                const fullPhoneNumber = `${countryCode} ${phoneNumber}`;
                await onSignup(email, password, fullName, fullPhoneNumber);
            }
        } catch (err) {
            setError('Authentication failed');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card" style={!isLogin ? { maxWidth: '480px' } : {}}>
                <div className="flex justify-center mb-6" style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                    <div className="logo-icon">
                        <Lock size={32} />
                    </div>
                </div>
                <h2 style={{ textAlign: 'center', margin: '0 0 0.5rem 0' }}>
                    {isLogin ? 'FounderTrack Login' : 'Create Account'}
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    {isLogin ? 'Internal Access Only' : 'Join the team'}
                </p>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="input-group">
                            <label className="input-label">Full Name</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="custom-input"
                                placeholder="e.g. John Doe"
                            />
                        </div>
                    )}

                    {!isLogin && (
                        <div className="input-group">
                            <label className="input-label">Contact Number</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="custom-input"
                                    style={{ width: '120px' }}
                                >
                                    {COUNTRY_CODES.map((c, i) => (
                                        <option key={i} value={c.code}>{c.flag} {c.code}</option>
                                    ))}
                                </select>
                                <input
                                    type="tel"
                                    required
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="custom-input"
                                    placeholder="PHONE"
                                />
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="custom-input"
                            placeholder="founder@company.com"
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
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
                    >
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
                </div>
            </div>
        </div>
    );
};
