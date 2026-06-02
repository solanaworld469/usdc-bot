// backend/src/routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 🛡️ SECURITY: Apply Godmode Check to ALL routes automatically
const adminAuth = (req, res, next) => {
  const providedKey = req.headers['x-admin-key'];
  if (providedKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ error: '⛔ SECURE FACILITY. CONNECTION TERMINATED.' });
  }
  next();
};

router.use(adminAuth);

/**
 * 👤 GET /api/admin-panel/users
 */
router.get('/users', async (req, res) => {
  try {
    const userRowsResult = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    
    const computedRows = await Promise.all(userRowsResult.rows.map(async (user) => {
      // 🌟 FIXED: We now grab 'last_ignition_time' directly from the machine table!
      const machineCheck = await db.query(
        "SELECT hourly_yield_rate, last_ignition_time FROM user_machines WHERE user_id = $1 AND status = 'ACTIVE' LIMIT 1",
        [user.telegram_id]
      );

      if (machineCheck.rows.length === 0) {
        return {
          ...user,
          live_runtime: "0h 0m 0s",
          mined_ucredits: "0.0000",
          mined_usdc: "0.000000",
          leakage_ucredits: "0.0000",
          leakage_usdc: "0.000000"
        };
      }

      const machineData = machineCheck.rows[0];
      const hourlyRate = parseFloat(machineData.hourly_yield_rate) || 0;
      const ratePerSec = hourlyRate / 3600;

      // 🌟 FIXED: Looking at the machine's ignition, NOT the user's
      if (!machineData.last_ignition_time) {
        return {
          ...user,
          live_runtime: "OFFLINE (No Ignition)",
          mined_ucredits: "0.0000",
          mined_usdc: "0.000000",
          leakage_ucredits: "0.0000",
          leakage_usdc: "0.000000"
        };
      }

      const lastIgnition = new Date(machineData.last_ignition_time);
      const serverNow = new Date();
      const elapsedSeconds = Math.max(0, Math.floor((serverNow - lastIgnition) / 1000));

      let totalMinedCredits = 0;
      let leakageCredits = 0;
      let activeMinedSeconds = 0;

      if (elapsedSeconds <= 90000) { 
        activeMinedSeconds = elapsedSeconds;
        totalMinedCredits = elapsedSeconds * ratePerSec;
      } else {
        activeMinedSeconds = 90000; 
        totalMinedCredits = 90000 * ratePerSec;
        const idleOvertimeSeconds = elapsedSeconds - 90000;
        leakageCredits = idleOvertimeSeconds * (ratePerSec * 0.5);
      }

      const hrs = Math.floor(activeMinedSeconds / 3600);
      const mins = Math.floor((activeMinedSeconds % 3600) / 60);
      const secs = activeMinedSeconds % 60;

      return {
        ...user,
        live_runtime: `${hrs}h ${mins}m ${secs}s`,
        mined_ucredits: totalMinedCredits.toFixed(4),
        mined_usdc: (totalMinedCredits / 2).toFixed(6),
        leakage_ucredits: leakageCredits.toFixed(4),
        leakage_usdc: (leakageCredits / 2).toFixed(6)
      };
    }));

    return res.status(200).json(computedRows);
  } catch (err) {
    console.error(`🔻 [Admin API Fault - Users]:`, err.message);
    res.status(500).json({ error: 'Failed to query database.' });
  }
});

/**
 * 🖥️ GET /api/admin-panel/machines
 */
router.get('/machines', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM user_machines ORDER BY purchased_at DESC');
    res.status(200).json(result.rows);
  } catch (err) { 
    console.error(`🔻 [Admin API Fault - Machines]:`, err.message);
    res.status(500).json({ error: 'Failed to query database.' }); 
  }
});

/**
 * 🔑 GET /api/admin-panel/keys
 */
router.get('/keys', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM activation_keys ORDER BY created_at DESC');
    res.status(200).json(result.rows);
  } catch (err) { 
    console.error(`🔻 [Admin API Fault - Keys]:`, err.message);
    res.status(500).json({ error: 'Failed to query database.' }); 
  }
});

/**
 * 📊 GET /api/admin-panel/overview
 * 🌟 NEW: Master stats for the Dashboard (Hardware Distribution & Expirations)
 */
router.get('/overview', async (req, res) => {
  try {
    // 1. Hardware Distribution (Groups active machines by tier)
    const distributionResult = await db.query(`
      SELECT machine_tier, COUNT(*) as count 
      FROM user_machines 
      WHERE status = 'ACTIVE' 
      GROUP BY machine_tier
      ORDER BY count DESC
    `);

    // 2. Expirations Timeline (Next 5 machines to die)
    const expirationsResult = await db.query(`
      SELECT m.machine_tier, m.expires_at, u.username, u.telegram_id
      FROM user_machines m
      LEFT JOIN users u ON m.telegram_id = u.telegram_id
      WHERE m.status = 'ACTIVE'
      ORDER BY m.expires_at ASC
      LIMIT 5
    `);

    // 3. Global Totals
    const usersCount = await db.query('SELECT COUNT(*) FROM users');
    const machinesCount = await db.query("SELECT COUNT(*) FROM user_machines WHERE status = 'ACTIVE'");

    res.status(200).json({
      totalUsers: parseInt(usersCount.rows[0].count),
      activeMachines: parseInt(machinesCount.rows[0].count),
      hardwareDistribution: distributionResult.rows,
      expirations: expirationsResult.rows
    });

  } catch (err) {
    console.error(`🔻 [Admin API Fault - Overview]:`, err.message);
    res.status(500).json({ error: 'Failed to build dashboard overview.' });
  }
});

module.exports = router;