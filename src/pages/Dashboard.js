import React, { useState, useCallback } from 'react';
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
    increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { useActiveEntry, useRecentEntries, useStats } from '../hooks/useTimesheets';
import { TopBar } from '../components/TopBar';
import { StatsWidget } from '../components/dashboard/StatsWidget';
import { TimerWidget } from '../components/dashboard/TimerWidget';
import { HistoryWidget } from '../components/dashboard/HistoryWidget';
import { MeetingAttendanceWidget } from '../components/dashboard/MeetingAttendanceWidget';
import {
    FOUNDERS,
    PREDEFINED_TASKS,
    COLLECTION_NAME,
    APP_ID
} from '../constants';

export const Dashboard = ({ user }) => {
    const [selectedFounder, setSelectedFounder] = useState(FOUNDERS[0]);

    // Use specialized hooks
    const { activeEntry, loading: activeLoading } = useActiveEntry(user, selectedFounder);
    const { entries: recentEntries, loading: recentLoading } = useRecentEntries(user, 5);
    const { stats, loading: statsLoading } = useStats(user);


    // --- Helper to update stats ---
    const updateStatsInDb = async (founder, duration, date) => {
        try {
            const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', 'aggregate');
            const now = new Date();
            const entryDate = date || now;

            const isThisMonth = entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
            const isThisYear = entryDate.getFullYear() === now.getFullYear();

            const updates = {
                [`founderStats.${founder}.year`]: increment(duration),
            };

            if (isThisYear) {
                updates.yearTotal = increment(duration);
            }

            if (isThisMonth) {
                updates.monthTotal = increment(duration);
                updates[`founderStats.${founder}.month`] = increment(duration);
            } else if (isThisYear) {
                // If entry is this year but not this month, we still updated year/founder year above
            }

            await setDoc(statsRef, updates, { merge: true });
        } catch (e) {
            console.error("Failed to update stats:", e);
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
        } catch (err) {
            console.error("Error clocking in:", err);
            alert("Failed to clock in. Check connection or database status.");
        }
    }, [user, selectedFounder]);

    const handleClockOut = useCallback(async () => {
        if (!user || !activeEntry) return;

        try {
            const endTime = new Date(); // Use client time for accurate immediate stats
            const startTime = activeEntry.startTime; // This is a Date object from the hook
            const duration = endTime.getTime() - startTime.getTime();

            const entryRef = doc(db, 'artifacts', APP_ID, 'public', 'data', COLLECTION_NAME, activeEntry.id);
            await updateDoc(entryRef, {
                endTime: Timestamp.fromDate(endTime),
                status: 'completed'
            });

            // Update Aggregates
            await updateStatsInDb(activeEntry.founder, duration, endTime);

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

            // Update Aggregates
            await updateStatsInDb(selectedFounder, duration, start);

        } catch (err) {
            console.error("Error adding manual entry:", err);
        }
    }, [user, selectedFounder]);

    const handleDelete = useCallback(async (id) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            // Fetch doc first to get duration for stats correction
            const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.endTime && data.startTime) {
                    const start = data.startTime.toDate ? data.startTime.toDate() : new Date(data.startTime);
                    const end = data.endTime.toDate ? data.endTime.toDate() : new Date(data.endTime);
                    const duration = end.getTime() - start.getTime();

                    // Decrement stats
                    await updateStatsInDb(data.founder, -duration, start);
                }
            }

            await deleteDoc(docRef);
        } catch (err) {
            console.error("Error deleting:", err);
        }
    }, []);


    return (
        <>
            <datalist id="task-suggestions">
                {PREDEFINED_TASKS.map(task => (
                    <option key={task} value={task} />
                ))}
            </datalist>

            <TopBar
                selectedFounder={selectedFounder}
                setSelectedFounder={setSelectedFounder}
                title="Timesheet Dashboard"
            />

            <div className="dashboard-grid">
                <StatsWidget stats={stats} loading={statsLoading} />

                <TimerWidget
                    activeEntry={activeEntry}
                    activeLoading={activeLoading}
                    onClockIn={handleClockIn}
                    onClockOut={handleClockOut}
                    onManualSubmit={handleManualSubmit}
                />

                <MeetingAttendanceWidget />

                <HistoryWidget
                    entries={recentEntries}
                    loading={recentLoading}
                    onDelete={handleDelete}
                />
            </div>
        </>
    );
};