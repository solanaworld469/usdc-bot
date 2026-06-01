import React, { useState, useEffect } from 'react';
import { UCreditDisplay } from './UCreditDisplay';

export const LedgerTab = ({ machineId, token }) => {
    const [epochs, setEpochs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedMonths, setExpandedMonths] = useState(new Set([1])); // Month 1 open by default

    useEffect(() => {
        const fetchLedger = async () => {
            try {
                // Hits the new route we built in Step 2
                const res = await fetch(`/api/ledger/epochs/${machineId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setEpochs(data.epochs);
                }
            } catch (err) {
                console.error("Ledger fetch fault:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLedger();
    }, [machineId, token]);

    const toggleMonth = (monthNum) => {
        setExpandedMonths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(monthNum)) newSet.delete(monthNum);
            else newSet.add(monthNum);
            return newSet;
        });
    };

    if (loading) return <div className="text-center p-4 text-cyan-400">SYNCING LEDGER PROTOCOLS...</div>;

    // --- TEMPORAL ENGINE: Calculate what is visible right now ---
    const now = new Date();
    
    // Filter out months that haven't started yet
    const visibleEpochs = epochs.filter(ep => new Date(ep.start_date) <= now);
    
    // Calculate totals from ALL visible history
    const totalClaimed = visibleEpochs.filter(ep => ep.claim_status === 'CLAIMED').reduce((acc, ep) => acc + parseFloat(ep.ucredits_mined), 0);
    const totalUnclaimed = visibleEpochs.filter(ep => ep.claim_status !== 'CLAIMED').reduce((acc, ep) => acc + parseFloat(ep.ucredits_mined), 0);
    const totalLeaked = visibleEpochs.reduce((acc, ep) => acc + parseFloat(ep.ucredits_leaked), 0);
    const cumMint = totalClaimed + totalUnclaimed;

    return (
        <div className="flex flex-col space-y-4 text-sm font-mono text-cyan-50">
            {/* LIFETIME STATS BOX */}
            <div className="border border-cyan-800 bg-gray-900/50 p-3 rounded">
                <h3 className="text-cyan-400 mb-2 border-b border-cyan-800 pb-1">📊 TOTAL LIFETIME HARDWARE STATS</h3>
                <ul className="space-y-1">
                    <li className="flex justify-between"><span>• Total Claimed:</span> <UCreditDisplay amount={totalClaimed} /></li>
                    <li className="flex justify-between"><span>• Total Unclaimed:</span> <UCreditDisplay amount={totalUnclaimed} /></li>
                    <li className="flex justify-between text-red-400"><span>• Total Leaked:</span> <UCreditDisplay amount={totalLeaked} /></li>
                    <li className="flex justify-between text-green-400"><span>• Cumulative Mint:</span> <UCreditDisplay amount={cumMint} /></li>
                </ul>
                <button className="w-full mt-3 py-2 bg-cyan-700/50 hover:bg-cyan-600 text-white rounded border border-cyan-500 font-bold transition-colors">
                    💰 CLAIM ALL AVAILABLE SETTLED CYCLES
                </button>
            </div>

            {/* MONTHLY ROLLOUT LIST */}
            <div className="space-y-2">
                {visibleEpochs.map((epoch) => {
                    const isExpanded = expandedMonths.has(epoch.month_number);
                    const endDate = new Date(epoch.end_date);
                    const daysLeft = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
                    
                    let statusBadge = epoch.claim_status;
                    if (epoch.claim_status === 'ACCRUING') statusBadge = `${daysLeft} DAYS LEFT`;

                    return (
                        <div key={epoch.id} className="border border-gray-700 rounded bg-black">
                            {/* Collapse/Expand Header */}
                            <div 
                                className="flex justify-between items-center p-2 cursor-pointer hover:bg-gray-800"
                                onClick={() => toggleMonth(epoch.month_number)}
                            >
                                <span className="text-cyan-300">
                                    {isExpanded ? '▼' : '▶'} MONTH {epoch.month_number} <span className="text-gray-500 text-xs">(Days {(epoch.month_number - 1) * 30 + 1} - {epoch.month_number * 30})</span>
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${epoch.claim_status === 'CLAIMED' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'}`}>
                                    [ {statusBadge} ]
                                </span>
                            </div>

                            {/* Expanded Data Panel */}
                            {isExpanded && (
                                <div className="p-3 border-t border-gray-700 bg-gray-900/30">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-400">• Total Yield:</span>
                                        <UCreditDisplay amount={epoch.ucredits_mined} />
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-red-400/80">• Thermal Leakage:</span>
                                        <UCreditDisplay amount={epoch.ucredits_leaked} className="text-red-400/80" />
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