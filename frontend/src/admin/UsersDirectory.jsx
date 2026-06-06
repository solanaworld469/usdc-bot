import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ⏱️ Certified formatting module to bring back your clean visual layout
const formatTime = (totalSeconds) => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hrs}h ${mins}m ${secs}s`;
};

export default function UsersDirectory() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🔄 Global clock heartbeat state mapping live execution environments
  const [serverNow, setServerNow] = useState(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => setServerNow(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

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
    <div className="bg-[#111318] border border-gray-900 rounded-xl overflow-hidden font-mono text-xs shadow-2xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#161925] border-b border-gray-900 text-gray-500 text-[10px] uppercase tracking-wider">
            <th className="p-4 w-[20%]">Telegram ID / User</th>
            <th className="p-4 w-[15%]">Vault Balance</th>
            <th className="p-4 w-[25%]">Live Runtime Track</th>
            <th className="p-4 w-[20%]">Accrued Mining Output</th>
            <th className="p-4 w-[20%]">Accrued Leakage Penalty</th>
          </tr>
        </thead>
        <tbody>
          {usersList.map((u) => (
            <tr key={u.telegram_id} className="border-b border-gray-900 hover:bg-[#13151b] transition-colors align-top">
              
              {/* Profile Card Frame Metrics */}
              <td className="p-4 border-r border-gray-900/30">
                <div className="font-bold text-white text-[11px]">@{u.username || 'unknown'}</div>
                <div className="text-[10px] text-gray-500 mt-1">{u.telegram_id}</div>
              </td>
              <td className="p-4 text-amber-400 font-bold border-r border-gray-900/30">
                ${parseFloat(u.vault_balance).toFixed(2)} USDC
              </td>

              {/* 🌟 COLOURED TELEMETRY AGGREGATOR SUB-GRID */}
              {u.fleet_size > 0 ? (
                <td colSpan={3} className="p-0">
                  <div className="flex flex-col w-full h-full">
                    
                    {u.machines && u.machines.map((m, i) => {
                      
                      // Fallback baseline variables to match design layouts securely
                      let elapsedSeconds = 0;
                      let isLeaking = false;
                      let overtimeSeconds = 0;
                      
                      let totalDisplayedLeakage = parseFloat(m.leakage_ucredits); 
                      let totalDisplayedLeakageUSDC = parseFloat(m.leakage_usdc);

                      // Run deterministic engine check if backend timestamp is available
                      if (m.last_ignition_time) {
                        const ignitionTime = new Date(m.last_ignition_time).getTime();
                        const nowMs = serverNow.getTime();
                        elapsedSeconds = Math.max(0, Math.floor((nowMs - ignitionTime) / 1000));

                        isLeaking = elapsedSeconds > 90000;
                        overtimeSeconds = isLeaking ? elapsedSeconds - 90000 : 0;

                        // Calculate raw live session uCredits directly
                        const hourlyYield = parseFloat(m.hourly_yield_rate);
                        const uCreditsPerSec = (hourlyYield * 2000) / 3600;
                        const liveLeakageUCredits = overtimeSeconds * (uCreditsPerSec * 0.5);

                        // Pull historical pool and explicitly parse it to uCredits (Stored as uCredits in DB)
                        const historicalLeakageUCredits = parseFloat(m.unmined_loss_pool);

                        // 💰 THE TRUE BALANCED SUM
                        totalDisplayedLeakage = historicalLeakageUCredits + liveLeakageUCredits;
                        totalDisplayedLeakageUSDC = totalDisplayedLeakage / 2000;
                      }

                      return (
                        <div key={i} className="grid grid-cols-[38.5%_30.5%_31%] border-b border-gray-900/50 p-4 hover:bg-cyan-950/10 transition-colors">
                          <div className="pr-2">
                            
                            {/* Node Asset Identity + Inline Telemetry Badges */}
                            <div className="text-cyan-300 font-bold text-[10px] uppercase flex items-center">
                              ⚙️ {m.name}
                              <span className="ml-2 font-mono text-[9px] font-bold tracking-widest uppercase">
                                {m.last_ignition_time ? (
                                  elapsedSeconds <= 86400 ? (
                                    <span className="text-cyan-400 bg-cyan-950/40 border border-cyan-900/50 px-1.5 py-0.5 rounded animate-pulse">⚡ ACTIVE</span>
                                  ) : elapsedSeconds <= 90000 ? (
                                    <span className="text-amber-500 bg-amber-950/40 border border-amber-900/50 px-1.5 py-0.5 rounded">🛑 GRACE</span>
                                  ) : (
                                    <span className="text-red-400 bg-red-950/40 border border-red-900/50 px-1.5 py-0.5 rounded animate-[pulse_0.5s_ease-in-out_infinite]">⚠️ LEAKING</span>
                                  )
                                ) : (
                                  <span className="text-gray-500 bg-gray-950/40 border border-gray-900 px-1.5 py-0.5 rounded">💤 IDLE</span>
                                )}
                              </span>
                            </div>
                            
                            {/* Runtime Layout Frame with String Backstop */}
                            <div className="text-cyan-500/70 text-[10px] mt-1.5 tracking-wider">
                              ⏱️ {elapsedSeconds > 0 ? formatTime(elapsedSeconds) : (m.runtime || '0h 0m 0s')}
                              
                              {isLeaking && (
                                <div className="text-[9px] text-red-500 font-mono mt-1 animate-pulse tracking-widest uppercase">
                                  ⚠️ Overtime Loss Ticking: +{formatTime(overtimeSeconds)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Mining Accrued Metric Layout Components */}
                          <div>
                            <div className="text-emerald-400 font-bold">+{m.mined_ucredits} uC</div>
                            <div className="text-emerald-900/70 text-[10px] mt-0.5">≈ ${m.mined_usdc} USDC</div>
                          </div>
                          
                          {/* Real-time Ticking Leakage Punishment Fields */}
                          <div>
                            <div className={`font-mono font-bold ${totalDisplayedLeakage > 0 ? "text-red-400" : "text-red-900/40"}`}>
                              -{totalDisplayedLeakage.toFixed(5)} uC
                            </div>
                            <div className={`text-[10px] mt-0.5 ${totalDisplayedLeakage > 0 ? "text-red-500/80" : "text-red-900/30"}`}>
                              ≈ -${totalDisplayedLeakageUSDC.toFixed(2)} USDC
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Master Total Row Footprint */}
                    <div className="grid grid-cols-[38.5%_30.5%_31%] p-4 bg-[#0a0b0e]/50 items-center">
                      <div className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                        🌐 TOTAL FLEET ({u.fleet_size})
                      </div>
                      <div>
                        <div className="text-emerald-300 font-bold">+{u.total_mined_ucredits} uC</div>
                        <div className="text-emerald-700 text-[10px] mt-0.5 font-bold">≈ ${u.total_mined_usdc} USDC</div>
                      </div>
                      <div>
                        <div className={`font-bold ${parseFloat(u.total_leakage_ucredits) > 0 ? "text-red-400" : "text-gray-500"}`}>
                          -{u.total_leakage_ucredits} uC
                        </div>
                        <div className={`text-[10px] mt-0.5 font-bold ${parseFloat(u.total_leakage_ucredits) > 0 ? "text-red-700" : "text-gray-600"}`}>
                          ≈ ${u.total_leakage_usdc} USDC
                        </div>
                      </div>
                    </div>

                  </div>
                </td>
              ) : (
                /* No Assets Deployed Interface Safety Valve */
                <td colSpan={3} className="p-0">
                  <div className="w-full h-full flex items-center justify-center p-8 bg-[#0a0b0e]/30 text-gray-700 font-bold text-[10px] uppercase tracking-widest">
                    No Active Fleet Deployed
                  </div>
                </td>
              )}

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}