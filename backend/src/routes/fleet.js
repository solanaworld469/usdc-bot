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
    // 🌟 FIXED: Added 'last_ignition_time' so the frontend knows exactly when to start counting
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
      
      // 🌟 FIXED: We extract the raw database hourly rate and divide by 3600 seconds
      // No more multiplying by 1,000,000!
      const hourlyRate = parseFloat(row.hourly_yield_rate) || 0;
      const truePerSecondRate = hourlyRate / 3600;

      return {
          id: row.id,
          machine_id: row.machine_tier, 
          name: nameMap[row.machine_tier] || 'Unknown Coil',
          price_usdc: price,       
          lease_days: leaseDays,   
          expires_at: row.expires_at,
          last_ignition_time: row.last_ignition_time, // Passed securely to App.jsx
          ucredits_per_sec: truePerSecondRate.toFixed(8) // Perfectly slow, mathematically flawless
      };
    });

    res.status(200).json({ fleet: activeFleet });

  } catch (err) {
    console.error(`🔻 [FLEET METRICS INVENTORY ERROR]:`, err.stack);
    res.status(500).json({ error: 'System telemetry data could not be synchronized.' });
  }
});

module.exports = router;