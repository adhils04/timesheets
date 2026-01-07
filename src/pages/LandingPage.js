import React from 'react';
import { useNavigate } from 'react-router-dom';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'var(--bg-body)',
            padding: '2rem',
            textAlign: 'center'
        }}>
            <h1 style={{
                fontSize: '3rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                marginBottom: '3rem'
            }}>
                Welcome to EasyEscape
            </h1>

            <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column', width: '100%', maxWidth: '400px' }}>
                <button
                    onClick={() => navigate('/login')}
                    className="action-btn"
                    style={{
                        padding: '1.5rem',
                        fontSize: '1.25rem',
                        background: 'var(--primary)',
                        color: 'white',
                        justifyContent: 'center'
                    }}
                >
                    Founder
                </button>

                <button
                    onClick={() => alert("Employee portal is currently under maintenance.")}
                    className="action-btn"
                    style={{
                        padding: '1.5rem',
                        fontSize: '1.25rem',
                        background: 'white',
                        color: 'var(--text-main)',
                        border: '2px solid var(--border-color)',
                        justifyContent: 'center'
                    }}
                >
                    Employee
                </button>
            </div>
        </div>
    );
};
