import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function MachineMonitor() {
  const [machinesList, setMachinesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/admin/console?tab=user_machines', {
      headers: { 'Accept': 'application/json', 'x-admin-key': 'siberian_godmode_2026' }
    })
      .then(res => {
        setMachinesList(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      }).catch(err => {
        console.error('🔻 [Admin Fetch Error]:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-xs text-red-400 py-4 animate-pulse">SYNCING DISTRIBUTED RUNTOMES...</div>;

  return (
    <div className="bg-[#111318] border border-gray-900 rounded-xl overflow-hidden">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-[#161925] border-b border-gray-900 text-gray-500 text-[10px] uppercase">
            <th className="p-3">Machine ID Instance</th>
            <th className="p-3">Operator ID Reference</th>
            <th className="p-3">Hardware Tier</th>
            <th className="p-3">Expirations Timeline</th>
          </tr>
        </thead>
        <tbody>
          {machinesList.map((m) => (
            <tr key={m.id} className="border-b border-gray-900/50 hover:bg-[#151722] transition-colors">
              <td className="p-3 text-gray-500 select-text text-[11px]">{m.id}</td>
              <td className="p-3 text-white font-bold select-text">{m.user_id}</td>
              <td className="p-3 text-cyan-400 font-bold">{m.machine_tier}</td>
              <td className="p-3 text-gray-400">{new Date(m.expires_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}