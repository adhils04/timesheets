import { useState, useEffect, useRef } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    getDocs,
    orderBy,
    limit,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { APP_ID, COLLECTION_NAME } from '../constants';
import { getCachedData, setCachedData, CACHE_KEYS } from '../utils/cache';

const getDataCollection = () => collection(db, 'artifacts', APP_ID, 'public', 'data', COLLECTION_NAME);

// Hook for the "Active" timer (Real-time needed for timer)
export const useActiveEntry = (user, selectedFounder) => {
    const [activeEntry, setActiveEntry] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setActiveEntry(null);
            setLoading(false);
            return;
        }

        const q = query(
            getDataCollection(),
            where('founder', '==', selectedFounder),
            where('endTime', '==', null),
            limit(1)
        );

        // Use onSnapshot for real-time timer updates (this is a small query)
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let data = null;
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                data = {
                    id: doc.id,
                    ...doc.data(),
                    startTime: doc.data().startTime?.toDate(),
                };
            }
            setActiveEntry(data);
            setLoading(false);
        }, (err) => {
            console.error("Active entry error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, selectedFounder]);

    return { activeEntry, loading };
};

// Hook for Recent History - INSTANT with cache, then background update
export const useRecentEntries = (user, limitCount = 10) => {
    // Initialize from cache immediately (synchronous)
    const cachedEntries = getCachedData(CACHE_KEYS.RECENT_ENTRIES);
    const [entries, setEntries] = useState(cachedEntries || []);
    const [loading, setLoading] = useState(!cachedEntries);

    useEffect(() => {
        if (!user) {
            setEntries([]);
            setLoading(false);
            return;
        }

        const q = query(
            getDataCollection(),
            orderBy('startTime', 'desc'),
            limit(limitCount)
        );

        // If we have cache, we're already showing data - just update silently
        const processSnapshot = (snapshot) => {
            const loaded = snapshot.docs.map(doc => {
                const data = doc.data({ serverTimestamps: 'estimate' });
                return {
                    id: doc.id,
                    ...data,
                    // Store as ISO strings for cache compatibility
                    startTime: data.startTime?.toDate()?.toISOString(),
                    endTime: data.endTime?.toDate()?.toISOString(),
                };
            });

            // Convert back to Date objects for display
            const withDates = loaded.map(entry => ({
                ...entry,
                startTime: entry.startTime ? new Date(entry.startTime) : null,
                endTime: entry.endTime ? new Date(entry.endTime) : null,
            }));

            setEntries(withDates);
            setLoading(false);

            // Cache the data (with ISO strings)
            setCachedData(CACHE_KEYS.RECENT_ENTRIES, loaded);
        };

        // If no cache, do initial getDocs for faster first load
        if (!cachedEntries) {
            getDocs(q).then((snapshot) => {
                processSnapshot(snapshot);
            }).catch(err => {
                console.error("Recent entries error:", err);
                setLoading(false);
            });
        }

        // Subscribe for real-time updates (background refresh)
        const unsubscribe = onSnapshot(q, processSnapshot, (err) => {
            console.error("Recent entries snapshot error:", err);
        });

        return () => unsubscribe();
    }, [user, limitCount, cachedEntries]);

    return { entries, loading };
};

// Helper to get stats collection query
const getStatsQuery = (startDate, endDate = null) => {
    const filters = [where('startTime', '>=', Timestamp.fromDate(startDate))];
    if (endDate) {
        filters.push(where('startTime', '<', Timestamp.fromDate(endDate)));
    }
    return query(getDataCollection(), ...filters);
};

// Optimized Hook for Stats - INSTANT with cache, then background update
export const useStats = (user) => {
    // Initialize from cache immediately (synchronous)
    const cachedStats = getCachedData(CACHE_KEYS.STATS);
    const [stats, setStats] = useState(cachedStats || {
        monthTotal: 0,
        yearTotal: 0,
        founderStats: {},
        activeCount: 0
    });
    const [loading, setLoading] = useState(!cachedStats);
    const hasLoadedRef = useRef(!!cachedStats);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const startOfMonthMs = startOfMonth.getTime();

        // Calculate stats from documents
        const calculateStats = (docs) => {
            let monthTotal = 0;
            let yearTotal = 0;
            let activeCount = 0;
            const founderStats = {};

            docs.forEach(doc => {
                const data = doc.data();
                const founder = data.founder;

                if (!founder) return;
                if (!founderStats[founder]) founderStats[founder] = { month: 0, year: 0 };

                if (!data.endTime) {
                    activeCount++;
                    return;
                }

                const sTime = data.startTime?.seconds ? data.startTime.seconds * 1000 : 0;
                const eTime = data.endTime?.seconds ? data.endTime.seconds * 1000 : 0;
                const duration = eTime - sTime;

                yearTotal += duration;
                founderStats[founder].year += duration;

                if (sTime >= startOfMonthMs) {
                    monthTotal += duration;
                    founderStats[founder].month += duration;
                }
            });

            return { monthTotal, yearTotal, founderStats, activeCount };
        };

        const q = getStatsQuery(startOfYear);

        const updateStats = (calculatedStats) => {
            setStats(calculatedStats);
            setLoading(false);
            hasLoadedRef.current = true;
            // Cache the stats
            setCachedData(CACHE_KEYS.STATS, calculatedStats);
        };

        // If no cache, use getDocs for initial load
        if (!cachedStats) {
            getDocs(q).then(snapshot => {
                updateStats(calculateStats(snapshot.docs));
            }).catch(err => {
                console.error("Stats getDocs error:", err);
                setLoading(false);
            });
        }

        // Subscribe for real-time updates (background refresh)
        const unsubscribe = onSnapshot(q, (snapshot) => {
            updateStats(calculateStats(snapshot.docs));
        }, (err) => {
            console.error("Stats snapshot error:", err);
        });

        return () => unsubscribe();
    }, [user, cachedStats]);

    return { stats, loading };
};

