import React, { useState } from 'react';
import { Trash2, History as HistoryIcon } from 'lucide-react';
import { deleteDoc, doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useTimesheets } from '../hooks/useTimesheets';
import { TopBar } from '../components/TopBar';
import { FOUNDERS, APP_ID, COLLECTION_NAME } from '../constants';
import { formatDuration, formatDate, getInitials } from '../utils';

export const Timesheets = ({ user, forcedFounder }) => {
    const [selectedFounder, setSelectedFounder] = useState(forcedFounder || FOUNDERS[0]);
    const { entries, loading } = useTimesheets(user);

    // Helper for stats updates (duplicated safely here to ensure robustness)
    const updateStatsInDb = async (founder, duration, date) => {
        try {
            const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', 'aggregate');
            const now = new Date();
            const entryDate = date || now;
            const isThisMonth = entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
            const isThisYear = entryDate.getFullYear() === now.getFullYear();

            const founderUpdates = { year: increment(duration) };
            if (isThisMonth) founderUpdates.month = increment(duration);

            const updates = { founderStats: { [founder]: founderUpdates } };
            if (isThisYear) updates.yearTotal = increment(duration);
            if (isThisMonth) updates.monthTotal = increment(duration);

            await setDoc(statsRef, updates, { merge: true });
        } catch (e) {
            console.error("Failed to update stats:", e);
        }
    };

    const updateActiveCount = async (change) => {
        try {
            const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', 'aggregate');
            await setDoc(statsRef, { activeCount: increment(change) }, { merge: true });
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                // If active, decrement count
                if (!data.endTime || data.status === 'active') {
                    await updateActiveCount(-1);
                }
                // If completed, decrement stats
                else if (data.endTime && data.startTime) {
                    const start = data.startTime.toDate ? data.startTime.toDate() : new Date(data.startTime);
                    const end = data.endTime.toDate ? data.endTime.toDate() : new Date(data.endTime);
                    const duration = end.getTime() - start.getTime();
                    await updateStatsInDb(data.founder, -duration, start);
                }
            }

            await deleteDoc(docRef);
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
                foundersList={forcedFounder ? [forcedFounder] : FOUNDERS}
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
                            const startTime = entry.startTime;
                            const endTime = entry.endTime;

                            // Safe duration calc
                            let duration = 'Active';
                            if (endTime && startTime) {
                                duration = formatDuration(endTime - startTime);
                            }

                            const initials = getInitials(entry.founder);
                            const colorIndex = FOUNDERS.indexOf(entry.founder) % 4;
                            const colors = ['#4361ee', '#7209b7', '#f72585', '#4cc9f0'];
                            const avatarColor = colors[Math.max(0, colorIndex)] || colors[0]; // Safe index

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
