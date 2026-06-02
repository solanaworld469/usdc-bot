import React from 'react';

export const UCreditDisplay = ({ amount, className = "" }) => {
    // 1. Ensure strict number parsing and exactly 5 decimals
    const num = parseFloat(amount) || 0;
    const [whole, decimal] = num.toFixed(5).split('.');
    
    // 2. Pad the front so it ALWAYS has at least 4 digits (e.g., 0002)
    const paddedWhole = whole.padStart(4, '0');

    // 3. Render with items-baseline and relative scaling for the exponent
    return (
        <span className={`font-mono tracking-wider inline-flex items-baseline ${className}`}>
            <span>{paddedWhole}.</span>
            {/* 🌟 FIXED: relative 'em' sizing automatically aligns the exponent cleanly */}
            <span style={{ fontSize: '0.6em', marginLeft: '1px' }} className="font-bold opacity-80">{decimal}</span>
        </span>
    );
};