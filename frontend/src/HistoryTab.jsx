import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function HistoryTab() {
  // INTERNAL TRANSACTION LOGIC STATE ENGINE
  const [historyRecords, setHistoryRecords] = useState([]); 
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1); // Defaults to current month (5 for May)
  const [filterStatus, setFilterStatus] = useState('ALL'); 

  // Master array containing all 12 operational grid periods
  const MONTHS = [
    { value: 1, name: 'January 2026' },
    { value: 2, name: 'February 2026' },
    { value: 3, name: 'March 2026' },
    { value: 4, name: 'April 2026' },
    { value: 5, name: 'May 2026' },
    { value: 6, name: 'June 2026' },
    { value: 7, name: 'July 2026' },
    { value: 8, name: 'August 2026' },
    { value: 9, name: 'September 2026' },
    { value: 10, name: 'October 2026' },
    { value: 11, name: 'November 2026' },
    { value: 12, name: 'December 2026' }
  ];

  /**
   * 📡 LIVE DATABASE SYNCHRONIZATION HOOK
   * Automatically re-queries your port 5000 server whenever the filters shift
   */
  useEffect(() => {
    const fetchLiveLedgerData = async () => {
      try {
        const mockAuthHeader = "Bearer 999999999"; // Developer test token
        const targetYear = 2026;

        // Query the history API endpoint passing dynamic query parameters
        const response = await axios.get('http://localhost:5000/api/history/ledger', {
          headers: { Authorization: mockAuthHeader },
          params: {
            month: filterMonth,
            year: targetYear,
            status: filterStatus
          }
        });

        // Hydrate local layout state with fresh array entries from PostgreSQL
        setHistoryRecords(response.data.ledger || []);
      } catch (err) {
        console.error('🔻 [Ledger Sync Fault]: Failed to fetch database history entries:', err.message);
      }
    };

    fetchLiveLedgerData();
  }, [filterMonth, filterStatus]); // Re-run effect instantly when dropdown or tabs shift

  return (
    <div className="w-full flex flex-col p-4 space-y-4 animate-fadeIn">
      <div className="border-b border-gray-900 pb-2">
        <h2 className="text-lg font-bold tracking-wide text-cyan-400 font-mono">📊 Transaction History</h2>
        <p className="text-[10px] text-gray-500 uppercase font-medium">Internal Operational Audit Logs</p>
      </div>

      {/* DUAL CONTROLLER FILTER HOOKS */}
      <div className="flex flex-col space-y-3 bg-[#111317] p-3 border border-gray-900 rounded-xl">
        <div className="flex flex-col space-y-1">
          <label className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">Select Ledger Month</label>
          <select 
            value={filterMonth}
            onChange={(e) => setFilterMonth(parseInt(e.target.value))}
            className="bg-[#1a1e26] border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-200 outline-none focus:border-cyan-500/50 appearance-none w-full"
            style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '16px' }}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value} className="bg-[#0a0b0d]">{m.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">Filter By Status</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'ALL', label: 'All Logs', activeClass: 'bg-cyan-950/40 border-cyan-500 text-cyan-400' },
              { id: 'PENDING', label: 'Pending', activeClass: 'bg-amber-950/40 border-amber-500 text-amber-400' },
              { id: 'COMPLETED', label: 'Completed', activeClass: 'bg-emerald-950/40 border-emerald-500 text-emerald-400' },
              { id: 'EXPIRED', label: 'Expired', activeClass: 'bg-red-950/40 border-red-500 text-red-400' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilterStatus(btn.id)}
                className={`text-[9px] font-bold uppercase tracking-tight py-1.5 rounded-md border transition-all ${
                  filterStatus === btn.id 
                    ? btn.activeClass 
                    : 'bg-[#1a1e26] border-gray-800 text-gray-500 hover:text-gray-300'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DATA STREAM RENDER PLATFORM */}
      <div className="space-y-2 flex-grow overflow-y-auto max-h-[50vh] pr-1">
        {historyRecords.length === 0 ? (
          <div className="bg-[#111317]/40 border border-dashed border-gray-900 rounded-xl py-12 px-4 text-center space-y-2">
            <div className="text-2xl opacity-40">🕳️</div>
            <h4 className="text-xs font-bold text-gray-500 font-mono uppercase tracking-wide">No Records Located</h4>
            <p className="text-[10px] text-gray-600 max-w-[200px] mx-auto">No ledger activities matches this selection profile inside this system block.</p>
          </div>
        ) : (
          historyRecords.map((record) => (
            <div key={record.id} className="bg-[#111317] border border-gray-900/80 rounded-xl p-3 flex items-center justify-between font-mono">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#1a1e26] flex items-center justify-center text-xs border border-gray-800">
                  {record.category === 'CLAIM_MINED' && '⛏️'}
                  {record.category === 'UNMINED_LOSS' && '🔻'}
                  {record.category === 'DEPOSIT' && '📥'}
                  {record.category === 'WITHDRAWAL' && '📤'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-200 uppercase tracking-tight">{record.category.replace('_', ' ')}</h4>
                  <p className="text-[9px] text-gray-500">{new Date(record.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <h5 className={`text-xs font-bold ${record.category === 'UNMINED_LOSS' ? 'text-red-400' : 'text-amber-400'}`}>
                  {record.category === 'UNMINED_LOSS' ? '-' : '+'}${parseFloat(record.amount).toFixed(4)}
                </h5>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  record.status === 'COMPLETED' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' :
                  record.status === 'PENDING' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30' :
                  'bg-red-950/40 text-red-400 border border-red-900/30'
                }`}>
                  {record.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}