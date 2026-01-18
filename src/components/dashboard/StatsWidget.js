import React from 'react';
import { Clock, Calendar, Briefcase, Activity } from 'lucide-react';

export const StatsWidget = ({ stats, loading, foundersList = [], usersData = [], showBreakdown = false }) => {

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
                {showBreakdown && <div className="card breakdown-card shimmer" style={{ height: '300px' }}></div>}
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



            {/* Founder Breakdown Section */}
            {showBreakdown && (
                <div className="card breakdown-card" style={{ gridColumn: 'span 12', marginTop: '1rem' }}>

                    {/* Helper to render table */}
                    {(() => {
                        // Separate users
                        const founders = usersData.filter(u => u.role === 'founder');
                        const employees = usersData.filter(u => u.role === 'employee' || !u.role);

                        // If no usersData passed (active fallback), map from foundersList (treat as 'Unknown' or just list)
                        // If usersData is empty but foundersList has items, we might be in a state where we just list them.
                        // But we updated Dashboard to populate usersData.

                        const renderTable = (cameraTitle, list) => (
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#475569', borderBottom: '2px solid var(--primary-light)', paddingBottom: '0.5rem', display: 'inline-block' }}>
                                    {cameraTitle}
                                </h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                                                <th style={{ padding: '0.75rem', color: '#64748b' }}>Name</th>
                                                <th style={{ padding: '0.75rem', color: '#3b82f6' }}>Hours (Month)</th>
                                                <th style={{ padding: '0.75rem', color: '#10b981' }}>Hours (Year)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {list.map(user => {
                                                const name = user.name || user; // Handle object or string
                                                const fStats = (stats.founderStats && stats.founderStats[name]) || {};
                                                const monthMs = fStats.month || 0;
                                                const yearMs = fStats.year || 0;

                                                return (
                                                    <tr key={name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '0.75rem', fontWeight: 500 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                                                                    {getInitials(name)}
                                                                </div>
                                                                {name}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#3b82f6' }}>{formatDuration(monthMs)}</td>
                                                        <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#10b981' }}>{formatDuration(yearMs)}</td>
                                                    </tr>
                                                );
                                            })}
                                            {list.length === 0 && (
                                                <tr><td colSpan="3" style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>No users found in this category</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );

                        return (
                            <div>
                                {renderTable('Founders', founders)}
                                {renderTable('Employees', employees)}
                            </div>
                        );
                    })()}

                </div>
            )}
        </>
    );
};
