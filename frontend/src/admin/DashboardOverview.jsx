import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function DashboardOverview() {
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    activeMachines: 0, 
    totalTvl: 0,
    hardwareDistribution: [],
    expirations: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const config = { 
          headers: { 
            'Accept': 'application/json', 
            'x-admin-key': 'siberian_godmode_2026' 
          } 
        };

        // 🌟 Fetch both routes simultaneously
        const [usersRes, overviewRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin-panel/users', config),
          axios.get('http://localhost:5000/api/admin-panel/overview', config)
        ]);

        if (Array.isArray(usersRes.data) && overviewRes.data) {
          // Calculate TVL from the users array
          const totalTvl = usersRes.data.reduce((acc, user) => acc + (parseFloat(user.vault_balance) || 0), 0);
          
          setStats({ 
            totalUsers: overviewRes.data.totalUsers, 
            activeMachines: overviewRes.data.activeMachines, 
            totalTvl: totalTvl,
            hardwareDistribution: overviewRes.data.hardwareDistribution,
            expirations: overviewRes.data.expirations
          });
        }
      } catch (err) {
        console.error('🔻 [Admin Fetch Error]:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="text-cyan-500 font-mono text-sm animate-pulse p-6">SYNCING MASTER DASHBOARD...</div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 🚀 TOP ROW: MASTER METRICS */}
      <div className="grid grid-cols-3 gap-4 font-mono">
        <div className="bg-[#111318] border border-gray-900 rounded-2xl p-4 space-y-1 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">TOTAL SPENDING TVL</span>
          <h3 className="text-xl font-bold text-emerald-400">${stats.totalTvl.toFixed(2)} USDC</h3>
        </div>
        <div className="bg-[#111318] border border-gray-900 rounded-2xl p-4 space-y-1 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">REGISTERED OPERATORS</span>
          <h3 className="text-xl font-bold text-white">{stats.totalUsers} Profiles</h3>
        </div>
        <div className="bg-[#111318] border border-gray-900 rounded-2xl p-4 space-y-1 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">SYSTEM ACTIVE COILS</span>
          <h3 className="text-xl font-bold text-amber-400">{stats.activeMachines} Deployed</h3>
        </div>
      </div>

    </div>
  );
}