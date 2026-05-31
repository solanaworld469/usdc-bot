import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function UsersDirectory() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/admin-panel/users', {
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

  if (loading) return <div className="text-xs text-red-400 py-4 animate-pulse font-mono">QUERYING LIVE DATA...</div>;

  return (
    <div className="bg-[#111318] border border-gray-900 rounded-xl overflow-hidden font-mono text-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#161925] border-b border-gray-900 text-gray-500 text-[10px] uppercase">
            <th className="p-3">Telegram ID / User</th>
            <th className="p-3">Vault Balance</th>
            <th className="p-3">Live Runtime Track</th>
            <th className="p-3">Accrued Mining Output</th>
            <th className="p-3">Accrued Leakage Penalty</th>
          </tr>
        </thead>
        <tbody>
          {usersList.map((u) => (
            <tr key={u.telegram_id} className="border-b border-gray-900/50 hover:bg-[#151722] transition-colors">
              <td className="p-3">
                <div className="font-bold text-white">@{u.username || 'unknown'}</div>
                <div className="text-[10px] text-gray-500">{u.telegram_id}</div>
              </td>
              <td className="p-3 text-amber-400 font-bold">${parseFloat(u.vault_balance).toFixed(2)} USDC</td>
              <td className="p-3 text-cyan-400 font-semibold">{u.live_runtime || "0h 0m 0s"}</td>
              <td className="p-3">
                <div className="text-emerald-400 font-bold">+{u.mined_ucredits} uC</div>
                <div className="text-gray-500 text-[10px]">≈ ${u.mined_usdc} USDC</div>
              </td>
              <td className="p-3">
                <div className="text-red-500 font-bold">-{u.leakage_ucredits} uC</div>
                <div className="text-gray-500 text-[10px]">≈ ${u.leakage_usdc} USDC</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}