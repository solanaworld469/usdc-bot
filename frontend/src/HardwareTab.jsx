import React, { useState, useEffect, useRef } from 'react';
import { hardcodedRigs, getRoiPercentage } from './pricelist';

// 🌟 FIXED: Added ownedCoils prop to receive the user's active fleet data
export default function HardwareTab({ ownedCoils, onSelectMachine }) {
  const [selectedDuration, setSelectedDuration] = useState(30);
  const roiPercentage = getRoiPercentage(selectedDuration);
  
  const scrollWrapperRef = useRef(null);
  const firstCardRef = useRef(null);

  useEffect(() => {
    // ⏳ Short timeout to ensure elements are painted before measuring heights
    const timer = setTimeout(() => {
      if (scrollWrapperRef.current && firstCardRef.current) {
        const cardHeight = firstCardRef.current.offsetHeight;
        // Divide by 2.2 to tuck the top under while leaving the icon peeking out
        const preciseOffset = cardHeight / 2.3; 
        
        scrollWrapperRef.current.scrollTo({
          top: preciseOffset,
          behavior: 'smooth'
        });
      }
    }, 80); // Quick millisecond wait for the paint engine

    return () => clearTimeout(timer);
  }, []); 

  return (
    <div 
      ref={scrollWrapperRef}
      className="w-full flex flex-col px-4 pb-24 select-none bg-[#0a0b0d] h-[calc(100vh-64px)] overflow-y-auto [&::-webkit-scrollbar]:hidden"
    >
      
      {/* 📌 STICKY UPPER WRAPPER */}
      <div className="sticky top-0 z-20 bg-[#0a0b0d] pt-2 pb-1 space-y-1 border-b border-gray-900/30 flex-shrink-0">
        
        {/* 🛒 HEADER ROW */}
        <div className="flex justify-between items-end font-mono pb-1">
          <div className="flex flex-col">
            <h2 className="text-base font-bold tracking-wide text-cyan-400">Cloud Storefront</h2>
            <span className="text-[9px] text-gray-500 uppercase tracking-tight">Quantum Processor (1 year contract) T&C Applies</span>
          </div>
          <div className="text-right">
            <span className="bg-cyan-950/40 border border-cyan-900/50 text-cyan-400 font-bold px-2.5 py-1 rounded text-[10px] tracking-wide">
              6/6 Active Machine
            </span>
          </div>
        </div>

        {/* 🎛️ CLAIM PERIOD SELECTOR */}
        <div className="flex flex-col space-y-0.5 bg-[#111317] px-3 py-1.5 border border-gray-900 rounded-xl">
          <label className="text-[8px] text-gray-500 font-mono uppercase tracking-wider">Select Claim Period Engine Routine</label>
          <select 
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
            className="bg-[#1a1e26] border border-gray-800 rounded-lg px-2.5 py-1 text-xs font-mono text-gray-200 outline-none focus:border-cyan-500/50 appearance-none w-full"
          >
            <option value={30}>Every 30 Days Routine (60.76% ROI Optimization)</option>
            <option value={60}>Every 60 Days Routine (63.70% ROI Optimization)</option>
            <option value={90}>Every 90 Days Routine (69.00% ROI Optimization)</option>
          </select>
        </div>

      </div>

      {/* 📦 EXPANDED RUNWAY GRID SYSTEM */}
      <div className="grid grid-cols-2 gap-3 pb-4 pt-1.5 pr-0.5">
        {hardcodedRigs.map((rig, index) => {
          const totalYieldUsdc = rig.priceUsdc * (roiPercentage / 100);
          const dailyYieldUsdc = totalYieldUsdc / selectedDuration;

          // 🌟 THE STOREFRONT LOCK LOGIC: Does the user already own this tier?
          // (Requires ownedCoils to be passed from App.jsx as instructed in the previous step)
          const isOwned = ownedCoils && ownedCoils.some(coil => coil.name === rig.name);

          return (
            <div 
              key={rig.id}
              ref={index === 0 ? firstCardRef : null}
              // 🔒 FIXED: If owned, the click action does absolutely nothing.
              onClick={() => isOwned ? null : onSelectMachine({ ...rig, leaseDays: selectedDuration })}
              // 🔒 FIXED: Applies grayed-out styling and disabled cursor if owned
              className={`border rounded-xl p-3 flex flex-col justify-between items-center relative transition-all group shadow-md ${
                isOwned 
                  ? 'bg-[#0d0f13] border-gray-950 cursor-not-allowed opacity-80' 
                  : 'bg-[#15171e] border-gray-900 active:scale-[0.98] hover:border-gray-800 cursor-pointer'
              }`}
            >
              {/* Massive premium icon frame block preserved */}
              <div className={`w-full h-24 my-1.5 rounded-xl flex items-center justify-center text-4xl shadow-inner border ${
                isOwned ? 'bg-[#12141a] border-gray-950 opacity-60' : 'bg-[#1a1d26] border-gray-950'
              }`}>
                <span className={isOwned ? 'grayscale' : ''}>{rig.icon}</span>
              </div>

              {/* Spacious spacing configuration layout */}
              <div className="text-center w-full space-y-1 mt-0.5 mb-1.5">
                <h4 className={`text-xs font-bold font-mono transition-colors ${
                  isOwned ? 'text-gray-500' : 'text-gray-200 group-hover:text-cyan-400'
                }`}>
                  {rig.name}
                </h4>
                
                <div className="bg-[#0e1014] rounded-md py-1 px-2 border border-gray-950">
                  <p className="text-[8px] text-gray-500 font-mono uppercase tracking-tight">Daily Yield</p>
                  <p className={`text-[10px] font-mono font-bold tracking-tight ${
                    isOwned ? 'text-gray-600' : 'text-blue-400'
                  }`}>
                    ${dailyYieldUsdc.toFixed(2)} USDC
                  </p>
                </div>
                
                {/* 🔒 THE OWNED BADGE VS THE PRICE BUTTON */}
                {isOwned ? (
                  <div className="w-full bg-[#0a0b0d] border border-gray-900 text-gray-600 text-[9px] font-mono font-bold py-1.5 rounded-lg mt-1 flex items-center justify-center tracking-widest uppercase">
                    🔒 Owned
                  </div>
                ) : (
                  <div className="w-full bg-[#1e2330] border border-gray-800 text-gray-200 text-[11px] font-mono font-bold py-1.5 rounded-lg mt-1">
                    ${rig.priceUsdc.toFixed(2)} USDC
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}