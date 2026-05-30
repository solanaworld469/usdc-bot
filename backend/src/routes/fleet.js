const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/auth');

// Simple metadata dictionary matching frontend display expectations
const nameMap = {
  rig_1: 'SOL Core',
  rig_2: 'SOL Flux',
  rig_3: 'Siberian Vapor',
  rig_4: 'SOL Vector',
  rig_5: 'Hyperion Cluster',
  rig_6: 'SOL Quantum'
};

/**
 * 🎛️ GET /api/hardware/fleet
 * Fetches user's actively running hardware nodes mapped exactly to your database architecture
 */
router.get('/fleet', authMiddleware, async (req, res) => {
  const telegramId = req.user.telegram_id;

  try {
    const queryStr = `
    SELECT 
        id, 
        user_id, 
        machine_tier, 
        price_usdc, 
        lease_days, 
        hourly_yield_rate, 
        purchased_at, 
        expires_at, 
        status 
    FROM user_machines 
    WHERE user_id = $1 AND status = 'ACTIVE' AND expires_at > NOW()
    ORDER BY purchased_at DESC
    `; 

    const result = await db.query(queryStr, [telegramId]);

    const activeFleet = result.rows.map(row => {
      const price = parseFloat(row.price_usdc) || 0.15; // default fallback if unassigned
      const leaseDays = parseInt(row.lease_days) || 30;
      
      // 🌟 Updated backend fleet velocity calculations matching the new lower ROI rates
      const roiPercent = leaseDays === 30 ? 60.76 
                      : leaseDays === 60 ? 63.70   // Updated to match 63.70% layout rule
                      : 69.00;                     // Updated to match 69.00% layout rule

      const totalYieldUsdc = price * (1 + roiPercent / 100);
      const dailyYieldUsdc = totalYieldUsdc / leaseDays;
      
      // Convert standard yield down to micro uCredits units per single second tick
      const totalSecondsInLease = leaseDays * 86400;
      const uCreditsPerSec = (totalYieldUsdc * 1000000) / totalSecondsInLease;

      return {
          id: row.id,
          machine_id: row.machine_tier, 
          name: nameMap[row.machine_tier] || 'Unknown Coil',
          price_usdc: price,       
          lease_days: leaseDays,   
          expires_at: row.expires_at,
          daily_yield_usdc: dailyYieldUsdc,
          ucredits_per_sec: uCreditsPerSec.toFixed(6)
      };
    });

    res.status(200).json({ fleet: activeFleet });

  } catch (err) {
    console.error(`🔻 [FLEET METRICS INVENTORY ERROR]:`, err.stack);
    res.status(500).json({ error: 'System telemetry data could not be synchronized.' });
  }
});

module.exports = router;