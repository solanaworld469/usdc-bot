import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function MachineMonitor() {
  const [machinesList, setMachinesList] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [expirations, setExpirations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        const config = { headers: { 'Accept': 'application/json', 'x-admin-key': 'siberian_godmode_2026' } };
        // 🌟 Pulls both the individual machines AND the high-level radar stats
        const [machinesRes, overviewRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin-panel/machines', config),
          axios.get('http://localhost:5000/api/admin-panel/overview', config)
        ]);
        
        setMachinesList(Array.isArray(machinesRes.data) ? machinesRes.data : []);
        if (overviewRes.data) {
          setDistribution(overviewRes.data.hardwareDistribution || []);
          setExpirations(overviewRes.data.expirations || []);
        }
      } catch (err) {
        console.error('🔻 [Fleet Fetch Error]:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFleetData();
  }, []);

  if (loading) return <div className="text-xs text-cyan-400 py-4 animate-pulse font-mono">SYNCING FLEET PROTOCOLS...</div>;

  return (
    <div className="space-y-6 font-mono animate-fadeIn">

      {/* 🗄️ BOTTOM ROW: THE RAW FLEET LEDGER */}
      <div className="bg-[#111318] border border-gray-900 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-gray-900 bg-[#161925]">
           <h3 className="text-white font-bold text-xs uppercase tracking-wider">⚙️ Active Mining Fleet (All Users)</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#161925] border-b border-gray-900 text-gray-500 text-[10px] uppercase">
                  <th className="p-3 whitespace-nowrap">Machine ID Instance</th>
                  <th className="p-3 whitespace-nowrap">Operator ID</th>
                  <th className="p-3 whitespace-nowrap">Hardware Tier</th>
                  <th className="p-3 whitespace-nowrap">Deployed</th>
                  <th className="p-3 whitespace-nowrap">Expirations Timeline</th>
                </tr>
              </thead>
              <tbody>
                {machinesList.map((m) => (
                  <tr key={m.id} className="border-b border-gray-900/50 hover:bg-[#151722] transition-colors">
                    {/* Truncated ID so it doesn't stretch your table design */}
                    <td className="p-3 text-gray-500 select-text text-[10px]">{m.id.substring(0, 8)}...</td>
                    <td className="p-3 text-white font-bold select-text">{m.user_id}</td>
                    <td className="p-3 text-cyan-400 font-bold">{m.machine_tier}</td>
                    <td className="p-3 text-gray-400">{new Date(m.purchased_at).toLocaleDateString()}</td>
                    <td className="p-3 text-red-400/80 font-bold">{new Date(m.expires_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {machinesList.length === 0 && (
                    <tr><td colSpan="5" className="p-6 text-center text-gray-600">No active fleet detected.</td></tr>
                )}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}