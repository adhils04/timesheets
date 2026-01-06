import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    getDocs,
    orderBy,
    limit,
    Timestamp,
    doc,
    setDoc
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

// Hook for Recent History - Standard Firestore Listener (No browser cache)
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

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data({ serverTimestamps: 'estimate' }),
                startTime: doc.data({ serverTimestamps: 'estimate' }).startTime?.toDate(),
                endTime: doc.data({ serverTimestamps: 'estimate' }).endTime?.toDate(),
            }));

            setEntries(loaded);
            setLoading(false);
        }, (err) => {
            console.error("Recent entries error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, limitCount]);

    return { entries, loading };
};

// Optimized Hook for Stats - Fetches PRE-CALCULATED Aggregates from DB
export const useStats = (user) => {
    const [stats, setStats] = useState({
        monthTotal: 0,
        yearTotal: 0,
        founderStats: {},
        activeCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Reference to the single aggregate stats document
        const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', 'aggregate');

        const unsubscribe = onSnapshot(statsRef, async (docSnap) => {
            if (docSnap.exists()) {
                // DATA EXISTS: Use the pre-calculated DB values (INSTANT)
                setStats(docSnap.data());
                setLoading(false);
            } else {
                // MIGRATION: First run only!
                console.log("Stats document missing. performing one-time migration...");

                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                // const startOfYear = new Date(now.getFullYear(), 0, 1);
                const startOfMonthMs = startOfMonth.getTime();

                // Fetch ALL raw data to calculate initial totals
                const q = query(getDataCollection());
                const snapshot = await getDocs(q);

                let monthTotal = 0;
                let yearTotal = 0;
                let activeCount = 0;
                const founderStats = {};

                snapshot.docs.forEach(d => {
                    const data = d.data();
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

                const computedStats = { monthTotal, yearTotal, founderStats, activeCount };

                // Save to DB so future loads are instant
                await setDoc(statsRef, computedStats);
                setStats(computedStats);
                setLoading(false);
            }
        }, (err) => {
            console.error("Stats snapshot error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { stats, loading };
};

// Progressive loading for Timesheets page (No cache)
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

        // PHASE 1: Load recent 50 entries
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

        // PHASE 2: Subscribe for real-time updates (Limited to recent 100)
        const qAll = query(
            getDataCollection(),
            orderBy('startTime', 'desc'),
            limit(100)
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
