/**
 * Database Reset Script
 * 
 * This script CLEARS all testing data (Time Entries and Meeting Records)
 * and resets the Stats to zero.
 * 
 * Usage: node scripts/reset-all.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } = require('firebase/firestore');

// Hardcoded config to ensure it runs without env setup manually
const firebaseConfig = {
    apiKey: "AIzaSyCjov15N246JwygMGcokruydxQ460uWZ2M",
    authDomain: "founders-time-sheet.firebaseapp.com",
    projectId: "founders-time-sheet",
    storageBucket: "founders-time-sheet.appspot.com",
    messagingSenderId: "673630096472",
    appId: "1:673630096472:web:ba2b5c93c03a1e32d88e2d"
};

const APP_ID = 'founder-timesheet-app';
const FOUNDERS = [
    'Naeem Theyyathumkadavath',
    'Saeed Abdu Rahiman',
    'Shafeeque Kokkuth',
    'Abdu Subahan'
];

async function resetDatabase() {
    console.log('🚀 Starting Database Cleanup...\n');
    console.log('   Target Project:', firebaseConfig.projectId);
    console.log('   App ID:', APP_ID);
    console.log('----------------------------------------');

    try {
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        // 1. Delete Timesheets
        console.log('\n🗑️  Cleaning Timesheets...');
        const timesheetsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'timesheets');
        const timesheetsSnap = await getDocs(timesheetsRef);
        console.log(`   Found ${timesheetsSnap.size} timesheet entries.`);

        if (timesheetsSnap.size > 0) {
            const deletePromises = timesheetsSnap.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            console.log('   All timesheets deleted.');
        }

        // 2. Delete Meeting Records
        console.log('\n🗑️  Cleaning Meeting Records...');
        const meetingsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'meeting_attendance');
        const meetingsSnap = await getDocs(meetingsRef);
        console.log(`   Found ${meetingsSnap.size} meeting records.`);

        if (meetingsSnap.size > 0) {
            const deletePromises = meetingsSnap.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            console.log('   All meeting records deleted.');
        }

        // 3. Reset Stats
        console.log('\n🔄 Resetting Aggregate Stats...');
        const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', 'aggregate');

        const initialStats = {
            // Timesheet stats
            monthTotal: 0,
            yearTotal: 0,
            activeCount: 0,
            founderStats: FOUNDERS.reduce((acc, founder) => ({
                ...acc,
                [founder]: { month: 0, year: 0 }
            }), {}),

            // Meeting stats
            meetingStats: {
                totalMeetings: 0,
                yearlyTotal: 0,
                founderStats: FOUNDERS.reduce((acc, founder) => ({
                    ...acc,
                    [founder]: 0
                }), {})
            },

            // Metadata
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            resetAt: new Date().toISOString()
        };

        await setDoc(statsRef, initialStats);
        console.log('   Stats reset to zero.');

        console.log('\n✅ Database cleanup complete!');
        console.log('   The application is now fresh.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Reset failed:', error);
        process.exit(1);
    }
}

resetDatabase();
