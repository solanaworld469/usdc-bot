const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/auth');

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
        last_ignition_time,
        expires_at, 
        status 
    FROM user_machines 
    WHERE user_id = $1 AND status = 'ACTIVE' AND expires_at > NOW()
    ORDER BY purchased_at DESC
    `; 

    const result = await db.query(queryStr, [telegramId]);

    const activeFleet = result.rows.map(row => {
      const price = parseFloat(row.price_usdc); 
      const leaseDays = parseInt(row.lease_days);
      
      const hourlyRateUsdc = parseFloat(row.hourly_yield_rate) || 0;
      
      // 🌟 FIXED MATH: Convert hourly USDC to hourly uCredits (* 2000), then down to a single second (/ 3600)
      const uCreditsPerSec = (hourlyRateUsdc * 2000) / 3600;

      return {
          id: row.id,
          machine_id: row.machine_tier, 
          name: nameMap[row.machine_tier] || 'Unknown Coil',
          price_usdc: price,       
          lease_days: leaseDays,   
          expires_at: row.expires_at,
          last_ignition_time: row.last_ignition_time,
          ucredits_per_sec: uCreditsPerSec.toFixed(8) 
      };
    });

    res.status(200).json({ fleet: activeFleet });

  } catch (err) {
    console.error(`🔻 [FLEET METRICS INVENTORY ERROR]:`, err.stack);
    res.status(500).json({ error: 'System telemetry data could not be synchronized.' });
  }
});

module.exports = router;