import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { FOUNDERS, APP_ID } from '../../constants';
import { getCachedData, setCachedData, CACHE_KEYS } from '../../utils/cache';

// Helper to get default attendance state
const getDefaultAttendance = () =>
    FOUNDERS.reduce((acc, founder) => ({ ...acc, [founder]: false }), {});

export const MeetingAttendanceWidget = React.memo(() => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Initialize attendance from cache for today's date
    const todayKey = new Date().toISOString().split('T')[0];
    const cachedTodayAttendance = getCachedData(CACHE_KEYS.ATTENDANCE_PREFIX + todayKey);
    const [attendance, setAttendance] = useState(cachedTodayAttendance || getDefaultAttendance());
    const [originalAttendance, setOriginalAttendance] = useState(cachedTodayAttendance || getDefaultAttendance());

    const [isNewEntry, setIsNewEntry] = useState(!cachedTodayAttendance);
    const [loading, setLoading] = useState(!cachedTodayAttendance || selectedDate !== todayKey);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Initialize stats from cache immediately
    const cachedStats = getCachedData(CACHE_KEYS.MEETING_STATS);
    const [stats, setStats] = useState(cachedStats || {
        founderStats: {},
        yearlyTotal: 0,
        totalMeetings: 0
    });

    // Track loaded dates to know which are new vs existing
    const loadedDatesRef = useRef(new Set());

    // Fetch attendance for the selected date
    useEffect(() => {
        let cancelled = false;

        const fetchAttendance = async () => {
            // Check cache first
            const cachedAttendance = getCachedData(CACHE_KEYS.ATTENDANCE_PREFIX + selectedDate);
            if (cachedAttendance) {
                setAttendance(cachedAttendance);
                setOriginalAttendance(cachedAttendance);
                setIsNewEntry(false);
                setLoading(false);
                loadedDatesRef.current.add(selectedDate);
                // Still fetch from server in background to ensure freshness
            } else {
                setLoading(true);
            }

            setSaveSuccess(false);

            try {
                const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'meeting_attendance', selectedDate);
                const docSnap = await getDoc(docRef);

                if (cancelled) return;

                if (docSnap.exists()) {
                    const data = docSnap.data().attendance || {};
                    // Ensure all founders have a value
                    const fullData = { ...getDefaultAttendance(), ...data };
                    setAttendance(fullData);
                    setOriginalAttendance(fullData);
                    setIsNewEntry(false);
                    loadedDatesRef.current.add(selectedDate);
                    // Cache this attendance
                    setCachedData(CACHE_KEYS.ATTENDANCE_PREFIX + selectedDate, fullData);
                } else if (!cachedAttendance) {
                    // Only reset to defaults if we didn't have cache
                    const defaults = getDefaultAttendance();
                    setAttendance(defaults);
                    setOriginalAttendance(defaults);
                    setIsNewEntry(true);
                }
            } catch (error) {
                console.error("Error fetching attendance:", error);
                // On error, only reset if we don't have cache
                if (!cachedAttendance) {
                    const defaults = getDefaultAttendance();
                    setAttendance(defaults);
                    setOriginalAttendance(defaults);
                    setIsNewEntry(true);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchAttendance();

        return () => { cancelled = true; };
    }, [selectedDate]);

    // Fetch overall stats on mount - use cache for instant display
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const q = query(
                    collection(db, 'artifacts', APP_ID, 'public', 'data', 'meeting_attendance'),
                    orderBy('date', 'desc')
                );
                const querySnapshot = await getDocs(q);

                const founderCounts = FOUNDERS.reduce((acc, f) => ({ ...acc, [f]: 0 }), {});
                let yearlyCount = 0;
                let totalMeetingsCount = 0;
                const currentYear = new Date().getFullYear();

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const docDate = new Date(data.date);
                    totalMeetingsCount++;

                    if (docDate.getFullYear() === currentYear) {
                        yearlyCount++;
                    }

                    if (data.attendance) {
                        Object.entries(data.attendance).forEach(([founder, attended]) => {
                            if (attended && founderCounts[founder] !== undefined) {
                                founderCounts[founder]++;
                            }
                        });
                    }
                });

                const newStats = {
                    founderStats: founderCounts,
                    yearlyTotal: yearlyCount,
                    totalMeetings: totalMeetingsCount
                };

                setStats(newStats);
                // Cache the stats
                setCachedData(CACHE_KEYS.MEETING_STATS, newStats);
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };

        fetchStats();
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
            // Calculate stats diff BEFORE save
            const currentYear = new Date().getFullYear();
            const meetingDate = new Date(selectedDate);
            const isThisYear = meetingDate.getFullYear() === currentYear;
            const wasNewEntry = isNewEntry;

            // Optimistic stats update
            setStats(prevStats => {
                const newStats = { ...prevStats };
                const newFounderStats = { ...prevStats.founderStats };

                // If new entry, increment totals
                if (wasNewEntry) {
                    newStats.totalMeetings += 1;
                    if (isThisYear) {
                        newStats.yearlyTotal += 1;
                    }
                }

                // Update founder counts based on diff from original
                FOUNDERS.forEach(founder => {
                    const wasAttending = originalAttendance[founder] || false;
                    const isAttending = attendance[founder] || false;

                    if (isAttending && !wasAttending) {
                        newFounderStats[founder] = (newFounderStats[founder] || 0) + 1;
                    } else if (!isAttending && wasAttending) {
                        newFounderStats[founder] = Math.max(0, (newFounderStats[founder] || 0) - 1);
                    }
                });

                newStats.founderStats = newFounderStats;
                return newStats;
            });

            // Perform save (fire and forget with timeout)
            const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'meeting_attendance', selectedDate);

            // Create save promise
            const saveData = {
                date: selectedDate,
                attendance: attendance,
                updatedAt: new Date().toISOString() // Use client timestamp to avoid serverTimestamp issues
            };

            // Try to save with timeout
            const savePromise = setDoc(docRef, saveData, { merge: true });
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 8000)
            );

            try {
                await Promise.race([savePromise, timeoutPromise]);
            } catch (timeoutError) {
                console.warn("Save timed out, but data may still sync later:", timeoutError);
                // Continue anyway - the save will complete in background
            }

            // Update local state to reflect save
            setOriginalAttendance({ ...attendance });
            setIsNewEntry(false);
            loadedDatesRef.current.add(selectedDate);
            setSaveSuccess(true);

            // Cache the saved attendance for instant loading next time
            setCachedData(CACHE_KEYS.ATTENDANCE_PREFIX + selectedDate, attendance);

            // Clear success after 3 seconds
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
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Loading attendance...
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

            {/* CSS for spinner animation */}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
});
