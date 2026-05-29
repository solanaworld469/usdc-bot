import React from 'react';

export default function ErrorModal({ message, onClose }) {
  if (!message) return null;

  return (
    // 🌍 OUTER VIEWPORT LAYER: Handles the backdrop blur and centers the card
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1000] flex items-center justify-center p-6 animate-fadeIn">
      
      {/* 📦 THE FOCUSED ERROR CARD FRAME */}
      <div className="w-full max-w-sm bg-[#111318] border border-gray-900 rounded-2xl p-6 relative shadow-2xl space-y-6 text-center border-l-4 border-l-red-500">
        
        {/* WARNING ICON GROUP */}
        <div className="mx-auto w-16 h-16 rounded-full bg-red-950/50 flex items-center justify-center border border-red-900/50">
          <span className="text-3xl text-red-400">⚠️</span>
        </div>

        {/* ERROR TEXT CORE */}
        <div className="space-y-1.5">
          <h2 className="text-sm font-bold text-gray-100 uppercase tracking-widest font-mono">
            Operational Block
          </h2>
          <p className="text-xs text-gray-400 font-medium leading-relaxed font-mono px-2">
            {message}
          </p>
        </div>

        {/* ACKNOWLEDGE BUTTON */}
        <button 
          onClick={onClose}
          className="w-full bg-[#1e2330] hover:bg-[#2a2f3d] text-gray-200 py-3 rounded-lg font-bold text-xs uppercase tracking-wider border border-gray-800 transition-colors"
        >
          Acknowledge
        </button>

      </div>
    </div>
  );
}