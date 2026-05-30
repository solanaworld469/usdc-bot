import React, { useState } from 'react';
import { getRoiPercentage } from './pricelist';

export default function MachineModal({ 
  machine, 
  userBalance, 
  onClose, 
  onOpenDeposit, 
  onConfirmPurchase,
  onSetErrorMessage 
}) {
  const [activationCode, setActivationCode] = useState('');
  const [showActivationGate, setShowActivationGate] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!machine) return null;

  const basePriceUsdc = parseFloat(machine.priceUsdc) || 0.00;
  const roiPercentage = getRoiPercentage(machine.leaseDays);

  // Math Metrics
  const totalYieldUsdc = basePriceUsdc * (1 + roiPercentage / 100);
  const dailyYieldUsdc = totalYieldUsdc / machine.leaseDays;
  
  // 1.5% Net Alloc Fee Computation
  const netAllocFee = basePriceUsdc * 0.015;
  const totalCostUsdc = basePriceUsdc + netAllocFee;

  const handleRentClick = () => {
    if (userBalance < totalCostUsdc || userBalance < 10.00) {
      onClose();       
      onOpenDeposit(); 
      if (onSetErrorMessage) {
        onSetErrorMessage(`Insufficient Balance! Your account must meet the required total cost ($${totalCostUsdc.toFixed(5)}) and the $10 minimum threshold.`);
      }
      return;
    }
    setShowActivationGate(true);
  };

  const handleVerifyAndDeploy = () => {
    if (activationCode.toUpperCase() === 'SOL-X9R2') {
      onConfirmPurchase(machine.id, machine.leaseDays);
    } else {
      setErrorMsg("Invalid network activation key signature.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#111318] border border-gray-900 rounded-3xl p-6 space-y-6 relative text-sm shadow-2xl">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-lg">✕</button>

        {!showActivationGate ? (
          <>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold tracking-wide text-white font-mono">{machine.name}</h3>
              <div className="w-full h-28 bg-[#161920] rounded-2xl flex items-center justify-center text-4xl border border-gray-900/60">
                {machine.icon}
              </div>
            </div>

            <div className="bg-[#161920] border border-gray-900 rounded-xl p-4 space-y-3 font-mono text-xs">
              {/* 🌟 Restructured To Match Your Visual Map Exactly */}
              <div className="flex justify-between">
                <span className="text-gray-500">Contract Lifecycle</span>
                <span className="text-white font-bold">1-Year Fixed Lease</span>
              </div>

              <div className="flex justify-between border-b border-gray-800/40 pb-2">
                <span className="text-gray-500">Claim Period</span>
                <span className="text-white font-bold">Every {machine.leaseDays} Days</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Daily yield</span>
                <span className="text-blue-400 font-bold">${dailyYieldUsdc.toFixed(4)} USDC</span>
              </div>
              
              <div className="flex justify-between border-b border-gray-800/40 pb-2">
                <span className="text-gray-500">Total yield</span>
                <span className="text-emerald-400 font-bold">${totalYieldUsdc.toFixed(4)} USDC</span>
              </div>
              
              <div className="flex justify-between pt-1">
                <span className="text-gray-500">Price</span>
                <span className="text-white font-bold">${basePriceUsdc.toFixed(2)} USDC</span>
              </div>

              <div className="flex justify-between border-b border-gray-800/40 pb-2">
                <span className="text-gray-500">Net Alloc Fee (1.5%)</span>
                <span className="text-amber-500 font-bold">${netAllocFee.toFixed(5)} USDC</span>
              </div>

              <div className="flex justify-between pt-1 items-center">
                <span className="text-gray-400">Total Cost</span>
                <span className="text-white font-bold text-sm">${totalCostUsdc.toFixed(5)} USDC</span>
              </div>
            </div>

            <button 
              onClick={handleRentClick}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3.5 rounded-xl font-bold tracking-wider uppercase text-xs active:scale-[0.99] transition-transform"
            >
              Rent Hardware — ${totalCostUsdc.toFixed(5)}
            </button>
          </>
        ) : (
          <div className="space-y-4 py-2">
            <div className="text-center space-y-1">
              <h3 className="text-amber-400 font-bold text-base flex items-center justify-center gap-1.5">⚠️ CORE INTERFACE LOCKED</h3>
              <p className="text-xs text-gray-400">Enter your 8-digit system node key to deploy network coils.</p>
            </div>

            {errorMsg && <p className="text-red-400 text-xs text-center font-mono animate-pulse">{errorMsg}</p>}

            <input 
              type="text"
              placeholder="ENTER SYSTEM SECRET KEY"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value)}
              className="w-full bg-[#161920] border border-gray-800 rounded-xl p-3 text-center uppercase font-mono tracking-widest text-white outline-none focus:border-cyan-500"
            />

            <div className="space-y-2">
              <button 
                onClick={handleVerifyAndDeploy}
                className="w-full bg-cyan-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider"
              >
                Verify & Initialize Rig
              </button>
              <button 
                onClick={() => setShowActivationGate(false)}
                className="w-full bg-transparent text-gray-500 py-2 rounded-xl text-xs font-semibold"
              >
                ← Back to Overview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}