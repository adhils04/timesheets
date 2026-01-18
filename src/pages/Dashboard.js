import React, { useState, useCallback, useEffect } from 'react';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    Timestamp,
    increment,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useActiveEntry, useRecentEntries, useStats } from '../hooks/useTimesheets';
import { TopBar } from '../components/TopBar';
import { StatsWidget } from '../components/dashboard/StatsWidget';
import { TimerWidget } from '../components/dashboard/TimerWidget';
import { HistoryWidget } from '../components/dashboard/HistoryWidget';
import { MeetingAttendanceWidget } from '../components/dashboard/MeetingAttendanceWidget';
import { EditEntryModal } from '../components/dashboard/EditEntryModal';
import {
    FOUNDERS as FALLBACK_FOUNDERS, // Renamed to fallback
    PREDEFINED_TASKS,
    COLLECTION_NAME,
    APP_ID
} from '../constants';

export const Dashboard = ({ user, forcedFounder, isReadOnly }) => {
    // Dynamic Founders List & User Data
    const [foundersList, setFoundersList] = useState([]);
    const [usersData, setUsersData] = useState([]); // [{ name, role, ... }]

    // Fetch founders from DB if Admin Mode, otherwise just use forcedFounder
    useEffect(() => {
        const fetchFounders = async () => {
            if (forcedFounder) {
                setFoundersList([forcedFounder]);
                // For simplified view, we don't strictly need usersData if only 1 user,
                // but for consistency we could try to fetch their role or just default.
                // Since forcedFounder string doesn't have role, StatsWidget will treat as default.
                setUsersData([{ name: forcedFounder, role: 'employee' }]);
                // Note: user prop might have role? user.role. 
                // But logic below relies on usersData for "Admin" view mostly.
            } else {
                try {
                    const q = query(
                        collection(db, 'artifacts', APP_ID, 'users')
                    );
                    const querySnapshot = await getDocs(q);

                    const users = querySnapshot.docs.map(doc => ({
                        name: doc.data().fullName,
                        role: doc.data().role || 'employee'
                    })).filter(u => u.name);

                    if (users.length > 0) {
                        setFoundersList(users.map(u => u.name));
                        setUsersData(users);
                    } else {
                        setFoundersList([]);
                        setUsersData([]);
                    }
                } catch (e) {
                    console.error("Error fetching founders:", e);
                    setFoundersList([]);
                    setUsersData([]);
                }
            }
        };
        fetchFounders();
    }, [forcedFounder]);

    const [selectedFounder, setSelectedFounder] = useState(forcedFounder || (foundersList[0] || (FALLBACK_FOUNDERS && FALLBACK_FOUNDERS[0]) || 'Founder'));
    const [editingEntry, setEditingEntry] = useState(null);

    // Sync state when list/forced changes
    useEffect(() => {
        if (forcedFounder) {
            setSelectedFounder(forcedFounder);
        } else if (foundersList.length > 0 && !foundersList.includes(selectedFounder)) {
            setSelectedFounder(foundersList[0]);
        }
    }, [forcedFounder, foundersList]);


    // Use specialized hooks
    const { activeEntry, loading: activeLoading } = useActiveEntry(user, selectedFounder);
    const { entries: recentEntries, loading: recentLoading } = useRecentEntries(user, 5); // Note: recentEntries might need filtering by founder if Admin? 5 recent global? Or filtered? 
    // Hook implementation usually queries ALL recent entries if no filter provided? 
    // useRecentEntries logic in hook: query(..., orderBy(startTime), limit(n)).
    // If we want filtering by selectedFounder in Admin view?
    // User didn't request filtering recent entries list in Admin dashboard explicitly, just "activities... of all founders".
    // So global list is fine.

    const { stats, loading: statsLoading } = useStats(user);

    // --- Stats Helpers ---
    const updateStatsInDb = async (founder, duration, date) => {
        try {
            const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', 'aggregate');
            const now = new Date();
            const entryDate = date || now;

            const isThisMonth = entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
            const isThisYear = entryDate.getFullYear() === now.getFullYear();

            // Nested Object Update (Safe for setDoc with merge)
            const founderUpdates = {
                year: increment(duration)
            };
            if (isThisMonth) {
                founderUpdates.month = increment(duration);
            }

            const updates = {
                founderStats: {
                    [founder]: founderUpdates
                }
            };

            if (isThisYear) {
                updates.yearTotal = increment(duration);
            }
            if (isThisMonth) {
                updates.monthTotal = increment(duration);
            }

            await setDoc(statsRef, updates, { merge: true });
        } catch (e) {
            console.error("Failed to update stats:", e);
        }
    };

    const updateActiveCount = async (change) => {
        try {
            const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', 'aggregate');
            await setDoc(statsRef, {
                activeCount: increment(change)
            }, { merge: true });
        } catch (e) {
            console.error("Failed to update active count:", e);
        }
    };

    // --- Actions ---
    const handleClockIn = useCallback(async (finalTask) => {
        if (!user || !finalTask.trim()) return;

        try {
            await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', COLLECTION_NAME), {
                founder: selectedFounder,
                task: finalTask,
                startTime: serverTimestamp(),
                endTime: null,
                status: 'active'
            });
            await updateActiveCount(1);
        } catch (err) {
            console.error("Error clocking in:", err);
            alert("Failed to clock in.");
        }
    }, [user, selectedFounder]);

    const handleClockOut = useCallback(async () => {
        if (!user || !activeEntry) return;

        try {
            const endTime = new Date();
            const startTime = activeEntry.startTime;
            const duration = endTime.getTime() - startTime.getTime();

            const entryRef = doc(db, 'artifacts', APP_ID, 'public', 'data', COLLECTION_NAME, activeEntry.id);
            await updateDoc(entryRef, {
                endTime: Timestamp.fromDate(endTime),
                status: 'completed'
            });

            await updateStatsInDb(activeEntry.founder, duration, endTime);
            await updateActiveCount(-1);
        } catch (err) {
            console.error("Error clocking out:", err);
        }
    }, [user, activeEntry]);

    const handleManualSubmit = useCallback(async (finalTask, date, startTime, endTime) => {
        if (!user || !finalTask.trim()) return;
        const start = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);
        if (end <= start) {
            alert("End time must be after start time");
            return;
        }
        const duration = end.getTime() - start.getTime();

        try {
            await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', COLLECTION_NAME), {
                founder: selectedFounder,
                task: finalTask,
                startTime: Timestamp.fromDate(start),
                endTime: Timestamp.fromDate(end),
                status: 'manual'
            });
            await updateStatsInDb(selectedFounder, duration, start);
        } catch (err) {
            console.error("Error adding manual entry:", err);
        }
    }, [user, selectedFounder]);

    const handleDelete = useCallback(async (id) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();

                // If it was an active task, decrement active count
                if (!data.endTime || data.status === 'active') {
                    await updateActiveCount(-1);
                }
                // If it was a completed task, decrement duration stats
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
    }, []);

    const handleUpdateEntry = async (updatedEntry) => {
        try {
            const oldEntry = editingEntry;
            if (!oldEntry) return;

            const entryRef = doc(db, 'artifacts', APP_ID, 'public', 'data', COLLECTION_NAME, updatedEntry.id);

            // 1. Revert stats for the old entry (if it was completed)
            const oldStart = oldEntry.startTime.toDate ? oldEntry.startTime.toDate() : new Date(oldEntry.startTime);
            const oldEnd = oldEntry.endTime ? (oldEntry.endTime.toDate ? oldEntry.endTime.toDate() : new Date(oldEntry.endTime)) : null;

            if (oldEnd) {
                const oldDuration = oldEnd.getTime() - oldStart.getTime();
                await updateStatsInDb(oldEntry.founder, -oldDuration, oldStart);
            }

            // 2. Add stats for the new entry
            const newDuration = updatedEntry.endTime.getTime() - updatedEntry.startTime.getTime();
            await updateStatsInDb(updatedEntry.founder, newDuration, updatedEntry.startTime);

            // 3. Update the document
            await updateDoc(entryRef, {
                task: updatedEntry.task,
                startTime: Timestamp.fromDate(updatedEntry.startTime),
                endTime: Timestamp.fromDate(updatedEntry.endTime)
            });

            setEditingEntry(null);
        } catch (err) {
            console.error("Error updating entry:", err);
            alert("Failed to update entry");
        }
    };


    // --- Personal Stats Calculation ---
    const effectiveStats = (forcedFounder && stats.founderStats && stats.founderStats[forcedFounder])
        ? {
            monthTotal: stats.founderStats[forcedFounder].month || 0,
            yearTotal: stats.founderStats[forcedFounder].year || 0,
            activeCount: activeEntry ? 1 : 0,
            founderStats: stats.founderStats, // Still pass global? Or filtered?
            // Meeting Widget needs global to calculate totals?
            // Actually Meeting Widget will calculate based on ITS input (foundersList).
            // But StatsWidget uses founderStats to show list.
            // If Personal, I should probably hide other founders in StatsWidget?
            // I'll filter founderStats to ONLY contain me.
            founderStats: { [forcedFounder]: stats.founderStats[forcedFounder] },
            meetingStats: stats.meetingStats
        }
        : stats;

    return (
        <>
            <datalist id="task-suggestions">
                {PREDEFINED_TASKS.map(task => (
                    <option key={task} value={task} />
                ))}
            </datalist>

            <TopBar
                selectedFounder={selectedFounder}
                setSelectedFounder={forcedFounder || isReadOnly ? undefined : setSelectedFounder}
                title={(forcedFounder && typeof forcedFounder === 'string') ? `Welcome, ${forcedFounder.split(' ')[0]}` : "Admin Dashboard"}
                foundersList={foundersList} // Pass dynamic list to TopBar (need to update TopBar to use it)
            />

            <div className="dashboard-grid">
                <StatsWidget stats={effectiveStats} loading={statsLoading} foundersList={foundersList} usersData={usersData} showBreakdown={!!isReadOnly} />

                {!isReadOnly && (
                    <TimerWidget
                        activeEntry={activeEntry}
                        activeLoading={activeLoading}
                        onClockIn={handleClockIn}
                        onClockOut={handleClockOut}
                        onManualSubmit={handleManualSubmit}
                    />
                )}

                <MeetingAttendanceWidget foundersList={foundersList} isReadOnly={isReadOnly} />

                <HistoryWidget
                    entries={recentEntries}
                    loading={recentLoading}
                    onDelete={handleDelete}
                    onEdit={setEditingEntry}
                />
            </div>

            <EditEntryModal
                entry={editingEntry}
                onSave={handleUpdateEntry}
                onCancel={() => setEditingEntry(null)}
            />
        </>
    );
};