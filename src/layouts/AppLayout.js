import React from 'react';
import { Sidebar } from '../components/Sidebar';

export const AppLayout = ({ children, user, onLogout, isAdmin }) => {
    return (
        <div className="dashboard-container">
            <Sidebar user={user} onLogout={onLogout} isAdmin={isAdmin} />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};
