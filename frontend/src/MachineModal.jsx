import React, { useState } from 'react';
import axios from 'axios';
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
  const [successMsg, setSuccessMsg] = useState(''); 
  const [isProcessing, setIsProcessing] = useState(false);

  if (!machine) return null;

  const roiPercentage = getRoiPercentage(machine.leaseDays);
  const basePriceUsdc = parseFloat(machine.priceUsdc);

  if (isNaN(basePriceUsdc) || basePriceUsdc <= 0) {
    throw new Error("pricing data corrupted Message Support");
  }

  // 🌟 FIXED MATH: Calculates daily yield, then projects it across the 180-day lifespan
  const cycleYieldUsdc = basePriceUsdc * (roiPercentage / 100);
  const dailyYieldUsdc = cycleYieldUsdc / machine.leaseDays;
  const totalYieldUsdc = dailyYieldUsdc * 180; 
  
  const netAllocFee = basePriceUsdc * 0.015;
  const totalCostUsdc = basePriceUsdc + netAllocFee;

  const handleRentClick = () => {
    if (userBalance < totalCostUsdc || userBalance < 10.00) {
      onClose();       
      onOpenDeposit(); 
      if (onSetErrorMessage) {
        onSetErrorMessage(`Insufficient Balance! Your account must meet the required total cost ($${totalCostUsdc.toFixed(2)}) and the $10 minimum threshold.`);
      }
      return;
    }
    setShowActivationGate(true);
  };

  const handleVerifyAndDeploy = async () => {
    if (!activationCode.trim()) {
      setErrorMsg("Please enter an activation key.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(''); 

    try {
      await onConfirmPurchase(machine.id, machine.leaseDays, activationCode.trim().toUpperCase());
      setSuccessMsg("Hardware deployed. Core ignition sequence ready.");
    } catch (err) {
      setErrorMsg('Invalid network activation key signature. Check and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className={`w-full max-w-sm bg-[#111318] border rounded-3xl p-6 relative text-sm shadow-2xl transition-all ${successMsg ? 'border-emerald-900/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-gray-900'}`}>
        
        {!successMsg && <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-lg transition-colors">✕</button>}

        {successMsg ? (
          <div className="text-center space-y-5 py-4 animate-slideUp">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-950/40 flex items-center justify-center border border-emerald-900/50">
              <span className="text-3xl text-emerald-400">✅</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-widest font-mono">
                Deployment Successful
              </h3>
              <p className="text-xs text-gray-300 font-mono px-2 leading-relaxed">
                {successMsg}
              </p>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-[#161920] hover:bg-[#1c1f29] border border-emerald-900/50 text-emerald-400 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider mt-4 transition-colors"
            >
              Acknowledge & Sync Grid
            </button>
          </div>
        ) : !showActivationGate ? (
          
          // 🌟 STAGE 1: OVERVIEW (Your specific layout)
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold tracking-wide text-white font-mono">{machine.name}</h3>
              <div className="w-full h-28 bg-[#161920] rounded-2xl flex items-center justify-center text-4xl border border-gray-900/60 shadow-inner">
                {machine.icon}
              </div>
            </div>

            <div className="bg-[#161920] border border-gray-900 rounded-xl p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Contract Lifecycle</span>
                <span className="text-red-400 font-bold">180 Days (6 Months)</span>
              </div>

              <div className="flex justify-between border-b border-gray-800/40 pb-2">
                <span className="text-gray-500">Claim Period</span>
                <span className="text-white font-bold">Every {machine.leaseDays} Days</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Daily yield</span>
                <span className="text-blue-400 font-bold">${dailyYieldUsdc.toFixed(2)} USDC</span>
              </div>
              
              <div className="flex justify-between border-b border-gray-800/40 pb-2">
                <span className="text-gray-500">Total yield</span>
                <span className="text-emerald-400 font-bold">${totalYieldUsdc.toFixed(2)} USDC</span>
              </div>
              
              <div className="flex justify-between pt-1">
                <span className="text-gray-500">Price</span>
                <span className="text-white font-bold">${basePriceUsdc.toFixed(2)} USDC</span>
              </div>

              <div className="flex justify-between border-b border-gray-800/40 pb-2">
                <span className="text-gray-500">Net Alloc Fee (1.5%)</span>
                <span className="text-amber-500 font-bold">${netAllocFee.toFixed(2)} USDC</span>
              </div>

              <div className="flex justify-between pt-1 items-center">
                <span className="text-gray-400">Total Cost</span>
                <span className="text-white font-bold text-sm">${totalCostUsdc.toFixed(2)} USDC</span>
              </div>
            </div>

            <button 
              onClick={handleRentClick}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-3.5 rounded-xl font-bold tracking-wider uppercase text-xs active:scale-[0.99] transition-all"
            >
              Rent Hardware — ${totalCostUsdc.toFixed(2)}
            </button>
          </div>
        ) : (
          
          // STAGE 2: KEY ENTRY
          <div className="space-y-5 py-2">
            <div className="text-center space-y-1 border-b border-gray-900/60 pb-4">
              <h3 className="text-amber-400 font-bold text-base flex items-center justify-center gap-1.5 font-mono">⚠️ CORE INTERFACE LOCKED</h3>
              <p className="text-xs text-gray-400 font-mono">Enter your 8-digit system node key to deploy network coils.</p>
            </div>

            {errorMsg && (
              <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3">
                <p className="text-red-400 text-xs text-center font-mono animate-pulse">{errorMsg}</p>
              </div>
            )}

            <input 
              type="text"
              placeholder="ENTER SYSTEM SECRET KEY"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value)}
              className="w-full bg-[#161920] border border-gray-800 rounded-xl p-3.5 text-center uppercase font-mono tracking-[0.2em] text-white outline-none focus:border-cyan-500 transition-colors"
            />

            <div className="space-y-2 pt-2">
              <button 
                onClick={handleVerifyAndDeploy}
                disabled={isProcessing}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-colors"
              >
                {isProcessing ? 'INITIALIZING BLOCK...' : 'Verify & Initialize Rig'}
              </button>
              <button 
                onClick={() => setShowActivationGate(false)}
                className="w-full bg-transparent text-gray-500 hover:text-gray-300 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide transition-colors"
              >
                ← Cancel & Return
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}