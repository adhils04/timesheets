import React, { memo } from 'react';
import { Clock, Calendar, Briefcase } from 'lucide-react';
import { formatDuration, getInitials } from '../../utils';
import { FOUNDERS } from '../../constants';

export const StatsWidget = memo(({ stats, loading }) => {
    return (
        <>
            <div className="stat-card card animate-enter delay-100">
                <div>
                    <div className="stat-icon-wrapper blue">
                        <Clock size={24} />
                    </div>
                    <div className="stat-label">Total Hours (Month)</div>
                    <div className="stat-value">
                        {loading && !stats.monthTotal ? <span className="skeleton-text" style={{ width: '80px', display: 'inline-block' }}></span> : formatDuration(stats.monthTotal)}
                    </div>
                </div>
            </div>

            <div className="stat-card card animate-enter delay-200">
                <div>
                    <div className="stat-icon-wrapper green">
                        <Calendar size={24} />
                    </div>
                    <div className="stat-label">Total Hours (Year)</div>
                    <div className="stat-value">
                        {loading && !stats.yearTotal ? <span className="skeleton-text" style={{ width: '80px', display: 'inline-block' }}></span> : formatDuration(stats.yearTotal)}
                    </div>
                </div>
            </div>

            <div className="stat-card card animate-enter delay-300">
                <div>
                    <div className="stat-icon-wrapper purple">
                        <Briefcase size={24} />
                    </div>
                    <div className="stat-label">Active Sessions</div>
                    <div className="stat-value">
                        {loading && stats.activeCount === 0 && !localStorage.getItem('dashboard_stats_cache') ? <span className="skeleton-text" style={{ width: '40px', display: 'inline-block' }}></span> : stats.activeCount}
                    </div>
                </div>
            </div>

            <div className="breakdown-card card animate-enter delay-400">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Yearly Breakdown</h3>
                <div className="breakdown-list">
                    {FOUNDERS.map(f => (
                        <div key={f} className="breakdown-item">
                            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{getInitials(f)}</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                                {loading && !stats.founderStats[f]?.year ? "-" : formatDuration(stats.founderStats[f]?.year || 0)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
});
