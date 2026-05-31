import React, { useState } from 'react';
import DashboardOverview from './DashboardOverview';
import UsersDirectory from './UsersDirectory';
import KeysInventory from './KeysInventory';
import MachineMonitor from './MachineMonitor';

export default function AdminTabRouter() {
  const [currentAdminView, setCurrentAdminView] = useState('overview');

  const ADMIN_SUB_TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'users', label: '👤 Users' },
    { id: 'keys', label: '🔑 Keys Vault' },
    { id: 'fleet', label: '⚙️ Fleet Monitor' }
  ];

  return (
    <div className="w-full flex flex-col p-6 space-y-5 text-sm bg-[#0a0b0d] min-h-screen text-gray-200 font-mono">
      
      {/* HEADER MATRIX BANNER */}
      <div className="border-b border-red-900/30 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold tracking-wide text-red-500">ROOT ADMIN HQ</h2>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Modular Fleet Cluster Controller Portal</span>
        </div>
        <span className="bg-red-950/40 border border-red-900/50 text-red-400 font-bold px-3 py-1 rounded text-[10px] tracking-widest uppercase animate-pulse">
          SECURE CONNECTION
        </span>
      </div>

      {/* TRACK CONTROLLER SUB-NAVIGATION GRID */}
      <div className="grid grid-cols-4 gap-2 bg-[#111318] p-1.5 border border-gray-900 rounded-xl max-w-2xl">
        {ADMIN_SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentAdminView(tab.id)}
            className={`py-2 rounded-lg text-xs font-bold uppercase transition-all tracking-wider ${
              currentAdminView === tab.id
                ? 'bg-red-950/50 border border-red-900/50 text-red-400 shadow-lg'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DYNAMIC VIEW ROUTER MOUNT VIEWPORT */}
      <div className="flex-grow pt-2">
        {currentAdminView === 'overview' && <DashboardOverview />}
        {currentAdminView === 'users' && <UsersDirectory />}
        {currentAdminView === 'keys' && <KeysInventory />}
        {currentAdminView === 'fleet' && <MachineMonitor />}
      </div>

    </div>
  );
}