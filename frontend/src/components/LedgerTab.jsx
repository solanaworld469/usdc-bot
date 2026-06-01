import React, { useState, useEffect } from 'react';
import { UCreditDisplay } from './UCreditDisplay';

export const LedgerTab = ({ machineId, token }) => {
    const [epochs, setEpochs] = useState([]);
    const [serverNow, setServerNow] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedMonths, setExpandedMonths] = useState(new Set([1]));

    useEffect(() => {
        const fetchLedger = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/ledger/epochs/${machineId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setEpochs(data.epochs);
                    setServerNow(new Date(data.server_time));
                }
            } catch (err) {
                console.error("Ledger fetch fault:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLedger();
    }, [machineId, token]);

    // 🌟 FIXED: Forces the database string into an integer so the click always works
    const toggleMonth = (monthNum) => {
        const parsedMonth = parseInt(monthNum, 10);
        setExpandedMonths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(parsedMonth)) newSet.delete(parsedMonth);
            else newSet.add(parsedMonth);
            return newSet;
        });
    };

    if (loading || !serverNow) return <div className="text-center p-4 text-cyan-400 font-mono text-xs animate-pulse">SYNCING TEMPORAL PROTOCOLS...</div>;

    const visibleEpochs = epochs.filter(ep => new Date(ep.start_date) <= serverNow);
    
    const totalClaimed = visibleEpochs.filter(ep => ep.claim_status === 'CLAIMED').reduce((acc, ep) => acc + parseFloat(ep.ucredits_mined), 0);
    const totalUnclaimed = visibleEpochs.filter(ep => ep.claim_status !== 'CLAIMED').reduce((acc, ep) => acc + parseFloat(ep.ucredits_mined), 0);
    const totalLeaked = visibleEpochs.reduce((acc, ep) => acc + parseFloat(ep.ucredits_leaked), 0);
    const cumMint = totalClaimed + totalUnclaimed;

    // 🌟 NEW: Math converter for your UI ($0.50 per uC based on your map)
    const toUSDC = (amount) => (amount * 0.5).toFixed(2);

    return (
        <div className="flex flex-col space-y-4 text-sm font-mono text-cyan-50 mt-4 animate-fadeIn">
            {/* LIFETIME STATS BOX */}
            <div className="border border-cyan-800 bg-[#111317] p-3 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                <h3 className="text-cyan-400 font-bold mb-2 border-b border-gray-800 pb-1.5 text-xs uppercase tracking-wider">📊 TOTAL LIFETIME HARDWARE STATS</h3>
                <ul className="space-y-1.5 text-xs">
                    <li className="flex justify-between items-center">
                        <span className="text-gray-400">• Total Claimed:</span> 
                        <div className="flex items-center gap-1.5"><UCreditDisplay amount={totalClaimed} className="text-white" /><span className="text-gray-500 font-sans text-[10px]">(${toUSDC(totalClaimed)})</span></div>
                    </li>
                    <li className="flex justify-between items-center">
                        <span className="text-gray-400">• Total Unclaimed:</span> 
                        <div className="flex items-center gap-1.5"><UCreditDisplay amount={totalUnclaimed} className="text-cyan-200" /><span className="text-gray-500 font-sans text-[10px]">(${toUSDC(totalUnclaimed)})</span></div>
                    </li>
                    <li className="flex justify-between items-center text-red-400/90">
                        <span className="text-gray-400">• Total Leaked:</span> 
                        <div className="flex items-center gap-1.5"><UCreditDisplay amount={totalLeaked} className="text-red-400" /><span className="text-red-900 font-sans text-[10px]">(${toUSDC(totalLeaked)})</span></div>
                    </li>
                    <li className="flex justify-between items-center text-emerald-400 mt-1 pt-1 border-t border-gray-800">
                        <span className="text-gray-400">• Cumulative Mint:</span> 
                        <div className="flex items-center gap-1.5"><UCreditDisplay amount={cumMint} className="text-emerald-400" /><span className="text-emerald-800 font-sans text-[10px]">(${toUSDC(cumMint)})</span></div>
                    </li>
                </ul>
                <button className="w-full mt-3.5 py-2.5 bg-gradient-to-r from-cyan-900 to-blue-900 hover:from-cyan-800 hover:to-blue-800 text-cyan-100 rounded border border-cyan-700/50 font-bold tracking-wider text-[10px] uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] active:scale-[0.98]">
                    💰 CLAIM ALL AVAILABLE SETTLED CYCLES: ${toUSDC(totalUnclaimed)}
                </button>
            </div>

            {/* MONTHLY ROLLOUT LIST */}
            <div className="space-y-2">
                {visibleEpochs.map((epoch) => {
                    const monthNum = parseInt(epoch.month_number, 10);
                    const isExpanded = expandedMonths.has(monthNum);
                    const endDate = new Date(epoch.end_date);
                    const daysLeft = Math.max(0, Math.ceil((endDate - serverNow) / (1000 * 60 * 60 * 24)));
                    
                    let statusBadge = epoch.claim_status;
                    if (epoch.claim_status === 'ACCRUING') statusBadge = `${daysLeft} DAYS LEFT`;

                    return (
                        <div key={epoch.id} className="border border-gray-800 rounded-lg bg-[#0e1014] overflow-hidden transition-all duration-200">
                            {/* Collapse/Expand Header */}
                            <div 
                                className="flex justify-between items-center p-3 cursor-pointer hover:bg-[#161920]"
                                onClick={() => toggleMonth(epoch.month_number)}
                            >
                                <span className="text-cyan-300 font-bold text-xs flex items-center gap-2">
                                    <span className="text-gray-500 text-[10px]">{isExpanded ? '▼' : '▶'}</span> 
                                    MONTH {monthNum} 
                                    <span className="text-gray-600 text-[9px] uppercase font-normal ml-1 hidden sm:inline">(Days {(monthNum - 1) * 30 + 1} - {monthNum * 30})</span>
                                </span>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                    epoch.claim_status === 'CLAIMED' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : 
                                    epoch.claim_status === 'ACCRUING' ? 'bg-blue-950/40 text-blue-400 border border-blue-900/30' :
                                    'bg-amber-950/40 text-amber-400 border border-amber-900/30'
                                }`}>
                                    [ {statusBadge} ]
                                </span>
                            </div>

                            {/* Expanded Data Panel */}
                            {isExpanded && (
                                <div className="p-3 border-t border-gray-800 bg-[#111317]">
                                    <div className="flex justify-between mb-2 items-center">
                                        <span className="text-gray-500 text-[10px] uppercase tracking-wide">• Total Yield:</span>
                                        <div className="flex items-center gap-1.5">
                                            <UCreditDisplay amount={epoch.ucredits_mined} className="text-cyan-100" />
                                            <span className="text-gray-500 font-sans text-[10px]">(${toUSDC(epoch.ucredits_mined)})</span>
                                            {epoch.claim_status === 'ACCRUING' && <span className="text-[8px] text-blue-400 animate-pulse border border-blue-900 px-1 rounded ml-1">*LIVE*</span>}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-[10px] uppercase tracking-wide">• Thermal Leakage:</span>
                                        <div className="flex items-center gap-1.5">
                                            <UCreditDisplay amount={epoch.ucredits_leaked} className="text-red-400/80" />
                                            <span className="text-red-900 font-sans text-[10px]">(${toUSDC(epoch.ucredits_leaked)})</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                
            </div>
        </div>
    );
};