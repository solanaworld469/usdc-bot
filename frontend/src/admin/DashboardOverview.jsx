import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function DashboardOverview() {
  const [metrics, setMetrics] = useState({ totalUsers: 0, activeMachines: 0, totalTvl: 0 });

 useEffect(() => {
    axios.get('http://localhost:5000/api/admin-panel/users', {
      headers: { 'Accept': 'application/json', 'x-admin-key': 'siberian_godmode_2026' }
    })
      .then(res => {
        if (Array.isArray(res.data)) {
          const totalTvl = res.data.reduce((acc, user) => acc + (parseFloat(user.vault_balance) || 0), 0);
          setMetrics({ totalUsers: res.data.length, activeMachines: 0, totalTvl });
        }
      }).catch(err => console.error('🔻 [Admin Fetch Error]:', err));
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4 font-mono">
      <div className="bg-[#111318] border border-gray-900 rounded-2xl p-4 space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">TOTAL SPENDING TVL</span>
        <h3 className="text-xl font-bold text-cyan-400">${metrics.totalTvl.toFixed(2)} USDC</h3>
      </div>
      <div className="bg-[#111318] border border-gray-900 rounded-2xl p-4 space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">REGISTERED OPERATORS</span>
        <h3 className="text-xl font-bold text-white">{metrics.totalUsers} Profiles</h3>
      </div>
      <div className="bg-[#111318] border border-gray-900 rounded-2xl p-4 space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">SYSTEM ACTIVE COILS</span>
        <h3 className="text-xl font-bold text-amber-400">Loading Nodes...</h3>
      </div>
    </div>
  );
}