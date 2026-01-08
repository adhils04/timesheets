
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const EditEntryModal = ({ entry, onSave, onCancel }) => {
    const [task, setTask] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        if (entry) {
            setTask(entry.task);

            // Format timestamps to HH:MM string for input[type="time"]
            // and YYYY-MM-DD for input[type="date"]
            const start = entry.startTime && entry.startTime.toDate ? entry.startTime.toDate() : new Date(entry.startTime);
            const end = entry.endTime && entry.endTime.toDate ? entry.endTime.toDate() : new Date(entry.endTime);

            if (start) {
                setStartTime(start.toTimeString().slice(0, 5));
                setDate(start.toISOString().split('T')[0]);
            }
            if (end) {
                setEndTime(end.toTimeString().slice(0, 5));
            }
        }
    }, [entry]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Reconstruct Date objects
        // We assume start and end are on the same day as 'date'
        // If end time is earlier than start time, it might be next day (but let's keep it simple: same day)

        const start = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);

        if (end <= start) {
            alert("End time must be after start time");
            return;
        }

        onSave({
            ...entry,
            task,
            startTime: start,
            endTime: end
        });
    };

    if (!entry) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Edit Entry</h3>
                    <button className="mode-switch-btn" onClick={onCancel} style={{ padding: '0.25rem' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Task Description</label>
                        <input
                            type="text"
                            className="custom-input"
                            value={task}
                            onChange={e => setTask(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Date</label>
                        <input
                            type="date"
                            className="custom-input"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label">Start Time</label>
                            <input
                                type="time"
                                className="custom-input"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">End Time</label>
                            <input
                                type="time"
                                className="custom-input"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="action-btn" onClick={onCancel} style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', color: '#64748b' }}>
                            Cancel
                        </button>
                        <button type="submit" className="action-btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
