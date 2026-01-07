import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    limit,
    doc,
    getDocs
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

        // Safety timeout - if Firestore hangs, stop loading after 3s
        const timeoutId = setTimeout(() => {
            setLoading(false);
        }, 3000);

        const q = query(
            getDataCollection(),
            where('founder', '==', selectedFounder),
            where('endTime', '==', null),
            limit(1)
        );

        // Use onSnapshot for real-time timer updates (this is a small query)
        const unsubscribe = onSnapshot(q, (snapshot) => {
            clearTimeout(timeoutId); // Data received, clear timeout
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

        return () => {
            unsubscribe();
            clearTimeout(timeoutId);
        };
    }, [user, selectedFounder]);

    return { activeEntry, loading };
};

// Hook for Recent History - Uses getDocs for a one-time fetch
export const useRecentEntries = (user, limitCount = 10) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setEntries([]);
            setLoading(false);
            return;
        }

        const fetchEntries = async () => {
            setLoading(true);
            try {
                const q = query(
                    getDataCollection(),
                    orderBy('startTime', 'desc'),
                    limit(limitCount)
                );
                const snapshot = await getDocs(q);
                const loaded = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data({ serverTimestamps: 'estimate' }),
                    startTime: doc.data({ serverTimestamps: 'estimate' }).startTime?.toDate(),
                    endTime: doc.data({ serverTimestamps: 'estimate' }).endTime?.toDate(),
                }));
                setEntries(loaded);
            } catch (err) {
                console.error("Recent entries error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchEntries();
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

        const timeoutId = setTimeout(() => {
            setLoading(false);
        }, 3000);

        // Reference to the single aggregate stats document
        const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', 'aggregate');

        const unsubscribe = onSnapshot(statsRef, (docSnap) => {
            clearTimeout(timeoutId);
            if (docSnap.exists()) {
                // DATA EXISTS: Use the pre-calculated DB values (INSTANT)
                const data = docSnap.data();
                setStats(data);
            } else {
                // No stats yet - use empty defaults
                console.warn("Stats document doesn't exist. Please ensure write operations update aggregates.");
                setStats({
                    monthTotal: 0,
                    yearTotal: 0,
                    founderStats: {},
                    activeCount: 0
                });
            }
            setLoading(false);
        }, (err) => {
            console.error("Stats snapshot error:", err);
            setLoading(false);
        });

        return () => {
            unsubscribe();
            clearTimeout(timeoutId);
        };
    }, [user]);

    return { stats, loading };
};

// Progressive loading for Timesheets page (one-time fetch)
export const useTimesheets = (user) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setEntries([]);
            setLoading(false);
            return;
        }

        const fetchEntries = async () => {
            setLoading(true);
            try {
                // Single query for recent entries
                const q = query(
                    getDataCollection(),
                    orderBy('startTime', 'desc'),
                    limit(100)
                );
                const snapshot = await getDocs(q);
                const loadedEntries = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data({ serverTimestamps: 'estimate' }),
                    startTime: doc.data({ serverTimestamps: 'estimate' }).startTime?.toDate(),
                    endTime: doc.data({ serverTimestamps: 'estimate' }).endTime?.toDate(),
                }));
                setEntries(loadedEntries);
            } catch (err) {
                console.error("Timesheets snapshot error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchEntries();
    }, [user]);

    return { entries, loading };
}