const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/auth');

/**
 * 🎛️ GET /api/hardware/fleet
 * Fetches user's actively running hardware nodes mapped exactly to your database architecture
 */
router.get('/fleet', authMiddleware, async (req, res) => {
  const telegramId = req.user.telegram_id;

  try {
    // 🔍 update this section inside backend/src/routes/fleet.js:
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

    // Update the activeFleet mapping returns to look at the real row parameters:
    const activeFleet = result.rows.map(row => {
    const price = parseFloat(row.price_usdc) || 0.0;
    const leaseDays = parseInt(row.lease_days) || 30;
    const hourlyRate = parseFloat(row.hourly_yield_rate) || 0.0;
    
    // Compute ROI threshold matrices matching your system criteria rules precisely
    const roiPercent = leaseDays === 30 ? 60.76 
                    : leaseDays === 60 ? 65.70 
                    : 70.06;

    const totalYieldUsdc = price * (1 + roiPercent / 100);
    const dailyYieldUsdc = totalYieldUsdc / leaseDays;
    
    // Convert standard yield down to micro uCredits units per single second tick
    const totalSecondsInLease = leaseDays * 86400;
    const uCreditsPerSec = (totalYieldUsdc * 1000000) / totalSecondsInLease;

    return {
        id: row.id,
        machine_id: row.machine_tier, 
        name: nameMap[row.machine_tier] || 'Unknown Coil',
        price_usdc: price,       // 🌟 REAL DATA
        lease_days: leaseDays,   // 🌟 REAL DATA
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