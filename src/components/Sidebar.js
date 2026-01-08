import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Clock,
    PieChart,
    LogOut,
    Shield,
    History as HistoryIcon
} from 'lucide-react';

export const Sidebar = ({ user, onLogout, isAdmin }) => {
    const navigate = useNavigate();

    // Helpers
    const getInitials = (email) => email ? email[0].toUpperCase() : '?';
    const getName = (email) => email ? email.split('@')[0] : 'User';

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-icon">
                    <Clock size={24} />
                </div>
                <span className="brand-name">EasyEscape</span>
            </div>

            <nav className="nav-menu">
                {/* Dashboard */}
                <NavLink to={isAdmin ? "/admintracker/dashboard" : "/dashboard"} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <PieChart size={20} />
                    <span>{isAdmin ? "Admin Dashboard" : "My Dashboard"}</span>
                </NavLink>

                <NavLink to={isAdmin ? "/admintracker/timesheets" : "/timesheets"} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <HistoryIcon size={20} />
                    <span>{isAdmin ? "All Timesheets" : "Timesheets"}</span>
                </NavLink>

                {/* Admin Tracker Link - Show if user is admin OR if we are already in admin mode (to keep nav valid?) 
                    Actually if we are in admin mode, we don't need a link to 'enter' admin mode. 
                    But maybe to restart?
                    Use user?.role checking as original.
                */}
                {user?.role === 'admin' && !isAdmin && (
                    <NavLink to="/admintracker" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Shield size={20} />
                        <span>Admin Tracker</span>
                    </NavLink>
                )}
            </nav>

            <div className="user-profile-mini">
                <div className="user-profile-info" onClick={() => navigate('/profile')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <div className="user-avatar">
                        {getInitials(user?.email)}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {getName(user?.email)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                        </div>
                    </div>
                </div>
                <button onClick={onLogout} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '0.5rem' }} title="Logout">
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
};
