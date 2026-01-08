import React from 'react';
import { Clock, Calendar, Briefcase, Activity } from 'lucide-react';

export const StatsWidget = ({ stats, loading, foundersList = [] }) => {

    // Format helpers
    const formatDuration = (ms) => {
        if (!ms) return '0h 0m';
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : '??';

    if (loading) {
        return (
            <>
                {[1, 2, 3].map(i => (
                    <div key={i} className="card stat-card shimmer" style={{ height: '160px' }}></div>
                ))}
                <div className="card breakdown-card shimmer" style={{ height: '300px' }}></div>
            </>
        );
    }

    return (
        <>
            {/* Main Stats Cards */}
            <div className="card stat-card">
                <div className="stat-icon-wrapper blue">
                    <Clock size={24} />
                </div>
                <div className="stat-label">Total Hours (Month)</div>
                <div className="stat-value">{formatDuration(stats.monthTotal)}</div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: 'var(--primary)' }}></div>
            </div>

            <div className="card stat-card">
                <div className="stat-icon-wrapper green">
                    <Calendar size={24} />
                </div>
                <div className="stat-label">Total Hours (Year)</div>
                <div className="stat-value">{formatDuration(stats.yearTotal)}</div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: '#10b981' }}></div>
            </div>

            <div className="card stat-card">
                <div className="stat-icon-wrapper purple">
                    <Briefcase size={24} />
                </div>
                <div className="stat-label">Active Sessions</div>
                <div className="stat-value">{stats.activeCount || 0}</div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: '#7209b7' }}></div>
            </div>


        </>
    );
};
