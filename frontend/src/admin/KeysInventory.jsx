import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function KeysInventory() {
  const [keysList, setKeysList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/admin-panel/keys', {
      headers: { 'Accept': 'application/json', 'x-admin-key': 'siberian_godmode_2026' }
    })
      .then(res => {
        setKeysList(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      }).catch(err => {
        console.error('🔻 [Admin Fetch Error]:', err);
        setLoading(false);
      });
  }, []);

  // Combined Search and Status filter engine logic
  const filteredKeys = keysList.filter(k => {
    const matchesSearch = k.key_signature.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (k.owner_id && k.owner_id.includes(searchQuery));
    const matchesStatus = statusFilter === 'ALL' || k.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="text-xs text-red-400 py-4 animate-pulse">READING VAULT KEY RECORDS...</div>;

  return (
    <div className="space-y-4">
      {/* FILTRATION DOCK OVERLAY BAR */}
      <div className="flex gap-3 bg-[#111318] p-3 border border-gray-900 rounded-xl items-center">
        <input 
          type="text" 
          placeholder="SEARCH KEY SIGNATURE / OWNER ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-[#161920] border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-red-500/50 flex-grow"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#161920] border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-300 outline-none focus:border-red-500/50"
        >
          <option value="ALL">ALL STATES</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="SOLD">SOLD</option>
          <option value="ACTIVE">ACTIVE</option>
        </select>
      </div>

      {/* RENDER TABLE GRID CONTAINER CONTAINER */}
      <div className="bg-[#111318] border border-gray-900 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#161925] border-b border-gray-900 text-gray-500 text-[10px] uppercase">
              <th className="p-3">ID</th>
              <th className="p-3">Key Token Signature</th>
              <th className="p-3">Owner Telegram ID</th>
              <th className="p-3">Status Badge</th>
            </tr>
          </thead>
          <tbody>
            {filteredKeys.slice(0, 100).map((k) => (
              <tr key={k.id} className="border-b border-gray-900/50 hover:bg-[#151722] transition-colors">
                <td className="p-3 text-gray-600">{String(k.id).padStart(4, '0')}</td>
                <td className="p-3 font-bold text-gray-200 tracking-wider select-text">{k.key_signature}</td>
                <td className="p-3 text-cyan-400 select-text">{k.owner_id || '---'}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    k.status === 'AVAILABLE' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' :
                    k.status === 'SOLD' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30' :
                    'bg-red-950/40 text-red-400 border border-red-900/30'
                  }`}>
                    {k.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}