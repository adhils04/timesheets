import React from 'react';
import { Users, ChevronDown } from 'lucide-react';
import { FOUNDERS } from '../constants';

export const TopBar = ({ selectedFounder, setSelectedFounder, title }) => {
    return (
        <header className="top-bar">
            <div className="page-title">
                <h1>{title}</h1>
                <span className="date-display">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>

            <div className="founder-selector-container">
                <Users size={18} style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }} />
                <select
                    value={selectedFounder}
                    onChange={(e) => setSelectedFounder(e.target.value)}
                    className="founder-select"
                >
                    {FOUNDERS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <ChevronDown size={14} style={{ marginLeft: '0.5rem', opacity: 0.5 }} />
            </div>
        </header>
    );
};
