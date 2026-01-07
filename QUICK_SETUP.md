# 🚀 Quick Setup Guide - Fix Empty Dashboard

## Problem
When you log in, you see empty spaces because the aggregate stats document doesn't exist in the correct path.

## Solution: Initialize the Database (One-Time Setup)

### Option 1: Quick Init (Recommended)

Run this command to create the required database structure:

```bash
# 1. Set your Firebase credentials
export FIREBASE_API_KEY="your-api-key"
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
export FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
export FIREBASE_MESSAGING_SENDER_ID="123456789"
export FIREBASE_APP_ID="1:123456789:web:abcdef"

# 2. Run initialization
node scripts/init-database.js
```

**This will:**
- ✅ Create the stats in `/founder-timesheet-app/...` (Correct Path)
- ✅ Initialize all counters to 0
- ✅ Enable instant dashboard loading

**Time required:** 5 seconds

---

### Option 2: Manual Setup via Firebase Console

If you prefer not to run scripts:

1. **Go to Firebase Console** → Firestore Database
2. **Navigate to**: `/artifacts/founder-timesheet-app/public/data/stats/aggregate`
3. **Add this document**:

```json
{
  "monthTotal": 0,
  "yearTotal": 0,
  "activeCount": 0,
  "founderStats": {
    "Naeem Theyyathumkadavath": { "month": 0, "year": 0 },
    "Saeed Abdu Rahiman": { "month": 0, "year": 0 },
    "Shafeeque Kokkuth": { "month": 0, "year": 0 },
    "Abdu Subahan": { "month": 0, "year": 0 }
  },
  "meetingStats": {
    "totalMeetings": 0,
    "yearlyTotal": 0,
    "founderStats": {
      "Naeem Theyyathumkadavath": 0,
      "Saeed Abdu Rahiman": 0,
      "Shafeeque Kokkuth": 0,
      "Abdu Subahan": 0
    }
  }
}
```

4. **Save** the document

---

### Verification

After running the initialization:
1. **Refresh your browser** (hard refresh: Cmd+Shift+R)
2. **Log in to the app**
3. **Check the dashboard** - You should see actual 0 values, not loading spinners.

---

## Troubleshooting

### "Save Meeting" Hangs?
If saving hangs, it usually means your network is blocking Firestore or permissions are missing.
We added a 5-second timeout to alert you if the network is too slow.

### Still seeing empty spaces?
Run `node scripts/init-database.js` again. We fixed a bug in the script where it was writing to the wrong database path.
