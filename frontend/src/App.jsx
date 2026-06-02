import React, { useState, useEffect } from 'react';
import axios from 'axios';
import HardwareTab from './HardwareTab';
import MachineModal from './MachineModal';
import FriendsTab from './FriendsTab';
import DepositModal from './DepositModal';
import HistoryTab from './HistoryTab';
import ErrorModal from './ErrorModal';
import { LedgerTab } from './components/LedgerTab';
import { UCreditDisplay } from './components/UCreditDisplay';

// 📡 Real-time fake transaction streaming logs array
const FAKE_CLAIMS_LOG = [
  "▲ [LOG]: User_88887 just claimed $2,730.00 USDC from Quantum array",
  "▲ [LOG]: Node_x201 just claimed $12.50 USDC from Core pool",
  "▲ [LOG]: Operator_992 just claimed $84.10 USDC from Pulse loop",
  "▲ [LOG]: User_14029 just claimed $140.00 USDC from Vector coil",
  "▲ [LOG]: Node_z883 just claimed $620.50 USDC from Matrix grid",
  "▲ [LOG]: User_77102 just claimed $3.15 USDC from Core pool",
  "▲ [LOG]: Operator_042 just claimed $712.00 USDC from Flux drive",
  "▲ [LOG]: User_55192 just claimed $1,195.00 USDC from Quantum cluster",
  "▲ [LOG]: Node_a902 just claimed $25.00 USDC from Pulse loop",
  "▲ [LOG]: Operator_310 just claimed $245.80 USDC from Vector coil"
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [inlineView, setInlineView] = useState('core');
  const [isLoading, setIsLoading] = useState(true); 
  const [isGlobalLocked, setIsGlobalLocked] = useState(false); 
  const [activeError, setActiveError] = useState(null); 

  // 🔄 SINGLE ROW DYNAMIC TIMING LOG FEEDS
  const [currentLog, setCurrentLog] = useState(FAKE_CLAIMS_LOG[0]);
  const [animateTrigger, setAnimateTrigger] = useState(true);

  // DYNAMIC BACKEND FLEET MANAGEMENT
  const [ownedCoils, setOwnedCoils] = useState([]);
  const [selectedCoilIndex, setSelectedCoilIndex] = useState(0);

  // ACCUMULATOR ASSET TRACKERS
  const [uCredits, setUCredits] = useState(0); 
  const [vaultUSDC, setVaultUSDC] = useState(0.00); 

  const [miningState, setMiningState] = useState('IDLE'); 
  const [secondsRemaining, setSecondsRemaining] = useState(86400); 
  const [unminedLoss, setUnminedLoss] = useState(0); 
  const [operatorLevel, setOperatorLevel] = useState('Bronze Operator');

  const [selectedMachine, setSelectedMachine] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);

  const activeCoil = ownedCoils[selectedCoilIndex] || null;
  const currentPerSecondRate = activeCoil ? (parseFloat(activeCoil.ucredits_per_sec || 0)) : 0.0000;
  const displayUsdcBalance = (uCredits / 1000000).toFixed(6);

  /**
   * 🎰 RANDOMIZED LIVE STREAM ENGINE: Shuffles single terminal rows at random 5-15s windows
   */
  useEffect(() => {
    let logTimeout;
    
    const triggerNextRandomLog = () => {
      setAnimateTrigger(false); 
      
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * FAKE_CLAIMS_LOG.length);
        setCurrentLog(FAKE_CLAIMS_LOG[randomIndex]);
        setAnimateTrigger(true); 
      }, 50); 

      const randomDelay = Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000;
      logTimeout = setTimeout(triggerNextRandomLog, randomDelay);
    };

    triggerNextRandomLog();
    return () => clearTimeout(logTimeout);
  }, []);

  /**
   * 📡 SYSTEM INITIALIZER BASELINE
   */
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      setIsGlobalLocked(true); 
      return config;
    }, (error) => {
      setIsGlobalLocked(false);
      return Promise.reject(error);
    });

    const responseInterceptor = axios.interceptors.response.use((response) => {
      setIsGlobalLocked(false); 
      return response;
    }, (error) => {
      setIsGlobalLocked(false); 
      return Promise.reject(error);
    });

    const initializeTerminalInfrastructure = async () => {
      try {
        const mockAuthHeader = "Bearer 999999999"; 

        const profileResponse = await axios.get('http://localhost:5000/api/user/profile', {
          headers: { Authorization: mockAuthHeader }
        });
        const profile = profileResponse.data.user_profile;
        setVaultUSDC(parseFloat(profile.vault_balance) || 0.00);
        setOperatorLevel(profile.level || 'Bronze Operator');

        const fleetResponse = await axios.get('http://localhost:5000/api/hardware/fleet', {
          headers: { Authorization: mockAuthHeader }
        });
        const activeFleets = fleetResponse.data.fleet || [];
        setOwnedCoils(activeFleets);

        // 🌟 FIXED: Keeping the accurate ignition time, but returning to the correct speed variable!
        if (activeFleets.length > 0 && activeFleets[0].last_ignition_time) {
          const lastIgnitionTime = new Date(activeFleets[0].last_ignition_time);
          const serverNow = new Date();
          const elapsedSeconds = Math.max(0, Math.floor((serverNow - lastIgnitionTime) / 1000));
          
          const initialRatePerSec = parseFloat(activeFleets[0].ucredits_per_sec) || 0;
          
          setUCredits(elapsedSeconds * initialRatePerSec);
          setMiningState(elapsedSeconds > 0 ? 'ACTIVE' : 'IDLE');
        }

        setIsLoading(false);
      } catch (err) {
        console.error('🔻 [Initializer Error]:', err.message);
        setIsLoading(false);
      }
    };

    initializeTerminalInfrastructure();

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  /**
   * 📬 GLOBAL BROADCAST LISTENER: Catches any triggerAppError event sent from child tabs
   */
  useEffect(() => {
    const handleErrorHook = (e) => {
      setActiveError(e.detail); // 🌟 Automatically sets error state to the passed message
    };
    window.addEventListener('triggerAppError', handleErrorHook);
    return () => window.removeEventListener('triggerAppError', handleErrorHook);
  }, []);  

  /**
   * ⚡ REAL-TIME SYSTEM ENGINE TICKER
   */
  useEffect(() => {
    if (isLoading || miningState !== 'ACTIVE' || !activeCoil) return;

    const tickInterval = setInterval(() => {
      setUCredits((prev) => prev + currentPerSecondRate);
      setSecondsRemaining((prev) => (prev <= 1 ? 86400 : prev - 1));
    }, 1000);

    return () => clearInterval(tickInterval);
  }, [isLoading, miningState, currentPerSecondRate, activeCoil]);

  const handleClaimRevenue = async () => {
    if (uCredits <= 0) return;
    try {
      const mockAuthHeader = "Bearer 999999999";
      const response = await axios.post('http://localhost:5000/api/mining/claim', {}, {
        headers: { Authorization: mockAuthHeader }
      });

      setVaultUSDC(parseFloat(response.data.new_vault_balance));
      setUCredits(0); 
      setMiningState('IDLE');
    } catch (err) {
      setActiveError(err.response?.data?.error || "Transaction verification cluster timeout.");
    }
  };

  const handlePurchaseMachine = async (machineId, leaseDays, keyCode) => {
    try {
      const mockAuthHeader = "Bearer 999999999";
      const response = await axios.post('http://localhost:5000/api/hardware/rent', {
        machine_id: machineId,
        lease_days: leaseDays,
        key_code: keyCode // 👑 FIXED: Sends the key to the backend!
      }, {
        headers: { Authorization: mockAuthHeader }
      });

      setVaultUSDC(parseFloat(response.data.new_vault_balance));
      
      const fleetResponse = await axios.get('http://localhost:5000/api/hardware/fleet', {
        headers: { Authorization: mockAuthHeader }
      });
      setOwnedCoils(fleetResponse.data.fleet || []);
      
      setMiningState('ACTIVE'); 
      setSelectedMachine(null); 
    } catch (err) {
      setActiveError(err.response?.data?.error || "Inbound payment network sync link fault.");
    }
  };

  const handleCoreIgnition = () => {
    if ((miningState === 'IDLE' || miningState === 'GRACE') && activeCoil) {
      setMiningState('ACTIVE');
      setSecondsRemaining(86400); 
    }
  };

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md bg-[#0a0b0d] min-h-screen flex flex-col items-center justify-center text-white font-sans antialiased">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono tracking-[0.2em] text-cyan-400 uppercase animate-pulse">Syncing Facility Nodes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md bg-[#0a0b0d] h-screen w-full flex flex-col justify-between text-white select-none relative font-sans antialiased overflow-hidden">
      
      {/* 📌 UPPER IMMUTABLE HEADER PLATFORM */}
      <header className="w-full flex flex-col flex-shrink-0 z-30 bg-[#0a0b0d]">
        
        {/* 👁️ Only render the dynamic facility tickers if the user is NOT on the hardware page */}
          {activeTab !== 'hardware' && (
            <>
              {/* Network Live Ticker */}
              <div className="bg-[#111317] text-[10px] font-mono text-cyan-400/90 px-4 py-2 text-center border-b border-gray-900/40 tracking-wider uppercase">
                Siberian Facility Linked • Node Active Cluster Rank: {operatorLevel}
              </div>

              {/* 🎰 SINGLE LINE LOG SHUFFLER */}
              <div className="bg-[#0e1014] border-b border-gray-950 h-7 flex items-center px-4 overflow-hidden relative">
                <p className={`text-[10px] font-mono text-amber-500/80 tracking-tight truncate w-full absolute left-4 right-4 ${
                  animateTrigger ? 'animate-[slideUpFade_0.4s_ease-out_forwards]' : 'opacity-0'
                }`}>
                  {currentLog}
                </p>
              </div>
            </>
          )}

        {/* 🎛️ COMPACT FIXED STICKY CHASSIS */}
        {activeTab === 'home' && (
          <div className="pt-2 pb-2 px-4 flex justify-between items-end border-b border-gray-950 bg-[#0a0b0d]">
            {/* LEFT: Machine Dropdown (Stays visible in both views) */}
            <div className="w-[55%]">
              <label className="text-[8px] font-mono font-bold text-gray-500 uppercase tracking-widest pl-0.5 mb-0.5 block">Active Target</label>
              {ownedCoils.length > 0 ? (
                <select
                  value={selectedCoilIndex}
                  onChange={(e) => { setSelectedCoilIndex(parseInt(e.target.value)); setUCredits(0); }}
                  className="bg-[#14171d] border border-gray-800/80 rounded-lg px-2 py-1 text-[11px] font-mono font-bold text-cyan-400 outline-none cursor-pointer appearance-none w-full"
                  style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2322d3ee' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '12px', paddingRight: '24px' }}
                >
                  {ownedCoils.map((coil, index) => (
                    <option key={coil.id} value={index} className="bg-[#0e1014] text-white">Coil #{index + 1}: {coil.name}</option>
                  ))}
                </select>
              ) : (
                <div className="inline-flex items-center space-x-1.5 bg-[#14171d] border border-dashed border-gray-800/80 px-2 py-0.5 rounded-md w-full">
                  <span className="text-[10px] text-amber-500">⚠️</span>
                  <span className="font-mono text-[9px] font-semibold text-gray-500 uppercase tracking-tight">No Coils</span>
                </div>
              )}
            </div>
            
            {/* RIGHT: The View Swap Button */}
            <div className="w-[42%] flex justify-end">
              <button 
                onClick={() => setInlineView(inlineView === 'core' ? 'ledger' : 'core')}
                className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 font-bold tracking-wider uppercase border border-cyan-900/50 bg-[#111317] px-2 py-1.5 rounded flex items-center transition-colors"
              >
                <span className="mr-1.5 text-cyan-500">≡</span> {inlineView === 'core' ? 'MINING HISTORY' : 'CORE ENGINE'}
              </button>
            </div>
          </div>
        )}

      </header>

      {/* 🧭 VIEWPORT SCROLLABLE BODY */}
      <main className="flex-grow overflow-y-auto pb-20 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {activeTab === 'home' && inlineView === 'core' && (
          <div className="w-full flex flex-col min-h-full">
            
            {/* CENTRAL MINING CORE PIE */}
            <div className="py-6 flex flex-col items-center justify-center bg-gradient-to-b from-[#0f121a]/60 to-[#0a0b0d]">
              
              {/* CORE BALANCES METRIC PANEL */}
              <div className="text-center space-y-0.5 mb-5 z-10">
                <p className="text-[9px] font-bold tracking-[0.15em] text-gray-500 uppercase">Mined Assets Accumulator</p>
                
                {/* 🌟 FIXED: Swapped raw text for the formatting engine to force leading zeros */}
                <div className="flex justify-center items-baseline space-x-2">
                  <UCreditDisplay amount={uCredits} className="text-4xl text-white font-bold" />
                  <span className="text-xs text-cyan-500 font-sans font-normal">uCredits</span>
                </div>
                
                {/* 🌟 FIXED: The strict 2 uC = $1 USDC economy rule */}
                <p className="text-xs text-gray-400 font-medium font-mono">≈ ${(parseFloat(uCredits) / 2000).toFixed(5)} USDC</p>
              </div>
              {/* INTERACTIVE GLOW RING */}
              <div 
                onClick={handleCoreIgnition}
                className="relative w-36 h-36 flex items-center justify-center z-10 cursor-pointer active:scale-95 transition-transform group"
              >
                <div className={`absolute inset-0 rounded-full border border-dashed transition-all duration-700 ${
                  miningState === 'ACTIVE' ? 'border-cyan-500/30 animate-[spin_30s_linear_infinite]' : 'border-red-500/20'
                }`}></div>
                <div className={`absolute inset-2 rounded-full border transition-all duration-700 ${
                  miningState === 'ACTIVE' ? 'border-cyan-500/50 shadow-[0_0_25px_rgba(34,211,238,0.2)] bg-[#0e1118]' : 'border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.1)] bg-[#160d0e]'
                }`}></div>
                <div className="z-10 text-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md mx-auto rotate-45 transform transition-colors duration-500 ${
                    miningState === 'ACTIVE' ? 'from-cyan-400 to-blue-500 bg-gradient-to-br animate-pulse' : 'from-red-500 to-rose-700 bg-gradient-to-br'
                  }`}>
                    <span className="text-base -rotate-45">{miningState === 'ACTIVE' ? '⚡' : '💤'}</span>
                  </div>
                </div>
              </div>

              {/* CONTEXTUAL STATUS TAB DOCK */}
              <div className="mt-5 z-10">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-mono tracking-wider font-bold border transition-all duration-500 ${
                  miningState === 'ACTIVE' ? 'bg-cyan-950/30 border-cyan-800/40 text-cyan-400' : 'bg-red-950/40 border-red-900/40 text-red-400'
                }`}>
                  {miningState === 'ACTIVE' ? `PROCESSING • ${formatTime(secondsRemaining)}` : 'CRITICAL TERMINAL SHUTDOWN • COILS IDLE'}
                </span>
              </div>
            </div>

            {/* CONTROL PANEL PLATFORM PANEL LAYER */}
            <div className="bg-[#101216] border-t border-gray-900 px-4 pt-4 pb-4 space-y-4 rounded-t-3xl shadow-xl flex-grow">
              
              {/* PROPERTY MATRIX COMPONENT VIEWPORT */}
              <div className="bg-[#14171d] border border-gray-900/80 rounded-xl p-3.5 space-y-2 font-mono text-xs relative overflow-hidden">
                <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold border-b border-gray-950 pb-1 flex justify-between items-center">
                  <span>🎛️ Active Machine Specs</span>
                  {activeCoil && <span className="text-cyan-400 text-[8px] border border-cyan-950 px-1 py-0.2 bg-cyan-950/20 rounded">ONLINE</span>}
                </div>

                {activeCoil ? (
                  <div className="grid grid-cols-2 gap-y-2 pt-1 text-[11px]">
                    <div><span className="text-gray-500">Hardware Model:</span></div>
                    <div className="text-right text-white font-bold">{activeCoil.name}</div>
                    <div><span className="text-gray-500">Purchase Cost:</span></div>
                    <div className="text-right text-gray-300">${parseFloat(activeCoil.price_usdc).toFixed(2)} USDC</div>
                    <div><span className="text-gray-500">Expected Yield:</span></div>
                    <div className="text-right text-blue-400 font-bold">${parseFloat(activeCoil.daily_yield_usdc).toFixed(4)} / Day</div>
                    <div><span className="text-gray-500">Lease Horizon:</span></div>
                    <div className="text-right text-gray-400">{activeCoil.lease_days} Days Plan</div>
                    <div className="col-span-2 border-t border-gray-950 my-1"></div>
                    <div><span className="text-gray-400 font-bold">Time to Expiry:</span></div>
                    <div className="text-right text-amber-400 font-bold tracking-tighter">
                      {Math.max(0, Math.ceil((new Date(activeCoil.expires_at) - new Date()) / (1000 * 60 * 60 * 24)))} Days Remaining
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-600 text-[11px] py-4 uppercase font-bold tracking-tight">
                    No active machines.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setInlineView('ledger')} // 🌟 Fast-travels to the ledger
                  className="bg-[#181b22] hover:bg-[#1f232d] text-white py-3 rounded-xl font-bold text-xs tracking-wider uppercase border border-gray-800 transition-colors"
                >
                  📥 Claim Revenue
                </button>
                <button 
                  onClick={() => setActiveTab('hardware')}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl font-bold text-xs tracking-wider uppercase shadow-md active:scale-98 transition-transform"
                >
                  🚀 Rent Hardware
                </button>
              </div>

              {/* /VAULT SHELF DISPLAY */}
              <div className="bg-[#14171d] border border-gray-900/60 rounded-xl p-3 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#1a1e26] flex items-center justify-center text-sm border border-gray-800">💼</div>
                    <div>
                      <p className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Vault Balance</p>
                      <h4 className="text-xs font-bold font-mono text-gray-200">${vaultUSDC.toFixed(2)} USDC</h4>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] font-mono text-red-500 uppercase tracking-wider">Unmined Leakage</p>
                    
                    {/* 🌟 FIXED: Applied the formatting engine to the red leakage text */}
                    <div className="flex justify-end items-baseline space-x-1">
                       <UCreditDisplay amount={unminedLoss > 0 ? unminedLoss : 0} className="text-xs font-bold text-red-400" />
                       <span className="text-[10px] text-red-400">uC</span>
                    </div>
                    
                    {/* 🌟 FIXED: The strict 2 uC = $1 USDC economy rule */}
                    <p className="text-[9px] font-mono text-red-500/70">≈ ${unminedLoss > 0 ? (parseFloat(unminedLoss) / 2000).toFixed(5) : '0.00000'} USDC</p>
                  </div>

                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button onClick={() => setShowDepositModal(true)} className="text-[11px] font-bold text-center text-cyan-400 bg-[#1a1e26] hover:bg-[#222731] border border-gray-800 rounded-lg py-2 transition-colors">
                    💰 Deposit Coins
                  </button>
                  <button onClick={() => setActiveError("Withdraw channels locked during pre-launch infrastructure syncing.")} className="text-[11px] font-bold text-center text-gray-400 bg-[#1a1e26] hover:bg-[#222731] border border-gray-800 rounded-lg py-2 transition-colors">
                    Withdraw →
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW B: THE INLINE LEDGER REVEAL */}
        {activeTab === 'home' && inlineView === 'ledger' && (
          <div className="w-full flex flex-col min-h-full px-4 pb-4 bg-[#0a0b0d]">
             {activeCoil ? (
                 <LedgerTab machineId={activeCoil.id} token="999999999" />
             ) : (
                 <div className="text-center mt-12 bg-[#111317] border border-gray-900 rounded-xl p-6">
                    <span className="text-2xl opacity-50 block mb-2">🕳️</span>
                    <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">No Active Coils Deployed</p>
                 </div>
             )}
          </div>
        )}


        {activeTab === 'hardware' && <HardwareTab onSelectMachine={(machine) => setSelectedMachine(machine)} />}
        {activeTab === 'friends' && <FriendsTab userBalance={vaultUSDC} onPurchaseSuccess={(cost) => setVaultUSDC(prev => prev - cost)} />}
        {activeTab === 'history' && <HistoryTab />}
      </main>

      {showDepositModal && <DepositModal onClose={() => setShowDepositModal(false)} />}

      {selectedMachine && (
        <MachineModal 
          machine={selectedMachine}
          userBalance={vaultUSDC}
          onClose={() => setSelectedMachine(null)}
          onOpenDeposit={() => setShowDepositModal(true)} 
          onConfirmPurchase={handlePurchaseMachine}
          onSetErrorMessage={(msg) => setActiveError(msg)} 
        />
      )}

      {/* 📌 FIXED STICKY FOOTER NAVIGATION ARRAY BAR */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 border-t border-gray-950 bg-[#0a0b0d] flex justify-around items-center z-50 max-w-md mx-auto shadow-2xl">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 text-[10px] uppercase tracking-wider w-14 transition-colors ${activeTab === 'home' ? 'text-cyan-400 font-bold' : 'text-gray-600'}`}>
          <span className="text-base">🎛️</span><span>Terminal</span>
        </button>
        <button onClick={() => setActiveTab('hardware')} className={`flex flex-col items-center gap-1 text-[10px] uppercase tracking-wider w-14 transition-colors ${activeTab === 'hardware' ? 'text-cyan-400 font-bold' : 'text-gray-600'}`}>
          <span className="text-base">🛒</span><span>Hardware</span>
        </button>
        <button onClick={() => setActiveTab('friends')} className={`flex flex-col items-center gap-1 text-[10px] uppercase tracking-wider w-14 transition-colors ${activeTab === 'friends' ? 'text-cyan-400 font-bold' : 'text-gray-600'}`}>
          <span className="text-base">🔌</span><span>Nodes</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 text-[10px] uppercase tracking-wider w-14 transition-colors ${activeTab === 'history' ? 'text-cyan-400 font-bold' : 'text-gray-600'}`}>
          <span className="text-base">📜</span><span>History</span>
        </button>
      </nav>

      {/* GLOBAL SPAM SHIELD */}
      {isGlobalLocked && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] cursor-wait z-[9999] flex items-center justify-center pointer-events-auto">
          <div className="bg-[#111317]/90 border border-cyan-500/20 px-4 py-2 rounded-lg shadow-2xl flex items-center space-x-2 font-mono text-[10px] text-cyan-400 uppercase tracking-wider">
            <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Syncing Block...</span>
          </div>
        </div>
      )}

      {/* CENTRAL OPERATIONAL ERROR POPUP */}
      {activeError && (
        <ErrorModal 
          title="OPERATIONAL BLOCK" 
          message={activeError} 
          onClose={() => setActiveError(null)} 
        />
      )}

      {/* 🎬 INLINE KEYFRAME INJECTION STRIP FOR SLIDE UP LOGS */}
      <style>{`
        @keyframes slideUpFade {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>

    </div>
  );
}