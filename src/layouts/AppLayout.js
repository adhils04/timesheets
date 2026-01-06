import React from 'react';
import { Sidebar } from '../components/Sidebar';

export const AppLayout = ({ children, user, onLogout }) => {
    return (
        <div className="dashboard-container">
            <Sidebar user={user} onLogout={onLogout} />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};
