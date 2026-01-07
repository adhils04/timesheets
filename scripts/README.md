# Stats Migration Script

This script populates the aggregate statistics in your Firestore database. Run this **once** when setting up the application or when you need to recalculate stats.

## Prerequisites

- Node.js installed
- Firebase project credentials
- Existing timesheet and meeting data in Firestore

## Setup

1. **Install dependencies** (if not already installed):
   ```bash
   npm install firebase
   ```

2. **Set environment variables** with your Firebase configuration:

   ```bash
   export FIREBASE_API_KEY="your-api-key"
   export FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   export FIREBASE_PROJECT_ID="your-project-id"
   export FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
   export FIREBASE_MESSAGING_SENDER_ID="123456789"
   export FIREBASE_APP_ID="1:123456789:web:abcdef"
   ```

   **Or create a `.env` file** in the project root:
   ```env
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=123456789
   FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

## Running the Migration

```bash
node scripts/migrate-stats.js
```

## What It Does

The script will:

1. ✅ Connect to your Firestore database
2. ✅ Fetch all timesheet entries
3. ✅ Calculate aggregate statistics:
   - Total hours (month)
   - Total hours (year)
   - Per-founder statistics
   - Active session count
4. ✅ Fetch all meeting attendance records
5. ✅ Calculate meeting statistics:
   - Total meetings (all time)
   - Total meetings (this year)
   - Per-founder attendance counts
6. ✅ Save all aggregates to `/artifacts/timesheets-app/public/data/stats/aggregate`

## Expected Output

```
🚀 Starting stats migration...

📊 Calculating timesheet statistics...
   ✓ Processed 150 timesheet entries
   ✓ Month Total: 45h
   ✓ Year Total: 320h
   ✓ Active Sessions: 2

📅 Calculating meeting statistics...
   ✓ Processed 24 meetings
   ✓ This Year: 18 meetings

💾 Saving aggregated stats to database...
✅ Migration completed successfully!

📈 Summary:
   - Timesheets: 150 entries
   - Meetings: 24 meetings
   - Active Sessions: 2
```

## When to Run

- **First time setup**: When deploying the app for the first time
- **After bulk imports**: If you've imported historical data
- **Data recovery**: If aggregate stats are corrupted or missing
- **Recalculation**: If you suspect stats are incorrect

## Important Notes

⚠️ **This is a one-time operation** - The app maintains stats automatically after this initial setup.

⚠️ **Do not run repeatedly** - Running this script will overwrite existing aggregate stats. The app updates stats in real-time as users add/edit/delete entries.

⚠️ **Backup first** - Consider backing up your Firestore data before running migrations.

## Troubleshooting

### Error: "Firebase config missing"
- Ensure all environment variables are set correctly
- Check that your `.env` file is in the project root
- Verify your Firebase credentials are valid

### Error: "Permission denied"
- Check Firestore security rules
- Ensure the service account has write permissions
- Verify the database path is correct

### Stats not showing in app
- Clear browser cache and reload
- Check browser console for errors
- Verify the stats document exists in Firestore Console

## Alternative: Manual Setup

If you prefer not to run the script, you can manually create the stats document in Firestore Console:

**Path:** `/artifacts/timesheets-app/public/data/stats/aggregate`

**Document structure:**
```json
{
  "monthTotal": 0,
  "yearTotal": 0,
  "activeCount": 0,
  "founderStats": {
    "Adhil": { "month": 0, "year": 0 },
    "Akhil": { "month": 0, "year": 0 },
    "Akshay": { "month": 0, "year": 0 }
  },
  "meetingStats": {
    "totalMeetings": 0,
    "yearlyTotal": 0,
    "founderStats": {
      "Adhil": 0,
      "Akhil": 0,
      "Akshay": 0
    }
  }
}
```

The app will then maintain these values automatically as data is added/modified.
