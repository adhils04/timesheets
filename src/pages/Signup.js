import React, { useState } from 'react';
import { Lock, User, Briefcase, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { COUNTRY_CODES } from '../constants';

export const Signup = ({ onSignup }) => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
    const [phoneNumber, setPhoneNumber] = useState('');

    // Role & Challenge
    const [role, setRole] = useState('employee');
    const [inviteCode, setInviteCode] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // 1. Mandatory Fields Check
        if (!email || !password || !fullName || !phoneNumber) {
            setError("All fields are required (Name, Email, Phone, Password)");
            setLoading(false);
            return;
        }

        // 2. Mobile Validation (Exact 10 digits)
        const phoneRegex = /^\d{10}$/;
        // Strip spaces first? The user said "should contain only 10 digits".
        // If the user inputs spaces, it might fail. Let's assume input needs to be clean or we clean it.
        // But the user said "contain only 10 digits". 
        // Let's strip spaces/dashes for the check or just check raw input?
        // Usually safer to check raw input if we want strict compliance to "10 digits".
        // But user UX: they might type space.
        // "mobile number: should contain only 10 digits."
        // I will check the cleaned version.
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (!phoneRegex.test(cleanPhone)) {
            setError("Mobile number must be exactly 10 digits");
            setLoading(false);
            return;
        }

        // 3. Password Validation
        // At least 8 chars, chars, numbers, symbols
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            setError("Password must be at least 8 characters and include letters, numbers, and symbols");
            setLoading(false);
            return;
        }

        // Founder Challenge
        if (role === 'founder') {
            if (inviteCode !== 'We1c0meEE') {
                setError("Invalid Invite Code. You cannot register as Founder.");
                setLoading(false);
                return;
            }
        }

        try {
            const fullPhoneNumber = `${countryCode} ${phoneNumber.replace(/\D/g, '')}`;
            // Pass role to the handler
            await onSignup(email, password, fullName, fullPhoneNumber, role);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Signup failed');
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
                <h2 style={{ textAlign: 'center', margin: '0 0 0.5rem 0' }}>Join EasyEscape</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Create your account
                </p>

                <form onSubmit={handleSubmit}>
                    {/* Role Selection */}
                    <div className="input-group" style={{ marginBottom: '2rem' }}>
                        <label className="input-label">I am a...</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <label style={{
                                flex: 1, padding: '1rem', border: role === 'employee' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                borderRadius: '8px', cursor: 'pointer', background: role === 'employee' ? 'rgba(67, 97, 238, 0.05)' : 'white',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                            }}>
                                <User size={24} color={role === 'employee' ? 'var(--primary)' : 'gray'} />
                                <span style={{ fontWeight: 600, color: role === 'employee' ? 'var(--primary)' : 'var(--text-main)' }}>Employee</span>
                                <input type="radio" name="role" value="employee" checked={role === 'employee'} onChange={() => setRole('employee')} style={{ display: 'none' }} />
                            </label>

                            <label style={{
                                flex: 1, padding: '1rem', border: role === 'founder' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                borderRadius: '8px', cursor: 'pointer', background: role === 'founder' ? 'rgba(67, 97, 238, 0.05)' : 'white',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                            }}>
                                <Briefcase size={24} color={role === 'founder' ? 'var(--primary)' : 'gray'} />
                                <span style={{ fontWeight: 600, color: role === 'founder' ? 'var(--primary)' : 'var(--text-main)' }}>Founder</span>
                                <input type="radio" name="role" value="founder" checked={role === 'founder'} onChange={() => setRole('founder')} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>

                    {/* Invite Code for Founder */}
                    {role === 'founder' && (
                        <div className="input-group animate-enter">
                            <label className="input-label" style={{ color: 'var(--primary)' }}>Invite Code (Required for Founders)</label>
                            <div style={{ position: 'relative' }}>
                                <Key size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    required
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    className="custom-input"
                                    style={{ paddingLeft: '2.5rem' }}
                                    placeholder="Enter secret code"
                                />
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label className="input-label">Full Name</label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="custom-input"
                            placeholder="John Doe"
                        />
                    </div>

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
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button
                        onClick={() => navigate('/login')}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
                    >
                        Already have an account? Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};
