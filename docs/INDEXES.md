# Firestore Index Deployment Guide

## Why Indexes Are Important

Firestore requires composite indexes for queries that filter or sort by multiple fields. Without proper indexes, queries will be **extremely slow** or fail entirely.

## Required Indexes for This App

This app requires the following composite indexes:

### 1. Active Sessions Query
**Collection:** `timesheets`  
**Fields:**
- `founder` (Ascending)
- `endTime` (Ascending)

**Used by:** Timer widget to find active sessions

### 2. Recent Entries Query
**Collection:** `timesheets`  
**Fields:**
- `startTime` (Descending)

**Used by:** Recent activity and timesheets page

## Deployment Methods

### Method 1: Automatic (Recommended)

1. **Run the app** in development mode:
   ```bash
   npm start
   ```

2. **Open the browser console** and look for index creation links

3. **Click the links** provided by Firebase - they will automatically create the indexes

4. **Wait 2-5 minutes** for indexes to build

### Method 2: Firebase CLI

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firestore** (if not already done):
   ```bash
   firebase init firestore
   ```
   - Select your project
   - Use default `firestore.rules` and `firestore.indexes.json`

4. **Deploy indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

5. **Wait for deployment** - You'll see:
   ```
   ✔  firestore: deployed indexes in firestore.indexes.json successfully
   ```

### Method 3: Firebase Console (Manual)

1. **Go to Firebase Console**: https://console.firebase.google.com

2. **Select your project**

3. **Navigate to**: Firestore Database → Indexes tab

4. **Click "Create Index"**

5. **For Index 1** (Active Sessions):
   - Collection ID: `timesheets`
   - Fields to index:
     - Field: `founder`, Order: Ascending
     - Field: `endTime`, Order: Ascending
   - Query scope: Collection
   - Click "Create"

6. **For Index 2** (Recent Entries):
   - Collection ID: `timesheets`
   - Fields to index:
     - Field: `startTime`, Order: Descending
   - Query scope: Collection
   - Click "Create"

7. **Wait for indexes to build** (2-5 minutes)

## Verifying Indexes

### In Firebase Console

1. Go to Firestore Database → Indexes
2. Check that both indexes show status: **Enabled** (green)
3. If status is "Building", wait a few minutes

### In Your App

1. Open the app in your browser
2. Open browser DevTools → Console
3. Look for any Firestore index warnings
4. If no warnings appear, indexes are working correctly

## Troubleshooting

### "Index building" for a long time
- **Small datasets** (< 1000 docs): Should complete in 1-2 minutes
- **Large datasets** (> 10,000 docs): May take 10-30 minutes
- **Very large datasets**: Can take hours

### "Index creation failed"
- Check Firestore quotas in Firebase Console
- Verify you have owner/editor permissions
- Try deleting and recreating the index

### App still slow after creating indexes
- **Clear browser cache** and reload
- **Verify indexes are enabled** (not just "Building")
- **Check network tab** in DevTools for slow requests
- **Run the migration script** to populate aggregate stats

### Console shows "Missing index" error
- **Click the provided link** in the error message
- Firebase will create the exact index needed
- Wait for it to build

## Index Maintenance

### When to Update Indexes

- When adding new query patterns
- When changing sort orders
- When adding new filter combinations

### How to Update

1. **Edit `firestore.indexes.json`**
2. **Deploy changes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

### Deleting Unused Indexes

Unused indexes consume storage and slow down writes. To delete:

1. Go to Firebase Console → Firestore → Indexes
2. Find the unused index
3. Click the three dots → Delete
4. Or remove from `firestore.indexes.json` and redeploy

## Performance Impact

### Without Indexes
- Query time: **30-60 seconds** (full collection scan)
- User experience: Unusable
- Firestore reads: Very high

### With Indexes
- Query time: **< 500ms**
- User experience: Instant
- Firestore reads: Minimal

## Best Practices

1. ✅ **Create indexes early** - Before deploying to production
2. ✅ **Test queries** - Verify performance in development
3. ✅ **Monitor usage** - Check Firestore usage dashboard
4. ✅ **Version control** - Keep `firestore.indexes.json` in git
5. ✅ **Document queries** - Comment why each index exists

## Additional Resources

- [Firestore Index Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Index Best Practices](https://firebase.google.com/docs/firestore/query-data/index-overview)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