// Progressive loading for Timesheets page - INSTANT with cache
export const useTimesheets = (user) => {
    // Initialize from cache immediately
    const cachedTimesheets = getCachedData('timesheets_all');
    const [entries, setEntries] = useState(() => {
        if (!cachedTimesheets) return [];
        // Convert ISO strings back to Date objects
        return cachedTimesheets.map(entry => ({
            ...entry,
            startTime: entry.startTime ? new Date(entry.startTime) : null,
            endTime: entry.endTime ? new Date(entry.endTime) : null,
        }));
    });
    const [loading, setLoading] = useState(!cachedTimesheets);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        if (!user) {
            setEntries([]);
            setLoading(false);
            return;
        }

        const processSnapshot = (snapshot, isPartial = false) => {
            const loadedEntries = snapshot.docs.map(doc => {
                const data = doc.data({ serverTimestamps: 'estimate' });
                return {
                    id: doc.id,
                    ...data,
                    startTime: data.startTime?.toDate()?.toISOString(),
                    endTime: data.endTime?.toDate()?.toISOString(),
                };
            });

            const withDates = loadedEntries.map(entry => ({
                ...entry,
                startTime: entry.startTime ? new Date(entry.startTime) : null,
                endTime: entry.endTime ? new Date(entry.endTime) : null,
            }));

            setEntries(withDates);
            setLoading(false);

            if (!isPartial) {
                setLoadingMore(false);
                // Cache all entries
                setCachedData('timesheets_all', loadedEntries);
            } else if (loadedEntries.length === 50) {
                setLoadingMore(true);
            }
        };

        // If no cache, load initial 50 entries first
        if (!cachedTimesheets) {
            const qRecent = query(
                getDataCollection(),
                orderBy('startTime', 'desc'),
                limit(50)
            );

            getDocs(qRecent).then(snapshot => {
                processSnapshot(snapshot, true);
            }).catch(err => {
                console.error("Timesheets getDocs error:", err);
                setLoading(false);
            });
        }

        // Subscribe for real-time updates (all entries)
        const qAll = query(
            getDataCollection(),
            orderBy('startTime', 'desc')
        );

        const unsubscribe = onSnapshot(qAll, (snapshot) => {
            processSnapshot(snapshot, false);
        });

        return () => unsubscribe();
    }, [user, cachedTimesheets]);

    return { entries, loading, loadingMore };
}
