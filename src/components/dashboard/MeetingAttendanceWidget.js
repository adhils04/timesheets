import React, { useState, useEffect } from 'react';
import {
    doc,
    getDoc,
    setDoc,
    increment,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../../firebase';
import { APP_ID } from '../../constants';

export const MeetingAttendanceWidget = React.memo(({ foundersList = [], isReadOnly }) => {
    // Helper to get default attendance state based on PROPS
    const getDefaultAttendance = () =>
        foundersList.reduce((acc, founder) => ({ ...acc, [founder]: false }), {});

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState({});
    const [originalAttendance, setOriginalAttendance] = useState({});

    const [isNewEntry, setIsNewEntry] = useState(true);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Stats state
    const [stats, setStats] = useState({
        founderStats: {},
        yearlyTotal: 0,
        totalMeetings: 0
    });

    // Reset/Init attendance when foundersList changes or date changes
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setSaveSuccess(false);
        const defaults = getDefaultAttendance();

        const fetchAttendance = async () => {
            try {
                const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'meeting_attendance', selectedDate);
                const docSnap = await getDoc(docRef);

                if (cancelled) return;

                if (docSnap.exists()) {
                    const data = docSnap.data().attendance || {};
                    // Merge with defaults to ensure all current founders exist
                    const fullData = { ...defaults, ...data };
                    // If a founder was deleted, they might still be in 'data'. That's fine.
                    // But typically we only want to show current foundersList form.
                    // So we filter keys? Or just use fullData?
                    // We'll prioritize defaults keys (current founders) but keep data values.
                    const filteredData = {};
                    foundersList.forEach(f => {
                        filteredData[f] = fullData[f] || false;
                    });

                    setAttendance(filteredData);
                    setOriginalAttendance(filteredData);
                    setIsNewEntry(false);
                } else {
                    setAttendance(defaults);
                    setOriginalAttendance(defaults);
                    setIsNewEntry(true);
                }
            } catch (error) {
                console.error("Error fetching attendance:", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        if (foundersList.length > 0) {
            fetchAttendance();
        } else {
            setLoading(false);
        }

        return () => { cancelled = true; };
    }, [selectedDate, foundersList]); // Depend on foundersList

    // --- Stats Listener ---
    useEffect(() => {
        const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', 'aggregate');
        const unsubscribe = onSnapshot(statsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.meetingStats) {
                    setStats(data.meetingStats);
                }
            }
        });
        return () => unsubscribe();
    }, []);


    const handleCheckboxChange = (founder) => {
        setAttendance(prev => ({ ...prev, [founder]: !prev[founder] }));
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveSuccess(false);

        try {
            const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', 'aggregate');
            const currentYear = new Date().getFullYear();
            const meetingDate = new Date(selectedDate);
            const isThisYear = meetingDate.getFullYear() === currentYear;

            const meetingUpdates = {};

            if (isNewEntry) {
                meetingUpdates.totalMeetings = increment(1);
                if (isThisYear) meetingUpdates.yearlyTotal = increment(1);
            }

            const founderUpdates = {};
            let hasFounderChanges = false;

            // Iterate over ALL keys in attendance (current list)
            Object.keys(attendance).forEach(founder => {
                const wasAttending = isNewEntry ? false : (originalAttendance[founder] || false);
                const isAttending = attendance[founder] || false;

                if (isAttending && !wasAttending) {
                    founderUpdates[founder] = increment(1);
                    hasFounderChanges = true;
                } else if (!isAttending && wasAttending) {
                    founderUpdates[founder] = increment(-1);
                    hasFounderChanges = true;
                }
            });

            if (hasFounderChanges) {
                meetingUpdates.founderStats = founderUpdates;
            }

            const finalUpdates = { meetingStats: meetingUpdates };
            const shouldUpdateStats = Object.keys(meetingUpdates).length > 0;

            await Promise.all([
                setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'meeting_attendance', selectedDate), {
                    date: selectedDate,
                    attendance: attendance,
                    updatedAt: new Date().toISOString()
                }, { merge: true }),
                shouldUpdateStats ? setDoc(statsRef, finalUpdates, { merge: true }) : Promise.resolve()
            ]);

            setOriginalAttendance({ ...attendance });
            setIsNewEntry(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);

        } catch (error) {
            console.error("Error saving attendance:", error);
            alert('Failed. Try again.');
        } finally {
            setSaving(false);
        }
    };

    // Rendering List: use foundersList
    return (
        <div className="card meeting-attendance-card" style={{ gridColumn: 'span 12' }}>
            <div className="timer-header">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Founders Weekly Meeting</h2>
                {!isReadOnly && (
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="custom-input" style={{ padding: '0.5rem', width: 'auto' }} />
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isReadOnly ? '1fr' : '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                {/* Form - Only show if NOT ReadOnly */}
                {!isReadOnly && (
                    <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px' }}>
                        <h3 style={{ marginTop: 0 }}>Mark Attendance {isNewEntry && <span style={{ fontSize: '0.8rem' }}>(New)</span>}</h3>
                        {loading ? (<div>Loading...</div>) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {foundersList.map(founder => (
                                    <label key={founder} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: attendance[founder] ? 'rgba(16, 185, 129, 0.1)' : 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                        <input type="checkbox" checked={attendance[founder] || false} onChange={() => handleCheckboxChange(founder)} />
                                        <span>{founder}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        <button onClick={handleSave} disabled={saving} style={{ marginTop: '1rem', width: '100%', padding: '1rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white' }}>
                            {saving ? 'Saving...' : 'Save Attendance'}
                        </button>
                    </div>
                )}

                {/* Overview - Always Show */}
                <div>
                    <h3>Attendance Overview</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px' }}>
                            <div>Total (Year)</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.yearlyTotal}</div>
                        </div>
                        <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px' }}>
                            <div>Total (All Time)</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalMeetings}</div>
                        </div>
                    </div>
                    {/* List Breakdown */}
                    <table style={{ width: '100%' }}>
                        <tbody>
                            {foundersList.map(founder => {
                                const count = stats.founderStats?.[founder] || 0;
                                const total = stats.totalMeetings || 1;
                                const rate = Math.round((count / total) * 100);
                                return (
                                    <tr key={founder}>
                                        <td>{founder}</td>
                                        <td style={{ textAlign: 'right' }}>{count} ({rate}%)</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
});