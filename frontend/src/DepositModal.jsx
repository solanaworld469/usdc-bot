import React, { useState } from 'react';

// Data mapping out the coin list structure from Image 1
const COIN_LIST = [
  { id: 'TON', name: 'TON', icon: '💎', type: 'single' },
  { id: 'STARS', name: 'Telegram Stars', icon: '⭐', type: 'single' },
  { id: 'USDT', name: 'USDT', icon: '💵', type: 'multi', chains: ['TON', 'Tron (TRC20)', 'BNB Smart Chain (BEP20)', 'Solana', 'Ethereum (ERC20)', 'Polygon POS'] },
  { id: 'USDC', name: 'USDC', icon: '🪙', type: 'multi', chains: ['Solana', 'Ethereum (ERC20)', 'BNB Smart Chain (BEP20)', 'Polygon POS'] },
  { id: 'TRX', name: 'TRX', icon: '🔺', type: 'single' },
  { id: 'SOL', name: 'SOL', icon: '☀️', type: 'single' },
  { id: 'BNB', name: 'BNB', icon: '🔶', type: 'single' },
  { id: 'POL', name: 'POL', icon: '🟪', type: 'single' },
  { id: 'ETH', name: 'ETH', icon: '🔷', type: 'single' },
  { id: 'BTC', name: 'Bitcoin', icon: '₿', type: 'single' }
];

export default function DepositModal({ onClose }) {
  const [currentScreen, setCurrentScreen] = useState('coins'); // 'coins' | 'chains' | 'invoice'
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [selectedChain, setSelectedChain] = useState('');

  const handleCoinSelect = (coin) => {
    setSelectedCoin(coin);
    if (coin.type === 'multi') {
      setCurrentScreen('chains');
    } else {
      setSelectedChain(coin.id); // Single-chain coins use their own name as the chain
      setCurrentScreen('invoice');
    }
  };

  return (
    // 🌍 FIXED OUTER BACKDROP: Changed items-end to items-center for full mobile centering
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      
      {/* 📦 INNER CONTENT CONTAINER BOX */}
      <div className="w-full max-w-sm bg-[#111318] border border-gray-900 rounded-3xl p-5 space-y-4 animate-slideUp relative text-sm max-h-[85vh] overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
        
        {/* HEADER AREA WITH DYNAMIC BACK ARROW */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-900/60">
          <div className="flex items-center space-x-2">
            {currentScreen !== 'coins' && (
              <button 
                onClick={() => setCurrentScreen('coins')}
                className="text-gray-400 hover:text-white pr-2 text-base font-bold font-mono transition-colors"
              >
                ←
              </button>
            )}
            <h3 className="text-xs font-bold tracking-wide text-gray-400 font-mono uppercase">
              {currentScreen === 'coins' && 'Select Payment Method:'}
              {currentScreen === 'chains' && 'Select Chain:'}
              {currentScreen === 'invoice' && 'Payment Invoice Generated'}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-sm transition-colors">✕</button>
        </div>

        {/* SCREEN 1: THE MAIN COIN SELECTION MENU */}
        {currentScreen === 'coins' && (
          <div className="space-y-2.5 pt-1">
            {/* Premium primary payment methods rows */}
            {COIN_LIST.slice(0, 2).map((coin) => (
              <button
                key={coin.id}
                onClick={() => handleCoinSelect(coin)}
                className="w-full bg-[#161920] border border-gray-800/80 hover:border-gray-700 p-3.5 rounded-xl flex items-center justify-between group active:scale-[0.99] transition-all"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{coin.icon}</span>
                  <span className="font-bold text-gray-200 font-mono text-xs tracking-wide">{coin.name}</span>
                </div>
                <span className="text-gray-600 group-hover:text-cyan-400 font-mono text-sm transition-colors">›</span>
              </button>
            ))}

            {/* Split 2-column layout grid for alternative tokens */}
            <div className="grid grid-cols-2 gap-2.5">
              {COIN_LIST.slice(2).map((coin) => (
                <button
                  key={coin.id}
                  onClick={() => handleCoinSelect(coin)}
                  className="bg-[#161920] border border-gray-800/80 hover:border-gray-700 p-3 rounded-xl flex items-center justify-between group active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-lg">{coin.icon}</span>
                    <span className="font-bold text-[11px] font-mono text-gray-300 tracking-tight">{coin.name}</span>
                  </div>
                  <span className="text-gray-600 group-hover:text-cyan-400 font-mono text-xs transition-colors">›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN 2: DYNAMIC CHAIN SELECTION SECTOR */}
        {currentScreen === 'chains' && selectedCoin && (
          <div className="space-y-2 pt-1">
            {selectedCoin.chains.map((chain) => (
              <button
                key={chain}
                onClick={() => {
                  setSelectedChain(chain);
                  setCurrentScreen('invoice');
                }}
                className="w-full bg-[#161920] border border-gray-800/80 hover:border-gray-700 p-3.5 rounded-xl flex items-center justify-between group active:scale-[0.99] transition-all"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-base">{selectedCoin.icon}</span>
                  <span className="font-semibold text-gray-200 text-xs font-mono">{chain}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-gray-500 group-hover:text-cyan-400 uppercase tracking-wider transition-colors">
                  {selectedCoin.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* SCREEN 3: FINAL DEPOSIT LINK/QR LAYER */}
        {currentScreen === 'invoice' && selectedCoin && (
          <div className="space-y-4 py-1 text-center animate-fadeIn font-mono">
            <div className="space-y-1">
              <span className="text-3xl block">{selectedCoin.icon}</span>
              <h4 className="font-bold text-sm text-gray-200">Send Payment Funds</h4>
              <p className="text-[10px] text-cyan-400 tracking-wide uppercase">Network Cluster: {selectedChain}</p>
            </div>

            {/* Invoice Address Content Canvas Box */}
            <div className="bg-[#161920] border border-gray-900 rounded-xl p-4 space-y-4 shadow-inner">
              <div className="w-28 h-28 bg-white mx-auto rounded-lg flex items-center justify-center shadow-lg p-2">
                <div className="text-black text-[9px] font-bold text-center leading-tight">
                  [ SCAN QR CODE TO DEPOSIT ]
                </div>
              </div>
              
              <div className="space-y-1.5 text-left">
                <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Gateway Target Address:</p>
                <div className="bg-[#111318] border border-gray-800 rounded-lg p-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-gray-300 truncate pr-2 text-xs">0x9R2_USDC_PAYMENT_NODE_FLOW</span>
                  <button 
                    onClick={() => alert('Secure payment destination copied to clipboard.')}
                    className="bg-cyan-600/20 text-cyan-400 border border-cyan-800/30 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wide active:scale-95 transition-all"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-gray-500 leading-normal">
              ⏳ Secure node tracking link active. Complete your transaction block before closure.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}