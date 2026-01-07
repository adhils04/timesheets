import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminLogin = ({ user, onSuccess }) => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('idle'); // idle, scanning, success, error
    const [message, setMessage] = useState('Touch ID for Admin Access');

    const handleScan = () => {
        if (status === 'scanning' || status === 'success') return;

        setStatus('scanning');
        setMessage('Verifying Identity...');

        // Simulate Biometric Scan Delay
        setTimeout(() => {
            if (user?.role === 'admin' || user?.email === 'adhil.founder@timesheets.com') {
                setStatus('success');
                setMessage('Access Granted');
                setTimeout(() => {
                    onSuccess();
                }, 1000);
            } else {
                setStatus('error');
                setMessage('Access Denied: Admin Role Required');
                setTimeout(() => {
                    setStatus('idle');
                    setMessage('Touch ID for Admin Access');
                }, 2000);
            }
        }, 2000);
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#0f172a',
            color: 'white',
            fontFamily: "'Inter', sans-serif"
        }}>
            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); }
                    70% { transform: scale(1.1); box-shadow: 0 0 0 20px rgba(79, 70, 229, 0); }
                    100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
                }
                .scanner-line {
                    position: absolute;
                    width: 100%;
                    height: 4px;
                    background: #3b82f6;
                    box-shadow: 0 0 10px #3b82f6;
                    border-radius: 2px;
                    animation: scan 1.5s linear infinite;
                }
                .fingerprint-container {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: rgba(30, 41, 59, 0.5);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid rgba(255,255,255,0.1);
                }
                .fingerprint-container:hover {
                    background: rgba(30, 41, 59, 0.8);
                    border-color: rgba(255,255,255,0.3);
                }
                .fingerprint-container.scanning {
                    border-color: #3b82f6;
                    box-shadow: 0 0 30px rgba(59, 130, 246, 0.2);
                }
                .fingerprint-container.success {
                    border-color: #10b981;
                    animation: pulse-ring 1s cubic-bezier(0.25, 0.8, 0.25, 1);
                }
                .fingerprint-container.error {
                    border-color: #ef4444;
                    animation: shake 0.5s;
                }
            `}</style>

            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <Lock size={48} color={status === 'success' ? '#10b981' : '#64748b'} style={{ marginBottom: '1rem', transition: 'color 0.5s' }} />
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>System Locked</h1>
                <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Restricted Area • Admin Only</p>
            </div>

            <div
                className={`fingerprint-container ${status}`}
                onClick={handleScan}
            >
                {status === 'success' ? (
                    <ShieldCheck size={64} color="#10b981" />
                ) : status === 'error' ? (
                    <AlertCircle size={64} color="#ef4444" />
                ) : (
                    <Fingerprint size={64} color={status === 'scanning' ? '#3b82f6' : 'white'} style={{ opacity: status === 'scanning' ? 0.8 : 1 }} />
                )}

                {status === 'scanning' && (
                    <div className="scanner-line"></div>
                )}
            </div>

            <div style={{ marginTop: '2rem', height: '2rem', color: status === 'error' ? '#ef4444' : status === 'success' ? '#10b981' : '#94a3b8', fontWeight: 500, letterSpacing: '0.5px' }}>
                {message.toUpperCase()}
            </div>

            <button
                onClick={() => navigate('/dashboard')}
                style={{
                    marginTop: '4rem',
                    background: 'none',
                    border: 'none',
                    color: '#475569',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    textDecoration: 'underline'
                }}
            >
                Return to Dashboard
            </button>
        </div>
    );
};
