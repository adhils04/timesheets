import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #0b132b 0%, #1c2541 100%)',
            color: 'white',
            textAlign: 'center',
            padding: '2rem',
            position: 'relative'
        }}>
            <h1 style={{
                fontSize: '3.5rem',
                fontWeight: 800,
                marginBottom: '1rem',
                background: 'linear-gradient(to right, #4cc9f0, #4361ee)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                Welcome to EasyEscape
            </h1>

            {/* <p style={{
                fontSize: '1.25rem',
                color: 'rgba(255,255,255,0.7)',
                maxWidth: '600px',
                lineHeight: 1.6
            }}>
                The smart way to manage your time and team.
            </p> */}

            {/* Bottom Arrow Button */}
            <div style={{
                position: 'absolute',
                bottom: '3rem',
                left: '50%',
                transform: 'translateX(-50%)',
                cursor: 'pointer'
            }}
                onClick={() => navigate('/login')}
            >
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(67, 97, 238, 0.5)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 0 30px rgba(67, 97, 238, 0.8)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(67, 97, 238, 0.5)';
                    }}
                >
                    <ArrowRight size={32} color="#4361ee" />
                </div>
            </div>
        </div>
    );
};
