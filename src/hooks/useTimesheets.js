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

// Hook for Recent History - Optimized with getDocs first
export const useRecentEntries = (user, limitCount = 10) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

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

        // Use getDocs for fast initial load (can use cache)
        getDocs(q).then((snapshot) => {
            const loaded = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data({ serverTimestamps: 'estimate' }),
                startTime: doc.data({ serverTimestamps: 'estimate' }).startTime?.toDate(),
                endTime: doc.data({ serverTimestamps: 'estimate' }).endTime?.toDate(),
            }));
            setEntries(loaded);
            setLoading(false);
        }).catch(err => {
            console.error("Recent entries error:", err);
            setLoading(false);
        });

        // Then subscribe for real-time updates
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data({ serverTimestamps: 'estimate' }),
                startTime: doc.data({ serverTimestamps: 'estimate' }).startTime?.toDate(),
                endTime: doc.data({ serverTimestamps: 'estimate' }).endTime?.toDate(),
            }));
            setEntries(loaded);
        });

        return () => unsubscribe();
    }, [user, limitCount]);

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

// Optimized Hook for Stats - Uses getDocs for instant initial load
export const useStats = (user) => {
    const [stats, setStats] = useState({
        monthTotal: 0,
        yearTotal: 0,
        founderStats: {},
        activeCount: 0
    });
    const [loading, setLoading] = useState(true);
    const hasLoadedRef = useRef(false);

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

        // FAST: Use getDocs for initial load (uses cache if available)
        if (!hasLoadedRef.current) {
            getDocs(q).then(snapshot => {
                const calculatedStats = calculateStats(snapshot.docs);
                setStats(calculatedStats);
                setLoading(false);
                hasLoadedRef.current = true;
            }).catch(err => {
                console.error("Stats getDocs error:", err);
                setLoading(false);
            });
        }

        // Then subscribe for real-time updates
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const calculatedStats = calculateStats(snapshot.docs);
            setStats(calculatedStats);
            setLoading(false);
        }, (err) => {
            console.error("Stats snapshot error:", err);
        });

        return () => unsubscribe();
    }, [user]);

    return { stats, loading };
};

// Progressive loading for Timesheets page - Uses getDocs for speed
export const useTimesheets = (user) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        if (!user) {
            setEntries([]);
            setLoading(false);
            return;
        }

        // PHASE 1: Load recent 50 entries with getDocs (FAST - uses cache)
        const qRecent = query(
            getDataCollection(),
            orderBy('startTime', 'desc'),
            limit(50)
        );

        getDocs(qRecent).then(snapshot => {
            const loadedEntries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data({ serverTimestamps: 'estimate' }),
                startTime: doc.data({ serverTimestamps: 'estimate' }).startTime?.toDate(),
                endTime: doc.data({ serverTimestamps: 'estimate' }).endTime?.toDate(),
            }));
            setEntries(loadedEntries);
            setLoading(false);

            if (loadedEntries.length === 50) {
                setLoadingMore(true);
            }
        }).catch(err => {
            console.error("Timesheets getDocs error:", err);
            setLoading(false);
        });

        // PHASE 2: Subscribe for real-time updates (all entries)
        const qAll = query(
            getDataCollection(),
            orderBy('startTime', 'desc')
        );

        const unsubscribe = onSnapshot(qAll, (snapshot) => {
            const allEntries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data({ serverTimestamps: 'estimate' }),
                startTime: doc.data({ serverTimestamps: 'estimate' }).startTime?.toDate(),
                endTime: doc.data({ serverTimestamps: 'estimate' }).endTime?.toDate(),
            }));
            setEntries(allEntries);
            setLoadingMore(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { entries, loading, loadingMore };
}
