import React, { useState, useEffect } from 'react';
import { Trash2, History as HistoryIcon, Search, Filter } from 'lucide-react';
import { deleteDoc, doc, getDoc, setDoc, increment, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useTimesheets } from '../hooks/useTimesheets';
import { TopBar } from '../components/TopBar';
import { FOUNDERS, APP_ID, COLLECTION_NAME } from '../constants';
import { formatDuration, formatDate, getInitials } from '../utils';

export const Timesheets = ({ user, forcedFounder, isAdmin }) => {
    const [selectedFounder, setSelectedFounder] = useState(forcedFounder || FOUNDERS[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'founder', 'employee'
    const [userMap, setUserMap] = useState({}); // Name -> Role

    // Fetch data (allow if isAdmin even if no user)
    const { entries, loading } = useTimesheets(user, isAdmin);

    // Fetch User Roles for Admin Filtering
    useEffect(() => {
        const fetchRoles = async () => {
            if (isAdmin) {
                try {
                    const querySnapshot = await getDocs(collection(db, 'artifacts', APP_ID, 'users'));
                    const map = {};
                    querySnapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.fullName && data.role) {
                            map[data.fullName] = data.role;
                        }
                    });
                    setUserMap(map);
                } catch (e) {
                    console.error("Error fetching user roles:", e);
                }
            }
        };
        fetchRoles();
    }, [isAdmin]);

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

    // Filter Logic
    let filteredEntries = isAdmin
        ? entries.filter(e => e.founder.toLowerCase().includes(searchQuery.toLowerCase()))
        : entries.filter(e => e.founder === selectedFounder);

    // Apply Role Filter
    if (isAdmin && roleFilter !== 'all') {
        filteredEntries = filteredEntries.filter(e => {
            const role = userMap[e.founder];
            // If user not in map (e.g. legacy data), default to 'founder' or 'employee' based on... logic? 
            // Or just exclude? 
            // Better to include if uncertain or maybe check Fallback Founders list?
            // FOUNDERS constant has names.
            if (!role) return FOUNDERS.includes(e.founder) ? (roleFilter === 'founder') : (roleFilter === 'employee');
            return role === roleFilter;
        });
    }

    return (
        <>
            <TopBar
                selectedFounder={selectedFounder}
                setSelectedFounder={forcedFounder || isAdmin ? undefined : setSelectedFounder}
                title={isAdmin ? "Admin Timesheets" : (forcedFounder ? "My Timesheet History" : "Timesheet History")}
                foundersList={isAdmin ? [] : (forcedFounder ? [forcedFounder] : FOUNDERS)}
            />

            {/* Admin Filter Controls */}
            {isAdmin && (
                <div style={{ marginTop: '2rem', marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '400px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="custom-input"
                            style={{ paddingLeft: '2.5rem', width: '100%' }}
                        />
                    </div>

                    {/* Role Filter */}
                    <div style={{ position: 'relative', minWidth: '150px' }}>
                        <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="custom-input"
                            style={{ paddingLeft: '2.5rem', width: '100%', cursor: 'pointer', appearance: 'none' }}
                        >
                            <option value="all">All Roles</option>
                            <option value="founder">Founders</option>
                            <option value="employee">Employees</option>
                        </select>
                    </div>
                </div>
            )}

            <div className="card history-section" style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <HistoryIcon size={20} /> {isAdmin ? `All Entries (${filteredEntries.length})` : 'All Entries (Year To Date)'}
                </h3>

                {filteredEntries.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {isAdmin ? "No matching records found." : "No activities recorded yet."}
                    </div>
                ) : (
                    <ul className="history-list">
                        {filteredEntries.map((entry) => {
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
