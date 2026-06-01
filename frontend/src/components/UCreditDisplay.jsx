import React from 'react';

export const UCreditDisplay = ({ amount, className = "" }) => {
    const num = parseFloat(amount) || 0;
    const [whole, decimal] = num.toFixed(5).split('.');
    
    const paddedWhole = whole.padStart(4, '0');

    return (
        <span className={`font-mono tracking-wider inline-flex items-baseline ${className}`}>
            <span className="text-sm">{paddedWhole}.</span>
            {/* 🌟 FIXED: Changed text-lg to text-[9px] to make it a tiny exponent */}
            <sup className="text-[9px] font-bold text-gray-400 ml-[1px]">{decimal}</sup>
        </span>
    );
};