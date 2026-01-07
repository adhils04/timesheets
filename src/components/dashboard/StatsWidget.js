import React, { memo } from 'react';
import { Clock, Calendar, Briefcase } from 'lucide-react';
import { formatDuration, getInitials } from '../../utils';
import { FOUNDERS } from '../../constants';

const SkeletonLoader = ({ width = '80px', height = '32px' }) => (
    <div
        className="skeleton-loader"
        style={{
            width,
            height,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '4px',
            display: 'inline-block'
        }}
    />
);

export const StatsWidget = memo(({ stats, loading }) => {
    const isDataReady = stats && (stats.monthTotal > 0 || stats.yearTotal > 0 || Object.keys(stats.founderStats || {}).length > 0);

    return (
        <>
            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>

            <div className="stat-card card animate-enter delay-100">
                <div>
                    <div className="stat-icon-wrapper blue">
                        <Clock size={24} />
                    </div>
                    <div className="stat-label">Total Hours (Month)</div>
                    <div className="stat-value">
                        {loading && !isDataReady ? (
                            <SkeletonLoader width="80px" height="32px" />
                        ) : (
                            formatDuration(stats.monthTotal || 0)
                        )}
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
                        {loading && !isDataReady ? (
                            <SkeletonLoader width="80px" height="32px" />
                        ) : (
                            formatDuration(stats.yearTotal || 0)
                        )}
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
                        {loading && !isDataReady ? (
                            <SkeletonLoader width="40px" height="32px" />
                        ) : (
                            stats.activeCount || 0
                        )}
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
                                {loading && !isDataReady ? (
                                    <SkeletonLoader width="60px" height="20px" />
                                ) : (
                                    formatDuration(stats.founderStats?.[f]?.year || 0)
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
});
