import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function FriendsTab({ userBalance, onPurchaseSuccess }) {
  const [networkData, setNetworkData] = useState({
    active_sub_nodes: 0,
    total_network_earnings: 0.0,
    deposit_rewards_20: 0.0,
    lifetime_yields_2: 0.0,
    keys_ledger: []
  });

  const [loading, setLoading] = useState(true);
  const [localHiddenKeys, setLocalHiddenKeys] = useState({}); // Single row visibility maps
  const [globalHideAll, setGlobalHideAll] = useState(true);   // Header collapse folder flag

  // Triggering the central ErrorModal from App.jsx via window events to keep components unlinked
  const triggerAppError = (msg) => {
    const errorEvent = new CustomEvent('triggerAppError', { detail: msg });
    window.dispatchEvent(errorEvent);
  };

  /**
   * 📡 LIVE TELEMETRY LOADER: Gathers real-time multi-split balances and ledger matrix
   */
  const fetchNetworkTelemetry = async () => {
    try {
      const mockAuthHeader = "Bearer 999999999";
      const response = await axios.get('http://localhost:5000/api/nodes/network-summary', {
        headers: { Authorization: mockAuthHeader }
      });
      setNetworkData(response.data.summary);
      setLoading(false);
    } catch (err) {
      console.error('🔻 [Network Fetch Failure]:', err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkTelemetry();
  }, []);

  /**
   * 🛒 WHOLESALE CHECKOUT TRIGGER: Orders code pack directly from backend config arrays
   */
  const handleBuyPackage = async (packType, priceUsdc) => {
    // 🌟 Check if balance is missing or too low
    if (!userBalance || userBalance < priceUsdc) {
      // Change 'alert' back to your high-tier custom event dispatcher
      triggerAppError("Insufficient Balance! Your terminal wallet requires funding before wholesale buy orders clear.");
      return;
    }

    try {
      const mockAuthHeader = "Bearer 999999999";
      await axios.post('http://localhost:5000/api/nodes/buy-package', { package_type: packType }, {
        headers: { Authorization: mockAuthHeader }
      });
      
      if (onPurchaseSuccess) onPurchaseSuccess(priceUsdc);
      fetchNetworkTelemetry(); 
    } catch (err) {
      // 🌟 Change this catch block alert back to the custom dispatcher too!
      triggerAppError(err.response?.data?.error || "Wholesale market matching system timeout.");
    }
  };

  /**
   * 📥 CLAIM COMMISSION WITHDRAW OVERRIDE GATEKEEPER
   */
  const handleClaimCommissions = async () => {
    // 🛑 Strictly enforces your 10 active sub-nodes business rule
    if (networkData.active_sub_nodes < 10) {
      triggerAppError(`Referral withdrawal blocked! Your active network sub-nodes are not up to 10 mehnnn.`);
      return;
    }

    try {
      const mockAuthHeader = "Bearer 999999999";
      const response = await axios.post('http://localhost:5000/api/nodes/claim-commissions', {}, {
        headers: { Authorization: mockAuthHeader }
      });
      alert(response.data.message);
      fetchNetworkTelemetry();
    } catch (err) {
      triggerAppError(err.response?.data?.error || "Accounting settlement rejection.");
    }
  };

  // Toggle helpers for layout folders
  const toggleRowVisibility = (id) => {
    setLocalHiddenKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center space-y-2 text-cyan-400 font-mono text-xs uppercase animate-pulse">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Syncing Network Nodes...</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col relative select-none animate-fadeIn">
      
      {/* 🔌 1. STICKY NODE NETWORK STATUS SECTION (Slim, low-profile height block) */}
      <div className="sticky top-0 z-10 bg-[#0a0b0d] border-b border-gray-950 p-3 flex flex-col space-y-2 shadow-md">
        <div className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest pl-0.5">🔌 Distributed Node Network Status</div>
        
        <div className="bg-[#111318] border border-gray-900 rounded-xl px-3 py-2 flex flex-col space-y-1.5">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-mono uppercase">Connected Sub-Nodes</span>
              <span className="text-sm font-bold text-cyan-400 font-mono">{networkData.active_sub_nodes} Active</span>
            </div>
            <div className="text-right flex flex-col">
              <span className="text-[10px] text-gray-500 font-mono uppercase">Total Network Earnings</span>
              <span className="text-xs font-bold text-white font-mono">${parseFloat(networkData.total_network_earnings).toFixed(6)} USDC</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-950 text-[10px] font-mono font-bold">
            <div className="flex items-center space-x-1">
              <span className="text-xs">💰</span>
              <span className="text-gray-500">20% Deposits:</span>
              <span className="text-emerald-400">${parseFloat(networkData.deposit_rewards_20).toFixed(4)}</span> {/* Green claimable rewards */}
            </div>
            <div className="flex items-center justify-end space-x-1">
              <span className="text-xs">⚡</span>
              <span className="text-gray-500">2% Yields:</span>
              <span className="text-amber-400">${parseFloat(networkData.lifetime_yields_2).toFixed(4)}</span> {/* Yellow lifecycle cuts */}
            </div>
          </div>

          <button 
            onClick={handleClaimCommissions}
            className="w-full bg-[#181b22] hover:bg-[#1f232d] border border-gray-800 text-gray-200 text-[10px] font-mono font-bold py-1.5 rounded-lg tracking-wider uppercase mt-1 transition-colors"
          >
            📥 Claim Commissions
          </button>
        </div>
      </div>

      {/* 🧭 SCROLLABLE SYSTEM WORKSPACE CHASSIS */}
      <div className="px-4 py-3 space-y-4 overflow-y-auto pb-24">
        
        {/* 🛒 2. WHOLESALE KEY MARKET PACKAGE COUNTER */}
        <div className="space-y-2">
          <div className="border-b border-gray-900/40 pb-1">
            <h4 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-wide">🛒 Wholesale Key Market</h4>
            <p className="text-[8px] font-mono text-gray-600 uppercase">Buy system verification codes using your vault balance</p>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            <div className="bg-[#14171d] border border-gray-900 p-2.5 rounded-xl flex items-center justify-between">
              <div className="flex flex-col"><span className="font-bold text-gray-200">Starter Pack</span><span className="text-[9px] text-gray-500">Generates 3 activation codes</span></div>
              <button onClick={() => handleBuyPackage('starter', 5.00)} className="bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 border border-cyan-800/40 font-bold px-3 py-1.5 rounded-lg text-[10px]">$5.00 USDC</button>
            </div>
            <div className="bg-[#14171d] border border-gray-900 p-2.5 rounded-xl flex items-center justify-between">
              <div className="flex flex-col"><span className="font-bold text-gray-200">Business Pack</span><span className="text-[9px] text-gray-500">Generates 10 activation codes</span></div>
              <button onClick={() => handleBuyPackage('business', 10.00)} className="bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 border border-cyan-800/40 font-bold px-3 py-1.5 rounded-lg text-[10px]">$10.00 USDC</button>
            </div>
            <div className="bg-[#14171d] border border-gray-900 p-2.5 rounded-xl flex items-center justify-between">
              <div className="flex flex-col"><span className="font-bold text-gray-200">Whale Bulk Pack</span><span className="text-[9px] text-gray-500">Generates 25 activation codes</span></div>
              <button onClick={() => handleBuyPackage('whale', 20.00)} className="bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 border border-cyan-800/40 font-bold px-3 py-1.5 rounded-lg text-[10px]">$20.00 USDC</button>
            </div>
          </div>
        </div>

        {/* 📜 3. DISTRIBUTED KEY DIRECTORY LEDGER PANEL */}
        <div className="space-y-2">
          <div className="border-b border-gray-900/40 pb-1 flex justify-between items-end">
            <div>
              <h4 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-wide">📜 Distributed Key Ledger</h4>
              <p className="text-[8px] font-mono text-gray-600 uppercase">Audit inventory deployment variables</p>
            </div>
            <button 
              onClick={() => {
                setGlobalHideAll(!globalHideAll);
                setLocalHiddenKeys({}); // Clear selective maps when invoking global macro shifts
              }}
              className="text-[8px] font-mono font-bold text-cyan-400 bg-cyan-950/20 border border-cyan-900 px-1.5 py-0.5 rounded uppercase tracking-tighter"
            >
              {globalHideAll ? "Show All" : "Hide All"}
            </button>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {networkData.keys_ledger.length > 0 ? (
              networkData.keys_ledger.map((row) => {
                // Determine visibility folder conditions based on local toggles or global hooks
                const isExplicitlyHidden = localHiddenKeys[row.id] !== undefined ? localHiddenKeys[row.id] : globalHideAll;

                return (
                  <div key={row.id} className="bg-[#14171d] border border-gray-900/80 rounded-xl px-3 py-2 flex flex-col space-y-1">
                    
                    {/* Header Row Line */}
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-gray-500">🔑</span>
                        <span className="text-gray-200 tracking-wide select-text">{row.key_code}</span>
                      </div>
                      <button 
                        onClick={() => toggleRowVisibility(row.id)}
                        className="text-[8px] text-gray-500 hover:text-gray-300 font-bold uppercase tracking-tight"
                      >
                        [{isExplicitlyHidden ? "Show" : "Hide"}]
                      </button>
                    </div>

                    {/* Expandable Parameter Dashboard Panel */}
                    {!isExplicitlyHidden && (
                      <div className="pt-1.5 border-t border-gray-950 flex flex-col space-y-1 text-[10px] text-gray-400">
                        
                        {row.status === 'UNUSED' && (
                          <div className="flex justify-between text-cyan-400 text-[9px] font-bold uppercase">
                            <span>Status: Unused Inventory</span>
                            <span className="text-gray-500 tracking-tight">Expires in: {row.expires_in_string}</span>
                          </div>
                        )}

                        {row.status === 'EXPIRED' && (
                          <div className="text-red-500 text-[9px] font-bold uppercase">
                            Status: Allocation Expired
                          </div>
                        )}

                        {row.status === 'USED' && (
                          <div className="flex flex-col space-y-1.5 w-full">
                            <div className="flex justify-between text-[9px] text-gray-400 uppercase font-bold tracking-tight">
                              <span>Status: Connected Operator</span>
                              <span className="text-white select-text">ID: {row.used_by_telegram_id}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 pl-1 text-[10px] font-bold bg-[#0f1116] p-1.5 rounded-lg border border-gray-950">
                              <span className="text-gray-500">💰 20% Deposit Rewards:</span>
                              <span className="text-right text-emerald-400">+$ {parseFloat(row.bonus_deposit_usdc).toFixed(4)}</span>
                              
                              <span className="text-gray-500">⚡ 2% Accumulated Yield:</span>
                              <span className="text-right text-amber-400">+$ {parseFloat(row.bonus_mining_usdc).toFixed(4)}</span>
                              
                              <span className="text-gray-500">🔺 Sub-Node Unmined Loss:</span>
                              <span className="text-right text-red-400">$ {parseFloat(row.sub_node_leakage_usdc).toFixed(4)}</span>
                            </div>
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-600 text-[10px] py-6 uppercase font-bold tracking-tight bg-gray-950/20 border border-dashed border-gray-900 rounded-xl">
                Wholesale key register vacant. Purchase a crypto generation pack above.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}