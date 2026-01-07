/**
 * One-time migration script to populate aggregate statistics
 * Run this script if your stats are empty or need to be recalculated
 * 
 * Usage: node scripts/migrate-stats.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, getDocs, doc, setDoc } = require('firebase/firestore');

// Firebase config - Update with your actual config
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

const APP_ID = 'timesheets-app';
const COLLECTION_NAME = 'timesheets';
const FOUNDERS = ['Adhil', 'Akhil', 'Akshay'];

async function migrateStats() {
    console.log('🚀 Starting stats migration...\n');

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    try {
        // 1. Migrate Timesheet Stats
        console.log('📊 Calculating timesheet statistics...');
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfMonthMs = startOfMonth.getTime();

        const timesheetsQuery = query(
            collection(db, 'artifacts', APP_ID, 'public', 'data', COLLECTION_NAME)
        );
        const timesheetsSnapshot = await getDocs(timesheetsQuery);

        let monthTotal = 0;
        let yearTotal = 0;
        let activeCount = 0;
        const founderStats = {};

        FOUNDERS.forEach(f => {
            founderStats[f] = { month: 0, year: 0 };
        });

        timesheetsSnapshot.docs.forEach(d => {
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

        console.log(`   ✓ Processed ${timesheetsSnapshot.docs.length} timesheet entries`);
        console.log(`   ✓ Month Total: ${Math.round(monthTotal / 3600000)}h`);
        console.log(`   ✓ Year Total: ${Math.round(yearTotal / 3600000)}h`);
        console.log(`   ✓ Active Sessions: ${activeCount}\n`);

        // 2. Migrate Meeting Stats
        console.log('📅 Calculating meeting statistics...');
        const meetingsQuery = query(
            collection(db, 'artifacts', APP_ID, 'public', 'data', 'meeting_attendance')
        );
        const meetingsSnapshot = await getDocs(meetingsQuery);

        const founderCounts = FOUNDERS.reduce((acc, f) => ({ ...acc, [f]: 0 }), {});
        let yearlyCount = 0;
        let totalMeetingsCount = 0;
        const currentYear = new Date().getFullYear();

        meetingsSnapshot.forEach((doc) => {
            const d = doc.data();
            totalMeetingsCount++;
            const dDate = new Date(d.date);
            if (dDate.getFullYear() === currentYear) yearlyCount++;

            if (d.attendance) {
                Object.entries(d.attendance).forEach(([founder, attended]) => {
                    if (attended) founderCounts[founder]++;
                });
            }
        });

        console.log(`   ✓ Processed ${totalMeetingsCount} meetings`);
        console.log(`   ✓ This Year: ${yearlyCount} meetings\n`);

        // 3. Save to Database
        console.log('💾 Saving aggregated stats to database...');
        const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', 'aggregate');

        await setDoc(statsRef, {
            monthTotal,
            yearTotal,
            founderStats,
            activeCount,
            meetingStats: {
                founderStats: founderCounts,
                yearlyTotal: yearlyCount,
                totalMeetings: totalMeetingsCount
            },
            lastMigrated: new Date().toISOString()
        });

        console.log('✅ Migration completed successfully!\n');
        console.log('📈 Summary:');
        console.log(`   - Timesheets: ${timesheetsSnapshot.docs.length} entries`);
        console.log(`   - Meetings: ${totalMeetingsCount} meetings`);
        console.log(`   - Active Sessions: ${activeCount}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateStats();
