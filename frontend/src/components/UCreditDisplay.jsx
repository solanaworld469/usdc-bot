import React from 'react';

export const UCreditDisplay = ({ amount, className = "" }) => {
    // 1. Ensure it's a number and format strictly to 5 decimal places
    const num = parseFloat(amount) || 0;
    const [whole, decimal] = num.toFixed(5).split('.');
    
    // 2. Pad the whole number to exactly 4 digits
    const paddedWhole = whole.padStart(4, '0');

    // 3. Render the split UI with the superscript decimal
    return (
        <span className={`font-mono tracking-wider ${className}`}>
            {paddedWhole}.<sup className="text-lg font-bold">{decimal}</sup>
        </span>
    );
};