/**
 * LocalStorage Cache Utility
 * Provides instant data loading by caching Firebase data locally
 */

const CACHE_PREFIX = 'foundertrack_';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached data from localStorage
 * @param {string} key - Cache key
 * @returns {object|null} - Cached data or null if expired/missing
 */
export const getCachedData = (key) => {
    try {
        const cached = localStorage.getItem(CACHE_PREFIX + key);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        
        // Check if cache is expired
        if (Date.now() - timestamp > CACHE_EXPIRY_MS) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }

        return data;
    } catch (e) {
        console.warn('Cache read error:', e);
        return null;
    }
};

/**
 * Set cached data in localStorage
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export const setCachedData = (key, data) => {
    try {
        const cacheEntry = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheEntry));
    } catch (e) {
        console.warn('Cache write error:', e);
        // If localStorage is full, clear old cache entries
        clearOldCache();
    }
};

/**
 * Clear specific cache entry
 * @param {string} key - Cache key to clear
 */
export const clearCache = (key) => {
    try {
        localStorage.removeItem(CACHE_PREFIX + key);
    } catch (e) {
        console.warn('Cache clear error:', e);
    }
};

/**
 * Clear all FounderTrack cache entries
 */
export const clearAllCache = () => {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    } catch (e) {
        console.warn('Cache clear all error:', e);
    }
};

/**
 * Clear old cache entries when storage is full
 */
const clearOldCache = () => {
    try {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
        
        // Sort by timestamp and remove oldest entries
        const entries = cacheKeys.map(key => {
            try {
                const cached = JSON.parse(localStorage.getItem(key));
                return { key, timestamp: cached?.timestamp || 0 };
            } catch {
                return { key, timestamp: 0 };
            }
        });

        entries.sort((a, b) => a.timestamp - b.timestamp);
        
        // Remove oldest 50% of entries
        const toRemove = entries.slice(0, Math.ceil(entries.length / 2));
        toRemove.forEach(entry => localStorage.removeItem(entry.key));
    } catch (e) {
        console.warn('Old cache clear error:', e);
    }
};

// Cache keys constants
export const CACHE_KEYS = {
    STATS: 'dashboard_stats',
    RECENT_ENTRIES: 'recent_entries',
    MEETING_STATS: 'meeting_stats',
    ATTENDANCE_PREFIX: 'attendance_'
};
