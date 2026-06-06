const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/auth');
const backendPrices = require('../config/prices'); 
const { initializeMachineEpochs } = require('../services/epochService');

router.post('/rent', authMiddleware, async (req, res) => {
  const { machine_id, lease_days, key_code } = req.body;
  const telegramId = req.user.telegram_id;

  // 🛡️ STRICT INPUT ENFORCEMENT
  if (!machine_id || !lease_days || !key_code) {
    return res.status(400).json({ error: 'System alignment parameters or key missing.' });
  }

  const leaseInt = parseInt(lease_days);
  if (![30, 60, 90].includes(leaseInt)) {
    return res.status(400).json({ error: 'A valid revenue lock plan (30, 60, or 90 days) must be selected.' });
  }

  const machinePrice = backendPrices[machine_id];
  if (machinePrice === undefined) {
    return res.status(404).json({ error: 'Invalid hardware model signature.' });
  }

  // 💰 STRICT SCENARIO A MATH (Pure Profit Only)
  let roiPercentage;
  if (leaseInt === 30) roiPercentage = 60.76;
  else if (leaseInt === 60) roiPercentage = 63.70;
  else if (leaseInt === 90) roiPercentage = 69.00;

  // Calculate total pure profit over the entire lease, then slice it into the exact hourly speed limit
  const totalYield = machinePrice * (roiPercentage / 100);
  const hourlyYieldRate = totalYield / (leaseInt * 24);

  const netAllocFee = machinePrice * 0.015;
  const totalRequiredCost = machinePrice + netAllocFee;

  // 🔌 POOL INTEGRATION
  const client = await db.pool.connect(); 
  
  try {
    await client.query('BEGIN'); 

    // 1. Verify Activation Key
    const keyRes = await client.query(
      "SELECT status FROM activation_keys WHERE key_signature = $1 FOR UPDATE", 
      [key_code]
    );
    
    if (keyRes.rows.length === 0) throw new Error('KEY_NOT_FOUND');
    if (keyRes.rows[0].status !== 'AVAILABLE') throw new Error('KEY_ALREADY_USED');

    // 2. Verify User Balance (Pulling 'id' for the hardware table relationship)
    const userResult = await client.query(
      'SELECT vault_balance FROM users WHERE telegram_id = $1 FOR UPDATE',
      [telegramId]
    );

    if (userResult.rows.length === 0) throw new Error('USER_NOT_FOUND');
    
    const userId = userResult.rows[0].id;
    // 🛡️ STRICT PARSING: No fallback "|| 0.00". If balance is missing/null, trigger a corruption fault.
    const currentBalance = parseFloat(userResult.rows[0].vault_balance);
    if (isNaN(currentBalance)) throw new Error('CORRUPT_BALANCE');
    
    if (currentBalance < totalRequiredCost || currentBalance < 10.00) {
      throw new Error('INSUFFICIENT_FUNDS');
    }

    // 3. Deduct Balance
    const newBalance = currentBalance - totalRequiredCost;
    const serverNow = new Date();
    
    // 🌟 FIXED: Strictly calculate 180 days (6 months) from this exact millisecond
    const expiresAt = new Date(serverNow.getTime() + (180 * 24 * 60 * 60 * 1000));

    await client.query(
      'UPDATE users SET vault_balance = $1, last_claim_at = $2 WHERE telegram_id = $3',
      [newBalance, serverNow, telegramId]
    );

    // 4. Mark Key as ACTIVE
    await client.query(
      "UPDATE activation_keys SET status = 'ACTIVE', owner_id = $1, activated_at = NOW() WHERE key_signature = $2",
      [telegramId, key_code]
    );

    // 5. 👑 DEPLOY MACHINE: Now explicitly injecting expires_at
    const machineInsertRes = await client.query(
      `INSERT INTO user_machines (
        user_id, 
        telegram_id, 
        machine_tier, 
        price_usdc,
        hourly_yield_rate, 
        purchased_at, 
        started_at, 
        last_ignition_time, 
        last_claim_at,
        expires_at,  
        lease_days, 
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVE')
      RETURNING id`, 
      [
        telegramId, 
        telegramId, 
        machine_id, 
        machinePrice, 
        hourlyYieldRate, 
        serverNow, 
        serverNow, 
        serverNow, 
        serverNow, 
        expiresAt,
        leaseInt   
      ]
    );

    const newMachineId = machineInsertRes.rows[0].id;

    // 🌟 MOVE 2 INJECTED HERE: Generate the 6 Months instantly
    // We pass 'client' so it stays inside the secure transaction!
    await initializeMachineEpochs(newMachineId, telegramId, client);


    // 6. Log Ledger Event
    await client.query(
      `INSERT INTO historical_ledgers (telegram_id, category, amount, status, created_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [telegramId, 'WITHDRAWAL', totalRequiredCost, 'COMPLETED', serverNow]
    );

    await client.query('COMMIT'); 

    return res.status(200).json({
      message: 'Processing coils deployed and ignition loop verified.',
      machine_deployed: machine_id,
      new_vault_balance: newBalance
    });

  } catch (err) {
    await client.query('ROLLBACK');
    
    // 🛡️ SECURE ERROR MASKING: 
    // Logs the dangerous stack trace only to your backend server screen.
    console.error(`🔻 [CHECKOUT FAULT]:`, err.message);

    // Translates known errors into perfectly clean strings for the frontend UI.
    const safeErrors = {
      'KEY_NOT_FOUND': { status: 404, msg: 'Invalid network activation key signature.' },
      'KEY_ALREADY_USED': { status: 400, msg: 'This activation key has already been used or sold.' },
      'USER_NOT_FOUND': { status: 404, msg: 'Operator profile mismatch. Please restart app.' },
      'INSUFFICIENT_FUNDS': { status: 400, msg: `Insufficient Funds! Total cost includes a 1.5% routing fee.` },
      'CORRUPT_BALANCE': { status: 500, msg: 'Vault integrity check failed. Please contact support.' }
    };

    if (safeErrors[err.message]) {
      return res.status(safeErrors[err.message].status).json({ error: safeErrors[err.message].msg });
    }

    // 🛑 DEFAULT CATCH-ALL: If it's a raw database error (like a missing column), the user just sees this:
    return res.status(500).json({ error: 'Hardware deployment anomaly. Please try again or contact support.' });

  } finally {
    client.release(); // 🔌 Instantly releases the connection
  }
});

// 🔌 SYSTEM RESET CORE IGNITION ENGINE (WITH PROFIT & LEAKAGE TRAP)
router.post('/ignite', authMiddleware, async (req, res) => {
  const { machine_id } = req.body;
  const telegramId = req.user.telegram_id;

  if (!machine_id) {
    return res.status(400).json({ error: 'Target machine identifier signature missing.' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verify machine and pull the critical timestamp BEFORE we overwrite it
    const machineCheck = await client.query(
      `SELECT id, status, last_ignition_time, hourly_yield_rate 
       FROM user_machines 
       WHERE id = $1 AND telegram_id = $2 FOR UPDATE`,
      [machine_id, telegramId]
    );

    if (machineCheck.rows.length === 0) {
      throw new Error('MACHINE_NOT_FOUND');
    }

    const machine = machineCheck.rows[0];
    const serverNow = new Date();
    
    // 🛑 2. THE DUAL TRAP (Calculate the accrued profit AND the penalty)
    if (machine.last_ignition_time) {
      const ignitionTime = new Date(machine.last_ignition_time).getTime();
      const nowMs = serverNow.getTime();
      const elapsedSeconds = Math.max(0, Math.floor((nowMs - ignitionTime) / 1000));

      // Calculate base rate logic
      const ratePerSecUsdc = parseFloat(machine.hourly_yield_rate) / 3600;
      const ratePerSecUCredits = ratePerSecUsdc * 2000; // Convert to uCredits

      // Splitting time into Good (Mining) and Bad (Leakage)
      const activeMiningSeconds = Math.min(elapsedSeconds, 90000); // Caps at 25 hours
      const leakageSeconds = Math.max(0, elapsedSeconds - 90000);       // Anything past 25 hours

      // 💰 TRAP 1: THE PROFIT
      const earnedUCredits = activeMiningSeconds * ratePerSecUCredits;
      
      // ⚠️ TRAP 2: THE PENALTY
      const penaltyUCredits = leakageSeconds * (ratePerSecUCredits * 0.5);
      const penaltyUSDC = penaltyUCredits / 2000; 

      // 📝 3. PERMANENTLY LOG THE FINANCIALS ACROSS ALL LEDGERS

      // A) Update the Machine Master Totals (Both Profit and Loss)
      await client.query(
        `UPDATE user_machines 
         SET unmined_loss_pool = unmined_loss_pool + $1,
             unmined_profit_pool = unmined_profit_pool + $2
         WHERE id = $3`,
        [penaltyUCredits, earnedUCredits, machine_id]
      );

      // B) Update the currently active 30-day epoch
      await client.query(
        `UPDATE machine_monthly_epochs 
         SET ucredits_leaked = ucredits_leaked + $1,
             ucredits_mined = ucredits_mined + $2
         WHERE machine_id = $3 AND claim_status = 'ACCRUING'`,
        [penaltyUCredits, earnedUCredits, machine_id]
      );

      // C) Update User's lifetime master ledger (Only tracking leakage here per original logic)
      if (penaltyUSDC > 0) {
        await client.query(
          `UPDATE users SET total_usdc_leaked = total_usdc_leaked + $1 WHERE telegram_id = $2`,
          [penaltyUSDC, telegramId]
        );
      }
    }

    // 🔄 4. RESET THE CLOCK (Only AFTER the money is safely saved)
    await client.query(
      `UPDATE user_machines 
       SET last_ignition_time = $1, status = 'ACTIVE' 
       WHERE id = $2`,
      [serverNow, machine_id]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Coil operational velocity re-established. Temporal ledgers safely synchronized.',
      ignited_machine: machine_id,
      last_ignition_time: serverNow
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`🔻 [IGNITION HARDWARE FAULT]:`, err.message);

    const safeErrors = {
      'MACHINE_NOT_FOUND': { status: 404, msg: 'Target terminal node hardware registry mismatch.' }
    };

    if (safeErrors[err.message]) {
      return res.status(safeErrors[err.message].status).json({ error: safeErrors[err.message].msg });
    }

    return res.status(500).json({ error: 'Core engine ignition failure. Please contact support.' });
  } finally {
    client.release();
  }
});

module.exports = router;