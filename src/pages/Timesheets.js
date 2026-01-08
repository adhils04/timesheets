import React, { useState } from 'react';
import { Trash2, History as HistoryIcon } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useTimesheets } from '../hooks/useTimesheets';
import { TopBar } from '../components/TopBar';
import { FOUNDERS, APP_ID, COLLECTION_NAME } from '../constants';
import { formatDuration, formatDate, getInitials } from '../utils';

export const Timesheets = ({ user, forcedFounder }) => {
    const [selectedFounder, setSelectedFounder] = useState(forcedFounder || FOUNDERS[0]);
    const { entries, loading } = useTimesheets(user);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', COLLECTION_NAME, id));
        } catch (err) {
            console.error("Error deleting:", err);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <>
            <TopBar
                selectedFounder={selectedFounder}
                setSelectedFounder={forcedFounder ? undefined : setSelectedFounder}
                title={forcedFounder ? "My Timesheet History" : "Timesheet History"}
            />

            <div className="card history-section" style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <HistoryIcon size={20} /> All Entries (Year To Date)
                </h3>

                {entries.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No activities recorded yet.</div>
                ) : (
                    <ul className="history-list">
                        {entries.filter(e => e.founder === selectedFounder).map((entry) => {
                            const duration = entry.endTime ? formatDuration(entry.endTime - entry.startTime) : 'Active';
                            const initials = getInitials(entry.founder);
                            const colorIndex = FOUNDERS.indexOf(entry.founder) % 4;
                            const colors = ['#4361ee', '#7209b7', '#f72585', '#4cc9f0'];
                            const avatarColor = colors[colorIndex];

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
                                            <span>{formatDate(entry.startTime)}</span>
                                            <span>•</span>
                                            <span>{entry.startTime && entry.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {entry.endTime ? entry.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                                        </div>
                                    </div>
                                    <span className="history-duration" style={!entry.endTime ? { color: '#10b981', background: '#d1fae5' } : {}}>
                                        {duration}
                                    </span>
                                    <button onClick={() => handleDelete(entry.id)} className="history-delete-btn" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </>
    );
};
