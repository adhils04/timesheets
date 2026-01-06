import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Clock,
    PieChart,
    History,
    BarChart3,
    Users,
    LogOut
} from 'lucide-react';

export const Sidebar = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const getInitials = (email) => {
        if (!email) return '?';
        return email[0].toUpperCase();
    };

    const getName = (email) => {
        if (!email) return 'User';
        return email.split('@')[0];
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-icon">
                    <Clock size={24} />
                </div>
                <span className="brand-name">FounderTrack</span>
            </div>

            <nav className="nav-menu">
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <PieChart size={20} />
                    <span>Overview</span>
                </NavLink>
                <NavLink to="/timesheets" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <History size={20} />
                    <span>Timesheets</span>
                </NavLink>
                <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <BarChart3 size={20} />
                    <span>Analytics</span>
                </NavLink>
                <NavLink to="/team" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Users size={20} />
                    <span>Team</span>
                </NavLink>
            </nav>

            <div className="user-profile-mini">
                <div className="user-profile-info" onClick={() => navigate('/profile')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, cursor: 'pointer' }}>
                    <div className="user-avatar">
                        {getInitials(user?.email)}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {getName(user?.email)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Admin</div>
                    </div>
                </div>
                <button onClick={onLogout} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '0.5rem' }} title="Logout">
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
};
