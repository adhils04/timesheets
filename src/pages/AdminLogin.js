import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminLogin = ({ user, onSuccess }) => {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (code === '097756') {
            onSuccess();
        } else {
            setError('Invalid Secret Code');
        }
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
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <ShieldCheck size={48} color="#3b82f6" style={{ marginBottom: '1rem' }} />
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Admin Access</h1>
                <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Enter Verification Code</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
                <input
                    type="password"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter Secret Code"
                    style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(30, 41, 59, 0.5)',
                        color: 'white',
                        fontSize: '1.2rem',
                        textAlign: 'center',
                        letterSpacing: '4px'
                    }}
                    autoFocus
                />

                {error && <div style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

                <button
                    type="submit"
                    style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#3b82f6',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    Verify Access
                </button>
            </form>

            <button
                onClick={() => navigate('/dashboard')}
                style={{
                    marginTop: '2rem',
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
