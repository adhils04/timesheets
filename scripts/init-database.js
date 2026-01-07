/**
 * Database Initialization Script
 * 
 * This script initializes the Firestore database with the required
 * aggregate stats structure. Run this ONCE before using the app.
 * 
 * Usage: node scripts/init-database.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase config - Update with your actual config or use environment variables
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBLlxqCbGJjLnzNhWJpDzCvQZJQGxXxXxX",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

const APP_ID = 'founder-timesheet-app';
const FOUNDERS = [
    'Naeem Theyyathumkadavath',
    'Saeed Abdu Rahiman',
    'Shafeeque Kokkuth',
    'Abdu Subahan'
];

async function initializeDatabase() {
    console.log('🚀 Initializing Firestore database...\n');

    try {
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        // Create the aggregate stats document with initial values
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
            lastUpdated: new Date().toISOString()
        };

        console.log('📊 Creating aggregate stats document...');
        await setDoc(statsRef, initialStats);

        console.log('✅ Database initialized successfully!\n');
        console.log('📈 Initial structure created:');
        console.log('   - Timesheet stats: Ready');
        console.log('   - Meeting stats: Ready');
        console.log('   - Founder tracking: Enabled for', FOUNDERS.join(', '));
        console.log('\n✨ Your app is now ready to use!');
        console.log('   The dashboard will load instantly with real-time data.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        console.error('\nPlease check:');
        console.error('   1. Firebase credentials are correct');
        console.error('   2. Firestore is enabled in your Firebase project');
        console.error('   3. You have write permissions to Firestore\n');
        process.exit(1);
    }
}

// Run initialization
initializeDatabase();
