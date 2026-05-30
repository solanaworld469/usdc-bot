import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function FriendsTab({ userBalance, onPurchaseSuccess }) {
  const [networkData, setNetworkData] = useState({
    active_sub_nodes: 0,
    total_network_earnings: 0.0,
    deposit_rewards_20: 0.0,
    lifetime_yields_2: 0.0,
    keys_ledger: [],
    gifted_ledger: []
  });

  const [loading, setLoading] = useState(true);
  
  // 👁️ Restored Hide/Show All States
  const [localHiddenKeys, setLocalHiddenKeys] = useState({}); 
  const [globalHideAll, setGlobalHideAll] = useState(true);   

  // 🎁 Gifting System States
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftTarget, setGiftTarget] = useState('');
  const [giftQty, setGiftQty] = useState(1);
  const [activeLedgerTab, setActiveLedgerTab] = useState('inventory'); // 'inventory' | 'gifted'

  const triggerAppError = (msg) => {
    const errorEvent = new CustomEvent('triggerAppError', { detail: msg });
    window.dispatchEvent(errorEvent);
  };

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

  const handleBuyPackage = async (packType, priceUsdc) => {
    if (!userBalance || userBalance < priceUsdc) {
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
      triggerAppError(err.response?.data?.error || "Wholesale market matching system timeout.");
    }
  };

  const handleSendGift = async () => {
    const qty = parseInt(giftQty);
    if (!giftTarget || isNaN(qty) || qty <= 0) {
      triggerAppError("Please provide a valid Target User ID and Quantity.");
      return;
    }
    const totalCost = qty * 1.66;
    if (!userBalance || userBalance < totalCost) {
      triggerAppError(`Insufficient Balance! Gifting ${qty} keys requires $${totalCost.toFixed(2)} USDC.`);
      return;
    }

    try {
      const mockAuthHeader = "Bearer 999999999";
      await axios.post('http://localhost:5000/api/nodes/gift-package', {
        target_user_id: giftTarget,
        quantity: qty
      }, {
        headers: { Authorization: mockAuthHeader }
      });
      
      if (onPurchaseSuccess) onPurchaseSuccess(totalCost);
      setShowGiftModal(false);
      setGiftTarget('');
      setGiftQty(1);
      fetchNetworkTelemetry(); 
      setActiveLedgerTab('gifted');
    } catch (err) {
      triggerAppError(err.response?.data?.error || "Gift dispatch system timeout.");
    }
  };

  const handleClaimCommissions = async () => {
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

  // 👁️ Restored Global & Local Visibility Toggles
  const toggleGlobalVisibility = () => {
    setGlobalHideAll(!globalHideAll);
    setLocalHiddenKeys({}); // Reset specific keys when master toggle is hit
  };

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
    <div className="w-full flex flex-col relative select-none animate-fadeIn pb-24">
      
      {/* 🔌 1. STICKY NODE NETWORK STATUS SECTION */}
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
              <span className="text-xs">💰</span><span className="text-gray-500">20% Deposits:</span><span className="text-emerald-400">${parseFloat(networkData.deposit_rewards_20).toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-end space-x-1">
              <span className="text-xs">⚡</span><span className="text-gray-500">2% Yields:</span><span className="text-amber-400">${parseFloat(networkData.lifetime_yields_2).toFixed(4)}</span>
            </div>
          </div>
          <button onClick={handleClaimCommissions} className="w-full bg-[#181b22] hover:bg-[#1f232d] border border-gray-800 text-gray-200 text-[10px] font-mono font-bold py-1.5 rounded-lg tracking-wider uppercase mt-1 transition-colors">
            📥 Claim Commissions
          </button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-5">
        
        {/* 🎁 1.5. GIFT A NETWORK FRIEND */}
        <div className="space-y-2">
          <div className="border-b border-gray-900/40 pb-1">
            <h4 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wide">🎁 Gift A Network Friend</h4>
            <p className="text-[8px] font-mono text-gray-600 uppercase">Dispatch dynamic key gifts to peers</p>
          </div>
          <div className="bg-[#14171d] border border-cyan-900/30 p-3 rounded-xl flex items-center justify-between shadow-[0_0_15px_rgba(34,211,238,0.05)]">
            <div className="flex flex-col">
              <span className="font-bold text-gray-200 text-[11px] font-mono">Dynamic Key Dispatch</span>
              <span className="text-[9px] font-mono text-gray-500">Mints custom 3-day activation packs</span>
            </div>
            <button onClick={() => setShowGiftModal(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-[0_0_10px_rgba(34,211,238,0.2)] transition-colors tracking-wide">
              CHOOSE GIFT ➔
            </button>
          </div>
        </div>

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
          {/* Header Row with Tabs and Global Toggle */}
          <div className="flex justify-between items-end mb-1">
            <div className="flex space-x-2">
              <button onClick={() => setActiveLedgerTab('inventory')} className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${activeLedgerTab === 'inventory' ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-800' : 'bg-[#14171d] text-gray-500 border border-gray-900'}`}>
                Inventory
              </button>
              <button onClick={() => setActiveLedgerTab('gifted')} className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${activeLedgerTab === 'gifted' ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-800' : 'bg-[#14171d] text-gray-500 border border-gray-900'}`}>
                Gifted History
              </button>
            </div>
            
            {/* 👁️ The Restored Global Hide/Show Button */}
            {activeLedgerTab === 'inventory' && networkData.keys_ledger.length > 0 && (
              <button 
                onClick={toggleGlobalVisibility}
                className="text-[9px] border border-cyan-800/50 bg-cyan-900/20 text-cyan-400 hover:text-cyan-300 font-bold px-2 py-0.5 rounded uppercase tracking-widest transition-colors"
              >
                {globalHideAll ? 'SHOW ALL' : 'HIDE ALL'}
              </button>
            )}
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {activeLedgerTab === 'inventory' ? (
              networkData.keys_ledger.length > 0 ? (
                networkData.keys_ledger.map((row) => {
                  const isExplicitlyHidden = localHiddenKeys[row.id] !== undefined ? localHiddenKeys[row.id] : globalHideAll;
                  return (
                    <div key={row.id} className="bg-[#14171d] border border-gray-900/80 rounded-xl px-3 py-2 flex flex-col space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-bold">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-gray-500">🔑</span><span className="text-gray-200 select-text">{row.key_code}</span>
                        </div>
                        <button onClick={() => toggleRowVisibility(row.id)} className="text-[8px] text-gray-500 hover:text-gray-300 font-bold uppercase">
                          [{isExplicitlyHidden ? "Show" : "Hide"}]
                        </button>
                      </div>
                      {!isExplicitlyHidden && (
                        <div className="pt-1.5 border-t border-gray-950 flex flex-col space-y-1 text-[10px] text-gray-400 animate-fadeIn">
                          {row.status === 'UNUSED' && <div className="flex justify-between text-cyan-400 text-[9px] font-bold uppercase"><span>Status: Unused Inventory</span><span className="text-gray-500 tracking-tight">Expires in: {row.expires_in_string}</span></div>}
                          {row.status === 'EXPIRED' && <div className="text-red-500 text-[9px] font-bold uppercase">Status: Allocation Expired</div>}
                          {row.status === 'USED' && (
                            <div className="flex flex-col space-y-1.5 w-full">
                              <div className="flex justify-between text-[9px] text-gray-400 uppercase font-bold tracking-tight"><span>Status: Connected Operator</span><span className="text-white select-text">ID: {row.used_by_telegram_id}</span></div>
                              <div className="grid grid-cols-2 gap-x-2 gap-y-1 pl-1 text-[10px] font-bold bg-[#0f1116] p-1.5 rounded-lg border border-gray-950">
                                <span className="text-gray-500">💰 20% Deposits:</span><span className="text-right text-emerald-400">+$ {parseFloat(row.bonus_deposit_usdc).toFixed(4)}</span>
                                <span className="text-gray-500">⚡ 2% Yield:</span><span className="text-right text-amber-400">+$ {parseFloat(row.bonus_mining_usdc).toFixed(4)}</span>
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
                  Wholesale key register vacant.
                </div>
              )
            ) : (
              // 🌟 GIFTED HISTORY TAB CONTENT
              networkData.gifted_ledger?.length > 0 ? (
                networkData.gifted_ledger.map((row) => (
                  <div key={row.id} className="bg-[#14171d] border border-gray-900/80 rounded-xl px-3 py-2 flex flex-col space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-amber-500">🎁</span>
                        <span className="text-gray-200 tracking-wide">Sent to: {row.recipient_id}</span>
                      </div>
                      <span className={`text-[9px] uppercase ${row.status === 'UNUSED' ? 'text-cyan-400' : row.status === 'USED' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {row.status === 'UNUSED' ? `Expires in ${row.expires_in_string}` : row.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-600 text-[10px] py-6 uppercase font-bold tracking-tight bg-gray-950/20 border border-dashed border-gray-900 rounded-xl">
                  No outbound gifts dispatched yet.
                </div>
              )
            )}
          </div>
        </div>

      </div>

      {/* 🎭 THE GIFTING SLIDE-UP MODAL OVERLAY */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#111318] border border-gray-900 rounded-3xl p-5 space-y-5 animate-slideUp relative">
            <button onClick={() => setShowGiftModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white text-sm transition-colors">✕</button>
            
            <div className="text-center border-b border-gray-900/60 pb-3">
              <span className="text-3xl">🎁</span>
              <h3 className="text-sm font-bold tracking-wide text-cyan-400 font-mono uppercase mt-2">Initialize Dispatch Transfer</h3>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">1. Target User ID</label>
                <input 
                  type="text" 
                  value={giftTarget}
                  onChange={(e) => setGiftTarget(e.target.value)}
                  placeholder="Enter Friend's Telegram ID..." 
                  className="w-full bg-[#161920] border border-gray-800 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">2. Code Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  value={giftQty}
                  onChange={(e) => setGiftQty(e.target.value)}
                  placeholder="How many keys? (e.g., 5)" 
                  className="w-full bg-[#161920] border border-gray-800 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="bg-[#0f1116] border border-gray-900 p-3 rounded-xl space-y-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase border-b border-gray-800 pb-1">Summary:</p>
                <ul className="text-[9px] text-gray-300 space-y-1">
                  <li>• Total Cost: <span className="text-cyan-400 font-bold">${(giftQty * 1.66).toFixed(2)} USDC</span> ($1.66/code)</li>
                  <li>• Life Cycle Horizon: <span className="text-amber-400">3 Days (72 Hours)</span> until decay</li>
                </ul>
              </div>

              <div className="space-y-2 pt-2">
                <button 
                  onClick={handleSendGift}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-bold uppercase tracking-wider transition-colors"
                >
                  Dispatch & Secure Gift Codes
                </button>
                <button 
                  onClick={() => setShowGiftModal(false)}
                  className="w-full bg-transparent text-gray-500 hover:text-white py-2 rounded-xl font-semibold uppercase tracking-wide transition-colors"
                >
                  Cancel Terminal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}