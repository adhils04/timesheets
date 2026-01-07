/**
 * Diagnosis Script
 * 
 * Checks the health of the Firestore connection and data integrity.
 * Usage: node scripts/diagnose.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, getDocs, limit, query } = require('firebase/firestore');

// Using the CORRECT APP_ID
const APP_ID = 'founder-timesheet-app';

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

async function diagnose() {
    console.log('🔍 Starting Diagnosis...');
    console.log(`📱 App ID (path): ${APP_ID}`);

    console.log('🔧 Configuration Check:');
    console.log(`   - Project ID: '${firebaseConfig.projectId}'`);
    console.log(`   - Auth Domain: '${firebaseConfig.authDomain}'`);
    console.log(`   - Storage Bucket: '${firebaseConfig.storageBucket}'`);
    console.log(`   - API Key: ${firebaseConfig.apiKey ? 'Valid (Not shown)' : 'MISSING'}`);

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.error('❌ Missing critical environment variables!');
        process.exit(1);
    }

    try {
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        // 1. Check Connectivity & Latency
        const start = Date.now();
        console.log('\n📡 Testing connectivity...');
        const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', 'aggregate');
        const statsSnap = await getDoc(statsRef);
        const latency = Date.now() - start;

        console.log(`✅ Connection successful! Latency: ${latency}ms`);

        if (latency > 2000) {
            console.warn('⚠️  SLOW CONNECTION DETECTED. Network might be the issue.');
        }

        // 2. Check Data Existence
        if (statsSnap.exists()) {
            console.log('✅ Aggregate Stats Document: FOUND');
            const data = statsSnap.data();
            console.log(`   - Total Hours: ${data.monthTotal || 0}`);
            console.log(`   - Founders Tracked: ${Object.keys(data.founderStats || {}).join(', ')}`);
        } else {
            console.error('❌ Aggregate Stats Document: MISSING');
            console.error('   -> ACTION: Run "node scripts/init-database.js" immediately!');
        }

        // 3. Check Persistence
        // (We can't strictly check browser persistence here, but we can verify script access)

        console.log('\n✨ Diagnosis Complete');
        if (!statsSnap.exists()) {
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Diagnosis Failed:', error);
    }
}

diagnose();
