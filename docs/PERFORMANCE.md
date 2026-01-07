# Performance Optimization Guide

## Overview
This document outlines the performance optimizations implemented to reduce dashboard load times from 45+ seconds to under 2 seconds.

## Key Optimizations

### 1. **Removed Expensive Migration Queries**
Previously, the app would fetch ALL documents on first load to calculate statistics. This has been removed.

**Before:**
- `useStats`: Fetched all timesheet entries to calculate totals
- `MeetingAttendanceWidget`: Fetched all meeting documents to calculate stats

**After:**
- Both hooks now use real-time listeners to pre-calculated aggregate stats
- Empty defaults are shown if stats don't exist yet

### 2. **Eliminated Redundant Queries**
**Before:**
- `useTimesheets`: Made 2 queries (getDocs + onSnapshot)
- Multiple components fetching overlapping data

**After:**
- Single `onSnapshot` query per component
- Efficient real-time updates without double-fetching

### 3. **Database-Side Aggregation**
All statistics are now maintained as aggregates in Firestore using `increment()`:

```
/artifacts/{APP_ID}/public/data/stats/aggregate
{
  monthTotal: number,
  yearTotal: number,
  activeCount: number,
  founderStats: {
    [founder]: { month: number, year: number }
  },
  meetingStats: {
    totalMeetings: number,
    yearlyTotal: number,
    founderStats: { [founder]: number }
  }
}
```

### 4. **Required Firestore Indexes**

For optimal performance, ensure these composite indexes exist in Firestore:

#### Timesheets Collection
```
Collection: artifacts/{APP_ID}/public/data/timesheets
Fields: founder (Ascending), endTime (Ascending)
```

```
Collection: artifacts/{APP_ID}/public/data/timesheets
Fields: startTime (Descending)
```

**To create indexes:**
1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Add the fields as specified above
4. Or, run the app and click the index creation links in console errors

### 5. **Real-time Data Flow**

All data uses Firestore's real-time listeners (`onSnapshot`):
- ✅ No browser caching
- ✅ Instant updates across all clients
- ✅ Single source of truth (Firestore)

## Migration Script

If you need to populate initial aggregate stats, run:

```bash
# Set environment variables
export FIREBASE_API_KEY="your-api-key"
export FIREBASE_AUTH_DOMAIN="your-domain"
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_STORAGE_BUCKET="your-bucket"
export FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
export FIREBASE_APP_ID="your-app-id"

# Run migration
node scripts/migrate-stats.js
```

This is a **one-time operation** and should only be run when:
- Setting up the app for the first time
- Recovering from data corruption
- Recalculating stats after bulk data changes

## Performance Metrics

### Expected Load Times (with proper indexes):

| Component | Before | After |
|-----------|--------|-------|
| Stats Widget | 30-45s | <500ms |
| Meeting Widget | 20-30s | <500ms |
| Recent Activity | 5-10s | <500ms |
| Timesheets Page | 45s | <1s |
| **Total Dashboard** | **45-60s** | **<2s** |

### Query Counts Per Page Load:

| Page | Before | After |
|------|--------|-------|
| Dashboard | 5 queries | 4 listeners |
| Timesheets | 2 queries | 1 listener |

## Monitoring Performance

### Chrome DevTools
1. Open DevTools → Network tab
2. Filter by "Firestore" or "firebase"
3. Check request count and timing

### Firestore Console
1. Go to Firebase Console → Firestore → Usage
2. Monitor read operations
3. Check for missing indexes

## Troubleshooting

### Slow Initial Load
- **Check Firestore indexes** - Missing indexes cause full collection scans
- **Verify aggregate stats exist** - Run migration script if needed
- **Check network latency** - Test on different networks

### Stats Not Updating
- **Verify write operations** - Ensure `increment()` is being called
- **Check console errors** - Look for Firestore permission errors
- **Validate data structure** - Ensure stats document matches schema

### Real-time Updates Not Working
- **Check listener cleanup** - Ensure `unsubscribe()` is called properly
- **Verify Firestore rules** - Ensure read permissions are correct
- **Check browser console** - Look for WebSocket connection errors

## Best Practices

1. **Always use `increment()`** for aggregate updates
2. **Never fetch all documents** for calculations
3. **Use compound indexes** for multi-field queries
4. **Limit query results** with `.limit()`
5. **Clean up listeners** in useEffect cleanup functions

## Future Optimizations

Potential improvements for even better performance:

1. **Pagination** - Load timesheets in batches
2. **Virtual scrolling** - For very long lists
3. **Service Worker** - For offline support (while maintaining real-time sync)
4. **Cloud Functions** - For complex aggregations
5. **Firestore bundles** - For initial data loading
