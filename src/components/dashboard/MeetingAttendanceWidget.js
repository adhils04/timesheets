import React, { useState, useEffect, useRef } from 'react';
import {
    doc,
    getDoc,
    setDoc,
    increment,
    onSnapshot,
    getDocs
} from 'firebase/firestore';
import { db } from '../../firebase';
import { FOUNDERS, APP_ID } from '../../constants';

// Helper to get default attendance state
const getDefaultAttendance = () =>
    FOUNDERS.reduce((acc, founder) => ({ ...acc, [founder]: false }), {});

export const MeetingAttendanceWidget = React.memo(() => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState(getDefaultAttendance());
    const [originalAttendance, setOriginalAttendance] = useState(getDefaultAttendance());

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

    // --- 1. Fetch Attendance for Selected Date (One-time fetch) ---
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setSaveSuccess(false);

        const fetchAttendance = async () => {
            try {
                const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'meeting_attendance', selectedDate);
                const docSnap = await getDoc(docRef);

                if (cancelled) return;

                if (docSnap.exists()) {
                    const data = docSnap.data().attendance || {};
                    const fullData = { ...getDefaultAttendance(), ...data };
                    setAttendance(fullData);
                    setOriginalAttendance(fullData);
                    setIsNewEntry(false);
                } else {
                    const defaults = getDefaultAttendance();
                    setAttendance(defaults);
                    setOriginalAttendance(defaults);
                    setIsNewEntry(true);
                }
            } catch (error) {
                console.error("Error fetching attendance:", error);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchAttendance();
        return () => {
            cancelled = true;
        };
    }, [selectedDate]);

    // --- 2. Real-time Aggregated Stats (Read Only) ---
    useEffect(() => {
        const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', 'aggregate');

        const unsubscribe = onSnapshot(statsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                // If meeting stats exist, use them
                if (data.meetingStats) {
                    setStats(data.meetingStats);
                } else {
                    // No meeting stats yet - use empty defaults
                    console.warn("Meeting stats don't exist yet. They will be created when you save attendance.");
                    setStats({
                        founderStats: FOUNDERS.reduce((acc, f) => ({ ...acc, [f]: 0 }), {}),
                        yearlyTotal: 0,
                        totalMeetings: 0
                    });
                }
            } else {
                // Stats document doesn't exist - use empty defaults
                setStats({
                    founderStats: FOUNDERS.reduce((acc, f) => ({ ...acc, [f]: 0 }), {}),
                    yearlyTotal: 0,
                    totalMeetings: 0
                });
            }
        }, (err) => {
            console.error("Meeting stats error:", err);
        });

        return () => unsubscribe();
    }, []);

    const handleCheckboxChange = (founder) => {
        setAttendance(prev => ({
            ...prev,
            [founder]: !prev[founder]
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveSuccess(false);

        try {
            // Update Aggregates Atomically
            const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', 'aggregate');
            const currentYear = new Date().getFullYear();
            const meetingDate = new Date(selectedDate);
            const isThisYear = meetingDate.getFullYear() === currentYear;

            const updates = {};

            // If new meeting, increment totals
            if (isNewEntry) {
                updates['meetingStats.totalMeetings'] = increment(1);
                if (isThisYear) {
                    updates['meetingStats.yearlyTotal'] = increment(1);
                }
            }

            // Increment/Decrement founder counts based on diff
            FOUNDERS.forEach(founder => {
                const wasAttending = isNewEntry ? false : (originalAttendance[founder] || false);
                const isAttending = attendance[founder] || false;

                if (isAttending && !wasAttending) {
                    updates[`meetingStats.founderStats.${founder}`] = increment(1);
                } else if (!isAttending && wasAttending) {
                    updates[`meetingStats.founderStats.${founder}`] = increment(-1);
                }
            });

            // Perform both updates in parallel with timeout
            await Promise.all([
                setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'meeting_attendance', selectedDate), {
                    date: selectedDate,
                    attendance: attendance,
                    updatedAt: new Date().toISOString()
                }, { merge: true }),
                Object.keys(updates).length > 0 ? setDoc(statsRef, updates, { merge: true }) : Promise.resolve()
            ]);

            setOriginalAttendance({ ...attendance });
            setIsNewEntry(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);

        } catch (error) {
            console.error("Error saving attendance:", error);
            alert('Failed to save attendance. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="card meeting-attendance-card" style={{ gridColumn: 'span 12' }}>
            <div className="timer-header">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Founders Weekly Meeting</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label className="date-display">Select Date:</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="custom-input"
                        style={{ padding: '0.5rem', width: 'auto' }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                {/* Left Column: Attendance Form */}
                <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Mark Attendance
                        {isNewEntry && !loading && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 400 }}>
                                (New Meeting)
                            </span>
                        )}
                    </h3>

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {FOUNDERS.map(founder => (
                                <div
                                    key={founder}
                                    style={{
                                        padding: '0.75rem',
                                        background: 'white',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}
                                >
                                    <div style={{
                                        width: '1.2rem',
                                        height: '1.2rem',
                                        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 1.5s infinite',
                                        borderRadius: '4px'
                                    }} />
                                    <div style={{
                                        width: '80px',
                                        height: '20px',
                                        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 1.5s infinite',
                                        borderRadius: '4px'
                                    }} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {FOUNDERS.map(founder => (
                                <label
                                    key={founder}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        cursor: 'pointer',
                                        padding: '0.75rem',
                                        background: attendance[founder] ? 'rgba(16, 185, 129, 0.1)' : 'white',
                                        borderRadius: '8px',
                                        border: attendance[founder] ? '1px solid #10b981' : '1px solid var(--border-color)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={attendance[founder] || false}
                                        onChange={() => handleCheckboxChange(founder)}
                                        style={{ width: '1.2rem', height: '1.2rem', accentColor: '#10b981' }}
                                    />
                                    <span style={{ fontWeight: 500 }}>{founder}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    <div style={{ marginTop: '1.5rem' }}>
                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '1rem',
                                cursor: saving || loading ? 'not-allowed' : 'pointer',
                                background: saveSuccess ? '#10b981' : saving ? '#6b7280' : 'var(--primary)',
                                color: 'white',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {saving ? (
                                <>
                                    <span style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid white',
                                        borderTopColor: 'transparent',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }}></span>
                                    Saving...
                                </>
                            ) : saveSuccess ? (
                                <>✓ Saved!</>
                            ) : (
                                'Save Attendance'
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Column: Stats Overview */}
                <div>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Attendance Overview
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(67, 97, 238, 0.05)', padding: '1rem', borderRadius: '12px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>Total Meetings (Year)</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{stats.yearlyTotal}</div>
                        </div>
                        <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '12px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Total Meetings (All Time)</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{stats.totalMeetings}</div>
                        </div>
                    </div>

                    <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Founder</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Attended</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {FOUNDERS.map((founder, index) => {
                                    const count = stats.founderStats[founder] || 0;
                                    const total = stats.totalMeetings || 1;
                                    const rate = Math.round((count / total) * 100);

                                    return (
                                        <tr key={founder} style={{ borderBottom: index === FOUNDERS.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{founder}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>{count}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{rate}%</span>
                                                    <div style={{ width: '40px', height: '4px', background: '#e9ecef', borderRadius: '2px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${rate}%`, height: '100%', background: 'var(--primary)' }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
});