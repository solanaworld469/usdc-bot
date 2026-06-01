const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/auth');
const backendPrices = require('../config/prices'); 

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

    await client.query(
      'UPDATE users SET vault_balance = $1, last_claim_at = $2 WHERE telegram_id = $3',
      [newBalance, serverNow, telegramId]
    );

    // 4. Mark Key as ACTIVE
    await client.query(
      "UPDATE activation_keys SET status = 'ACTIVE', owner_id = $1, activated_at = NOW() WHERE key_signature = $2",
      [telegramId, key_code]
    );

    // 5. 👑 DEPLOY MACHINE: Passing telegramId into both relational columns
    await client.query(
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
        lease_days, 
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE')`,
      [
        telegramId, // Maps to user_id
        telegramId, // Maps to telegram_id
        machine_id, 
        machinePrice, 
        hourlyYieldRate, 
        serverNow, // purchased_at
        serverNow, // started_at
        serverNow, // last_ignition_time
        serverNow, // last_claim_at
        leaseInt   // lease_days
      ]
    );

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

module.exports = router;