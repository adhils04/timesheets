/**
 * ADMIN PROMOTION SCRIPT
 * 
 * Run this script to promote a user to 'admin' role.
 * Usage: node scripts/make-admin.js <email>
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc } = require('firebase/firestore');

// Hardcoded config
const firebaseConfig = {
    apiKey: "AIzaSyCjov15N246JwygMGcokruydxQ460uWZ2M",
    authDomain: "founders-time-sheet.firebaseapp.com",
    projectId: "founders-time-sheet",
    storageBucket: "founders-time-sheet.appspot.com",
    messagingSenderId: "673630096472",
    appId: "1:673630096472:web:ba2b5c93c03a1e32d88e2d"
};

const APP_ID = 'founder-timesheet-app';

async function makeAdmin() {
    const email = process.argv[2];
    if (!email) {
        console.error("Please provide an email address.");
        console.log("Usage: node scripts/make-admin.js <email>");
        process.exit(1);
    }

    console.log(`Promoting ${email} to ADMIN...`);

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    try {
        const usersRef = collection(db, 'artifacts', APP_ID, 'public', 'users');
        const q = query(usersRef, where('email', '==', email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.error("User not found!");
            process.exit(1);
        }

        const userDoc = snapshot.docs[0];
        await updateDoc(userDoc.ref, { role: 'admin' });

        console.log(`✅ Success! ${email} is now an Admin.`);
        console.log("They can access /admintracker");
        process.exit(0);

    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

makeAdmin();
