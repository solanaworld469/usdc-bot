import React, { useState } from 'react';
import { hardcodedRigs, getRoiPercentage } from './pricelist';

export default function HardwareTab({ onSelectMachine }) {
  const [selectedDuration, setSelectedDuration] = useState(30);
  const roiPercentage = getRoiPercentage(selectedDuration);

  return (
    <div className="w-full flex flex-col p-4 space-y-4 animate-fadeIn pb-24 select-none">
      
      {/* HEADER SECTION */}
      <div className="border-b border-gray-900 pb-2">
        <h2 className="text-lg font-bold tracking-wide text-cyan-400 font-mono">🛒 Cloud Storefront</h2>
        <p className="text-[10px] text-gray-500 uppercase font-medium">Lease Processing Coils & Rigs</p>
      </div>

      {/* DURATION SELECTOR */}
      <div className="flex flex-col space-y-1 bg-[#111317] p-3 border border-gray-900 rounded-xl">
        <label className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">Select Lease Duration Contract</label>
        <select 
          value={selectedDuration}
          onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
          className="bg-[#1a1e26] border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-200 outline-none focus:border-cyan-500/50 appearance-none w-full"
        >
          <option value={30}>1 Month Contract (30 Days Plan)</option>
          <option value={60}>2 Month Contract (60 Days Plan)</option>
          <option value={90}>3 Month Contract (90 Days Plan)</option>
        </select>
      </div>

      {/* 📦 THE 2-COLUMN PREMIUM GRID SYSTEM (Scrollbar Hidden) */}
      <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[62vh] pr-0 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {hardcodedRigs.map((rig) => {
          const totalYieldUsdc = rig.priceUsdc * (1 + roiPercentage / 100);
          const dailyYieldUsdc = totalYieldUsdc / selectedDuration;

          return (
            <div 
              key={rig.id}
              onClick={() => onSelectMachine({ ...rig, leaseDays: selectedDuration })}
              className="bg-[#15171e] border border-gray-900 rounded-xl p-3 flex flex-col justify-between items-center relative active:scale-[0.98] transition-all hover:border-gray-800 group shadow-md"
            >
              <div className="w-full h-24 my-2 bg-[#1a1d26] rounded-xl flex items-center justify-center text-4xl shadow-inner border border-gray-950">
                {rig.icon}
              </div>

              <div className="text-center w-full space-y-1">
                <h4 className="text-xs font-bold font-mono text-gray-200 group-hover:text-cyan-400 transition-colors">{rig.name}</h4>
                
                {/* 💵 Changed from uCredits to Clean Dollar Display */}
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