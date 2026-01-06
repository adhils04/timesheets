import React, { useState, useCallback } from 'react';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp
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
    const { entries: recentEntries, loading: recentLoading } = useRecentEntries(user, 10);
    const { stats, loading: statsLoading } = useStats(user);


    // --- Actions ---
    // Memoizing actions to ensure props to widgets are stable
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
        }
    }, [user, selectedFounder]);

    const handleClockOut = useCallback(async () => {
        if (!user || !activeEntry) return;

        try {
            const entryRef = doc(db, 'artifacts', APP_ID, 'public', 'data', COLLECTION_NAME, activeEntry.id);
            await updateDoc(entryRef, {
                endTime: serverTimestamp(),
                status: 'completed'
            });
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

        try {
            await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', COLLECTION_NAME), {
                founder: selectedFounder,
                task: finalTask,
                startTime: Timestamp.fromDate(start),
                endTime: Timestamp.fromDate(end),
                status: 'manual'
            });
        } catch (err) {
            console.error("Error adding manual entry:", err);
        }
    }, [user, selectedFounder]);

    const handleDelete = useCallback(async (id) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', COLLECTION_NAME, id));
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
