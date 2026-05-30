import React, { useState, useEffect, useRef } from 'react';
import { hardcodedRigs, getRoiPercentage } from './pricelist';

export default function HardwareTab({ onSelectMachine }) {
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
          const totalYieldUsdc = rig.priceUsdc * (1 + roiPercentage / 100);
          const dailyYieldUsdc = totalYieldUsdc / selectedDuration;

          return (
            <div 
              key={rig.id}
              ref={index === 0 ? firstCardRef : null}
              onClick={() => onSelectMachine({ ...rig, leaseDays: selectedDuration })}
              className="bg-[#15171e] border border-gray-900 rounded-xl p-3 flex flex-col justify-between items-center relative active:scale-[0.98] transition-all hover:border-gray-800 group shadow-md cursor-pointer"
            >
              {/* Massive premium icon frame block preserved */}
              <div className="w-full h-24 my-1.5 bg-[#1a1d26] rounded-xl flex items-center justify-center text-4xl shadow-inner border border-gray-950">
                {rig.icon}
              </div>

              {/* Spacious spacing configuration layout */}
              <div className="text-center w-full space-y-1 mt-0.5 mb-1.5">
                <h4 className="text-xs font-bold font-mono text-gray-200 group-hover:text-cyan-400 transition-colors">{rig.name}</h4>
                
                <div className="bg-[#0e1014] rounded-md py-1 px-2 border border-gray-950">
                  <p className="text-[8px] text-gray-500 font-mono uppercase tracking-tight">Daily Yield</p>
                  <p className="text-[10px] text-blue-400 font-mono font-bold tracking-tight">${dailyYieldUsdc.toFixed(4)} USDC</p>
                </div>
                
                <div className="w-full bg-[#1e2330] border border-gray-800 text-gray-200 text-[11px] font-mono font-bold py-1.5 rounded-lg mt-1">
                  ${rig.priceUsdc.toFixed(2)} USDC
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}