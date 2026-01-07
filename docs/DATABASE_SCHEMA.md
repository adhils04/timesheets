# 🗄️ Firestore Database Schema

You only need to create **ONE** database in the Firebase Console: **Cloud Firestore**.

Once created, my scripts and the application automatically manage the internal structure (Collections and Documents). You do **NOT** need to create these manually.

## 1. Timesheets Collection
Stores every clock-in/out entry.
- **Path**: `/artifacts/founder-timesheet-app/public/data/timesheets/{ENTRY_ID}`
- **Fields**:
  - `founder` (string): Name of the founder (e.g., "Naeem...")
  - `task` (string): Description of work
  - `startTime` (timestamp): When started
  - `endTime` (timestamp): When finished (null if active)
  - `status` (string): "active", "completed", or "manual"

## 2. Meeting Attendance Collection
Stores attendance for each weekly meeting.
- **Path**: `/artifacts/founder-timesheet-app/public/data/meeting_attendance/{YYYY-MM-DD}`
- **Document ID**: The date of the meeting (e.g., "2023-10-27")
- **Fields**:
  - `attendance` (map): `{ "Naeem...": true, "Saeed...": false }`
  - `date` (string): "2023-10-27"

## 3. Aggregate Stats (The "Speed" Layer)
Stores calculated totals so the dashboard loads instantly.
- **Path**: `/artifacts/founder-timesheet-app/public/data/stats/aggregate`
- **Fields**:
  - `monthTotal` (number): Total milliseconds worked this month (all founders)
  - `yearTotal` (number): Total milliseconds worked this year
  - `founderStats` (map):
    - `Naeem...`: `{ month: 12345, year: 67890 }`
  - `meetingStats` (map):
    - `totalMeetings`: Total number of meetings
    - `founderStats`: `{ "Naeem...": 5 }` (Attendance count)

---

## 🚀 How to Create This
**You do not create these manually.**
1. Enable **Cloud Firestore** in the Firebase Console.
2. Run `node scripts/init-database.js`.
   - This script creates the `stats/aggregate` document with 0 values.
   - The other collections are created automatically when you use the app.
