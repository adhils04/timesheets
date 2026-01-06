import React, { useState, memo } from 'react';
import { Play, Square, Plus } from 'lucide-react';
// TimerWidget manages its own input state!
export const TimerWidget = memo(({ activeEntry, activeLoading, onClockIn, onClockOut, onManualSubmit }) => {
    // Local state for inputs - this isolates typing re-renders to this component only
    const [taskInput, setTaskInput] = useState('');
    const [timerCustomTask, setTimerCustomTask] = useState('');
    const [isManualEntry, setIsManualEntry] = useState(false);

    // Manual Entry States
    const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
    const [manualStartTime, setManualStartTime] = useState('09:00');
    const [manualEndTime, setManualEndTime] = useState('17:00');
    const [manualTask, setManualTask] = useState('');
    const [manualCustomTask, setManualCustomTask] = useState('');

    const handleStart = () => {
        const finalTask = taskInput === 'Others' ? timerCustomTask : taskInput;
        onClockIn(finalTask);
        // Clear inputs after start
        setTaskInput('');
        setTimerCustomTask('');
    };

    const handleManualSubmitInternal = (e) => {
        e.preventDefault();
        const finalTask = manualTask === 'Others' ? manualCustomTask : manualTask;
        onManualSubmit(finalTask, manualDate, manualStartTime, manualEndTime);
        // Clear
        setIsManualEntry(false);
        setManualTask('');
        setManualCustomTask('');
    }

    return (
        <div className="timer-section card animate-slide-up delay-200">
            <div style={{ padding: '2rem' }}>
                <div className="timer-header">
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                        {isManualEntry ? "Log Past Work" : "Current Session"}
                    </h2>
                    <button
                        onClick={() => setIsManualEntry(!isManualEntry)}
                        className="mode-switch-btn"
                    >
                        {isManualEntry ? "Switch to Timer" : "Switch to Manual Entry"}
                    </button>
                </div>

                {isManualEntry ? (
                    // Manual Entry Form
                    <form onSubmit={handleManualSubmitInternal} style={{ display: 'grid', gap: '1.5rem' }}>
                        <div>
                            <label className="input-label">Task Description</label>
                            <input
                                type="text"
                                list="task-suggestions"
                                value={manualTask}
                                onChange={(e) => setManualTask(e.target.value)}
                                placeholder="e.g., Q3 Financial Review"
                                className="task-input"
                            />
                            {manualTask === 'Others' && (
                                <input
                                    type="text"
                                    value={manualCustomTask}
                                    onChange={(e) => setManualCustomTask(e.target.value)}
                                    placeholder="Specify task..."
                                    className="task-input"
                                    style={{ marginTop: '0.5rem' }}
                                    autoFocus
                                />
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="input-label">Date</label>
                                <input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} className="custom-input" />
                            </div>
                            <div>
                                <label className="input-label">Start</label>
                                <input type="time" value={manualStartTime} onChange={e => setManualStartTime(e.target.value)} className="custom-input" />
                            </div>
                            <div>
                                <label className="input-label">End</label>
                                <input type="time" value={manualEndTime} onChange={e => setManualEndTime(e.target.value)} className="custom-input" />
                            </div>
                        </div>
                        <button type="submit" className="action-btn btn-primary">
                            <Plus size={20} /> Log Entry
                        </button>
                    </form>
                ) : (
                    // Timer View
                    <div className="timer-controls">
                        <div style={{ flex: 1 }}>
                            {activeEntry ? (
                                <div className="active-session-card">
                                    <div>
                                        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700, marginBottom: '0.25rem' }}>Active Task</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{activeEntry.task}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Started at {activeEntry.startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                    <div className="btn-pulse" style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%' }}></div>
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        list="task-suggestions"
                                        value={taskInput}
                                        onChange={(e) => setTaskInput(e.target.value)}
                                        placeholder="What are you working on?"
                                        className="task-input"
                                    />
                                    {taskInput === 'Others' && (
                                        <input
                                            type="text"
                                            value={timerCustomTask}
                                            onChange={(e) => setTimerCustomTask(e.target.value)}
                                            placeholder="Specify task..."
                                            className="task-input"
                                            style={{ marginTop: '0.75rem' }}
                                            autoFocus
                                        />
                                    )}
                                </>
                            )}
                        </div>

                        {activeEntry ? (
                            <button onClick={onClockOut} className="action-btn btn-danger">
                                <Square size={20} fill="currentColor" /> Stop
                            </button>
                        ) : (
                            <button onClick={handleStart} disabled={activeLoading && !activeEntry && false} className="action-btn btn-primary" >
                                <Play size={20} fill="currentColor" /> Start
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});
