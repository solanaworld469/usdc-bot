import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function UsersDirectory() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/admin/console?tab=users', {
      headers: { 'Accept': 'application/json', 'x-admin-key': 'siberian_godmode_2026' }
    })
      .then(res => {
        setUsersList(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      }).catch(err => {
        console.error('🔻 [Admin Fetch Error]:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-xs text-red-400 py-4 animate-pulse">QUERYING USER INDEX SCHEMAS...</div>;

  return (
    <div className="bg-[#111318] border border-gray-900 rounded-xl overflow-hidden">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-[#161925] border-b border-gray-900 text-gray-500 text-[10px] uppercase">
            <th className="p-3">Telegram ID</th>
            <th className="p-3">Username handle</th>
            <th className="p-3">Vault Balance</th>
            <th className="p-3">Rank Class</th>
          </tr>
        </thead>
        <tbody>
          {usersList.map((u) => (
            <tr key={u.telegram_id} className="border-b border-gray-900/50 hover:bg-[#151722] transition-colors">
              <td className="p-3 font-bold text-gray-400 select-text">{u.telegram_id}</td>
              <td className="p-3 text-white select-text">@{u.username || 'unknown'}</td>
              <td className="p-3 text-amber-400 font-bold">${parseFloat(u.vault_balance).toFixed(4)} USDC</td>
              <td className="p-3 text-cyan-400 font-semibold">{u.operator_rank}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}