import React, { useState } from 'react';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { APP_ID } from '../constants';

export const ResetDataTool = () => {
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');

    const handleClearData = async () => {
        if (password !== 'admin123') { // Simple protection
            setStatus('Incorrect Password');
            return;
        }

        if (!window.confirm("WARNING: This will delete ALL application data (Timesheets, Meetings, Stats). Users will remain but their data will be gone. Continue?")) return;

        setLoading(true);
        setStatus('Starting cleanup...');

        try {
            // Helper to delete collections in batches
            const deleteCollection = async (pathSegments) => {
                const colRef = collection(db, ...pathSegments);
                const snapshot = await getDocs(colRef);
                const batchSize = 500;
                let batch = writeBatch(db);
                let count = 0;
                let totalDeleted = 0;

                setStatus(`Found ${snapshot.size} documents in ${pathSegments[pathSegments.length - 1]}...`);

                for (const docSnapshot of snapshot.docs) {
                    batch.delete(docSnapshot.ref);
                    count++;
                    if (count >= batchSize) {
                        await batch.commit();
                        totalDeleted += count;
                        batch = writeBatch(db);
                        count = 0;
                    }
                }
                if (count > 0) {
                    await batch.commit();
                    totalDeleted += count;
                }
                setStatus(prev => prev + ` Deleted ${totalDeleted} documents from ${pathSegments[pathSegments.length - 1]}. `);
            };

            // 1. Clear Timesheets
            await deleteCollection(['artifacts', APP_ID, 'public', 'data', 'timesheets']);

            // 2. Clear Meetings
            await deleteCollection(['artifacts', APP_ID, 'public', 'data', 'meeting_attendance']);

            // 3. Clear Stats (Aggregate)
            // It's a single doc
            await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'stats', 'aggregate'));
            setStatus(prev => prev + " Stats reset. ");

            // 4. Clear Users (Optional - User asked for "Fresh")
            // If we clear users, we force re-signup logic.
            // Let's DO IT to be thorough.
            await deleteCollection(['artifacts', APP_ID, 'users']);

            setStatus(prev => prev + " DONE. All data cleared.");

        } catch (error) {
            console.error(error);
            setStatus(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <h1>System Reset Tool</h1>
            <p style={{ color: 'red', fontWeight: 'bold' }}>DANGER ZONE: This permanently wipes the database.</p>

            <div style={{ margin: '2rem 0' }}>
                <input
                    type="password"
                    placeholder="Enter Admin Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ padding: '0.5rem', marginRight: '1rem' }}
                />
                <button
                    onClick={handleClearData}
                    disabled={loading}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'red',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    {loading ? 'Clearing...' : 'NUKE DATABASE'}
                </button>
            </div>

            <div style={{ marginTop: '2rem', whiteSpace: 'pre-wrap', textAlign: 'left', background: '#eee', padding: '1rem' }}>
                {status}
            </div>
        </div>
    );
};
