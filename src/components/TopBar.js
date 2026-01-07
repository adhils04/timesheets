import React from 'react';
import { Users, ChevronDown } from 'lucide-react';
import { FOUNDERS } from '../constants';

export const TopBar = ({ selectedFounder, setSelectedFounder, title }) => {
    // Helper for time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Parse title to extract name if it follows "Welcome, Name" pattern
    // If personalized dashboard (forcedFounder), title is "Welcome, Name"
    const displayTitle = title.startsWith('Welcome')
        ? `${getGreeting()}, ${title.replace('Welcome, ', '')}`
        : title;

    return (
        <header className="top-bar">
            <div className="page-title">
                <h1>{displayTitle}</h1>
                <span className="date-display">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>

            <div className="founder-selector-container">
                <Users size={18} style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }} />
                <select
                    value={selectedFounder}
                    onChange={(e) => setSelectedFounder ? setSelectedFounder(e.target.value) : null}
                    className="founder-select"
                    disabled={!setSelectedFounder}
                >
                    {FOUNDERS.map(f => <option key={f} value={f}>{f}</option>)}
                    {/* If selectedFounder is not in FOUNDERS list (dynamic user), add option */}
                    {!FOUNDERS.includes(selectedFounder) && (
                        <option key={selectedFounder} value={selectedFounder}>{selectedFounder}</option>
                    )}
                </select>
                <ChevronDown size={14} style={{ marginLeft: '0.5rem', opacity: 0.5 }} />
            </div>
        </header>
    );
};
