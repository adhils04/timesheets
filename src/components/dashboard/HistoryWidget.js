import React, { memo } from 'react';
import { History, Trash2 } from 'lucide-react';
import { formatDuration, formatDate, getInitials } from '../../utils';
import { FOUNDERS } from '../../constants';

export const HistoryWidget = memo(({ entries, loading, onDelete }) => {
    return (
        <div className="card history-section animate-slide-up delay-300">
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={20} /> Recent Activity (Last 10)
            </h3>

            {entries.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {loading ? "Checking history..." : "No activities recorded yet."}
                </div>
            ) : (
                <ul className="history-list">
                    {entries.map((entry) => {
                        const startTime = entry.startTime;
                        const endTime = entry.endTime;

                        // Safe duration calc
                        let duration = 'Active';
                        if (endTime && startTime) {
                            duration = formatDuration(endTime - startTime);
                        }

                        const initials = getInitials(entry.founder);
                        const colorIndex = FOUNDERS.indexOf(entry.founder) % 4;
                        const colors = ['#4361ee', '#7209b7', '#f72585', '#4cc9f0']; // safe colors
                        const avatarColor = colors[Math.max(0, colorIndex)] || colors[0];

                        return (
                            <li key={entry.id} className="history-item">
                                <div className="history-avatar" style={{ background: `${avatarColor}20`, color: avatarColor }}>
                                    {initials}
                                </div>
                                <div className="history-content">
                                    <div className="history-task">{entry.task}</div>
                                    <div className="history-meta">
                                        <span>{entry.founder}</span>
                                        <span>•</span>
                                        <span>{startTime ? formatDate(startTime) : 'Unknown Date'}</span>
                                        <span>•</span>
                                        <span>
                                            {startTime ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} -
                                            {endTime ? endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                        </span>
                                    </div>
                                </div>
                                <span className="history-duration" style={!endTime ? { color: '#10b981', background: '#d1fae5' } : {}}>
                                    {duration}
                                </span>
                                <button onClick={() => onDelete(entry.id)} className="history-delete-btn" title="Delete">
                                    <Trash2 size={16} />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
});
