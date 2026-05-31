const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/auth');
const backendPrices = require('../config/prices'); 

router.post('/rent', authMiddleware, async (req, res) => {
  const { machine_id, lease_days, key_code } = req.body;
  const telegramId = req.user.telegram_id;

  // 🛡️ STRICT ENFORCEMENT: Hard-halt if the user didn't explicitly choose a plan
  if (!machine_id || !lease_days || !key_code) {
    return res.status(400).json({ error: 'System alignment parameters or key missing.' });
  }

  if (![30, 60, 90].includes(parseInt(lease_days))) {
    return res.status(400).json({ error: 'A valid revenue lock plan (30, 60, or 90 days) must be explicitly selected.' });
  }

  const machinePrice = backendPrices[machine_id];
  if (machinePrice === undefined) {
    return res.status(404).json({ error: 'Invalid hardware model signature.' });
  }

  const netAllocFee = machinePrice * 0.015;
  const totalRequiredCost = machinePrice + netAllocFee;

  // 🔌 POOL INTEGRATION: Fetch a fast client from the connection manager
  const client = await db.pool.connect(); 
  
  try {
    await client.query('BEGIN'); 

    // 1. Verify the Activation Key FIRST
    const keyRes = await client.query(
      "SELECT status FROM activation_keys WHERE key_signature = $1 FOR UPDATE", 
      [key_code]
    );
    
    if (keyRes.rows.length === 0) {
      throw new Error('KEY_NOT_FOUND');
    }
    
    if (keyRes.rows[0].status !== 'AVAILABLE') {
      throw new Error('KEY_ALREADY_USED');
    }

    // 2. Verify User Balance
    const userResult = await client.query(
      'SELECT vault_balance FROM users WHERE telegram_id = $1 FOR UPDATE',
      [telegramId]
    );

    const currentBalance = parseFloat(userResult.rows[0].vault_balance) || 0.00;

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

    // 5. Insert machine with status 'ACTIVE' (PostgreSQL handles expires_at via 1-Year default)
    await client.query(
      `INSERT INTO user_machines (telegram_id, machine_tier, hourly_yield_rate, created_at, lease_days, status) 
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE')`,
      [telegramId, machine_id, 0.5000, serverNow, parseInt(lease_days)]
    );

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
    await client.query('ROLLBACK'); // 🔄 Single graceful cleanup rollback point
    
    // Dispatch clean contextual error status codes to your React UI
    if (err.message === 'KEY_NOT_FOUND') {
      return res.status(404).json({ error: 'Invalid network activation key signature.' });
    }
    if (err.message === 'KEY_ALREADY_USED') {
      return res.status(400).json({ error: 'This activation key has already been used or sold.' });
    }
    if (err.message === 'INSUFFICIENT_FUNDS') {
      return res.status(400).json({ 
        error: `Insufficient Funds! Total cost is $${totalRequiredCost.toFixed(5)} with a $10 minimum threshold.` 
      });
    }

    console.error(`🔻 [CHECKOUT CRITICAL ERORR]:`, err.stack);
    return res.status(500).json({ error: 'Hardware deployment anomaly.' });

  } finally {
    client.release(); // 🔌 Release the client instantly back into the pool to prevent connection congestion
  }
});

module.exports = router;