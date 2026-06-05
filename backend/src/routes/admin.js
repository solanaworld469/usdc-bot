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
 * 🌟 FIXED: ADVANCED FLEET PAYLOAD WITH NESTED MACHINE DATA
 */
const nameMap = {
  rig_1: 'SOL Core',
  rig_2: 'SOL Flux',
  rig_3: 'Siberian Vapor',
  rig_4: 'SOL Vector',
  rig_5: 'Hyperion Cluster',
  rig_6: 'SOL Quantum'
};

router.get('/users', async (req, res) => {
  try {
    const userRowsResult = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    
    const computedRows = await Promise.all(userRowsResult.rows.map(async (user) => {
      
      // Grab every active machine this user owns
      const machineCheck = await db.query(
        "SELECT machine_tier, hourly_yield_rate, last_ignition_time FROM user_machines WHERE user_id = $1 AND status = 'ACTIVE' ORDER BY purchased_at ASC",
        [user.telegram_id]
      );

      // If they own 0 machines
      if (machineCheck.rows.length === 0) {
        return {
          ...user,
          fleet_size: 0,
          machines: [],
          total_mined_ucredits: "0000.00000",
          total_mined_usdc: "0.00",
          total_leakage_ucredits: "0000.00000",
          total_leakage_usdc: "0.00"
        };
      }

      let aggregateMinedUSDC = 0;
      let aggregateLeakageUSDC = 0;
      const userMachines = []; // 🌟 NEW: The array that will hold individual machine data!

      // Loop through every machine to calculate exact individual math
      for (let i = 0; i < machineCheck.rows.length; i++) {
          const machine = machineCheck.rows[i];
          const machineName = nameMap[machine.machine_tier] || machine.machine_tier;
          
          if (!machine.last_ignition_time) {
              userMachines.push({
                  name: `Coil ${i + 1} (${machineName})`,
                  runtime: "OFFLINE",
                  mined_ucredits: "0000.00000",
                  mined_usdc: "0.00",
                  leakage_ucredits: "0000.00000",
                  leakage_usdc: "0.00"
              });
              continue;
          }

          const hourlyRateUSDC = parseFloat(machine.hourly_yield_rate) || 0;
          const ratePerSecUSDC = hourlyRateUSDC / 3600;

          const lastIgnition = new Date(machine.last_ignition_time);
          const serverNow = new Date();
          const elapsedSeconds = Math.max(0, Math.floor((serverNow - lastIgnition) / 1000));

          let machineMinedUSDC = 0;
          let machineLeakageUSDC = 0;

          if (elapsedSeconds <= 90000) { 
              machineMinedUSDC = elapsedSeconds * ratePerSecUSDC;
          } else {
              machineMinedUSDC = 90000 * ratePerSecUSDC;
              const idleOvertimeSeconds = elapsedSeconds - 90000;
              machineLeakageUSDC = idleOvertimeSeconds * (ratePerSecUSDC * 0.5);
          }

          aggregateMinedUSDC += machineMinedUSDC;
          aggregateLeakageUSDC += machineLeakageUSDC;

          const hrs = Math.floor(elapsedSeconds / 3600).toString().padStart(2, '0');
          const mins = Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, '0');
          const secs = (elapsedSeconds % 60).toString().padStart(2, '0');

          // Push the exact math for THIS specific machine to the array
          userMachines.push({
              name: `Coil ${i + 1} (${machineName})`,
              runtime: `${hrs}h ${mins}m ${secs}s`,
              mined_ucredits: (machineMinedUSDC * 2000).toFixed(5).padStart(10, '0'),
              mined_usdc: machineMinedUSDC.toFixed(2),
              leakage_ucredits: (machineLeakageUSDC * 2000).toFixed(5).padStart(10, '0'),
              leakage_usdc: machineLeakageUSDC.toFixed(2)
          });
      }

      // Convert totals to uCredits
      const totalMinedUCredits = aggregateMinedUSDC * 2000;
      const totalLeakageUCredits = aggregateLeakageUSDC * 2000;

      return {
        ...user,
        fleet_size: userMachines.length,
        machines: userMachines, // 🌟 Sends the nested array to the frontend
        total_mined_ucredits: totalMinedUCredits.toFixed(5).padStart(10, '0'),
        total_mined_usdc: aggregateMinedUSDC.toFixed(2),
        total_leakage_ucredits: totalLeakageUCredits.toFixed(5).padStart(10, '0'),
        total_leakage_usdc: aggregateLeakageUSDC.toFixed(2)
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