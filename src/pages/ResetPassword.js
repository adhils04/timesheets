import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Key, Lock, CheckCircle } from 'lucide-react';

export const ResetPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleEmailSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!email.endsWith('@easy-escape.com')) {
            setError('Email using valid domain @easy-escape.com is required.');
            return;
        }

        setLoading(true);
        // Simulate sending email
        setTimeout(() => {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(code);
            console.log(`[SIMULATION] Email sent to ${email} with code: ${code}`);
            alert(`[SIMULATION] Verification Code: ${code}`);

            setLoading(false);
            setStep(2);
            setSuccessMessage(`One-time password sent to ${email}`);
        }, 1500);
    };

    const handleOtpSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (otp !== generatedOtp) {
            setError('Invalid verification code. Please try again.');
            return;
        }

        setStep(3);
        setSuccessMessage('Code verified successfully.');
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password should be at least 6 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        // Simulate password reset logic
        setTimeout(() => {
            setLoading(false);
            setSuccessMessage('Password reset successfully!');
            // Here you would typically call Firebase to update, but as noted, we are mocking the success flow
            // updatePassword(currentUser, newPassword) - requires authentication

            setTimeout(() => {
                navigate('/login');
            }, 2000);
        }, 1500);
    };

    const renderStep1 = () => (
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
            <button
                type="submit"
                disabled={loading}
                className="action-btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
            >
                {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
        </form>
    );

    const renderStep2 = () => (
        <form onSubmit={handleOtpSubmit}>
            <div className="input-group">
                <label className="input-label">Verification Code</label>
                <div style={{ position: 'relative' }}>
                    <Key size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="custom-input"
                        placeholder="123456"
                        maxLength={6}
                        style={{ paddingLeft: '2.5rem', letterSpacing: '4px' }}
                    />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Check your email or the browser alert/console.
                </p>
            </div>
            <button
                type="submit"
                className="action-btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
            >
                Verify Code
            </button>
        </form>
    );

    const renderStep3 = () => (
        <form onSubmit={handlePasswordReset}>
            <div className="input-group">
                <label className="input-label">New Password</label>
                <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="custom-input"
                        placeholder="••••••••"
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </div>
            </div>
            <div className="input-group">
                <label className="input-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="custom-input"
                        placeholder="••••••••"
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </div>
            </div>
            <button
                type="submit"
                disabled={loading}
                className="action-btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
            >
                {loading ? 'Resetting...' : 'Reset Password'}
            </button>
        </form>
    );

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
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    {step === 1 && "Enter your work email to receive a code"}
                    {step === 2 && "Enter the 6-digit code sent to your email"}
                    {step === 3 && "Create a new secure password"}
                </p>

                {error && (
                    <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>⚠️</span> {error}
                    </div>
                )}

                {successMessage && !error && (
                    <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={18} /> {successMessage}
                    </div>
                )}

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </div>
        </div>
    );
};
